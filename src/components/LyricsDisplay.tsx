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
  // Optional props for backward compatibility
  highlightedDailyVerse?: { bookId: string; chapterNumber: number; verseNumber: number };
  listenMode?: 'chapter' | 'verse';
  onSelectListenMode?: (mode: 'chapter' | 'verse') => void;
  autoAdvanceVerse?: boolean;
  onToggleAutoAdvance?: () => void;
  repeatMode?: 'off' | 'verse' | 'chapter';
  onToggleRepeat?: () => void;
  bgMusicStyle?: any;
  bgMusicMuted?: boolean;
  onToggleBgMusicMuted?: () => void;
  onSelectBgMusicStyle?: (style: any) => void;
}

export const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  verses,
  currentVerseIndex,
  isPlaying,
  onPlayVerse,
  title,
  theme,
  onPlayWholeChapter,
}) => {
  const [showEnglish, setShowEnglish] = useState(false);
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
      <div className="px-6 py-6 sm:px-8 sm:py-8 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 tracking-tight">
            {title}
          </h1>
          {theme && (
            <p className="text-sm text-stone-500 font-serif mt-1">
              {theme}
            </p>
          )}
        </div>

        {/* Minimal Actions */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <button
            onClick={() => onPlayWholeChapter?.(0)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-xs"
          >
            {isPlaying ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span>వింటున్నారు</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>అధ్యాయం వినండి</span>
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

      {/* Verses Reading List */}
      <div className="divide-y divide-stone-100">
        {verses.map((verse, index) => {
          const isActive = isPlaying && currentVerseIndex === index;

          return (
            <div
              key={`${verse.chapterNumber}-${verse.verseNumber}`}
              ref={isActive ? activeVerseRef : null}
              onClick={() => onPlayVerse(index)}
              className={`group px-6 py-5 sm:px-8 sm:py-6 transition-all cursor-pointer relative flex items-start gap-4 ${
                isActive
                  ? 'bg-amber-50/70 border-l-4 border-l-amber-500'
                  : 'hover:bg-stone-50/80 border-l-4 border-l-transparent'
              }`}
            >
              {/* Verse Number Indicator */}
              <div className="shrink-0 pt-0.5">
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-serif transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-2xs'
                      : 'bg-stone-100 text-stone-500 group-hover:text-stone-900 group-hover:bg-stone-200/70'
                  }`}
                >
                  {verse.verseNumber}
                </span>
              </div>

              {/* Verse Content */}
              <div className="flex-1 min-w-0 pr-8">
                {/* Telugu Scripture Text */}
                <p
                  className={`text-lg sm:text-xl leading-relaxed font-serif transition-colors ${
                    isActive
                      ? 'text-stone-950 font-semibold'
                      : 'text-stone-800'
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
    </div>
  );
};
