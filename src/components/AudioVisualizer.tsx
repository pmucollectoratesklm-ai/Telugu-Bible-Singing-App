import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 64);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Idle gentle breathing wave when not playing
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = 12 + Math.sin(Date.now() * 0.003 + i * 0.15) * 8;
        }
      }

      const barCount = 36;
      const barWidth = (width / barCount) - 2;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * 2] || 0;
        const percent = val / 255;
        const barHeight = Math.max(4, percent * height * 0.88);
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // Devotional warm gold and amber gradient
        const gradient = ctx.createLinearGradient(0, height, 0, y);
        gradient.addColorStop(0, isPlaying ? 'rgba(217, 119, 6, 0.2)' : 'rgba(156, 163, 175, 0.1)');
        gradient.addColorStop(0.5, isPlaying ? 'rgba(245, 158, 11, 0.7)' : 'rgba(209, 213, 219, 0.25)');
        gradient.addColorStop(1, isPlaying ? 'rgba(251, 191, 36, 0.95)' : 'rgba(229, 231, 235, 0.4)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
        ctx.fill();

        // Tip accent dot
        if (isPlaying && percent > 0.25) {
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(x + barWidth / 2, y - 2, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isPlaying]);

  return (
    <div className="w-full h-12 flex items-center justify-center overflow-hidden rounded-lg bg-amber-950/20 px-2 border border-amber-500/10">
      <canvas
        ref={canvasRef}
        width={320}
        height={48}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
