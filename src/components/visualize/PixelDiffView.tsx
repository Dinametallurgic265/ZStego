import { useState } from 'react';
import type { DiffData } from '../../lib/tauri';

interface PixelDiffViewProps {
  original: string;
  diff: DiffData;
}

export function PixelDiffView({ original, diff }: PixelDiffViewProps) {
  const [amplify, setAmplify] = useState<10 | 50 | 100>(10);

  const diffSrc = amplify === 10 ? diff.diff_10x : amplify === 50 ? diff.diff_50x : diff.diff_100x;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {([10, 50, 100] as const).map((v) => (
          <button
            key={v}
            onClick={() => setAmplify(v)}
            aria-pressed={amplify === v}
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${amplify === v ? 'var(--accent-primary)' : 'var(--border-default)'}`,
              background: amplify === v ? 'color-mix(in srgb, var(--accent-primary) 15%, transparent)' : 'var(--bg-input)',
              color: amplify === v ? 'var(--accent-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-ui)',
              transition: 'all var(--duration-fast)',
            }}
          >
            ×{v}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Original</p>
          <img
            src={`data:image/png;base64,${original}`}
            alt="original"
            style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
          />
        </div>
        <div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
            Difference ×{amplify}
          </p>
          <img
            src={`data:image/png;base64,${diffSrc}`}
            alt={`diff ${amplify}x`}
            style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
          />
        </div>
      </div>
    </div>
  );
}
