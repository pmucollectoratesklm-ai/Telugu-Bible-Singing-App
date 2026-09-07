import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { LyricsDisplay } from './components/LyricsDisplay';
import { SongPlayer } from './components/SongPlayer';
import { ScriptureSelector } from './components/ScriptureSelector';
import { SearchModal } from './components/SearchModal';
import { PdfUploadModal } from './components/PdfUploadModal';
import { audioEngine } from './audio/audioEngine';
import { BibleVerse, AudioEngineSettings } from './types';
import { PRELOADED_SCRIPTURES, BIBLE_BOOKS } from './data/teluguBibleData';
import { getBibleChapter } from './data/scriptureService';

export default function App() {
  // Current Selected Scripture
  const [currentBookId, setCurrentBookId] = useState<string>('psalms');
  const [currentChapter, setCurrentChapter] = useState<number>(23);
  const [currentVerseNumber, setCurrentVerseNumber] = useState<number | undefined>(undefined);

  // Custom scriptures uploaded by user from Telugu Bible PDF
  const [customScriptures, setCustomScriptures] = useState<
    Record<string, { title: string; theme: string; verses: BibleVerse[] }>
  >({});

  // Audio Engine Playback State
  const [playbackState, setPlaybackState] = useState({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    currentVerseIndex: 0,
    currentLineIndex: 0,
    isChapterCompleted: false,
    isAnnouncingCompletion: false,
    announcementText: '',
  });

  const [settings, setSettings] = useState<AudioEngineSettings>(audioEngine.getSettings());

  // Modal states
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Derive current passage data with full verse array (never just 1 verse)
  const currentBook = useMemo(() => {
    return BIBLE_BOOKS.find((b) => b.id === currentBookId) || BIBLE_BOOKS[0];
  }, [currentBookId]);

  const currentPassage = useMemo(() => {
    return getBibleChapter(currentBookId, currentChapter, customScriptures);
  }, [currentBookId, currentChapter, customScriptures]);

  // Connect AudioEngine callback
  useEffect(() => {
    audioEngine.setCallback((state) => {
      setPlaybackState(state);
    });

    return () => {
      audioEngine.stop();
    };
  }, []);

  // Keyboard shortcuts (Cmd+K for search, Space for play/pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        if (playbackState.isPlaying && !playbackState.isPaused) {
          audioEngine.pause();
        } else if (playbackState.isPaused) {
          audioEngine.resume();
        } else {
          audioEngine.playScripture(currentPassage.verses, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackState, currentPassage.verses]);

  // Update Settings handler
  const handleUpdateSettings = useCallback((newSettings: Partial<AudioEngineSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      audioEngine.updateSettings(updated);
      return updated;
    });
  }, []);

  // Play Whole Chapter starting at index
  const handlePlayWholeChapter = useCallback(
    (startIndex: number = 0) => {
      setCurrentVerseNumber(undefined);
      audioEngine.playWholeChapter(currentPassage.verses, startIndex);
    },
    [currentPassage.verses]
  );

  // Play Single Verse at index
  const handlePlaySingleVerse = useCallback(
    (index: number) => {
      const targetVerse = currentPassage.verses[index];
      if (targetVerse) {
        setCurrentVerseNumber(targetVerse.verseNumber);
      }
      audioEngine.playSingleVerse(currentPassage.verses, index);
    },
    [currentPassage.verses]
  );

  // Playback Action Handlers
  const handlePlay = useCallback(() => {
    audioEngine.playWholeChapter(currentPassage.verses, playbackState.currentVerseIndex);
  }, [currentPassage.verses, playbackState.currentVerseIndex]);

  const handlePause = useCallback(() => {
    audioEngine.pause();
  }, []);

  const handleResume = useCallback(() => {
    audioEngine.resume();
  }, []);

  const handleStop = useCallback(() => {
    audioEngine.stop();
  }, []);

  const handlePlayVerse = useCallback(
    (index: number) => {
      handlePlayWholeChapter(index);
    },
    [handlePlayWholeChapter]
  );

  const handlePrev = useCallback(() => {
    audioEngine.prevVerse();
  }, []);

  const handleNext = useCallback(() => {
    audioEngine.nextVerse();
  }, []);

  // Navigate Passage with Whole Chapter vs Desired Verse support
  const handleSelectPassage = useCallback(
    (bookId: string, chapter: number, verseNumber?: number, playMode?: 'chapter' | 'verse') => {
      audioEngine.stop();
      setCurrentBookId(bookId);
      setCurrentChapter(chapter);
      setCurrentVerseNumber(verseNumber);

      const resolved = getBibleChapter(bookId, chapter, customScriptures);

      if (playMode === 'chapter' || verseNumber === undefined) {
        // User wants to listen to the whole chapter from verse 1
        setTimeout(() => {
          audioEngine.playWholeChapter(resolved.verses, 0);
        }, 150);
      } else {
        // User selected a specific desired verse
        const targetIdx = resolved.verses.findIndex((v) => v.verseNumber === verseNumber);
        const idxToPlay = targetIdx >= 0 ? targetIdx : 0;
        setTimeout(() => {
          audioEngine.playSingleVerse(resolved.verses, idxToPlay);
        }, 150);
      }
    },
    [customScriptures]
  );

  // Handle PDF Extracted Data
  const handlePdfExtracted = useCallback(
    (extractedData: {
      bookId: string;
      chapterNumber: number;
      title: string;
      theme: string;
      verses: BibleVerse[];
    }) => {
      const key = `${extractedData.bookId}-${extractedData.chapterNumber}`;
      setCustomScriptures((prev) => ({
        ...prev,
        [key]: {
          title: extractedData.title,
          theme: extractedData.theme,
          verses: extractedData.verses,
        },
      }));

      handleSelectPassage(extractedData.bookId, extractedData.chapterNumber);

      setTimeout(() => {
        audioEngine.playScripture(extractedData.verses, 0);
      }, 300);
    },
    [handleSelectPassage]
  );

  // Chapter completion navigation
  const hasNextChapter = currentChapter < currentBook.totalChapters;
  const nextChapterNumber = currentChapter + 1;

  const handleNextChapter = useCallback(() => {
    if (currentChapter < currentBook.totalChapters) {
      handleSelectPassage(currentBookId, currentChapter + 1);
      setTimeout(() => {
        handlePlayWholeChapter(0);
      }, 300);
    }
  }, [currentBookId, currentChapter, currentBook.totalChapters, handleSelectPassage, handlePlayWholeChapter]);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-stone-900 font-sans selection:bg-amber-200 selection:text-amber-950">
      {/* Minimal Top Navigation Header */}
      <Header
        onOpenSelector={() => setIsSelectorOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        isPlaying={playbackState.isPlaying && !playbackState.isPaused}
        currentBookName={currentBook.nameTelugu}
        currentChapter={currentChapter}
      />

      {/* Centered Main Scripture Reader View */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6 pb-28">
        {/* Quick Chapter Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
          <span className="text-stone-400 shrink-0 font-medium mr-1 font-serif">
            త్వరిత అధ్యాయాలు:
          </span>
          {[
            { id: 'psalms', ch: 23, title: 'కీర్తనలు 23' },
            { id: 'john', ch: 3, title: 'యోహాను 3' },
            { id: 'psalms', ch: 121, title: 'కీర్తనలు 121' },
            { id: '1corinthians', ch: 13, title: '1 కొరింథీ 13' },
            { id: 'psalms', ch: 100, title: 'కీర్తనలు 100' },
            { id: 'matthew', ch: 5, title: 'మత్తయి 5' },
            { id: 'isaiah', ch: 40, title: 'యెషయా 40' },
          ].map((item) => {
            const isActive = currentBookId === item.id && currentChapter === item.ch;
            return (
              <button
                key={`${item.id}-${item.ch}`}
                onClick={() => handleSelectPassage(item.id, item.ch)}
                className={`px-3 py-1.5 rounded-full font-serif shrink-0 transition-all ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 font-semibold shadow-2xs'
                    : 'bg-stone-200/70 hover:bg-stone-300/70 text-stone-700'
                }`}
              >
                {item.title}
              </button>
            );
          })}
        </div>

        {/* Minimal Distraction-Free Scripture Reader */}
        <LyricsDisplay
          verses={currentPassage.verses}
          currentVerseIndex={playbackState.currentVerseIndex}
          currentLineIndex={playbackState.currentLineIndex}
          isPlaying={playbackState.isPlaying && !playbackState.isPaused}
          onPlayVerse={handlePlayVerse}
          title={currentPassage.title}
          theme={currentPassage.theme}
          onPlayWholeChapter={handlePlayWholeChapter}
          onPlaySingleVerse={handlePlaySingleVerse}
          selectedVerseNumber={currentVerseNumber}
          isChapterCompleted={playbackState.isChapterCompleted}
          isAnnouncingCompletion={playbackState.isAnnouncingCompletion}
          announcementText={playbackState.announcementText}
          onNextChapter={handleNextChapter}
          hasNextChapter={hasNextChapter}
          nextChapterNumber={nextChapterNumber}
        />
      </main>

      {/* Sleek Minimal Docked Bottom Audio Player */}
      <SongPlayer
        isPlaying={playbackState.isPlaying}
        isPaused={playbackState.isPaused}
        currentTime={playbackState.currentTime}
        duration={playbackState.duration}
        currentVerseIndex={playbackState.currentVerseIndex}
        totalVerses={currentPassage.verses.length}
        currentVerseText={currentPassage.verses[playbackState.currentVerseIndex]?.teluguText}
        currentBookName={currentBook.nameTelugu}
        currentChapter={currentChapter}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onPlay={handlePlay}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
        onPrev={handlePrev}
        onNext={handleNext}
        onPlayWholeChapter={handlePlayWholeChapter}
        onPlaySingleVerse={handlePlaySingleVerse}
        analyser={audioEngine.getAnalyser()}
        isChapterCompleted={playbackState.isChapterCompleted}
        isAnnouncingCompletion={playbackState.isAnnouncingCompletion}
        announcementText={playbackState.announcementText}
      />

      {/* Chapter & Verse Selector Modal */}
      <ScriptureSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        currentBookId={currentBookId}
        currentChapter={currentChapter}
        currentVerseNumber={currentVerseNumber}
        onSelectPassage={handleSelectPassage}
        customScriptures={customScriptures}
      />

      {/* Quick Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectPassage={handleSelectPassage}
        customScriptures={customScriptures}
      />

      {/* PDF Upload Modal */}
      <PdfUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onPdfExtracted={handlePdfExtracted}
      />
    </div>
  );
}
