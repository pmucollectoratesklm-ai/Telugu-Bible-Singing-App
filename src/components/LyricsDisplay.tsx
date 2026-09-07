import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Copy, Check, Volume2 } from 'lucide-react';
import { BibleVerse } from '../types';

interface LyricsDisplayProps {
  verses: BibleVerse[];
  currentVerseIndex: number;
  currentLineIndex?: number;
  isPlaying: boolean;
  onPlayVerse: (index: number) => void;
  title: string;
  theme?: string;
  ragaName?: string;
  onPlayWholeChapter?: (startIndex?: number) => void;
  onPlaySingleVerse?: (index: number) => void;
  selectedVerseNumber?: number;
  onSelectVerseFilter?: (verseNumber?: number) => void;
  // Chapter Completion Readout
  isChapterCompleted?: boolean;
  isAnnouncingCompletion?: boolean;
  announcementText?: string;
  onNextChapter?: () => void;
  hasNextChapter?: boolean;
  nextChapterNumber?: number;
}

export const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  verses,
  currentVerseIndex,
  isPlaying,
  onPlayVerse,
  title,
  theme,
  onPlayWholeChapter,
  onPlaySingleVerse,
  selectedVerseNumber,
  isChapterCompleted = false,
  isAnnouncingCompletion = false,
  announcementText = '',
  onNextChapter,
  hasNextChapter = false,
  nextChapterNumber,
}) => {
  const [showEnglish, setShowEnglish] = useState(false);
  const [activeTabMode, setActiveTabMode] = useState<'chapter' | 'verse'>('chapter');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const activeVerseRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll active playing verse gently into view
  useEffect(() => {
    if (isPlaying && activeVerseRef.current) {
      activeVerseRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentVerseIndex, isPlaying]);

  const handleCopy = (verse: BibleVerse, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${verse.bookNameTelugu} ${verse.chapterNumber}:${verse.verseNumber}\n${verse.teluguText}${
      verse.meaning ? `\n\n${verse.meaning}` : ''
    }`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
      {/* Chapter Top Section */}
      <div className="px-6 py-6 sm:px-8 sm:py-7 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 tracking-tight">
              {title}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              {verses.length} వచనములు
            </span>
          </div>
          {theme && (
            <p className="text-xs sm:text-sm text-stone-500 font-serif mt-1">
              {theme}
            </p>
          )}
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={() => {
              setActiveTabMode('chapter');
              onPlayWholeChapter?.(0);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs"
            title="1వ వచనము నుండి చివరి వరకు క్రమముగా వినండి"
          >
            {isPlaying && activeTabMode === 'chapter' ? (
              <>
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span>వింటున్నారు</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>మొత్తం అధ్యాయం</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowEnglish(!showEnglish)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              showEnglish
                ? 'bg-stone-900 text-stone-50 border-stone-900'
                : 'bg-stone-100 hover:bg-stone-200/80 text-stone-600 border-stone-200'
            }`}
          >
            {showEnglish ? 'ఆంగ్లం: ఆన్' : 'ఆంగ్ల అనువాదం'}
          </button>
        </div>
      </div>

      {/* Listening Choice Toolbar: Whole Chapter vs Desired Verse */}
      <div className="px-6 py-3 sm:px-8 bg-stone-50/80 border-b border-stone-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Toggle Mode */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-600 font-serif">వినే ఎంపిక:</span>
          <div className="inline-flex rounded-full bg-stone-200/80 p-0.5 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTabMode('chapter');
                onPlayWholeChapter?.(0);
              }}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                activeTabMode === 'chapter'
                  ? 'bg-amber-500 text-stone-950 shadow-xs font-bold'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <span>📖 మొత్తం అధ్యాయము</span>
            </button>
            <button
              onClick={() => {
                setActiveTabMode('verse');
                onPlaySingleVerse?.(currentVerseIndex);
              }}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                activeTabMode === 'verse'
                  ? 'bg-amber-500 text-stone-950 shadow-xs font-bold'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <span>🎯 కోరుకున్న వచనము</span>
            </button>
          </div>
        </div>

        {/* Desired Verse Jump Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <span className="text-[11px] text-stone-500 shrink-0 font-medium font-serif">వచనము:</span>
          {verses.map((v, i) => {
            const isPlayingThis = isPlaying && currentVerseIndex === i;
            return (
              <button
                key={v.verseNumber}
                onClick={() => {
                  setActiveTabMode('verse');
                  onPlaySingleVerse ? onPlaySingleVerse(i) : onPlayVerse(i);
                }}
                className={`h-7 px-2.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  isPlayingThis
                    ? 'bg-amber-600 text-white shadow-xs scale-105 ring-2 ring-amber-400/40'
                    : 'bg-white hover:bg-stone-200/80 text-stone-700 border border-stone-200'
                }`}
                title={`వచనము ${v.verseNumber} నేరుగా వినండి`}
              >
                {v.verseNumber}
              </button>
            );
          })}
        </div>
      </div>

      {/* Verses Reading List */}
      <div className="divide-y divide-stone-100">
        {verses.map((verse, index) => {
          const isActive = isPlaying && currentVerseIndex === index;

          return (
            <div
              key={`${verse.chapterNumber}-${verse.verseNumber}`}
              ref={isActive ? activeVerseRef : null}
              className={`group px-6 py-5 sm:px-8 sm:py-6 transition-all relative flex items-start gap-4 ${
                isActive
                  ? 'bg-amber-50/70 border-l-4 border-l-amber-500'
                  : 'hover:bg-stone-50/70 border-l-4 border-l-transparent'
              }`}
            >
              {/* Verse Number Indicator & Quick Play Button */}
              <div className="shrink-0 pt-0.5 flex flex-col items-center gap-1.5">
                <button
                  onClick={() => {
                    setActiveTabMode('verse');
                    onPlaySingleVerse ? onPlaySingleVerse(index) : onPlayVerse(index);
                  }}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold font-serif transition-all ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-xs ring-2 ring-amber-300'
                      : 'bg-stone-100 text-stone-700 hover:bg-amber-200 hover:text-amber-950'
                  }`}
                  title={`వచనము ${verse.verseNumber} వినండి (Play Verse ${verse.verseNumber})`}
                >
                  {isActive ? <Volume2 className="w-4 h-4 animate-pulse" /> : verse.verseNumber}
                </button>
              </div>

              {/* Verse Content */}
              <div className="flex-1 min-w-0 pr-16 sm:pr-24">
                {/* Telugu Scripture Text */}
                <p
                  onClick={() => {
                    setActiveTabMode('verse');
                    onPlaySingleVerse ? onPlaySingleVerse(index) : onPlayVerse(index);
                  }}
                  className={`text-lg sm:text-xl leading-relaxed font-serif transition-colors cursor-pointer ${
                    isActive
                      ? 'text-stone-950 font-semibold'
                      : 'text-stone-800 hover:text-amber-900'
                  }`}
                >
                  {verse.teluguText}
                </p>

                {/* English Meaning / Transliteration (if enabled) */}
                {showEnglish && (verse.meaning || verse.transliteration) && (
                  <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed font-sans">
                    {verse.meaning || verse.transliteration}
                  </p>
                )}

                {/* Micro Action Buttons underneath verse */}
                <div className="mt-2 flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity text-[11px]">
                  <button
                    onClick={() => {
                      setActiveTabMode('verse');
                      onPlaySingleVerse ? onPlaySingleVerse(index) : onPlayVerse(index);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-900 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>ఈ వచనం వినండి</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTabMode('chapter');
                      onPlayWholeChapter?.(index);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-900 transition-colors"
                  >
                    <span>ఇక్కడి నుండి అధ్యాయం</span>
                  </button>
                </div>
              </div>

              {/* Action: Copy verse icon */}
              <button
                onClick={(e) => handleCopy(verse, index, e)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-stone-400 hover:text-stone-800 rounded-lg transition-all absolute right-4 top-4"
                title="వచనాన్ని కాపీ చేయండి (Copy Verse)"
              >
                {copiedIndex === index ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Chapter Completion Announcement Banner (During Voice Readout) */}
      {isAnnouncingCompletion && (
        <div className="px-6 py-5 sm:px-8 sm:py-6 bg-amber-500/10 border-t border-amber-200/80 flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900 font-sans">
              అధ్యాయము సమాప్తమైనది చదవబడుచున్నది...
            </p>
            <p className="text-sm sm:text-base font-serif font-semibold text-stone-900 mt-0.5">
              {announcementText || `${title} సంపూర్ణముగా సమాప్తమైనది. దేవునికి స్తోత్రము.`}
            </p>
          </div>
        </div>
      )}

      {/* Chapter Completed Card (After Complete Readout) */}
      {isChapterCompleted && !isAnnouncingCompletion && (
        <div className="px-6 py-6 sm:px-8 sm:py-7 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                {title} సంపూర్ణముగా చదవబడినది
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 font-serif">
                దేవునికి స్తోత్రము. ప్రతి వచనము తుది అక్షరము వరకు పూర్తి చేయబడినది.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => onPlayWholeChapter?.(0)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-semibold transition-all active:scale-95 shadow-2xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>మరల వినండి</span>
            </button>

            {hasNextChapter && onNextChapter && (
              <button
                onClick={onNextChapter}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold transition-all active:scale-95 shadow-xs"
              >
                <span>{nextChapterNumber}వ అధ్యాయం</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
