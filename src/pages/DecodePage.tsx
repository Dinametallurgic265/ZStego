import { useState, useRef } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/Progress';
import { Badge } from '../components/ui/Badge';
import { toast } from '../components/ui/Toast';
import { tauriApi } from '../lib/tauri';
import { useSessionStore } from '../store/session';
import { basename, formatBytes } from '../lib/utils';
import { useTauriDrop, pickCarrier } from '../lib/fileDrop';


function HexDump({ hex }: { hex: string }) {
  const bytes = hex.split(' ').filter(Boolean);
  const rows: string[][] = [];
  for (let i = 0; i < bytes.length; i += 16) rows.push(bytes.slice(i, i + 16));
  return (
    <div className="result-preview-hex">
      {rows.map((row, ri) => (
        <div key={ri} className="result-preview-hex-row">
          <span className="result-preview-hex-addr">{(ri * 16).toString(16).padStart(4, '0')}</span>
          <span className="result-preview-hex-bytes">{row.join(' ').padEnd(47, ' ')}</span>
          <span className="result-preview-hex-ascii">
            {row.map((b) => {
              const n = parseInt(b, 16);
              return n >= 32 && n < 127 ? String.fromCharCode(n) : '.';
            }).join('')}
          </span>
        </div>
      ))}
    </div>
  );
}


export function DecodePage() {
  const {
    startJob, setStep, finishDecodeJob, failJob,
    jobStatus, decodeResult, jobProgress, jobStep, jobError,
    headerPeek, setHeaderPeek, decodePreview, setDecodePreview,
  } = useSessionStore();

  const [carrierPath, setCarrierPath] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [carrierInfo, setCarrierInfo] = useState<{ format: string; width: number | null; height: number | null; sample_rate: number | null } | null>(null);
  const [password, setPassword] = useState('');
  const [shuffleSeed, setShuffleSeed] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleCarrierPaths = async (paths: string[]) => {
    const path = paths[0];
    if (!path) return;
    setCarrierPath(path);
    setHeaderPeek(null);
    setDecodePreview(null);
    try {
      const info = await tauriApi.analyzeCarrier(path);
      if (info.thumbnail) setThumbnail(info.thumbnail);
      setCarrierInfo({ format: info.format, width: info.width, height: info.height, sample_rate: info.sample_rate });
    } catch {  }

    try {
      const peek = await tauriApi.peekHeader(path);
      setHeaderPeek(peek);
    } catch {  }
  };

  const { isOver } = useTauriDrop(dropRef, handleCarrierPaths);

  const handleClick = async () => {
    const path = await pickCarrier();
    if (path) await handleCarrierPaths([path]);
  };

  const canDecode = carrierPath && password.length >= 1;

  const handleDecode = async () => {
    if (!carrierPath || !password) return;

    const outputPath = await save({
      defaultPath: 'extracted',
      filters: [{ name: 'All Files', extensions: ['*'] }],
    });
    if (!outputPath) return;

    startJob();
    setDecodePreview(null);
    try {
      setStep('Extracting bits', 20);
      await new Promise((r) => setTimeout(r, 60));
      setStep('Decrypting', 55);

      const result = await tauriApi.decodeFile({
        carrier_path: carrierPath,
        output_path: outputPath,
        password,
        shuffle_seed: shuffleSeed ? parseInt(shuffleSeed, 10) : null,
      });

      setStep('Complete', 100);
      finishDecodeJob(result);
      toast.success('Decoded', `Extracted ${formatBytes(result.original_size)} to ${result.output_path}`);


      try {
        const preview = await tauriApi.readPreview(result.output_path);
        setDecodePreview(preview);
      } catch {  }
    } catch (e: any) {
      failJob(e?.message ?? String(e));
      toast.error('Decode failed', e?.message ?? String(e));
    }
  };

  const handleCopy = async () => {
    if (!decodePreview) return;
    try {
      if (decodePreview.kind === 'text') {
        await navigator.clipboard.writeText(decodePreview.data);
        toast.success('Copied', 'Text copied to clipboard');
      } else if (decodeResult) {
        await navigator.clipboard.writeText(decodeResult.output_path);
        toast.success('Copied', 'Path copied to clipboard');
      }
    } catch {  }
  };

  const handleOpenFolder = async () => {
    if (!decodeResult) return;
    try {
      const dir = decodeResult.output_path.substring(0, decodeResult.output_path.lastIndexOf('/')) || '/';
      await tauriApi.openPath(dir);
    } catch {  }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Decode</h1>
        <p className="page-subtitle">Extract and decrypt a hidden payload from a carrier file</p>
      </div>

      <div className="page-columns">

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <label className="form-label">Stego Carrier</label>
            <div
              ref={dropRef}
              className={`dropzone ${isOver ? 'dropzone-active' : ''} ${carrierPath ? 'dropzone-filled' : ''}`}
              onClick={handleClick}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
              role="button"
              tabIndex={0}
              aria-label={carrierPath ? `Carrier: ${basename(carrierPath)}. Click to replace` : 'Click or drop stego carrier file'}
              style={{ cursor: 'pointer' }}
            >
              <AnimatePresence mode="wait">
                {carrierPath ? (
                  <motion.div key="preview" className="dropzone-preview"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    {thumbnail ? (
                      <img src={`data:image/png;base64,${thumbnail}`} className="dropzone-thumb" alt="carrier" />
                    ) : (
                      <div className="dropzone-audio-icon">
                        <WaveformIcon />
                      </div>
                    )}
                    <div className="dropzone-meta">
                      <span className="dropzone-filename">{basename(carrierPath)}</span>
                      {carrierInfo && (
                        <>
                          <span className="dropzone-format mono">{carrierInfo.format.toUpperCase()}</span>
                          {carrierInfo.width && (
                            <span className="dropzone-dim mono">{carrierInfo.width}×{carrierInfo.height}</span>
                          )}
                          {carrierInfo.sample_rate && (
                            <span className="dropzone-dim mono">{(carrierInfo.sample_rate / 1000).toFixed(1)} kHz</span>
                          )}
                        </>
                      )}
                    </div>
                    <span className="dropzone-replace">Replace</span>
                  </motion.div>
                ) : (
                  <motion.div key="empty" className="dropzone-empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <UploadIcon active={isOver} />
                    <span className="dropzone-hint">{isOver ? 'Drop here' : 'Click or drop stego carrier'}</span>
                    <span className="dropzone-sub">PNG, BMP, JPEG, WAV, FLAC, MP3</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>


          <AnimatePresence>
            {headerPeek && (
              <motion.div
                className="card header-peek"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="header-peek-title">Detected payload header</div>
                <div className="header-peek-grid">
                  <div className="header-peek-item">
                    <span className="header-peek-key">Algorithm</span>
                    <span className="header-peek-val">{headerPeek.algo}</span>
                  </div>
                  <div className="header-peek-item">
                    <span className="header-peek-key">Encryption</span>
                    <span className="header-peek-val">{headerPeek.encryption}</span>
                  </div>
                  <div className="header-peek-item">
                    <span className="header-peek-key">LSB bits</span>
                    <span className="header-peek-val">{headerPeek.lsb_bits}</span>
                  </div>
                  <div className="header-peek-item">
                    <span className="header-peek-key">Payload size</span>
                    <span className="header-peek-val">~{formatBytes(headerPeek.payload_size)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input input-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter decryption password…"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canDecode && handleDecode()}
                  style={{ paddingRight: 40 }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Shuffle seed (if used during encode)</label>
              <input
                className="input mono"
                type="number"
                placeholder="Leave blank if none"
                value={shuffleSeed}
                onChange={(e) => setShuffleSeed(e.target.value)}
              />
            </div>

            <Button variant="primary" size="lg" onClick={handleDecode} disabled={!canDecode} style={{ width: '100%' }} icon={<UnlockIcon />}>
              Decode & Extract
            </Button>
          </div>


          <AnimatePresence>
            {jobStatus === 'running' && (
              <motion.div className="card" style={{ padding: 'var(--space-4)' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Progress value={jobProgress} label={jobStep} animated />
              </motion.div>
            )}
          </AnimatePresence>


          <AnimatePresence>
            {jobStatus === 'done' && decodeResult && (
              <motion.div
                className="card"
                style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>✓ Extracted</span>
                  <Badge variant="success">{formatBytes(decodeResult.original_size)}</Badge>
                  <Badge variant="accent">{decodeResult.algorithm}</Badge>
                  <Badge variant="default">{decodeResult.encryption}</Badge>
                </div>

                <p
                  className="mono"
                  title={decodeResult.output_path}
                  style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
                >
                  {decodeResult.output_path}
                </p>


                {decodePreview && (
                  <div className="result-preview">
                    {decodePreview.kind === 'image' && (
                      <img
                        className="result-preview-img"
                        src={`data:image/png;base64,${decodePreview.data}`}
                        alt="decoded"
                      />
                    )}
                    {decodePreview.kind === 'text' && (
                      <pre className="result-preview-text">{decodePreview.data}</pre>
                    )}
                    {decodePreview.kind === 'hex' && (
                      <HexDump hex={decodePreview.data} />
                    )}
                  </div>
                )}

                <div className="result-preview-actions">
                  <Button variant="secondary" size="sm" onClick={handleCopy}>
                    {decodePreview?.kind === 'text' ? 'Copy text' : 'Copy path'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleOpenFolder}>Open folder</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>


          <AnimatePresence>
            {jobStatus === 'error' && (
              <motion.div className="card" style={{ padding: 'var(--space-4)', color: 'var(--accent-danger)', fontSize: 'var(--font-size-sm)', overflowWrap: 'break-word', wordBreak: 'break-word' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                ✕ {jobError || 'Decode failed — check password and carrier file'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function UnlockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="7" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 7V5a3 3 0 016 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function UploadIcon({ active }: { active: boolean }) {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none"
      style={{ color: active ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
      <rect x="4" y="28" width="32" height="4" rx="2" fill="currentColor" opacity="0.3"/>
      <path d="M20 24V10M13 17l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function WaveformIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
      <path d="M4 24h4M8 14v20M16 18v12M24 8v32M32 16v16M40 20v8M44 24h4"
        stroke="var(--accent-secondary)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}
