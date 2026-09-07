import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Gauge,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  Music,
  User,
  RotateCcw,
  AudioWaveform,
  ChevronDown,
  ChevronUp,
  Loader2,
  Radio,
  Wand2,
  BookOpen,
  Bookmark,
  Repeat,
} from 'lucide-react';
import { AudioEngineSettings, VoiceOption, RagaOption, BibleVerse, BackgroundMusicStyle } from '../types';
import { VOICE_OPTIONS, RAGA_OPTIONS } from '../data/teluguBibleData';
import { AudioVisualizer } from './AudioVisualizer';
import { MusicEffectsPanel } from './MusicEffectsPanel';

interface SongPlayerProps {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  currentVerseIndex: number;
  totalVerses: number;
  currentVerseText?: string;
  currentBookName: string;
  currentChapter: number;
  settings: AudioEngineSettings;
  onUpdateSettings: (newSettings: Partial<AudioEngineSettings>) => void;
  onApplyPreset?: (preset: 'cathedral' | 'temple' | 'joyful' | 'meditative') => void;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  analyser: AnalyserNode | null;
  onGenerateAiAudio: () => Promise<void>;
  isGeneratingAiAudio: boolean;
  hasAiAudio: boolean;
  onPlayWholeChapter?: (startIndex?: number) => void;
  onPlaySingleVerse?: (index: number) => void;
}

export const SongPlayer: React.FC<SongPlayerProps> = ({
  isPlaying,
  isPaused,
  currentTime,
  duration,
  currentVerseIndex,
  totalVerses,
  currentVerseText,
  currentBookName,
  currentChapter,
  settings,
  onUpdateSettings,
  onApplyPreset,
  onPlay,
  onPause,
  onResume,
  onStop,
  onPrev,
  onNext,
  analyser,
  onGenerateAiAudio,
  isGeneratingAiAudio,
  hasAiAudio,
  onPlayWholeChapter,
  onPlaySingleVerse,
}) => {
  const [showMixer, setShowMixer] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showEffects, setShowEffects] = useState(false);

  const selectedVoice = VOICE_OPTIONS.find((v) => v.id === settings.voiceId) || VOICE_OPTIONS[0];
  const selectedRaga = RAGA_OPTIONS.find((r) => r.id === settings.ragaId) || RAGA_OPTIONS[0];

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getPitchKeyLabel = (semi: number) => {
    const keys = ['F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#'];
    const index = 6 + semi;
    return keys[index] || `${semi > 0 ? '+' : ''}${semi} st`;
  };

  const speedPresets = [0.75, 1.0, 1.25, 1.5, 2.0];

  const bgMusicOptions: { id: BackgroundMusicStyle; labelTelugu: string; labelEnglish: string; icon: string; desc: string }[] = [
    {
      id: 'worship_piano',
      labelTelugu: 'ఆరాధన పియానో',
      labelEnglish: 'Worship Piano & Strings',
      icon: '🎹',
      desc: 'మెత్తని కీబోర్డ్ & స్ట్రింగ్స్ ప్యాడ్ తీపి ఆరాధన శైలి',
    },
    {
      id: 'acoustic_guitar',
      labelTelugu: 'అకౌస్టిక్ హార్ప్',
      labelEnglish: 'Acoustic Harp & Guitar',
      icon: '🎸',
      desc: 'సున్నితమైన తీగల స్వరం & గీత స్వరాలు',
    },
    {
      id: 'sacred_strings',
      labelTelugu: 'ఆర్కెస్ట్రా స్ట్రింగ్స్',
      labelEnglish: 'Sacred Strings Pad',
      icon: '🎻',
      desc: 'చర్చి వాతావరణం, ప్రశాంతమైన వయోలిన్ ఆర్కెస్ట్రా',
    },
    {
      id: 'soothing_tanpura',
      labelTelugu: 'సాత్విక తంబుర',
      labelEnglish: 'Pure Sine Devotional Drone',
      icon: '🪕',
      desc: 'సున్నితమైన ప్యూర్ సైన్ శ్రుతి - ఎటువంటి రొద లేకుండా',
    },
    {
      id: 'vocals_only',
      labelTelugu: 'గాత్రం మాత్రమే',
      labelEnglish: 'Pure Vocals Only (No BG)',
      icon: '🔇',
      desc: 'నేపథ్య సంగీతం పూర్తిగా నిశ్శబ్దం - కేవలం స్వచ్ఛమైన గాత్రం',
    },
  ];

  return (
    <div className="sticky bottom-0 z-40 w-full bg-stone-900/95 backdrop-blur-md border-t border-amber-500/20 text-stone-100 shadow-2xl transition-all">
      {/* Top Slider Progress Bar */}
      <div className="relative w-full h-1.5 bg-stone-800 cursor-pointer group">
        <div
          className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 transition-all duration-150"
          style={{ width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        {/* Main Player Row */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left Info: Scripture reference & Active voice/raga badges */}
          <div className="w-full lg:w-1/4 flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-amber-200 border border-amber-600/30 shrink-0 shadow-inner">
              <Music className="w-6 h-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-amber-200 font-serif text-sm sm:text-base truncate">
                  {currentBookName} {currentChapter}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  వచనం {currentVerseIndex + 1}/{totalVerses}
                </span>
                {hasAiAudio && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    AI Vocal
                  </span>
                )}
              </div>

              <div className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5 truncate">
                <span className="text-amber-400/90 font-medium">{selectedRaga.nameTelugu}</span>
                <span>•</span>
                <span className="truncate">{selectedVoice.nameTelugu.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          {/* Center: Playback Controls & Waveform */}
          <div className="w-full lg:w-2/4 flex flex-col items-center gap-2">
            {/* Listen Scope Toggle & Control buttons */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
              {/* Listen Scope Segment: Whole Chapter vs Single Verse */}
              <div className="flex items-center rounded-lg bg-stone-800/90 border border-stone-700/80 p-0.5 text-xs mr-1 shadow-inner">
                <button
                  id="player-mode-chapter"
                  onClick={() => {
                    onUpdateSettings({ listenMode: 'chapter' });
                    if (onPlayWholeChapter) onPlayWholeChapter(currentVerseIndex);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-semibold ${
                    settings.listenMode === 'chapter'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="సంపూర్ణ అధ్యాయం వినండి (వచనాలు 1 నుండి చివరి వరకు వరుసగా)"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>మొత్తం అధ్యాయం</span>
                </button>
                <button
                  id="player-mode-verse"
                  onClick={() => {
                    onUpdateSettings({ listenMode: 'verse' });
                    if (onPlaySingleVerse) onPlaySingleVerse(currentVerseIndex);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-semibold ${
                    settings.listenMode === 'verse'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="ఒక వచనం మాత్రమే వినండి"
                >
                  <Bookmark className="w-3 h-3" />
                  <span>ఒకే వచనం</span>
                </button>
              </div>

              {/* Previous verse */}
              <button
                id="player-prev-verse-btn"
                onClick={onPrev}
                disabled={currentVerseIndex <= 0}
                className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="మునుపటి వచనం (Previous Verse)"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              {/* Stop */}
              <button
                id="player-stop-btn"
                onClick={onStop}
                className="p-2 rounded-full text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors"
                title="గానం ఆపండి (Stop)"
              >
                <Square className="w-4 h-4" />
              </button>

              {/* Play / Pause Primary Button */}
              {isPlaying && !isPaused ? (
                <button
                  id="player-pause-btn"
                  onClick={onPause}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold flex items-center justify-center shadow-lg shadow-amber-600/30 transition-all hover:scale-105 active:scale-95"
                  title="పాజ్ చేయండి (Pause)"
                >
                  <Pause className="w-6 h-6 fill-current" />
                </button>
              ) : (
                <button
                  id="player-play-btn"
                  onClick={isPaused ? onResume : onPlay}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold flex items-center justify-center shadow-lg shadow-amber-600/30 transition-all hover:scale-105 active:scale-95"
                  title="గానం వినండి (Play Singing Scripture)"
                >
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                </button>
              )}

              {/* Next verse */}
              <button
                id="player-next-verse-btn"
                onClick={onNext}
                disabled={currentVerseIndex >= totalVerses - 1}
                className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="తరువాతి వచనం (Next Verse)"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Quick Background Music Mute / Style Switcher */}
              <button
                id="player-quick-bg-mute-btn"
                onClick={() => onUpdateSettings({ bgMusicMuted: !settings.bgMusicMuted })}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  settings.bgMusicMuted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border-stone-700'
                }`}
                title={
                  settings.bgMusicMuted
                    ? 'నేపథ్య సంగీతం మ్యూట్ చేయబడింది. ఆన్ చేయడానికి క్లిక్ చేయండి'
                    : 'నేపథ్య సంగీతం మ్యూట్ చేయండి (గాత్రం మాత్రమే)'
                }
              >
                {settings.bgMusicMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline text-[11px]">గాత్రం మాత్రమే</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline text-[11px]">
                      {settings.bgMusicStyle === 'worship_piano'
                        ? 'పియానో'
                        : settings.bgMusicStyle === 'acoustic_guitar'
                        ? 'హార్ప్'
                        : settings.bgMusicStyle === 'sacred_strings'
                        ? 'స్ట్రింగ్స్'
                        : settings.bgMusicStyle === 'soothing_tanpura'
                        ? 'తంబుర'
                        : 'సంగీతం'}
                    </span>
                  </>
                )}
              </button>

              {/* AI Voice Generation Action */}
              <button
                id="generate-ai-vocal-btn"
                onClick={onGenerateAiAudio}
                disabled={isGeneratingAiAudio}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all disabled:opacity-50"
                title="Generate Studio Quality AI Sung Audio for this scripture"
              >
                {isGeneratingAiAudio ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">AI స్వరగానం...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">AI భక్తి గానం</span>
                  </>
                )}
              </button>
            </div>

            {/* Visualizer & Time display */}
            <div className="w-full max-w-md flex items-center gap-3">
              <span className="text-[11px] font-mono text-stone-400 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1">
                <AudioVisualizer analyser={analyser} isPlaying={isPlaying && !isPaused} />
              </div>
              <span className="text-[11px] font-mono text-stone-400 w-10 text-left">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right: Pitch & Speed Quick Triggers + Mixer */}
          <div className="w-full lg:w-1/4 flex items-center justify-end gap-2 flex-wrap">
            {/* Speed Pill */}
            <div className="relative group">
              <button
                onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs border border-stone-700 transition-colors"
                title="Adjust Singing Speed & Pitch"
              >
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold">{settings.speed}x</span>
                <span className="text-stone-500">|</span>
                <span className="text-amber-300 font-medium">
                  {settings.pitchSemi === 0 ? 'Normal' : `${settings.pitchSemi > 0 ? '+' : ''}${settings.pitchSemi} st`}
                </span>
              </button>
            </div>

            {/* Voice & Composition Drawer Trigger */}
            <button
              id="toggle-voice-raga-btn"
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                showSettingsDrawer
                  ? 'bg-amber-600 text-stone-950 border-amber-500'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
              }`}
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>స్వరము & రాగం</span>
              {showSettingsDrawer ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Sound & Background Music Mixer Trigger */}
            <button
              id="toggle-mixer-btn"
              onClick={() => {
                setShowMixer(!showMixer);
                if (!showMixer) {
                  setShowEffects(false);
                  setShowSettingsDrawer(false);
                }
              }}
              className={`p-2 rounded-lg text-xs border transition-all ${
                showMixer
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
              }`}
              title="Accompaniment & Background Music Mixer"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Dedicated Music Effects & Rhythm Trigger */}
            <button
              id="toggle-music-effects-btn"
              onClick={() => {
                setShowEffects(!showEffects);
                if (!showEffects) {
                  setShowMixer(false);
                  setShowSettingsDrawer(false);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                showEffects
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 border-amber-400 shadow-md shadow-amber-500/30'
                  : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border-amber-500/30'
              }`}
              title="సంగీత ఎఫెక్టులు (Reverb, Echo, Rhythm & Presets)"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ఎఫెక్టులు</span>
              {showEffects ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Music Effects & DSP Studio Drawer */}
        {showEffects && (
          <div className="mt-4 pt-4 border-t border-stone-800 animate-in fade-in duration-200">
            <MusicEffectsPanel
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              onApplyPreset={onApplyPreset}
              onClose={() => setShowEffects(false)}
              onTriggerAiVocal={onGenerateAiAudio}
              isGeneratingAiAudio={isGeneratingAiAudio}
              hasAiAudio={hasAiAudio}
            />
          </div>
        )}

        {/* Expandable Settings Drawer: Speed, Pitch, Voice, and Raga */}
        {showSettingsDrawer && (
          <div className="mt-4 pt-4 border-t border-stone-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            {/* Control 1: Custom Speed */}
            <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  గాన వేగము (Singing Speed):
                </span>
                <span className="font-mono text-amber-400 font-bold">{settings.speed}x</span>
              </div>

              <input
                id="speed-slider"
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={settings.speed}
                onChange={(e) => onUpdateSettings({ speed: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer"
              />

              <div className="flex items-center justify-between gap-1 pt-1">
                {speedPresets.map((sp) => (
                  <button
                    key={sp}
                    onClick={() => onUpdateSettings({ speed: sp })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      settings.speed === sp
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                    }`}
                  >
                    {sp}x
                  </button>
                ))}
              </div>
            </div>

            {/* Control 2: Adjustable Playback Pitch Settings */}
            <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                  <AudioWaveform className="w-3.5 h-3.5 text-amber-400" />
                  శ్రుతి / పిచ్ (Pitch Key):
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-amber-400 font-bold">
                    {getPitchKeyLabel(settings.pitchSemi)} ({settings.pitchSemi > 0 ? '+' : ''}
                    {settings.pitchSemi} st)
                  </span>
                  {settings.pitchSemi !== 0 && (
                    <button
                      onClick={() => onUpdateSettings({ pitchSemi: 0 })}
                      className="text-[10px] text-stone-400 hover:text-amber-300 p-0.5"
                      title="Reset to 0"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <input
                id="pitch-slider"
                type="range"
                min="-6"
                max="6"
                step="1"
                value={settings.pitchSemi}
                onChange={(e) => onUpdateSettings({ pitchSemi: parseInt(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer"
              />

              <div className="flex items-center justify-between text-[10px] text-stone-400">
                <span>-6 (మంద్ర)</span>
                <span className="text-amber-400/80 font-medium">సాధారణం (0)</span>
                <span>+6 (తార)</span>
              </div>
            </div>

            {/* Control 3: Voice Selection */}
            <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/60 space-y-1.5">
              <div className="text-xs font-semibold text-stone-200 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                గాయక స్వరము (Vocalist Voice):
              </div>
              <select
                id="voice-select"
                value={settings.voiceId}
                onChange={(e) => onUpdateSettings({ voiceId: e.target.value })}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-medium"
              >
                {VOICE_OPTIONS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nameTelugu} - {v.nameEnglish}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-stone-400 truncate">
                {selectedVoice.descriptionTelugu}
              </p>
            </div>

            {/* Control 4: Melodic Composition Raga */}
            <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/60 space-y-1.5">
              <div className="text-xs font-semibold text-stone-200 flex items-center gap-1.5 mb-1">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                సంగీత రాగ స్వరకల్పన (Raga Melody):
              </div>
              <select
                id="raga-select"
                value={settings.ragaId}
                onChange={(e) => onUpdateSettings({ ragaId: e.target.value })}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-medium"
              >
                {RAGA_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nameTelugu} ({r.nameEnglish})
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-amber-300/80 truncate">
                భావం: {selectedRaga.moodTelugu}
              </div>
            </div>
          </div>
        )}

        {/* Accompaniment & Background Music Mixer Drawer */}
        {showMixer && (
          <div className="mt-4 pt-4 border-t border-stone-800 space-y-4 animate-in fade-in duration-200">
            {/* Background Music Style Selector Cards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-amber-400" />
                  నేపథ్య సంగీత శైలి (Background Music Style & Timbre)
                </span>
                <button
                  onClick={() => onUpdateSettings({ bgMusicMuted: !settings.bgMusicMuted })}
                  className={`text-xs font-semibold px-2 py-0.5 rounded border transition-colors ${
                    settings.bgMusicMuted
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:text-white'
                  }`}
                >
                  {settings.bgMusicMuted ? 'మ్యూట్ చేయబడింది (ఆన్ చేయండి)' : 'సంగీతం మ్యూట్ చేయండి'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                {bgMusicOptions.map((opt) => {
                  const isSelected = settings.bgMusicStyle === opt.id && !settings.bgMusicMuted;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onUpdateSettings({ bgMusicStyle: opt.id, bgMusicMuted: opt.id === 'vocals_only' });
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-amber-600/30 to-amber-800/20 border-amber-400 ring-1 ring-amber-400/50 text-white'
                          : 'bg-stone-800/70 hover:bg-stone-800 border-stone-700/60 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{opt.icon}</span>
                        <span className="text-xs font-bold truncate">{opt.labelTelugu}</span>
                      </div>
                      <div className="text-[10px] text-amber-300/80 truncate mb-0.5 font-sans">
                        {opt.labelEnglish}
                      </div>
                      <p className="text-[10px] text-stone-400 leading-tight line-clamp-2">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Volume Sliders Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-800/80">
              {/* Master Volume */}
              <div className="p-2.5 rounded-xl bg-stone-800/60 border border-stone-700/50 space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-300">
                  <span>ప్రధాన శబ్దం (Master)</span>
                  <span className="font-mono text-amber-400">
                    {Math.round(settings.masterVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.masterVolume}
                  onChange={(e) => onUpdateSettings({ masterVolume: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Vocal Volume */}
              <div className="p-2.5 rounded-xl bg-stone-800/60 border border-stone-700/50 space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-300">
                  <span>గాత్రం (Vocal)</span>
                  <span className="font-mono text-amber-400">
                    {Math.round(settings.vocalVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.vocalVolume}
                  onChange={(e) => onUpdateSettings({ vocalVolume: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Background Music Volume */}
              <div className="p-2.5 rounded-xl bg-stone-800/60 border border-stone-700/50 space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-300">
                  <span>నేపథ్య సంగీతం (BG Music)</span>
                  <span className="font-mono text-amber-400">
                    {settings.bgMusicMuted ? 'Muted' : `${Math.round(settings.accompanimentVolume * 100)}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  disabled={settings.bgMusicMuted}
                  value={settings.accompanimentVolume}
                  onChange={(e) =>
                    onUpdateSettings({ accompanimentVolume: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Tanpura Drone */}
              <div className="p-2.5 rounded-xl bg-stone-800/60 border border-stone-700/50 space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-300">
                  <span>తంబుర శ్రుతి (Tanpura)</span>
                  <span className="font-mono text-amber-400">
                    {Math.round(settings.tanpuraVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.tanpuraVolume}
                  onChange={(e) => onUpdateSettings({ tanpuraVolume: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
