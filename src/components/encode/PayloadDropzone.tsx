import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '../../store/session';
import { basename, formatBytes } from '../../lib/utils';
import { useTauriDrop, pickPayload } from '../../lib/fileDrop';
import { invoke } from '@tauri-apps/api/core';

export function PayloadDropzone() {
  const { payloadPath, payloadSize, setPayload } = useSessionStore();
  const ref = useRef<HTMLDivElement>(null);

  const handlePaths = async (paths: string[]) => {
    const path = paths[0];
    if (!path) return;

    let size = 0;
    try {
      size = await invoke<number>('get_file_size', { path });
    } catch {  }
    setPayload(path, size);
  };

  const { isOver } = useTauriDrop(ref, handlePaths);

  const handleClick = async () => {
    const path = await pickPayload();
    if (path) await handlePaths([path]);
  };

  return (
    <div className="dropzone-wrapper">
      <label className="form-label">Payload (Secret File)</label>
      <div
        ref={ref}
        className={`dropzone dropzone-sm ${isOver ? 'dropzone-active' : ''} ${payloadPath ? 'dropzone-filled' : ''}`}
        onClick={handleClick}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
        role="button"
        tabIndex={0}
        aria-label={payloadPath ? `Payload: ${basename(payloadPath)}. Click to replace` : 'Click or drop any file to use as payload'}
        style={{ cursor: 'pointer' }}
      >
        <AnimatePresence mode="wait">
          {payloadPath ? (
            <motion.div
              key="filled"
              className="dropzone-file-info"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <FileIcon />
              <div className="dropzone-meta">
                <span className="dropzone-filename">{basename(payloadPath)}</span>
                {payloadSize != null && payloadSize > 0 && (
                  <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    {formatBytes(payloadSize)}
                  </span>
                )}
              </div>
              <span className="dropzone-replace">Replace</span>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="dropzone-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FileIcon dim />
              <span className="dropzone-hint">
                {isOver ? 'Drop file here' : 'Click or drop any file'}
              </span>
              <span className="dropzone-sub">Any file type is accepted</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FileIcon({ dim }: { dim?: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
      style={{ color: dim ? 'var(--text-muted)' : 'var(--accent-primary)' }}>
      <rect x="4" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M14 2l6 6v16H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
