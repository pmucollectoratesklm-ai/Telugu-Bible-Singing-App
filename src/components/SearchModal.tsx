import React, { useState, useMemo } from 'react';
import { X, Search, Music, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { BibleVerse } from '../types';
import { PRELOADED_SCRIPTURES, BIBLE_BOOKS } from '../data/teluguBibleData';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPassage: (bookId: string, chapter: number, verseNumber?: number) => void;
  customScriptures?: Record<string, { title: string; theme: string; verses: BibleVerse[] }>;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectPassage,
  customScriptures = {},
}) => {
  const [query, setQuery] = useState('');

  // Collect all searchable verses
  const allVerses = useMemo(() => {
    const list: BibleVerse[] = [];
    // Preloaded
    Object.values(PRELOADED_SCRIPTURES).forEach((item) => {
      list.push(...item.verses);
    });
    // Custom uploaded
    Object.values(customScriptures || {}).forEach((item: { title: string; theme: string; verses: BibleVerse[] }) => {
      if (item?.verses) {
        list.push(...item.verses);
      }
    });
    return list;
  }, [customScriptures]);

  // Quick keyword suggestions
  const suggestions = [
    'కాపరి (Shepherd)',
    'ప్రేమ (Love)',
    'సహాయము (Help)',
    'యోహాను 3:16',
    'కీర్తనలు 23',
    'ధన్యతలు (Beatitudes)',
    'బలము (Strength)',
    'కృప (Grace)',
  ];

  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return allVerses.filter((v) => {
      const telugu = v.teluguText.toLowerCase();
      const trans = v.transliteration.toLowerCase();
      const mean = v.meaning.toLowerCase();
      const bookTe = v.bookNameTelugu.toLowerCase();
      const bookEn = v.bookNameEnglish.toLowerCase();
      const ref = `${bookEn} ${v.chapterNumber}:${v.verseNumber}`.toLowerCase();
      const refTe = `${bookTe} ${v.chapterNumber}:${v.verseNumber}`.toLowerCase();

      return (
        telugu.includes(q) ||
        trans.includes(q) ||
        mean.includes(q) ||
        bookTe.includes(q) ||
        bookEn.includes(q) ||
        ref.includes(q) ||
        refTe.includes(q)
      );
    });
  }, [allVerses, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-stone-50 border border-amber-900/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="p-4 border-b border-amber-900/10 bg-white flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-700 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="వాక్యము, పుస్తకం, లేదా కీవర్డ్ వెతకండి (e.g. కాపరి, ప్రేమ, John 3:16)..."
            autoFocus
            className="flex-1 text-sm sm:text-base font-medium text-stone-900 placeholder:text-stone-400 bg-transparent focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs px-2 py-1 rounded-md text-stone-500 hover:bg-stone-100"
            >
              క్లియర్
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Keyword Pills */}
        <div className="px-4 py-2 bg-amber-50/70 border-b border-amber-200/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          <span className="text-amber-800 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> సూచనలు:
          </span>
          {suggestions.map((s) => {
            const raw = s.split(' ')[0];
            return (
              <button
                key={s}
                onClick={() => setQuery(raw)}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 whitespace-nowrap transition-colors"
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {query && searchResults.length === 0 && (
            <div className="py-12 text-center text-stone-500">
              <BookOpen className="w-10 h-10 mx-auto text-amber-700/40 mb-2" />
              <p className="text-sm font-medium">ఫలితాలు కనుగొనబడలేదు</p>
              <p className="text-xs text-stone-400 mt-1">
                మరొక పదం లేదా పుస్తకం పేరుతో శోధించండి
              </p>
            </div>
          )}

          {!query && (
            <div className="py-8 text-center text-stone-500">
              <Music className="w-8 h-8 mx-auto text-amber-600 mb-2 animate-bounce" />
              <p className="text-xs sm:text-sm font-medium text-amber-950">
                మీకు ఇష్టమైన బైబిల్ వచనాన్ని శోధించి తక్షణమే గానం వినండి
              </p>
              <p className="text-xs text-stone-400 mt-1">
                తెలుగు లిపి లేదా ఆంగ్ల లిప్యంతరీకరణ రెండింటిలోనూ శోధించవచ్చు
              </p>
            </div>
          )}

          {searchResults.map((verse, idx) => (
            <div
              key={`${verse.bookId}-${verse.chapterNumber}-${verse.verseNumber}-${idx}`}
              className="p-3.5 rounded-xl bg-white hover:bg-amber-50/80 border border-amber-900/10 hover:border-amber-400/50 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    {verse.bookNameTelugu} {verse.chapterNumber}:{verse.verseNumber}
                  </span>
                  <span className="text-xs text-stone-400">
                    ({verse.bookNameEnglish} {verse.chapterNumber}:{verse.verseNumber})
                  </span>
                </div>
                <p className="text-sm text-stone-900 font-serif leading-relaxed line-clamp-2">
                  {verse.teluguText}
                </p>
                <p className="text-xs text-stone-500 italic mt-0.5 line-clamp-1">
                  {verse.transliteration}
                </p>
              </div>

              <button
                onClick={() => {
                  onSelectPassage(verse.bookId, verse.chapterNumber, verse.verseNumber);
                  onClose();
                }}
                className="shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 group-hover:shadow-md"
              >
                <Music className="w-3.5 h-3.5" />
                <span>గానం చేయి</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-stone-100 border-t border-amber-900/10 text-xs text-stone-500 flex items-center justify-between">
          <span>
            {query ? `${searchResults.length} వచనములు దొరికాయి` : 'త్వరిత నావిగేషన్'}
          </span>
          <span className="text-[11px] text-stone-400">ESC నొక్కి మూసివేయండి</span>
        </div>
      </div>
    </div>
  );
};
