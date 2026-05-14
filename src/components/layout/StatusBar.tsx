import { useSessionStore } from '../../store/session';
import { formatBytes } from '../../lib/utils';

export function StatusBar() {
  const { jobStatus, jobStep, jobProgress, carrierInfo } = useSessionStore();

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        {carrierInfo && (
          <>
            <span className="statusbar-item mono" style={{ flexShrink: 0 }}>
              {carrierInfo.format.toUpperCase()}
            </span>
            {carrierInfo.width && (
              <span className="statusbar-item mono" style={{ flexShrink: 0 }}>
                {carrierInfo.width}×{carrierInfo.height}px
              </span>
            )}
            {carrierInfo.sample_rate && (
              <span className="statusbar-item mono" style={{ flexShrink: 0 }}>
                {(carrierInfo.sample_rate / 1000).toFixed(1)} kHz
              </span>
            )}
            <span className="statusbar-item" style={{ flexShrink: 0 }}>
              Cap: <b className="mono">{formatBytes(carrierInfo.capacity_1bit)}</b>
            </span>
          </>
        )}
      </div>

      <div className="statusbar-right">
        {jobStatus === 'running' && (
          <div className="statusbar-job">
            <span className="statusbar-spinner" />
            <span className="statusbar-step">{jobStep}</span>
            <span className="statusbar-pct mono">{jobProgress.toFixed(0)}%</span>
          </div>
        )}
        {jobStatus === 'done' && <span className="statusbar-done">✓ Done</span>}
        {jobStatus === 'error' && <span className="statusbar-error">✕ Error</span>}
      </div>
    </div>
  );
}
