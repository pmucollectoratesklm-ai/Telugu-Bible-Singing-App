import React from 'react';
import { Search, Upload, BookOpen, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onOpenSelector: () => void;
  onOpenSearch: () => void;
  onOpenUpload: () => void;
  onOpenDailyVerse?: () => void;
  isPlaying: boolean;
  currentBookName: string;
  currentChapter: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSelector,
  onOpenSearch,
  onOpenUpload,
  isPlaying,
  currentBookName,
  currentChapter,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Minimal Brand */}
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold text-stone-900 font-serif tracking-tight">
            పరిశుద్ధ గ్రంథము
          </span>
          <span className="text-[11px] font-sans text-stone-400 hidden sm:inline">
            Telugu Holy Bible
          </span>
        </div>

        {/* Center: Current Scripture Quick Selector Button */}
        <button
          id="header-select-btn"
          onClick={onOpenSelector}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200/80 border border-stone-300/80 text-stone-900 text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-2xs"
          title="అధ్యాయం ఎంచుకోండి (Select Scripture Book & Chapter)"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
          <span className="font-serif">
            {currentBookName} {currentChapter}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
        </button>

        {/* Right: Search & Upload Icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            id="header-search-btn"
            onClick={onOpenSearch}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-full transition-all"
            title="వెతుకు (Search Bible Verses)"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            id="header-upload-btn"
            onClick={onOpenUpload}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-full transition-all"
            title="PDF నుండి అధ్యాయం జోడించండి (Upload Bible PDF)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
