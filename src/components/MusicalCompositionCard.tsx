import React, { useState } from 'react';
import { Sparkles, Music2, Disc3, RefreshCw, Volume2, Info, ChevronRight } from 'lucide-react';
import { SongComposition, RagaOption, VoiceOption } from '../types';

interface MusicalCompositionCardProps {
  composition: SongComposition | null;
  raga: RagaOption;
  voice: VoiceOption;
  onRecomposeWithAi: () => Promise<void>;
  isRecomposing: boolean;
  onPlayStanza?: (index: number) => void;
}

export const MusicalCompositionCard: React.FC<MusicalCompositionCardProps> = ({
  composition,
  raga,
  voice,
  onRecomposeWithAi,
  isRecomposing,
  onPlayStanza,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="w-full bg-white rounded-2xl border border-amber-900/15 shadow-xs overflow-hidden transition-all">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-amber-100/70 via-amber-50 to-stone-50 border-b border-amber-900/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Music2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-amber-950 font-serif truncate">
              సంగీత స్వరకల్పన & రాగ విశేషాలు (Melodic Composition)
            </h3>
            <p className="text-[11px] text-amber-800/80 truncate">
              {raga.nameTelugu} ({raga.nameEnglish}) • {voice.nameTelugu}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="recompose-with-ai-btn"
            onClick={onRecomposeWithAi}
            disabled={isRecomposing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-xs font-semibold transition-all shadow-2xs active:scale-95 disabled:opacity-50"
            title="Re-compose musical meter, chords, and raga with Gemini AI"
          >
            <RefreshCw className={`w-3 h-3 ${isRecomposing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">AI స్వరకల్పన</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-stone-500 hover:text-stone-800 rounded-md"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 text-xs">
          {/* Raga and Tala Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                రాగం (Raga)
              </span>
              <span className="font-serif font-bold text-amber-950 text-xs sm:text-sm">
                {composition?.raga || raga.nameTelugu}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                తాళం (Tala Meter)
              </span>
              <span className="font-serif font-bold text-amber-950 text-xs sm:text-sm">
                {composition?.tala || 'ఆది తాళం (8 Beats)'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                భావం (Mood / Rasa)
              </span>
              <span className="font-serif font-bold text-amber-950 text-xs sm:text-sm truncate block">
                {composition?.mood || raga.moodTelugu}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                వేగ సూచిక (Tempo)
              </span>
              <span className="font-mono font-bold text-amber-950 text-xs sm:text-sm">
                {composition?.tempoBpm || raga.baseTempoBpm} BPM
              </span>
            </div>
          </div>

          {/* Swara Scale Structure */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 space-y-1">
            <div className="flex items-center justify-between text-stone-600 font-semibold text-[11px]">
              <span>స్వర ఆరోహణ - అవరోహణ (Carnatic Swara Scale):</span>
              <span className="text-amber-800 font-mono text-xs">{raga.swaraScale}</span>
            </div>
            {composition?.swaras && (
              <div className="font-mono text-xs text-amber-900 bg-white p-2 rounded-md border border-amber-200/60">
                {composition.swaras}
              </div>
            )}
          </div>

          {/* Song Stanzas Structure (Pallavi, Charanam) */}
          {composition?.stanzas && composition.stanzas.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-stone-700">
                సంగీత విభాగాల విభజన (Song Structure):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {composition.stanzas.map((stanza, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-amber-200/70 bg-amber-50/40 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-900">{stanza.type}</span>
                      {stanza.durationSeconds && (
                        <span className="text-stone-400 font-mono">{stanza.durationSeconds}s</span>
                      )}
                    </div>
                    <p className="text-stone-900 font-serif text-xs line-clamp-1">{stanza.telugu}</p>
                    {stanza.swaraLine && (
                      <p className="font-mono text-[10px] text-amber-800/90">{stanza.swaraLine}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Singing Tips */}
          {composition?.singingTips && (
            <div className="p-3 rounded-xl bg-amber-100/40 border border-amber-200 text-stone-700 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold text-amber-950">గాన సూచన: </span>
                {composition.singingTips}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
