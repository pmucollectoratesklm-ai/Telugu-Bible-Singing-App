import React, { useState, useMemo } from 'react';
import { X, Search, Check, Music2, Sparkles, BookMarked, BookmarkCheck, Play, ListOrdered, CheckCircle2 } from 'lucide-react';
import { BibleBook, BibleVerse, Testament } from '../types';
import { BIBLE_BOOKS, PRELOADED_SCRIPTURES } from '../data/teluguBibleData';
import { getBibleChapter } from '../data/scriptureService';

interface ScriptureSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentBookId: string;
  currentChapter: number;
  currentVerseNumber?: number;
  onSelectPassage: (bookId: string, chapter: number, verseNumber?: number, playMode?: 'chapter' | 'verse') => void;
  customScriptures?: Record<string, { title: string; theme: string; verses: BibleVerse[] }>;
}

export const ScriptureSelector: React.FC<ScriptureSelectorProps> = ({
  isOpen,
  onClose,
  currentBookId,
  currentChapter,
  currentVerseNumber,
  onSelectPassage,
  customScriptures = {},
}) => {
  const [testament, setTestament] = useState<Testament>('old');
  const [selectedBookId, setSelectedBookId] = useState<string>(currentBookId);
  const [selectedChapter, setSelectedChapter] = useState<number>(currentChapter);
  const [selectedVerse, setSelectedVerse] = useState<number | undefined>(currentVerseNumber);
  const [searchQuery, setSearchQuery] = useState('');

  const allScriptureKeys = useMemo(() => {
    const keys = new Set(Object.keys(PRELOADED_SCRIPTURES));
    if (customScriptures) {
      Object.keys(customScriptures).forEach((k) => keys.add(k));
    }
    return keys;
  }, [customScriptures]);

  // Chapter details & verses using getBibleChapter
  const chapterData = useMemo(() => {
    return getBibleChapter(selectedBookId, selectedChapter, customScriptures);
  }, [selectedBookId, selectedChapter, customScriptures]);

  const chapterVerses = chapterData.verses;

  // Selected verse object
  const selectedVerseObj = useMemo(() => {
    if (selectedVerse === undefined) return null;
    return chapterVerses.find((v) => v.verseNumber === selectedVerse) || chapterVerses[0];
  }, [chapterVerses, selectedVerse]);

  const selectedBook = useMemo(() => {
    return BIBLE_BOOKS.find((b) => b.id === selectedBookId) || BIBLE_BOOKS[0];
  }, [selectedBookId]);

  // Filter books by testament and search query
  const filteredBooks = useMemo(() => {
    return BIBLE_BOOKS.filter((book) => {
      const matchesTestament = book.testament === testament;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesTestament;
      const matchesSearch =
        book.nameTelugu.toLowerCase().includes(q) ||
        book.nameEnglish.toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [testament, searchQuery]);

  if (!isOpen) return null;

  const handleConfirmWholeChapter = () => {
    onSelectPassage(selectedBookId, selectedChapter, undefined, 'chapter');
    onClose();
  };

  const handleConfirmVerse = (verseNum?: number) => {
    const targetVerse = verseNum !== undefined ? verseNum : selectedVerse || 1;
    onSelectPassage(selectedBookId, selectedChapter, targetVerse, 'verse');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-stone-50 border border-amber-900/20 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-900/10 bg-amber-100/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <BookMarked className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-950 font-serif">
                బైబిల్ గ్రంథము & అధ్యాయము ఎంపిక
              </h2>
              <p className="text-xs text-amber-800">
                మీరు గానం చేయాలనుకుంటున్న పుస్తకం, అధ్యాయం మరియు వచనములను ఎంచుకోండి
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Highlights of Musical Passages */}
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200/60 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-amber-800 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            ప్రముఖ కీర్తనలు:
          </span>
          {[
            { id: 'psalms', ch: 23, label: 'కీర్తనలు 23 (కాపరి)' },
            { id: 'john', ch: 3, label: 'యోహాను 3:16 (ప్రేమ)' },
            { id: 'psalms', ch: 121, label: 'కీర్తనలు 121 (సహాయం)' },
            { id: '1corinthians', ch: 13, label: '1 కొరింథీ 13 (ప్రేమ గీతం)' },
            { id: 'psalms', ch: 100, label: 'కీర్తనలు 100 (స్తుతి)' },
            { id: 'matthew', ch: 5, label: 'మత్తయి 5 (ధన్యతలు)' },
            { id: 'isaiah', ch: 40, label: 'యెషయా 40 (బలము)' },
          ].map((item) => (
            <button
              key={`${item.id}-${item.ch}`}
              onClick={() => {
                setSelectedBookId(item.id);
                setSelectedChapter(item.ch);
                setSelectedVerse(undefined);
              }}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all border ${
                selectedBookId === item.id && selectedChapter === item.ch
                  ? 'bg-amber-600 text-white border-amber-700 font-semibold shadow-xs'
                  : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Content Area: 3 Columns (Books, Chapters, Verses) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-[360px]">
          {/* Column 1: Books (5 cols on md) */}
          <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-amber-900/10 flex flex-col overflow-hidden bg-white/60">
            {/* Testament switcher & Search */}
            <div className="p-3 border-b border-amber-900/10 space-y-2">
              <div className="flex rounded-lg bg-amber-100/70 p-0.5 border border-amber-200">
                <button
                  onClick={() => setTestament('old')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    testament === 'old'
                      ? 'bg-white text-amber-950 shadow-xs'
                      : 'text-amber-800 hover:text-amber-950'
                  }`}
                >
                  పాత నిబంధన (Old)
                </button>
                <button
                  onClick={() => setTestament('new')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    testament === 'new'
                      ? 'bg-white text-amber-950 shadow-xs'
                      : 'text-amber-800 hover:text-amber-950'
                  }`}
                >
                  క్రొత్త నిబంధన (New)
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-600" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="పుస్తకం వెతకండి (e.g. కీర్తనలు, యోహాను)..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-amber-950 placeholder:text-amber-700/50"
                />
              </div>
            </div>

            {/* Book List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-amber-100">
              {filteredBooks.map((book) => {
                const isSelected = book.id === selectedBookId;
                const hasSingingScore = allScriptureKeys.has(`${book.id}-1`) || 
                  (book.id === 'psalms' && allScriptureKeys.has('psalms-23')) ||
                  (book.id === 'john' && allScriptureKeys.has('john-3'));

                return (
                  <button
                    key={book.id}
                    onClick={() => {
                      setSelectedBookId(book.id);
                      setSelectedChapter(1);
                      setSelectedVerse(undefined);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg text-sm transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-white font-semibold shadow-xs'
                        : 'hover:bg-amber-100/60 text-stone-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-serif">{book.nameTelugu}</div>
                      <div className={`text-[11px] truncate ${isSelected ? 'text-amber-100' : 'text-stone-500'}`}>
                        {book.nameEnglish} • {book.totalChapters} అధ్యాయాలు
                      </div>
                    </div>
                    {hasSingingScore && (
                      <span
                        className={`shrink-0 flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-amber-800/60 text-amber-100'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                        title="Melody score & lyrics available"
                      >
                        <Music2 className="w-2.5 h-2.5" />
                        గానం
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Chapters (4 cols on md) */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-amber-900/10 flex flex-col overflow-hidden bg-amber-50/30">
            <div className="p-3 border-b border-amber-900/10 bg-amber-100/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  అధ్యాయం ఎంచుకోండి
                </span>
                <div className="text-xs text-amber-800 truncate font-serif">
                  {selectedBook.nameTelugu} (మొత్తం {selectedBook.totalChapters})
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {Array.from({ length: selectedBook.totalChapters }, (_, i) => i + 1).map((ch) => {
                  const isChSelected = ch === selectedChapter;
                  const key = `${selectedBookId}-${ch}`;
                  const isScored = allScriptureKeys.has(key);

                  return (
                    <button
                      key={ch}
                      onClick={() => {
                        setSelectedChapter(ch);
                        setSelectedVerse(undefined);
                      }}
                      className={`relative h-10 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                        isChSelected
                          ? 'bg-amber-700 text-white ring-2 ring-amber-700 ring-offset-1 shadow-sm'
                          : isScored
                          ? 'bg-amber-200/70 hover:bg-amber-300 text-amber-950 font-bold border border-amber-300'
                          : 'bg-white hover:bg-amber-100/80 text-stone-700 border border-stone-200'
                      }`}
                    >
                      {ch}
                      {isScored && !isChSelected && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 3: Verses (3 cols on md) */}
          <div className="md:col-span-3 flex flex-col overflow-hidden bg-white/80">
            <div className="p-3 border-b border-amber-900/10 bg-amber-100/40">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                వినే ఎంపిక (Listening Choice)
              </span>
              <div className="text-xs text-amber-800 font-medium">
                {selectedBook.nameTelugu} {selectedChapter}వ అధ్యాయము ({chapterVerses.length} వచనములు)
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Option 1: Whole Chapter */}
              <div>
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-amber-700" />
                  <span>ఎంపిక 1: పూర్తి అధ్యాయము</span>
                </div>
                <button
                  id="select-whole-chapter-choice"
                  onClick={() => setSelectedVerse(undefined)}
                  className={`w-full p-3 rounded-xl text-left border transition-all ${
                    selectedVerse === undefined
                      ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400/50'
                      : 'bg-stone-50 hover:bg-amber-50 text-stone-900 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm">
                      📖 మొత్తం అధ్యాయము గానం వినండి
                    </span>
                    {selectedVerse === undefined && (
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    )}
                  </div>
                  <p
                    className={`text-[11px] mt-1 leading-snug ${
                      selectedVerse === undefined ? 'text-amber-100' : 'text-stone-500'
                    }`}
                  >
                    1వ వచనము నుండి {chapterVerses.length}వ వచనము వరకు క్రమముగా పూర్తి అధ్యాయం వినబడుతుంది.
                  </p>
                </button>
              </div>

              {/* Option 2: Specific Verse */}
              <div className="pt-1">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>ఎంపిక 2: కోరుకున్న నిర్దిష్ట వచనము</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {chapterVerses.map((v) => {
                    const isVSelected = selectedVerse === v.verseNumber;
                    return (
                      <button
                        key={v.verseNumber}
                        id={`select-verse-chip-${v.verseNumber}`}
                        onClick={() => setSelectedVerse(v.verseNumber)}
                        className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all border ${
                          isVSelected
                            ? 'bg-amber-700 text-white border-amber-800 shadow-xs ring-2 ring-amber-400/50 scale-105'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-amber-100 hover:border-amber-300'
                        }`}
                      >
                        వ. {v.verseNumber}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Verse Preview Card */}
                {selectedVerseObj && selectedVerse !== undefined && (
                  <div className="mt-2.5 p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 mb-1">
                      <span>ఎంచుకున్న వచనము {selectedVerseObj.verseNumber}:</span>
                      <span className="text-[10px] text-amber-700 font-normal">
                        {selectedBook.nameTelugu} {selectedChapter}:{selectedVerseObj.verseNumber}
                      </span>
                    </div>
                    <p className="text-xs text-stone-800 font-serif leading-relaxed line-clamp-2">
                      {selectedVerseObj.teluguText}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-amber-900/10 bg-stone-100/95 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-stone-700">
            మీరు ఎంచుకున్నది:{' '}
            <span className="font-bold text-amber-950 font-serif">
              {selectedBook.nameTelugu} {selectedChapter}వ అధ్యాయము
              {selectedVerse !== undefined ? ` — వచనము ${selectedVerse}` : ' (మొత్తం అధ్యాయము)'}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-lg transition-colors"
            >
              రద్దు
            </button>

            {selectedVerse !== undefined ? (
              <>
                <button
                  onClick={handleConfirmWholeChapter}
                  className="px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-all"
                  title="మొత్తం అధ్యాయమును మొదటి నుండి వినండి"
                >
                  మొత్తం అధ్యాయం వినండి
                </button>
                <button
                  id="confirm-specific-verse-btn"
                  onClick={() => handleConfirmVerse(selectedVerse)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 rounded-lg transition-all shadow-md shadow-amber-800/20 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  వచనము {selectedVerse} వినండి
                </button>
              </>
            ) : (
              <button
                id="confirm-whole-chapter-btn"
                onClick={handleConfirmWholeChapter}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 rounded-lg transition-all shadow-md shadow-amber-800/20 active:scale-95"
              >
                <Music2 className="w-3.5 h-3.5" />
                మొత్తం అధ్యాయము గానం వినండి
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
