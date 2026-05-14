import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tauriApi } from '../../lib/tauri';
import { useSessionStore } from '../../store/session';
import { useAppStore } from '../../store/app';
import { basename, isImageExt, extname } from '../../lib/utils';
import { toast } from '../ui/Toast';
import { useTauriDrop, pickCarrier } from '../../lib/fileDrop';

export function CarrierDropzone() {
  const { carrierPath, carrierInfo, setCarrier } = useSessionStore();
  const { addRecentFile } = useAppStore();
  const ref = useRef<HTMLDivElement>(null);

  const handlePaths = async (paths: string[]) => {
    const path = paths[0];
    if (!path) return;
    try {
      const info = await tauriApi.analyzeCarrier(path);
      setCarrier(path, info);
      addRecentFile({ path, kind: 'carrier', timestamp: Date.now() / 1000, thumbnail: info.thumbnail ?? undefined });
    } catch (e: any) {
      toast.error('Failed to load carrier', e?.message ?? String(e));
    }
  };

  const { isOver } = useTauriDrop(ref, handlePaths);

  const handleClick = async () => {
    const path = await pickCarrier();
    if (path) await handlePaths([path]);
  };

  const ext = carrierPath ? extname(carrierPath) : '';
  const isImg = isImageExt(ext);

  return (
    <div className="dropzone-wrapper">
      <label className="form-label">Carrier File</label>
      <div
        ref={ref}
        className={`dropzone ${isOver ? 'dropzone-active' : ''} ${carrierPath ? 'dropzone-filled' : ''}`}
        onClick={handleClick}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
        role="button"
        tabIndex={0}
        aria-label={carrierPath ? `Carrier: ${basename(carrierPath)}. Click to replace` : 'Click or drop image or audio carrier file'}
        style={{ cursor: 'pointer' }}
      >
        <AnimatePresence mode="wait">
          {carrierPath && carrierInfo ? (
            <motion.div
              key="preview"
              className="dropzone-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {isImg && carrierInfo.thumbnail ? (
                <img
                  src={`data:image/png;base64,${carrierInfo.thumbnail}`}
                  alt="carrier preview"
                  className="dropzone-thumb"
                />
              ) : (
                <div className="dropzone-audio-icon">
                  <WaveformIcon />
                </div>
              )}
              <div className="dropzone-meta">
                <span className="dropzone-filename">{basename(carrierPath)}</span>
                <span className="dropzone-format mono">{carrierInfo.format.toUpperCase()}</span>
                {carrierInfo.width && (
                  <span className="dropzone-dim mono">{carrierInfo.width}×{carrierInfo.height}</span>
                )}
                {carrierInfo.sample_rate && (
                  <span className="dropzone-dim mono">{(carrierInfo.sample_rate / 1000).toFixed(1)} kHz</span>
                )}
              </div>
              <span className="dropzone-replace">Click or drop to replace</span>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="dropzone-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <UploadIcon active={isOver} />
              <span className="dropzone-hint">
                {isOver ? 'Drop carrier here' : 'Click or drop image / audio'}
              </span>
              <span className="dropzone-sub">PNG, BMP, JPEG, WAV, FLAC, MP3</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function UploadIcon({ active }: { active: boolean }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none"
      style={{ color: active ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
      <rect x="4" y="28" width="32" height="4" rx="2" fill="currentColor" opacity="0.3"/>
      <path d="M20 24V10M13 17l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function WaveformIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M4 24h4M8 14v20M16 18v12M24 8v32M32 16v16M40 20v8M44 24h4"
        stroke="var(--accent-secondary)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}
