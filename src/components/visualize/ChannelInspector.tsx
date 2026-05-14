import { useState, useEffect, useRef } from 'react';
import type { ChannelData } from '../../lib/tauri';

type Channel = 'r' | 'g' | 'b' | 'a' | 'r_lsb' | 'g_lsb' | 'b_lsb';

const CHANNELS: { key: Channel; label: string; color: string }[] = [
  { key: 'r',     label: 'Red',     color: '#ff4d6d' },
  { key: 'g',     label: 'Green',   color: '#3bdb8e' },
  { key: 'b',     label: 'Blue',    color: '#7c5cfc' },
  { key: 'a',     label: 'Alpha',   color: '#8890b5' },
  { key: 'r_lsb', label: 'R LSB',   color: '#ff4d6d' },
  { key: 'g_lsb', label: 'G LSB',   color: '#3bdb8e' },
  { key: 'b_lsb', label: 'B LSB',   color: '#7c5cfc' },
];

interface ChannelInspectorProps {
  data: ChannelData;
}

export function ChannelInspector({ data }: ChannelInspectorProps) {
  const [activeChannel, setActiveChannel] = useState<Channel>('r');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = data.width;
    canvas.height = data.height;

    const channelData = data[activeChannel] as number[];
    const imageData = ctx.createImageData(data.width, data.height);

    for (let i = 0; i < channelData.length; i++) {
      const v = channelData[i];
      imageData.data[i * 4]     = v;
      imageData.data[i * 4 + 1] = v;
      imageData.data[i * 4 + 2] = v;
      imageData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }, [data, activeChannel]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {CHANNELS.map((ch) => (
          <button
            key={ch.key}
            onClick={() => setActiveChannel(ch.key)}
            aria-pressed={activeChannel === ch.key}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${activeChannel === ch.key ? ch.color : 'var(--border-default)'}`,
              background: activeChannel === ch.key ? `color-mix(in srgb, ${ch.color} 15%, transparent)` : 'var(--bg-input)',
              color: activeChannel === ch.key ? ch.color : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              transition: 'all var(--duration-fast)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            {ch.label}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
      />
    </div>
  );
}
