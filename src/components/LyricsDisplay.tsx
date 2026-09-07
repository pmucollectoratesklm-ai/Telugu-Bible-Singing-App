import React, { useState } from 'react';
import {
  Play,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Bookmark,
  Sparkles,
  Music,
  Languages,
  BookOpen,
  Repeat,
  Radio,
  Sliders,
  ChevronRight,
  ListFilter,
} from 'lucide-react';
import { BibleVerse, BackgroundMusicStyle } from '../types';

interface LyricsDisplayProps {
  verses: BibleVerse[];
  currentVerseIndex: number;
  currentLineIndex: number;
  isPlaying: boolean;
  onPlayVerse: (index: number) => void;
  title: string;
  theme?: string;
  ragaName: string;
  highlightedDailyVerse?: { bookId: string; chapterNumber: number; verseNumber: number };
  // Whole Chapter vs Individual Verse controls
  listenMode?: 'chapter' | 'verse';
  onSelectListenMode?: (mode: 'chapter' | 'verse') => void;
  onPlayWholeChapter?: (startIndex?: number) => void;
  onPlaySingleVerse?: (index: number) => void;
  selectedVerseNumber?: number;
  onSelectVerseFilter?: (verseNumber?: number) => void;
  autoAdvanceVerse?: boolean;
  onToggleAutoAdvance?: () => void;
  repeatMode?: 'off' | 'verse' | 'chapter';
  onToggleRepeat?: () => void;
  // Background music controls
  bgMusicStyle?: BackgroundMusicStyle;
  bgMusicMuted?: boolean;
  onToggleBgMusicMuted?: () => void;
  onSelectBgMusicStyle?: (style: BackgroundMusicStyle) => void;
}

export const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  verses,
  currentVerseIndex,
  currentLineIndex,
  isPlaying,
  onPlayVerse,
  title,
  theme,
  ragaName,
  highlightedDailyVerse,
  listenMode = 'chapter',
  onSelectListenMode,
  onPlayWholeChapter,
  onPlaySingleVerse,
  selectedVerseNumber,
  onSelectVerseFilter,
  autoAdvanceVerse = true,
  onToggleAutoAdvance,
  repeatMode = 'off',
  onToggleRepeat,
  bgMusicStyle = 'worship_piano',
  bgMusicMuted = false,
  onToggleBgMusicMuted,
  onSelectBgMusicStyle,
}) => {
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showSwaras, setShowSwaras] = useState(true);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>('large');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<number>>(new Set());

  const handleCopy = (verse: BibleVerse, index: number) => {
    const textToCopy = `${verse.bookNameTelugu} ${verse.chapterNumber}:${verse.verseNumber}\n${verse.teluguText}\n${verse.transliteration}\n${verse.meaning}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleBookmark = (index: number) => {
    setBookmarkedVerses((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'normal':
        return 'text-base sm:text-lg';
      case 'large':
        return 'text-lg sm:text-xl';
      case 'xl':
        return 'text-xl sm:text-2xl';
    }
  };

  const getBgStyleLabel = (style: BackgroundMusicStyle) => {
    switch (style) {
      case 'worship_piano':
        return '🎹 ఆరాధన పియానో (Worship Piano)';
      case 'acoustic_guitar':
        return '🎸 అకౌస్టిక్ హార్ప్ (Acoustic Harp)';
      case 'sacred_strings':
        return '🎻 దివ్య స్ట్రింగ్స్ (Sacred Strings)';
      case 'soothing_tanpura':
        return '🪕 సాత్విక తంబుర (Pure Sine Drone)';
      case 'vocals_only':
        return '🔇 గాత్రం మాత్రమే (Vocals Only)';
      default:
        return '🎹 ఆరాధన పియానో';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-stone-50/50 rounded-2xl border border-amber-900/10 shadow-xs overflow-hidden">
      {/* Top Bar with Title and Display Toggles */}
      <div className="p-4 sm:p-5 border-b border-amber-900/10 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-amber-950 font-serif truncate">
              {title}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
              {ragaName}
            </span>
            {/* Active Listen Mode Badge */}
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                listenMode === 'chapter'
                  ? 'bg-amber-500/15 text-amber-900 border-amber-500/30'
                  : 'bg-indigo-500/15 text-indigo-900 border-indigo-500/30'
              }`}
            >
              {listenMode === 'chapter' ? (
                <>
                  <BookOpen className="w-3 h-3 text-amber-700" />
                  సంపూర్ణ అధ్యాయం ({verses.length} వచనాలు)
                </>
              ) : (
                <>
                  <Bookmark className="w-3 h-3 text-indigo-700" />
                  వ్యక్తిగత వచనం
                </>
              )}
            </span>
          </div>
          {theme && (
            <p className="text-xs text-amber-800/80 mt-0.5 font-medium truncate">
              {theme}
            </p>
          )}
        </div>

        {/* View toggles & Font Sizing */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Swaras Toggle */}
          <button
            onClick={() => setShowSwaras(!showSwaras)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showSwaras
                ? 'bg-amber-100 text-amber-950 border-amber-300 font-semibold'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
            title="Toggle Carnatic / Devotional Swara notations"
          >
            <Music className="w-3 h-3" />
            <span>స్వరాలు (Swaras)</span>
          </button>

          {/* Transliteration Toggle */}
          <button
            onClick={() => setShowTransliteration(!showTransliteration)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showTransliteration
                ? 'bg-amber-100 text-amber-950 border-amber-300 font-semibold'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
            title="Toggle English Transliteration"
          >
            <Languages className="w-3 h-3" />
            <span>లిప్యంతరీకరణ</span>
          </button>

          {/* Meaning Toggle */}
          <button
            onClick={() => setShowMeaning(!showMeaning)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showMeaning
                ? 'bg-amber-100 text-amber-950 border-amber-300 font-semibold'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
            title="Toggle English Translation / Meaning"
          >
            <span>భావార్థం</span>
          </button>

          {/* Font Size Selector */}
          <div className="flex items-center rounded-lg border border-stone-200 bg-white p-0.5 ml-1">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-0.5 text-xs rounded transition-all ${
                fontSize === 'normal' ? 'bg-amber-200 text-amber-950 font-bold' : 'text-stone-500'
              }`}
              title="Normal font size"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-0.5 text-xs rounded transition-all ${
                fontSize === 'large' ? 'bg-amber-200 text-amber-950 font-bold' : 'text-stone-500'
              }`}
              title="Large font size"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('xl')}
              className={`px-2 py-0.5 text-xs rounded transition-all ${
                fontSize === 'xl' ? 'bg-amber-200 text-amber-950 font-bold' : 'text-stone-500'
              }`}
              title="Extra large font size"
            >
              A++
            </button>
          </div>
        </div>
      </div>

      {/* DEDICATED LISTEN MODE & VERSES SELECTOR BAR */}
      <div className="bg-amber-50/70 border-b border-amber-900/10 px-4 py-3 space-y-2.5">
        {/* Row 1: Mode Switcher & Direct Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-amber-900/15 shadow-2xs">
            <button
              id="lyrics-mode-whole-chapter-btn"
              onClick={() => {
                onSelectListenMode?.('chapter');
                onSelectVerseFilter?.(undefined);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                listenMode === 'chapter'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-amber-900 hover:bg-amber-50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>సంపూర్ణ అధ్యాయం (Whole Chapter)</span>
            </button>

            <button
              id="lyrics-mode-single-verse-btn"
              onClick={() => {
                onSelectListenMode?.('verse');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                listenMode === 'verse'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-amber-900 hover:bg-amber-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>వ్యక్తిగత వచనం (Individual Verse)</span>
            </button>
          </div>

          {/* Quick Play Trigger & Background Music Quick Control */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Action Button based on mode */}
            {listenMode === 'chapter' ? (
              <button
                id="play-whole-chapter-action-btn"
                onClick={() => onPlayWholeChapter?.(0)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-xs hover:shadow transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>మొత్తం అధ్యాయం పాడండి (1 - {verses.length})</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                <span className="font-semibold text-amber-950">క్రింది వచనాలలో ఒకదాన్ని ఎంచుకోండి</span>
                {/* Auto Advance Toggle */}
                {onToggleAutoAdvance && (
                  <button
                    onClick={onToggleAutoAdvance}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                      autoAdvanceVerse
                        ? 'bg-amber-200/70 text-amber-950 border-amber-400'
                        : 'bg-white text-stone-500 border-stone-300'
                    }`}
                    title="వచనం ముగిసిన వెంటనే తర్వాతి వచనం పాడండి"
                  >
                    <span>ఆటో తదుపరి: {autoAdvanceVerse ? 'ఆన్' : 'ఆఫ్'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Repeat Toggle */}
            {onToggleRepeat && (
              <button
                onClick={onToggleRepeat}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  repeatMode !== 'off'
                    ? 'bg-amber-100 text-amber-950 border-amber-400'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-amber-50'
                }`}
                title="గానం లూప్ చేయండి"
              >
                <Repeat className="w-3.5 h-3.5 text-amber-700" />
                <span>{repeatMode === 'verse' ? 'వచనం లూప్' : repeatMode === 'chapter' ? 'అధ్యాయం లూప్' : 'లూప్'}</span>
              </button>
            )}

            {/* Quick Background Music Mute/Style Pill */}
            {onToggleBgMusicMuted && (
              <button
                onClick={onToggleBgMusicMuted}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  bgMusicMuted
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'
                }`}
                title={
                  bgMusicMuted
                    ? 'నేపథ్య సంగీతం మ్యూట్ చేయబడింది. ఆన్ చేయడానికి క్లిక్ చేయండి'
                    : 'సంగీతం మ్యూట్ చేసి కేవలం గాత్రం మాత్రమే వినండి'
                }
              >
                {bgMusicMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                    <span>గాత్రం మాత్రమే</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {bgMusicStyle === 'worship_piano'
                        ? 'పియానో'
                        : bgMusicStyle === 'acoustic_guitar'
                        ? 'హార్ప్'
                        : bgMusicStyle === 'sacred_strings'
                        ? 'స్ట్రింగ్స్'
                        : bgMusicStyle === 'soothing_tanpura'
                        ? 'తంబుర'
                        : 'గాత్రం'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Quick Verse Jump Numbers Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin text-xs">
          <span className="text-[11px] font-bold text-amber-900 shrink-0 flex items-center gap-1 mr-1">
            <ListFilter className="w-3 h-3 text-amber-700" />
            వచనం ఎంపిక:
          </span>

          {/* All Verses Pill */}
          <button
            onClick={() => {
              onSelectVerseFilter?.(undefined);
              onSelectListenMode?.('chapter');
              onPlayWholeChapter?.(0);
            }}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
              listenMode === 'chapter' && !selectedVerseNumber
                ? 'bg-amber-700 text-white shadow-2xs'
                : 'bg-white hover:bg-amber-100 text-amber-950 border border-amber-900/10'
            }`}
          >
            అన్ని వచనాలు (1-{verses.length})
          </button>

          {/* Individual Verse Pills */}
          {verses.map((verse, idx) => {
            const isCurrentlyPlaying = isPlaying && currentVerseIndex === idx;
            const isSelected = selectedVerseNumber === verse.verseNumber;

            return (
              <button
                key={`pill-${verse.verseNumber}`}
                onClick={() => {
                  onSelectVerseFilter?.(verse.verseNumber);
                  onSelectListenMode?.('verse');
                  onPlaySingleVerse?.(idx);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all flex items-center gap-1 ${
                  isCurrentlyPlaying
                    ? 'bg-emerald-600 text-white shadow-xs animate-pulse ring-2 ring-emerald-400'
                    : isSelected
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white hover:bg-amber-100 text-stone-700 border border-stone-200'
                }`}
                title={`వచనం ${verse.verseNumber} పాడండి`}
              >
                <span>{verse.verseNumber}</span>
                {isCurrentlyPlaying && <Music className="w-2.5 h-2.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lyrics Content Verse by Verse */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {verses.map((verse, index) => {
          const isCurrent = isPlaying && currentVerseIndex === index;
          const isBookmarked = bookmarkedVerses.has(index);
          const isDailyVerse =
            highlightedDailyVerse &&
            verse.bookId === highlightedDailyVerse.bookId &&
            verse.chapterNumber === highlightedDailyVerse.chapterNumber &&
            verse.verseNumber === highlightedDailyVerse.verseNumber;
          const isTargeted = selectedVerseNumber === verse.verseNumber;

          return (
            <div
              key={`${verse.bookId}-${verse.chapterNumber}-${verse.verseNumber}`}
              id={`verse-card-${index}`}
              className={`group relative p-4 sm:p-5 rounded-2xl transition-all duration-300 border ${
                isCurrent
                  ? 'bg-gradient-to-r from-amber-100/95 via-amber-50 to-white border-amber-500 shadow-md shadow-amber-500/10 ring-2 ring-amber-400/50 scale-[1.008]'
                  : isDailyVerse
                  ? 'bg-gradient-to-r from-amber-100/60 via-amber-50/40 to-white border-amber-400 shadow-xs ring-1 ring-amber-400/40'
                  : isTargeted
                  ? 'bg-amber-50/80 border-amber-300 shadow-2xs'
                  : 'bg-white hover:bg-amber-50/40 border-stone-200/80 hover:border-amber-300/60 shadow-xs'
              }`}
            >
              {/* Verse Badge & Playing indicator */}
              <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
                        : isDailyVerse
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-amber-100 text-amber-900 group-hover:bg-amber-200'
                    }`}
                  >
                    {verse.verseNumber}
                  </span>
                  <span className="text-xs font-bold text-amber-950 font-serif">
                    {verse.bookNameTelugu} {verse.chapterNumber}:{verse.verseNumber}
                  </span>

                  {isDailyVerse && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-xs animate-pulse">
                      <Sparkles className="w-3 h-3 text-amber-100" />
                      నేటి దిన వాక్యము (Verse of the Day)
                    </span>
                  )}

                  {isCurrent && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs animate-pulse">
                      <Volume2 className="w-3 h-3 text-emerald-600" />
                      {listenMode === 'chapter' ? 'అధ్యాయంలో గానం సాగుతోంది' : 'ఈ వచనం గానం నడుస్తోంది'}
                    </span>
                  )}
                </div>

                {/* Verse Action Buttons: Sing this single verse, play whole chapter from here, repeat, bookmark, copy */}
                <div className="flex items-center gap-1.5">
                  {/* Sing Just This Verse */}
                  <button
                    onClick={() => {
                      onSelectListenMode?.('verse');
                      onPlaySingleVerse ? onPlaySingleVerse(index) : onPlayVerse(index);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                      isCurrent && listenMode === 'verse'
                        ? 'bg-amber-700 text-white ring-2 ring-amber-400'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300/60'
                    }`}
                    title="ఈ ఒక్క వచనాన్ని మాత్రమే గానం చేయండి"
                  >
                    <Bookmark className="w-3 h-3" />
                    <span>ఈ వచనం</span>
                  </button>

                  {/* Play Whole Chapter Starting From This Verse */}
                  <button
                    onClick={() => {
                      onSelectListenMode?.('chapter');
                      onPlayWholeChapter ? onPlayWholeChapter(index) : onPlayVerse(index);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-all active:scale-95"
                    title="ఈ వచనం నుండి సంపూర్ణ అధ్యాయం గానం కొనసాగించండి"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span className="hidden sm:inline">ఇక్కడి నుండి అధ్యాయం</span>
                  </button>

                  {/* Bookmark */}
                  <button
                    onClick={() => toggleBookmark(index)}
                    className={`p-1.5 rounded-lg hover:bg-amber-100 text-stone-400 transition-colors ${
                      isBookmarked ? 'text-amber-600 bg-amber-50' : 'hover:text-stone-700'
                    }`}
                    title={isBookmarked ? 'బుక్‌మార్క్ తీసివేయి' : 'బుక్‌మార్క్ చేయండి'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500 text-amber-600' : ''}`} />
                  </button>

                  {/* Copy */}
                  <button
                    onClick={() => handleCopy(verse, index)}
                    className="p-1.5 rounded-lg hover:bg-amber-100 text-stone-400 hover:text-stone-700 transition-colors"
                    title="వచనము కాపీ చేయండి"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Swaras Notation (Musical notes) */}
              {showSwaras && (verse.swaras || 'స . గ . ప . ద . స\' . . .') && (
                <div className="mb-2.5 font-mono text-xs text-amber-900 bg-amber-200/50 px-3 py-1 rounded-lg border border-amber-300/60 inline-block tracking-wider">
                  <span className="text-[10px] font-sans font-bold text-amber-950 mr-1.5">
                    స్వరకల్పన:
                  </span>
                  {verse.swaras || 'స . గ . ప . ద . స\' . . .'}
                </div>
              )}

              {/* Telugu Primary Scripture Lyrics */}
              <div
                className={`font-serif font-medium leading-relaxed tracking-wide transition-colors ${getFontSizeClass()} ${
                  isCurrent ? 'text-amber-950 font-bold' : 'text-stone-900'
                }`}
              >
                {verse.teluguText}
              </div>

              {/* English Transliteration */}
              {showTransliteration && verse.transliteration && (
                <p className="mt-2 text-xs sm:text-sm text-amber-900/80 italic font-sans leading-relaxed">
                  {verse.transliteration}
                </p>
              )}

              {/* English Translation / Meaning */}
              {showMeaning && verse.meaning && (
                <p className="mt-2 text-xs text-stone-600 font-sans border-t border-amber-900/10 pt-2">
                  <span className="font-semibold text-stone-700 mr-1">English:</span>
                  {verse.meaning}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
