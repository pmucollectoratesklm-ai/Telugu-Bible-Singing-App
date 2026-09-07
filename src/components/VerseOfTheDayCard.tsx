import React, { useState } from 'react';
import {
  Sparkles,
  Music2,
  Play,
  Pause,
  Share2,
  Copy,
  Check,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
  Heart,
  Info,
} from 'lucide-react';
import { DailyVerse, VoiceOption, RagaOption } from '../types';
import { VOICE_OPTIONS, RAGA_OPTIONS } from '../data/teluguBibleData';
import { getFormattedTeluguDate } from '../data/dailyVerses';

interface VerseOfTheDayCardProps {
  dailyVerse: DailyVerse;
  isPlayingTodayVerse: boolean;
  onPlayDailyVerse: (verse: DailyVerse) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onResetToday: () => void;
  dayOffset: number;
}

export const VerseOfTheDayCard: React.FC<VerseOfTheDayCardProps> = ({
  dailyVerse,
  isPlayingTodayVerse,
  onPlayDailyVerse,
  onPrevDay,
  onNextDay,
  onResetToday,
  dayOffset,
}) => {
  const [copied, setCopied] = useState(false);
  const [showReflection, setShowReflection] = useState(false);

  // Derive active date from offset
  const dateObj = new Date();
  if (dayOffset !== 0) {
    dateObj.setDate(dateObj.getDate() + dayOffset);
  }
  const { teluguDate, englishDate } = getFormattedTeluguDate(dateObj);

  const voice = VOICE_OPTIONS.find((v) => v.id === dailyVerse.voiceId) || VOICE_OPTIONS[0];
  const raga = RAGA_OPTIONS.find((r) => r.id === dailyVerse.ragaId) || RAGA_OPTIONS[0];

  const handleCopy = () => {
    const text = `✨ నేటి దిన వాక్య గానం (Verse of the Day) - ${teluguDate}\n📖 ${dailyVerse.bookNameTelugu} ${dailyVerse.chapterNumber}:${dailyVerse.verseNumber}\n"${dailyVerse.teluguText}"\n${dailyVerse.transliteration}\n\nభావార్థం: ${dailyVerse.meaning}\nసంగీత రాగం: ${raga.nameTelugu} | గాత్రం: ${voice.nameTelugu}\nఆత్మీయ ధ్యానము: ${dailyVerse.reflectionTelugu}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `నేటి దిన వాక్య గానం: ${dailyVerse.bookNameTelugu} ${dailyVerse.chapterNumber}:${dailyVerse.verseNumber}`,
          text: `"${dailyVerse.teluguText}"\nరాగం: ${raga.nameTelugu} - Telugu Singing Bible`,
          url: window.location.href,
        });
      } catch {
        // user cancelled or share unsupported
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      id="verse-of-the-day-container"
      className="relative w-full rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-50 via-white to-amber-100/50 shadow-md shadow-amber-900/5 transition-all"
    >
      {/* Decorative Golden Top Accent Ribbon */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700" />

      <div className="p-4 sm:p-6 space-y-4">
        {/* Top Header Bar: Badge, Date, and Day Cycling */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-900/10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-600 text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-spin-slow" />
              నేటి దిన వాక్య గానం • Verse of the Day
            </span>

            <div className="flex items-center gap-1.5 text-xs text-amber-900 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>{teluguDate}</span>
              <span className="text-amber-500 hidden md:inline">|</span>
              <span className="text-stone-500 hidden md:inline text-[11px]">{englishDate}</span>
            </div>
          </div>

          {/* Day Navigation Controls */}
          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              onClick={onPrevDay}
              className="p-1.5 rounded-lg text-amber-900 hover:bg-amber-200/60 transition-colors border border-amber-200"
              title="మునుపటి దిన వాక్యం (Previous Day)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {dayOffset !== 0 && (
              <button
                onClick={onResetToday}
                className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-lg transition-colors"
                title="ఈ రోజు వాక్యానికి తిరిగి రండి (Today)"
              >
                ఈరోజు (Today)
              </button>
            )}
            <button
              onClick={onNextDay}
              className="p-1.5 rounded-lg text-amber-900 hover:bg-amber-200/60 transition-colors border border-amber-200"
              title="తరువాతి దిన వాక్యం (Next Day)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Scripture Text & Badges */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-200/80 text-amber-950 border border-amber-300">
                {dailyVerse.bookNameTelugu} {dailyVerse.chapterNumber}:{dailyVerse.verseNumber}
              </span>
              <span className="text-xs text-stone-500">
                ({dailyVerse.bookNameEnglish} {dailyVerse.chapterNumber}:{dailyVerse.verseNumber})
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-white border border-amber-200 text-amber-900">
                {dailyVerse.themeTelugu}
              </span>
            </div>

            {/* Telugu Scripture Highlight Box */}
            <div className="p-4 rounded-xl bg-amber-100/40 border border-amber-300/60 shadow-inner">
              <blockquote className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-amber-950 leading-relaxed tracking-wide">
                "{dailyVerse.teluguText}"
              </blockquote>

              <p className="mt-2 text-xs sm:text-sm text-amber-900/80 italic font-sans leading-relaxed">
                {dailyVerse.transliteration}
              </p>
            </div>

            {/* English Meaning */}
            <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
              <span className="font-semibold text-amber-900 mr-1">Meaning:</span>
              {dailyVerse.meaning}
            </p>
          </div>

          {/* Right Column: Melodic Composition & Singing CTA Deck */}
          <div className="w-full lg:w-80 shrink-0 flex flex-col gap-3 p-4 rounded-xl bg-white/90 border border-amber-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                <Music2 className="w-3.5 h-3.5 text-amber-600" />
                ఈ నాటి సంగీత స్వరకల్పన
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                {dailyVerse.tempo} BPM
              </span>
            </div>

            {/* Curated Voice & Raga details */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/80 border border-amber-200/60">
                <span className="text-stone-600 font-medium">గాత్రం (Voice):</span>
                <span className="font-bold text-amber-950 font-serif">{voice.nameTelugu}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/80 border border-amber-200/60">
                <span className="text-stone-600 font-medium">రాగం (Melody):</span>
                <span className="font-bold text-amber-950 font-serif">{raga.nameTelugu}</span>
              </div>
              <div className="p-2 rounded-lg bg-stone-50 border border-stone-200/60 font-mono text-[11px] text-amber-900 truncate">
                <span className="text-[10px] font-sans font-bold text-stone-500 mr-1">స్వరం:</span>
                {dailyVerse.swaras}
              </div>
            </div>

            {/* Primary Singing CTA Button */}
            <button
              id="sing-verse-of-the-day-btn"
              onClick={() => onPlayDailyVerse(dailyVerse)}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 ${
                isPlayingTodayVerse
                  ? 'bg-amber-800 text-white hover:bg-amber-900 shadow-amber-800/30'
                  : 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white shadow-amber-700/30 hover:scale-[1.02]'
              }`}
            >
              {isPlayingTodayVerse ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>గానం పాజ్ చేయండి (Pause)</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>నేటి వాక్యాన్ని ఆలపించండి (Sing Today's Verse)</span>
                </>
              )}
            </button>

            {/* Sub-actions: Reflection toggle, Copy, Share */}
            <div className="flex items-center justify-between gap-1 pt-1 text-xs border-t border-amber-100">
              <button
                onClick={() => setShowReflection(!showReflection)}
                className="flex items-center gap-1 text-amber-900 hover:text-amber-950 font-medium py-1 px-1.5 rounded hover:bg-amber-100/60 transition-colors text-[11px]"
              >
                <Info className="w-3.5 h-3.5 text-amber-600" />
                <span>{showReflection ? 'ధ్యానం దాచు' : 'ఆత్మీయ ధ్యానం'}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded hover:bg-amber-100 text-stone-500 hover:text-amber-900 transition-colors"
                  title="వాక్యము కాపీ చేయండి"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="p-1.5 rounded hover:bg-amber-100 text-stone-500 hover:text-amber-900 transition-colors"
                  title="వాక్యము షేర్ చేయండి"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Spiritual Reflection Section */}
        {showReflection && (
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 space-y-1.5 animate-in fade-in duration-200">
            <div className="font-bold font-serif text-sm text-amber-950 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-amber-600 fill-amber-500/20" />
              ఆత్మీయ ధ్యానము & దైవిక సందేశము (Spiritual Reflection):
            </div>
            <p className="font-serif leading-relaxed text-stone-800 text-sm">
              {dailyVerse.reflectionTelugu}
            </p>
            <p className="text-stone-500 italic text-[11px] font-sans">
              "{dailyVerse.reflectionEnglish}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
