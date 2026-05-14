import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformViewProps {
  path: string;
}

export function WaveformView({ path }: WaveformViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    wsRef.current?.destroy();
    wsRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'var(--accent-secondary)',
      progressColor: 'var(--accent-primary)',
      cursorColor: 'var(--accent-primary)',
      height: 80,
      barWidth: 2,
      barRadius: 2,
      barGap: 1,
      interact: true,

      url: `asset://localhost/${path.replace(/\\/g, '/')}`,
    });

    return () => { wsRef.current?.destroy(); };
  }, [path]);

  const toggle = () => wsRef.current?.playPause();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div
        ref={containerRef}
        style={{
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-2)',
          border: '1px solid var(--border-subtle)',
        }}
      />
      <button
        onClick={toggle}
        className="btn btn-primary btn-sm"
        aria-label="Play / Pause"
      >
        ▶ / ⏸
      </button>
    </div>
  );
}
