import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AudioEngineSettings } from '../types';
import { AudioVisualizer } from './AudioVisualizer';

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
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  analyser: AnalyserNode | null;
  onPlayWholeChapter?: (startIndex?: number) => void;
  onPlaySingleVerse?: (index: number) => void;
  onGenerateAiAudio?: () => Promise<void>;
  isGeneratingAiAudio?: boolean;
  hasAiAudio?: boolean;
  onApplyPreset?: (preset: 'pure_voice' | 'cathedral' | 'temple' | 'joyful' | 'meditative') => void;
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
  onPlay,
  onPause,
  onResume,
  onPrev,
  onNext,
  analyser,
}) => {
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const speeds = [0.8, 1.0, 1.25];
  const nextSpeed = () => {
    const currentIndex = speeds.indexOf(settings.speed);
    const nextIdx = (currentIndex + 1) % speeds.length;
    onUpdateSettings({ speed: speeds[nextIdx] });
  };

  const isMuted = settings.masterVolume === 0;
  const toggleMute = () => {
    if (isMuted) {
      onUpdateSettings({ masterVolume: 0.95 });
    } else {
      onUpdateSettings({ masterVolume: 0 });
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 text-stone-100 shadow-2xl">
      <div className="max-w-4xl mx-auto px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Scripture Verse Info */}
        <div className="flex items-center gap-3 w-full sm:w-auto min-w-0 justify-between sm:justify-start">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-amber-400 text-sm tracking-tight">
                {currentBookName} {currentChapter}:{currentVerseIndex + 1}
              </span>
              <span className="text-[11px] text-stone-400">
                ({currentVerseIndex + 1}/{totalVerses})
              </span>
            </div>
            {currentVerseText && (
              <p className="text-xs text-stone-300 truncate max-w-[260px] sm:max-w-xs font-serif mt-0.5">
                {currentVerseText}
              </p>
            )}
          </div>

          {/* Mobile Speed & Mute */}
          <div className="flex items-center gap-1 sm:hidden">
            <button
              onClick={nextSpeed}
              className="px-2 py-1 text-xs font-mono rounded bg-stone-800 text-amber-300"
            >
              {settings.speed}x
            </button>
            <button
              onClick={toggleMute}
              className="p-1.5 text-stone-400 hover:text-stone-100 rounded"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Center: Playback Controls & Minimal Real-Time Waveform */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
          {/* Previous Verse */}
          <button
            id="player-prev-btn"
            onClick={onPrev}
            disabled={currentVerseIndex === 0}
            className="p-2 text-stone-400 hover:text-stone-100 disabled:opacity-30 disabled:hover:text-stone-400 transition-colors"
            title="మునుపటి వచనం (Previous Verse)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause / Resume */}
          <button
            id="player-play-btn"
            onClick={() => {
              if (isPlaying && !isPaused) {
                onPause();
              } else if (isPaused) {
                onResume();
              } else {
                onPlay();
              }
            }}
            className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center shadow-md active:scale-95 transition-all"
            title={isPlaying && !isPaused ? 'విరామం (Pause)' : 'వినండి (Play)'}
          >
            {isPlaying && !isPaused ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Next Verse */}
          <button
            id="player-next-btn"
            onClick={onNext}
            disabled={currentVerseIndex >= totalVerses - 1}
            className="p-2 text-stone-400 hover:text-stone-100 disabled:opacity-30 disabled:hover:text-stone-400 transition-colors"
            title="తర్వాతి వచనం (Next Verse)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Minimal Real-Time Frequency Waveform Visualizer */}
          <div className="hidden md:flex items-center gap-2 pl-2">
            <div className="w-32 h-6 overflow-hidden rounded">
              <AudioVisualizer
                analyser={analyser}
                isPlaying={isPlaying && !isPaused}
                height={24}
                mode="waveform"
              />
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>

        {/* Right: Clean Desktop Speed & Volume Controls */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={nextSpeed}
            className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 transition-colors"
            title="పఠన వేగం (Playback Speed)"
          >
            {settings.speed}x
          </button>

          <button
            onClick={toggleMute}
            className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-md transition-colors"
            title={isMuted ? 'ధ్వని ఆన్ చేయండి' : 'మ్యూట్ చేయండి'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
