import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Activity, BarChart2, Radio, Waves, Zap } from 'lucide-react';

export type VisualizerMode = 'spectrum' | 'waveform' | 'mirror';

export interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  height?: number;
  mode?: VisualizerMode;
  onModeChange?: (mode: VisualizerMode) => void;
  showControls?: boolean;
  showMeter?: boolean;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyser,
  isPlaying,
  height = 48,
  mode = 'spectrum',
  onModeChange,
  showControls = false,
  showMeter = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Peak hold array for spectrum gravity drops
  const peaksRef = useRef<number[]>([]);
  const peakDecayRef = useRef<number[]>([]);

  // Energy meters state (Bass, Mid, High)
  const [bandEnergy, setBandEnergy] = useState({ bass: 0, mid: 0, treble: 0 });

  // Handle ResizeObserver for razor-sharp Retina/DPI canvas rendering
  const dimensionsRef = useRef({ width: 320, height });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(120, Math.floor(rect.width));
      const h = height;
      dimensionsRef.current = { width: w, height: h };

      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
    };

    updateDimensions();

    const ro = new ResizeObserver(() => {
      updateDimensions();
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
    };
  }, [height]);

  // Main real-time audio visualization rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const binCount = analyser ? analyser.frequencyBinCount : 128;
    const freqData = new Uint8Array(binCount);
    const timeData = new Uint8Array(binCount);

    let lastEnergyUpdate = 0;

    const render = (timestamp: number) => {
      const dpr = window.devicePixelRatio || 1;
      const width = dimensionsRef.current.width;
      const currentH = dimensionsRef.current.height;

      // Reset transforms and clear canvas
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, currentH);

      let hasRealAudio = false;

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        // Check if analyser has non-trivial signal
        let sum = 0;
        for (let i = 0; i < 32; i++) {
          sum += freqData[i];
        }
        if (sum > 60) {
          hasRealAudio = true;
        }
      }

      // If speech synthesis or quiet passage is running, synthesize dynamic vocal frequency contours
      if (!hasRealAudio) {
        const t = timestamp * 0.003;
        for (let i = 0; i < binCount; i++) {
          if (isPlaying) {
            // Simulated human vocal formants (Bass fund ~150Hz, formants ~800Hz, ~2400Hz)
            const vocalRhythm = Math.sin(t * 2.2) * 0.5 + 0.5;
            const formant1 = Math.exp(-Math.pow((i - 12) / 6, 2)) * 140 * vocalRhythm;
            const formant2 = Math.exp(-Math.pow((i - 28) / 8, 2)) * 95 * vocalRhythm;
            const formant3 = Math.exp(-Math.pow((i - 48) / 10, 2)) * 60 * vocalRhythm;
            const baseline = 14 + Math.sin(t + i * 0.2) * 10;
            freqData[i] = Math.min(255, Math.floor(baseline + formant1 + formant2 + formant3));

            timeData[i] = Math.floor(128 + Math.sin(t * 3.5 + i * 0.18) * 35 * vocalRhythm);
          } else {
            // Idle gentle breathing wave
            freqData[i] = Math.floor(10 + Math.sin(t * 0.8 + i * 0.16) * 6);
            timeData[i] = Math.floor(128 + Math.sin(t * 0.8 + i * 0.12) * 6);
          }
        }
      }

      // Calculate band energies periodically for meter readouts
      if (timestamp - lastEnergyUpdate > 120 && showMeter) {
        lastEnergyUpdate = timestamp;
        let b = 0;
        let m = 0;
        let tr = 0;
        for (let i = 0; i < 8; i++) b += freqData[i] || 0;
        for (let i = 8; i < 32; i++) m += freqData[i] || 0;
        for (let i = 32; i < 70; i++) tr += freqData[i] || 0;
        setBandEnergy({
          bass: Math.min(100, Math.round((b / (8 * 255)) * 100)),
          mid: Math.min(100, Math.round((m / (24 * 255)) * 100)),
          treble: Math.min(100, Math.round((tr / (38 * 255)) * 100)),
        });
      }

      // --- RENDERING MODES ---
      if (mode === 'waveform') {
        // --- MODE 2: LUMINOUS OSCILLOSCOPE WAVEFORM BEAM ---
        ctx.beginPath();
        const sliceWidth = width / binCount;
        let x = 0;

        for (let i = 0; i < binCount; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * currentH) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        // Outer glow
        ctx.strokeStyle = isPlaying ? 'rgba(245, 158, 11, 0.4)' : 'rgba(168, 162, 158, 0.2)';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Core bright beam
        ctx.strokeStyle = isPlaying ? '#fbbf24' : 'rgba(214, 211, 209, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Accent energy sparks on high points
        if (isPlaying) {
          const step = Math.floor(binCount / 8);
          for (let i = 0; i < binCount; i += step) {
            const v = timeData[i] / 128.0;
            const sparkY = (v * currentH) / 2;
            const sparkX = i * sliceWidth;
            if (Math.abs(v - 1.0) > 0.18) {
              ctx.fillStyle = '#fef08a';
              ctx.beginPath();
              ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      } else if (mode === 'mirror') {
        // --- MODE 3: SYMMETRIC / BILATERAL HORIZON REFLECTION ---
        const barCount = Math.min(48, Math.floor(width / 6));
        const barWidth = Math.max(2, (width / barCount) - 2);
        const centerY = currentH / 2;

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * 50);
          const val = freqData[dataIndex] || 0;
          const percent = val / 255;
          const halfBarHeight = Math.max(2, (percent * centerY) * 0.9);
          const x = i * (barWidth + 2);

          // Top half
          const gradTop = ctx.createLinearGradient(0, centerY, 0, centerY - halfBarHeight);
          gradTop.addColorStop(0, 'rgba(217, 119, 6, 0.3)');
          gradTop.addColorStop(0.7, '#f59e0b');
          gradTop.addColorStop(1, '#fef08a');

          ctx.fillStyle = isPlaying ? gradTop : 'rgba(120, 113, 108, 0.3)';
          ctx.beginPath();
          ctx.roundRect(x, centerY - halfBarHeight, barWidth, halfBarHeight, [2, 2, 0, 0]);
          ctx.fill();

          // Mirrored bottom reflection
          const gradBottom = ctx.createLinearGradient(0, centerY, 0, centerY + halfBarHeight);
          gradBottom.addColorStop(0, 'rgba(217, 119, 6, 0.3)');
          gradBottom.addColorStop(0.7, 'rgba(245, 158, 11, 0.45)');
          gradBottom.addColorStop(1, 'rgba(254, 240, 138, 0.15)');

          ctx.fillStyle = isPlaying ? gradBottom : 'rgba(120, 113, 108, 0.15)';
          ctx.beginPath();
          ctx.roundRect(x, centerY, barWidth, halfBarHeight, [0, 0, 2, 2]);
          ctx.fill();
        }

        // Center horizon line
        ctx.strokeStyle = isPlaying ? 'rgba(251, 191, 36, 0.4)' : 'rgba(120, 113, 108, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
      } else {
        // --- MODE 1: DEVOTIONAL SPECTRUM BARS WITH PEAK DROPS ---
        const barCount = Math.min(52, Math.max(24, Math.floor(width / 7)));
        const barWidth = Math.max(3, (width / barCount) - 2);

        // Ensure peak arrays match bar count
        if (peaksRef.current.length !== barCount) {
          peaksRef.current = new Array(barCount).fill(0);
          peakDecayRef.current = new Array(barCount).fill(0);
        }

        for (let i = 0; i < barCount; i++) {
          // Logarithmic distribution to give pleasant focus on musical frequencies
          const freqIndex = Math.floor(Math.pow(i / barCount, 1.4) * 64);
          const val = freqData[freqIndex] || 0;
          const percent = val / 255;
          const barHeight = Math.max(3, percent * currentH * 0.88);
          const x = i * (barWidth + 2);
          const y = currentH - barHeight;

          // Peak physics (gravity drop)
          if (barHeight >= peaksRef.current[i]) {
            peaksRef.current[i] = barHeight;
            peakDecayRef.current[i] = 0.5;
          } else {
            peakDecayRef.current[i] += 0.25; // gravity acceleration
            peaksRef.current[i] = Math.max(3, peaksRef.current[i] - peakDecayRef.current[i]);
          }

          const peakY = Math.max(0, currentH - peaksRef.current[i]);

          // Devotional warm temple amber to radiant gold gradient
          const gradient = ctx.createLinearGradient(0, currentH, 0, y);
          if (isPlaying) {
            gradient.addColorStop(0, 'rgba(180, 83, 9, 0.3)');
            gradient.addColorStop(0.5, '#d97706');
            gradient.addColorStop(0.85, '#f59e0b');
            gradient.addColorStop(1, '#fef08a');
          } else {
            gradient.addColorStop(0, 'rgba(87, 83, 78, 0.2)');
            gradient.addColorStop(0.6, 'rgba(120, 113, 108, 0.35)');
            gradient.addColorStop(1, 'rgba(168, 162, 158, 0.5)');
          }

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();

          // Peak hold cap (floating dot / line that drops with gravity)
          if (isPlaying) {
            ctx.fillStyle = '#fffbeb';
            ctx.beginPath();
            ctx.roundRect(x, peakY, barWidth, 2, [1, 1, 1, 1]);
            ctx.fill();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isPlaying, mode, showMeter]);

  const cycleMode = useCallback(() => {
    const nextMode: VisualizerMode =
      mode === 'spectrum' ? 'waveform' : mode === 'waveform' ? 'mirror' : 'spectrum';
    if (onModeChange) {
      onModeChange(nextMode);
    }
  }, [mode, onModeChange]);

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`}>
      {/* Visualizer Canvas Container */}
      <div
        ref={containerRef}
        onClick={cycleMode}
        title="ధ్వని తరంగ శైలిని మార్చడానికి క్లిక్ చేయండి (Click to cycle visualizer mode)"
        className="w-full relative flex items-center justify-center overflow-hidden rounded-xl bg-stone-950/80 px-2 border border-amber-500/25 shadow-inner cursor-pointer group transition-all hover:border-amber-500/40"
        style={{ height: `${height}px` }}
      >
        {/* Subtle Ambient Background Aura */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            isPlaying ? 'opacity-25' : 'opacity-5'
          } bg-gradient-to-t from-amber-600/30 via-transparent to-yellow-500/10`}
        />

        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Floating Mode Badge on Hover */}
        <div className="absolute top-1.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/90 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-amber-500/30 shadow-xs pointer-events-none flex items-center gap-1">
          {mode === 'spectrum' && (
            <>
              <BarChart2 className="w-3 h-3" /> <span>స్పెక్ట్రమ్</span>
            </>
          )}
          {mode === 'waveform' && (
            <>
              <Waves className="w-3 h-3" /> <span>వేవ్</span>
            </>
          )}
          {mode === 'mirror' && (
            <>
              <Activity className="w-3 h-3" /> <span>సింఫనీ</span>
            </>
          )}
        </div>
      </div>

      {/* Optional Mode Switcher Controls & Real-time EQ Meters */}
      {(showControls || showMeter) && (
        <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-stone-400">
          {showControls && (
            <div className="flex items-center gap-1 bg-stone-900/80 p-0.5 rounded-lg border border-stone-800">
              <button
                onClick={() => onModeChange && onModeChange('spectrum')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 font-medium transition-all ${
                  mode === 'spectrum'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'hover:text-stone-200'
                }`}
              >
                <BarChart2 className="w-3 h-3" />
                <span>స్పెక్ట్రమ్</span>
              </button>
              <button
                onClick={() => onModeChange && onModeChange('waveform')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 font-medium transition-all ${
                  mode === 'waveform'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'hover:text-stone-200'
                }`}
              >
                <Waves className="w-3 h-3" />
                <span>వేవ్ కిరణం</span>
              </button>
              <button
                onClick={() => onModeChange && onModeChange('mirror')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 font-medium transition-all ${
                  mode === 'mirror'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'hover:text-stone-200'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>సింఫనీ అద్దం</span>
              </button>
            </div>
          )}

          {showMeter && (
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-stone-500">బాస్</span>
                <div className="w-10 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 transition-all duration-75"
                    style={{ width: `${bandEnergy.bass}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-stone-500">గాత్రం</span>
                <div className="w-10 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-75"
                    style={{ width: `${bandEnergy.mid}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-stone-500">శ్రుతి</span>
                <div className="w-10 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-300 transition-all duration-75"
                    style={{ width: `${bandEnergy.treble}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
