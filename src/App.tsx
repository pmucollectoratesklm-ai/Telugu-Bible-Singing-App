import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { LyricsDisplay } from './components/LyricsDisplay';
import { SongPlayer } from './components/SongPlayer';
import { ScriptureSelector } from './components/ScriptureSelector';
import { SearchModal } from './components/SearchModal';
import { PdfUploadModal } from './components/PdfUploadModal';
import { MusicalCompositionCard } from './components/MusicalCompositionCard';
import { VerseOfTheDayCard } from './components/VerseOfTheDayCard';
import { audioEngine } from './audio/audioEngine';
import { BibleVerse, AudioEngineSettings, SongComposition, DailyVerse } from './types';
import { PRELOADED_SCRIPTURES, BIBLE_BOOKS, VOICE_OPTIONS, RAGA_OPTIONS } from './data/teluguBibleData';
import { getTodayVerse } from './data/dailyVerses';
import { BookOpen, Sparkles, Music, Share2, Compass } from 'lucide-react';

export default function App() {
  // Verse of the Day state
  const [dayOffset, setDayOffset] = useState<number>(0);
  const dailyVerse = useMemo(() => getTodayVerse(dayOffset), [dayOffset]);

  // Current Selected Scripture
  const [currentBookId, setCurrentBookId] = useState<string>('psalms');
  const [currentChapter, setCurrentChapter] = useState<number>(23);
  const [currentVerseNumber, setCurrentVerseNumber] = useState<number | undefined>(undefined);

  // Custom scriptures uploaded by user from Telugu Bible PDF
  const [customScriptures, setCustomScriptures] = useState<
    Record<string, { title: string; theme: string; verses: BibleVerse[] }>
  >({});

  // Audio Engine State
  const [playbackState, setPlaybackState] = useState({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    currentVerseIndex: 0,
    currentLineIndex: 0,
  });

  const [settings, setSettings] = useState<AudioEngineSettings>(audioEngine.getSettings());
  const [composition, setComposition] = useState<SongComposition | null>(null);
  const [isRecomposing, setIsRecomposing] = useState(false);
  const [isGeneratingAiAudio, setIsGeneratingAiAudio] = useState(false);
  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);

  // Modal states
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Derive current passage data
  const currentBook = useMemo(() => {
    return BIBLE_BOOKS.find((b) => b.id === currentBookId) || BIBLE_BOOKS[0];
  }, [currentBookId]);

  const currentPassage = useMemo(() => {
    const key = `${currentBookId}-${currentChapter}`;
    const found = PRELOADED_SCRIPTURES[key] || customScriptures[key];
    if (found) {
      return found;
    }

    // Default generated fallback verses if user selects any book/chapter not yet loaded
    const fallbackVerses: BibleVerse[] = [
      {
        bookId: currentBookId,
        bookNameTelugu: currentBook.nameTelugu,
        bookNameEnglish: currentBook.nameEnglish,
        chapterNumber: currentChapter,
        verseNumber: 1,
        teluguText: `${currentBook.nameTelugu} అధ్యాయము ${currentChapter} - మొదటి వచనము. ప్రభువు నామము స్తుతించబడును గాక.`,
        transliteration: `${currentBook.nameEnglish} adhyaayamu ${currentChapter} - modati vachanamu. Prabhuvu naamamu stutinchabadunu gaaka.`,
        meaning: `In ${currentBook.nameEnglish} Chapter ${currentChapter}, verse 1: Blessed be the name of the Lord.`,
        swaras: 'స . గ . ప . ద . స\' . . . | స\' ద ప గ రి స',
      },
    ];

    return {
      title: `${currentBook.nameTelugu} ${currentChapter}`,
      theme: 'దైవ వాక్య ధ్యానము & గాన సంకీర్తన',
      verses: fallbackVerses,
    };
  }, [currentBookId, currentChapter, customScriptures, currentBook]);

  // Selected verses filter (if a specific verse is targeted)
  const activeVerses = useMemo(() => {
    if (currentVerseNumber !== undefined) {
      const single = currentPassage.verses.filter((v) => v.verseNumber === currentVerseNumber);
      return single.length > 0 ? single : currentPassage.verses;
    }
    return currentPassage.verses;
  }, [currentPassage, currentVerseNumber]);

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
          audioEngine.playScripture(activeVerses, 0, aiAudioUrl || undefined);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackState, activeVerses, aiAudioUrl]);

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
      handleUpdateSettings({ listenMode: 'chapter' });
      setCurrentVerseNumber(undefined);
      audioEngine.playWholeChapter(currentPassage.verses, startIndex, aiAudioUrl || undefined);
    },
    [currentPassage.verses, aiAudioUrl, handleUpdateSettings]
  );

  // Play Single Verse at index
  const handlePlaySingleVerse = useCallback(
    (index: number) => {
      handleUpdateSettings({ listenMode: 'verse' });
      const targetVerse = currentPassage.verses[index];
      if (targetVerse) {
        setCurrentVerseNumber(targetVerse.verseNumber);
      }
      audioEngine.playSingleVerse(currentPassage.verses, index, aiAudioUrl || undefined);
    },
    [currentPassage.verses, aiAudioUrl, handleUpdateSettings]
  );

  // Playback Action Handlers
  const handlePlay = useCallback(() => {
    if (settings.listenMode === 'verse') {
      audioEngine.playSingleVerse(currentPassage.verses, playbackState.currentVerseIndex, aiAudioUrl || undefined);
    } else {
      audioEngine.playWholeChapter(currentPassage.verses, playbackState.currentVerseIndex, aiAudioUrl || undefined);
    }
  }, [settings.listenMode, currentPassage.verses, playbackState.currentVerseIndex, aiAudioUrl]);

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
      if (settings.listenMode === 'verse') {
        handlePlaySingleVerse(index);
      } else {
        handlePlayWholeChapter(index);
      }
    },
    [settings.listenMode, handlePlaySingleVerse, handlePlayWholeChapter]
  );

  const handlePrev = useCallback(() => {
    audioEngine.prevVerse();
  }, []);

  const handleNext = useCallback(() => {
    audioEngine.nextVerse();
  }, []);

  // Navigate Passage
  const handleSelectPassage = useCallback(
    (bookId: string, chapter: number, verseNumber?: number) => {
      audioEngine.stop();
      setCurrentBookId(bookId);
      setCurrentChapter(chapter);
      setCurrentVerseNumber(verseNumber);
      setAiAudioUrl(null);
    },
    []
  );

  // Check if today's verse is currently playing
  const isPlayingTodayVerse = useMemo(() => {
    return (
      playbackState.isPlaying &&
      !playbackState.isPaused &&
      currentBookId === dailyVerse.bookId &&
      currentChapter === dailyVerse.chapterNumber &&
      (currentVerseNumber === dailyVerse.verseNumber ||
        (currentVerseNumber === undefined &&
          activeVerses[playbackState.currentVerseIndex]?.verseNumber === dailyVerse.verseNumber))
    );
  }, [playbackState, currentBookId, currentChapter, currentVerseNumber, dailyVerse, activeVerses]);

  // Handle Play Verse of the Day with unique voice, raga, and pitch
  const handlePlayDailyVerse = useCallback(
    (verse: DailyVerse) => {
      if (isPlayingTodayVerse) {
        audioEngine.pause();
        return;
      }
      if (
        playbackState.isPaused &&
        currentBookId === verse.bookId &&
        currentChapter === verse.chapterNumber &&
        (currentVerseNumber === verse.verseNumber ||
          activeVerses[playbackState.currentVerseIndex]?.verseNumber === verse.verseNumber)
      ) {
        audioEngine.resume();
        return;
      }

      audioEngine.stop();
      setCurrentBookId(verse.bookId);
      setCurrentChapter(verse.chapterNumber);
      setCurrentVerseNumber(verse.verseNumber);
      setAiAudioUrl(null);

      // Apply the unique curated voice, raga, speed, and pitch for this scripture song
      const updatedSettings: Partial<AudioEngineSettings> = {
        voiceId: verse.voiceId,
        ragaId: verse.ragaId,
        speed: 1.0,
        pitchSemi: verse.pitchSemi,
      };
      handleUpdateSettings(updatedSettings);

      const verseItem: BibleVerse = {
        bookId: verse.bookId,
        bookNameTelugu: verse.bookNameTelugu,
        bookNameEnglish: verse.bookNameEnglish,
        chapterNumber: verse.chapterNumber,
        verseNumber: verse.verseNumber,
        teluguText: verse.teluguText,
        transliteration: verse.transliteration,
        meaning: verse.meaning,
        swaras: verse.swaras,
      };

      setTimeout(() => {
        audioEngine.playScripture([verseItem], 0);
      }, 150);
    },
    [
      isPlayingTodayVerse,
      playbackState.isPaused,
      currentBookId,
      currentChapter,
      currentVerseNumber,
      activeVerses,
      playbackState.currentVerseIndex,
      handleUpdateSettings,
    ]
  );

  const scrollToDailyVerse = useCallback(() => {
    const el = document.getElementById('verse-of-the-day-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

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

      // Auto start singing the extracted scripture!
      setTimeout(() => {
        audioEngine.playScripture(extractedData.verses, 0);
      }, 500);
    },
    [handleSelectPassage]
  );

  // Compose with Gemini AI
  const handleRecomposeWithAi = useCallback(async () => {
    setIsRecomposing(true);
    try {
      const verseSample = activeVerses[0]?.teluguText || 'యెహోవా నా కాపరి';
      const raga = RAGA_OPTIONS.find((r) => r.id === settings.ragaId) || RAGA_OPTIONS[0];
      const voice = VOICE_OPTIONS.find((v) => v.id === settings.voiceId) || VOICE_OPTIONS[0];

      const response = await fetch('/api/bible/compose-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teluguText: verseSample,
          bookName: currentBook.nameTelugu,
          chapter: currentChapter,
          verse: currentVerseNumber ? String(currentVerseNumber) : '1',
          ragaName: raga.nameTelugu,
          voiceStyle: voice.nameEnglish,
        }),
      });

      const data = await response.json();
      if (data.success && data.composition) {
        setComposition(data.composition);
      }
    } catch (err) {
      console.warn('AI recomposition error:', err);
    } finally {
      setIsRecomposing(false);
    }
  }, [activeVerses, settings.ragaId, settings.voiceId, currentBook, currentChapter, currentVerseNumber]);

  // Generate Gemini TTS Audio
  const handleGenerateAiAudio = useCallback(async () => {
    setIsGeneratingAiAudio(true);
    try {
      const voice = VOICE_OPTIONS.find((v) => v.id === settings.voiceId) || VOICE_OPTIONS[0];
      const raga = RAGA_OPTIONS.find((r) => r.id === settings.ragaId) || RAGA_OPTIONS[0];
      const currentVerse = activeVerses[playbackState.currentVerseIndex] || activeVerses[0];

      const response = await fetch('/api/bible/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentVerse?.teluguText || 'యెహోవా నా కాపరి',
          transliteration: currentVerse?.transliteration,
          voiceName: voice.geminiVoice,
          ragaName: raga.nameTelugu,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.audioBase64) {
        // Decode base64 to blob URL
        const binary = atob(resData.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const blobUrl = URL.createObjectURL(blob);
        setAiAudioUrl(blobUrl);

        // Immediately sing using the high fidelity audio!
        audioEngine.playScripture(activeVerses, playbackState.currentVerseIndex, blobUrl);
      }
    } catch (err) {
      console.warn('AI audio generation failed, continuing with procedural vocal synthesizer:', err);
    } finally {
      setIsGeneratingAiAudio(false);
    }
  }, [settings.voiceId, settings.ragaId, activeVerses, playbackState.currentVerseIndex]);

  const activeRaga = RAGA_OPTIONS.find((r) => r.id === settings.ragaId) || RAGA_OPTIONS[0];
  const activeVoice = VOICE_OPTIONS.find((v) => v.id === settings.voiceId) || VOICE_OPTIONS[0];

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 font-sans selection:bg-amber-200 selection:text-amber-950">
      {/* Top Navigation Header */}
      <Header
        onOpenSelector={() => setIsSelectorOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDailyVerse={scrollToDailyVerse}
        isPlaying={playbackState.isPlaying && !playbackState.isPaused}
        currentBookName={currentBook.nameTelugu}
        currentChapter={currentChapter}
        currentRagaName={activeRaga.nameTelugu}
        currentVoiceName={activeVoice.nameTelugu}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-6 pb-40">
        {/* Prominent Verse of the Day Feature Card */}
        <VerseOfTheDayCard
          dailyVerse={dailyVerse}
          isPlayingTodayVerse={isPlayingTodayVerse}
          onPlayDailyVerse={handlePlayDailyVerse}
          onPrevDay={() => setDayOffset((prev) => prev - 1)}
          onNextDay={() => setDayOffset((prev) => prev + 1)}
          onResetToday={() => setDayOffset(0)}
          dayOffset={dayOffset}
        />

        {/* Quick Scripture Navigation Banner */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif">
                  {currentPassage.title}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white">
                  {activeVerses.length} వచనములు
                </span>
              </div>
              <p className="text-xs text-amber-100/90 font-medium">
                {currentPassage.theme}
              </p>
            </div>
          </div>

          {/* Quick Chapter Navigation buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setIsSelectorOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 transition-all active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>వేరే అధ్యాయం ఎంచుకోండి</span>
            </button>
          </div>
        </div>

        {/* 2-Column Layout on Desktop: Lyrics on Left (8 cols), Composition & Raga on Right (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Lyrics Display */}
          <div className="lg:col-span-8 flex flex-col min-h-[500px]">
            <LyricsDisplay
              verses={currentPassage.verses}
              currentVerseIndex={playbackState.currentVerseIndex}
              currentLineIndex={playbackState.currentLineIndex}
              isPlaying={playbackState.isPlaying && !playbackState.isPaused}
              onPlayVerse={handlePlayVerse}
              title={currentPassage.title}
              theme={currentPassage.theme}
              ragaName={activeRaga.nameTelugu}
              highlightedDailyVerse={{
                bookId: dailyVerse.bookId,
                chapterNumber: dailyVerse.chapterNumber,
                verseNumber: dailyVerse.verseNumber,
              }}
              listenMode={settings.listenMode}
              onSelectListenMode={(mode) => handleUpdateSettings({ listenMode: mode })}
              onPlayWholeChapter={handlePlayWholeChapter}
              onPlaySingleVerse={handlePlaySingleVerse}
              selectedVerseNumber={currentVerseNumber}
              onSelectVerseFilter={(vn) => setCurrentVerseNumber(vn)}
              autoAdvanceVerse={settings.autoAdvanceVerse}
              onToggleAutoAdvance={() =>
                handleUpdateSettings({ autoAdvanceVerse: !settings.autoAdvanceVerse })
              }
              repeatMode={settings.repeatMode}
              onToggleRepeat={() =>
                handleUpdateSettings({
                  repeatMode:
                    settings.repeatMode === 'off'
                      ? 'verse'
                      : settings.repeatMode === 'verse'
                      ? 'chapter'
                      : 'off',
                })
              }
              bgMusicStyle={settings.bgMusicStyle}
              bgMusicMuted={settings.bgMusicMuted}
              onToggleBgMusicMuted={() =>
                handleUpdateSettings({ bgMusicMuted: !settings.bgMusicMuted })
              }
              onSelectBgMusicStyle={(style) =>
                handleUpdateSettings({
                  bgMusicStyle: style,
                  bgMusicMuted: style === 'vocals_only',
                })
              }
            />
          </div>

          {/* Right Column: Melodic Composition & Quick Passages */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Composition & Swaras Card */}
            <MusicalCompositionCard
              composition={composition}
              raga={activeRaga}
              voice={activeVoice}
              onRecomposeWithAi={handleRecomposeWithAi}
              isRecomposing={isRecomposing}
            />

            {/* Quick Singing Bookmarks */}
            <div className="p-4 rounded-2xl bg-white border border-amber-900/10 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  ప్రముఖ గాన కీర్తనలు (Popular Hymns)
                </h3>
              </div>

              <div className="space-y-1.5">
                {[
                  { id: 'psalms', ch: 23, title: 'యెహోవా నా కాపరి (కీర్తనలు 23)', raga: 'మోహన రాగం' },
                  { id: 'john', ch: 3, title: 'దేవుడు లోకమును ప్రేమించెను (యోహాను 3:16)', raga: 'కల్యాణి రాగం' },
                  { id: 'psalms', ch: 121, title: 'కొండలతట్టు నా కన్నులెత్తుచున్నాను (కీర్తనలు 121)', raga: 'శాంత కీర్తన' },
                  { id: '1corinthians', ch: 13, title: 'ప్రేమ గీతం (1 కొరింథీయులకు 13)', raga: 'హిందోళం' },
                  { id: 'psalms', ch: 100, title: 'కృతజ్ఞతా స్తుతి గీతం (కీర్తనలు 100)', raga: 'శంకరాభరణం' },
                  { id: 'matthew', ch: 5, title: 'పరలోక ధన్యతలు (మత్తయి 5)', raga: 'మాయామాళవగౌళ' },
                  { id: 'isaiah', ch: 40, title: 'నూతన బలము (యెషయా 40:31)', raga: 'మోహన రాగం' },
                ].map((item) => {
                  const isActive = currentBookId === item.id && currentChapter === item.ch;
                  return (
                    <button
                      key={`${item.id}-${item.ch}`}
                      onClick={() => handleSelectPassage(item.id, item.ch)}
                      className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                        isActive
                          ? 'bg-amber-100/90 border-amber-400 text-amber-950 font-bold shadow-xs'
                          : 'bg-stone-50 hover:bg-amber-50/70 border-stone-200 text-stone-800'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate font-serif">{item.title}</div>
                        <div className="text-[10px] text-amber-700/80 mt-0.5">{item.raga}</div>
                      </div>
                      <Music className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-700' : 'text-stone-400'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Devotional Singing Audio Player Deck */}
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
        onApplyPreset={(preset) => {
          audioEngine.applyAmbiencePreset(preset);
          setSettings(audioEngine.getSettings());
        }}
        onPlay={handlePlay}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
        onPrev={handlePrev}
        onNext={handleNext}
        onPlayWholeChapter={handlePlayWholeChapter}
        onPlaySingleVerse={handlePlaySingleVerse}
        analyser={audioEngine.getAnalyser()}
        onGenerateAiAudio={handleGenerateAiAudio}
        isGeneratingAiAudio={isGeneratingAiAudio}
        hasAiAudio={!!aiAudioUrl}
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
