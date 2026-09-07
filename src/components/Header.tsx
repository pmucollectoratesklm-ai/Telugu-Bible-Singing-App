import React from 'react';
import { Music, Search, Upload, BookOpen, Volume2, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenSelector: () => void;
  onOpenSearch: () => void;
  onOpenUpload: () => void;
  onOpenDailyVerse: () => void;
  isPlaying: boolean;
  currentBookName: string;
  currentChapter: number;
  currentRagaName: string;
  currentVoiceName: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSelector,
  onOpenSearch,
  onOpenUpload,
  onOpenDailyVerse,
  isPlaying,
  currentBookName,
  currentChapter,
  currentRagaName,
  currentVoiceName,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-amber-900/10 bg-amber-50/90 backdrop-blur-md transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-600/20 shrink-0">
            <Music className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-amber-950 font-serif tracking-tight truncate">
                తెలుగు గాన బైబిల్
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-200/60 text-amber-900 border border-amber-300/60">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Telugu Singing Bible
              </span>
            </div>
            <p className="text-xs text-amber-800/80 truncate hidden sm:block">
              పరిశుద్ధ గ్రంథ వాక్యములకు రాగ, తాళ, స్వర గాన సంకీర్తన
            </p>
          </div>
        </div>

        {/* Live Active Audio Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100/70 border border-amber-200/80 text-xs text-amber-900">
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          <span className="font-semibold">{currentBookName} {currentChapter}</span>
          <span className="text-amber-600/70">•</span>
          <span className="text-amber-800 font-medium">{currentRagaName}</span>
          <span className="text-amber-600/70">•</span>
          <span className="text-amber-700">{currentVoiceName.split(' ')[0]}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Verse of the Day Quick Jump */}
          <button
            id="header-daily-verse-btn"
            onClick={onOpenDailyVerse}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-amber-950 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 hover:from-amber-300 hover:to-amber-200 border border-amber-400/80 rounded-lg transition-all shadow-xs active:scale-95"
            title="నేటి దిన వాక్య గానం (Verse of the Day)"
          >
            <Sparkles className="w-4 h-4 text-amber-700 animate-pulse" />
            <span className="hidden md:inline font-serif">దిన వాక్యం</span>
          </button>

          {/* Quick Search */}
          <button
            id="header-search-btn"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-900 bg-white hover:bg-amber-100/80 border border-amber-200 rounded-lg transition-all shadow-xs active:scale-95"
            title="Search Bible Verses (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">వెతుకు</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono text-amber-600 bg-amber-50 rounded border border-amber-200">
              ⌘K
            </kbd>
          </button>

          {/* Scripture Selector */}
          <button
            id="header-select-btn"
            onClick={onOpenSelector}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-amber-950 bg-amber-200/70 hover:bg-amber-200 border border-amber-300 rounded-lg transition-all shadow-xs active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-amber-800" />
            <span className="font-medium">అధ్యాయము ఎంపిక</span>
          </button>

          {/* PDF Upload */}
          <button
            id="header-upload-btn"
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 rounded-lg transition-all shadow-sm shadow-amber-800/20 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">PDF అప్‌లోడ్</span>
          </button>
        </div>
      </div>
    </header>
  );
};
