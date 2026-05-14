import { useState } from 'react';
import type { ChannelData } from '../../lib/tauri';

interface BitViewerProps {
  data: ChannelData;
}

const BYTES_PER_ROW = 16;

export function BitViewer({ data }: BitViewerProps) {
  const [offset, setOffset] = useState(0);

  const raw = data.r;
  const windowData = raw.slice(offset, offset + BYTES_PER_ROW * 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <label htmlFor="bit-viewer-offset" className="form-label" style={{ marginBottom: 0 }}>Pixel offset</label>
        <input
          id="bit-viewer-offset"
          type="number"
          className="input mono"
          style={{ width: 120 }}
          value={offset}
          min={0}
          max={raw.length - 1}
          step={BYTES_PER_ROW}
          onChange={(e) => setOffset(Math.max(0, Math.min(raw.length - 1, Number(e.target.value))))}
        />
      </div>

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          padding: 'var(--space-3)',
          overflowX: 'auto',
          lineHeight: 1.8,
        }}
      >
        {Array.from({ length: Math.ceil(windowData.length / BYTES_PER_ROW) }, (_, row) => {
          const rowData = windowData.slice(row * BYTES_PER_ROW, (row + 1) * BYTES_PER_ROW);
          const rowOffset = offset + row * BYTES_PER_ROW;
          return (
            <div key={row} style={{ display: 'flex', gap: 'var(--space-4)', minWidth: 0 }}>
              <span style={{ color: 'var(--text-muted)', width: '6ch', flexShrink: 0 }}>
                {rowOffset.toString(16).padStart(6, '0')}
              </span>
              <span style={{ color: 'var(--text-secondary)', flex: '0 0 auto' }}>
                {rowData.map((b) => b.toString(16).padStart(2, '0')).join(' ')}
              </span>
              <span style={{ color: 'var(--accent-secondary)', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                {rowData.map((b) => b.toString(2).padStart(8, '0')).join(' ')}
              </span>
              <span style={{ color: 'var(--text-muted)', flex: '0 0 auto' }}>
                {rowData.map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '·')).join('')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
