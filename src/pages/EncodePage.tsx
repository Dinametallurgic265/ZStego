import { useState, useRef } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { CarrierDropzone } from '../components/encode/CarrierDropzone';
import { EncodeProgress } from '../components/encode/EncodeProgress';
import { AlgorithmPicker } from '../components/encode/AlgorithmPicker';
import { Slider } from '../components/ui/Slider';
import { Button } from '../components/ui/Button';
import { Tooltip } from '../components/ui/Tooltip';
import { toast } from '../components/ui/Toast';
import { tauriApi } from '../lib/tauri';
import { useSessionStore } from '../store/session';
import { useAppStore } from '../store/app';
import { basename, formatBytes } from '../lib/utils';
import { useTauriDrop, pickPayload } from '../lib/fileDrop';
import { invoke } from '@tauri-apps/api/core';


function passwordStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 16) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { level: 1, label: 'Weak',   color: 'var(--accent-danger)' },
    { level: 2, label: 'Fair',   color: 'var(--accent-warning)' },
    { level: 3, label: 'Good',   color: 'var(--accent-warning)' },
    { level: 4, label: 'Strong', color: 'var(--accent-success)' },
    { level: 5, label: 'Strong', color: 'var(--accent-success)' },
  ];
  return levels[Math.min(score, 4)];
}


function CapacityArc({ pct }: { pct: number }) {
  const r = 38;
  const cx = 50;
  const cy = 54;
  const startAngle = 135 * (Math.PI / 180);
  const endAngle   = 45  * (Math.PI / 180);
  const startX = cx + r * Math.cos(startAngle);
  const startY = cy + r * Math.sin(startAngle);
  const endX   = cx + r * Math.cos(endAngle);
  const endY   = cy + r * Math.sin(endAngle);
  const trackPath = `M ${startX.toFixed(2)} ${startY.toFixed(2)} A ${r} ${r} 0 1 1 ${endX.toFixed(2)} ${endY.toFixed(2)}`;
  const color   = pct > 85 ? 'var(--accent-danger)' : pct > 60 ? 'var(--accent-warning)' : 'var(--accent-success)';
  const clamped = Math.min(pct, 100);

  return (
    <svg width="100" height="90" viewBox="0 0 100 90" style={{ flexShrink: 0 }}>
      <path d={trackPath} fill="none" stroke="var(--bg-elevated)" strokeWidth="8" strokeLinecap="round" />
      <path
        d={trackPath}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray={`${clamped} 100`}
        style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.3s ease' }}
      />
      <text x="50" y="50" textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="700" fontFamily="var(--font-mono)">
        {Math.round(clamped)}%
      </text>
      <text x="50" y="63" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-ui)" letterSpacing="0.04em">
        USED
      </text>
    </svg>
  );
}


const QUALITY_MAP: Record<string, Record<number, string>> = {
  lsb: { 1: 'Imperceptible', 2: 'Minimal', 3: 'Low', 4: 'Visible' },
};

function getQuality(algo: string, bits: number): { label: string; color: string } {
  const label = QUALITY_MAP[algo]?.[bits] ?? 'Imperceptible';
  const color = label === 'Visible'  ? 'var(--accent-danger)'
    : label === 'Low'     ? 'var(--accent-warning)'
    : label === 'Minimal' ? 'var(--accent-warning)'
    : 'var(--accent-success)';
  return { label, color };
}


function CapMiniBar({ info }: { info: { capacity_1bit: number; capacity_2bit: number; capacity_4bit: number } }) {
  const max = info.capacity_4bit || 1;
  return (
    <div className="cap-bars">
      {[
        { label: '1-bit', cap: info.capacity_1bit },
        { label: '2-bit', cap: info.capacity_2bit },
        { label: '4-bit', cap: info.capacity_4bit },
      ].map(({ label, cap }) => (
        <div key={label} className="cap-bar-row">
          <span className="cap-bar-label">{label}</span>
          <div className="cap-bar-track">
            <div className="cap-bar-fill" style={{ width: `${(cap / max) * 100}%` }} />
          </div>
          <span className="cap-bar-val">{formatBytes(cap)}</span>
        </div>
      ))}
    </div>
  );
}


function PayloadSection() {
  const { payloadPath, payloadSize, setPayload, textPayload, setTextPayload } = useSessionStore();
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const ref = useRef<HTMLDivElement>(null);

  const handlePaths = async (paths: string[]) => {
    const path = paths[0];
    if (!path) return;
    let size = 0;
    try { size = await invoke<number>('get_file_size', { path }); } catch {  }
    setPayload(path, size);
  };

  const { isOver } = useTauriDrop(ref, handlePaths);

  const handleClick = async () => {
    const path = await pickPayload();
    if (path) await handlePaths([path]);
  };

  const byteCount = new TextEncoder().encode(textPayload).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="encode-section-header">
        <span className="encode-section-title">Payload</span>
        <div className="payload-tabs" role="tablist" aria-label="Payload input mode">
          <button role="tab" aria-selected={mode === 'file'} className={`payload-tab ${mode === 'file' ? 'payload-tab-active' : ''}`} onClick={() => setMode('file')}>File</button>
          <button role="tab" aria-selected={mode === 'text'} className={`payload-tab ${mode === 'text' ? 'payload-tab-active' : ''}`} onClick={() => setMode('text')}>Text</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'file' ? (
          <motion.div key="file" style={{ flex: 1 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
            <div
              ref={ref}
              className={`dropzone ${isOver ? 'dropzone-active' : ''} ${payloadPath ? 'dropzone-filled' : ''}`}
              onClick={handleClick}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
              role="button"
              tabIndex={0}
              aria-label={payloadPath ? `Payload: ${basename(payloadPath)}. Click to replace` : 'Click or drop any file to use as payload'}
              style={{ cursor: 'pointer', height: '100%', minHeight: 140 }}
            >
              <AnimatePresence mode="wait">
                {payloadPath ? (
                  <motion.div key="filled" className="dropzone-file-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <FileIcon />
                    <div className="dropzone-meta">
                      <span className="dropzone-filename">{basename(payloadPath)}</span>
                      {payloadSize != null && payloadSize > 0 && (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {formatBytes(payloadSize)}
                        </span>
                      )}
                    </div>
                    <span className="dropzone-replace">Replace</span>
                  </motion.div>
                ) : (
                  <motion.div key="empty" className="dropzone-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <FileIcon dim />
                    <span className="dropzone-hint">{isOver ? 'Drop file here' : 'Click or drop any file'}</span>
                    <span className="dropzone-sub">Any file type is accepted</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div key="text" style={{ flex: 1, display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
            <textarea
              className="text-payload-area"
              placeholder="Type or paste your secret message here…"
              value={textPayload}
              onChange={(e) => setTextPayload(e.target.value)}
              style={{ flex: 1, minHeight: 140, resize: 'none' }}
            />
            <div className="text-payload-meta">
              {textPayload.length} chars · {byteCount} bytes
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


export function EncodePage() {
  const {
    carrierPath, carrierInfo, payloadPath, payloadSize,
    textPayload, startJob, setStep, finishEncodeJob, failJob,
    jobStatus, encodeResult, jobError,
  } = useSessionStore();
  const { settings } = useAppStore();

  const [algorithm,  setAlgorithm]  = useState(settings.default_algorithm);
  const [encryption, setEncryption] = useState(settings.default_encryption);
  const [lsbBits,    setLsbBits]    = useState(1);
  const [password,   setPassword]   = useState('');
  const [shuffleSeed, setShuffleSeed] = useState('');
  const [stripExif,  setStripExif]  = useState(settings.strip_exif);
  const [showPassword, setShowPassword] = useState(false);

  const strength = passwordStrength(password);
  const quality  = getQuality(algorithm, lsbBits);

  const effectivePayloadSize = payloadPath
    ? (payloadSize ?? 0)
    : new TextEncoder().encode(textPayload).length;

  const capacityBytes = carrierInfo
    ? (lsbBits === 1 ? carrierInfo.capacity_1bit : lsbBits <= 2 ? carrierInfo.capacity_2bit : carrierInfo.capacity_4bit)
    : 0;
  const usedPct = capacityBytes > 0 ? Math.min((effectivePayloadSize / capacityBytes) * 100, 100) : 0;

  const hasPayload = payloadPath || textPayload.trim().length > 0;
  const canEncode  = !!carrierPath && hasPayload && password.length >= 1;

  const handleEncode = async () => {
    if (!carrierPath || !password) return;

    let resolvedPayloadPath = payloadPath;
    if (!resolvedPayloadPath) {
      if (!textPayload.trim()) return;
      try {
        resolvedPayloadPath = await tauriApi.writeTempText(textPayload);
      } catch (e: any) {
        toast.error('Failed to prepare text payload', e?.message ?? String(e));
        return;
      }
    }

    const outputPath = await save({
      defaultPath: 'output.png',
      filters: [
        { name: 'Images', extensions: ['png', 'bmp'] },
        { name: 'Audio',  extensions: ['wav'] },
      ],
    });
    if (!outputPath) return;

    startJob();
    try {
      setStep('Compress', 15);
      await new Promise((r) => setTimeout(r, 60));
      setStep('Encrypt', 35);
      await new Promise((r) => setTimeout(r, 60));
      setStep('Embed', 60);

      const result = await tauriApi.encodeFile({
        carrier_path:  carrierPath,
        payload_path:  resolvedPayloadPath,
        output_path:   outputPath,
        algorithm:     algorithm as any,
        encryption:    encryption as any,
        password,
        lsb_bits:      lsbBits,
        shuffle_seed:  shuffleSeed ? parseInt(shuffleSeed, 10) : null,
        strip_exif:    stripExif,
      });

      setStep('Verify', 90);
      await new Promise((r) => setTimeout(r, 60));
      setStep('Complete', 100);
      finishEncodeJob(result);
      toast.success('Encoded', `Saved to ${result.output_path}`);
    } catch (e: any) {
      failJob(e?.message ?? String(e));
      toast.error('Encoding failed', e?.message ?? String(e));
    }
  };

  const handleOpenFolder = async () => {
    if (!encodeResult) return;
    try {
      const dir = encodeResult.output_path.substring(0, encodeResult.output_path.lastIndexOf('/')) || '/';
      await tauriApi.openPath(dir);
    } catch {  }
  };

  const handleCopyPath = async () => {
    if (!encodeResult) return;
    try {
      await navigator.clipboard.writeText(encodeResult.output_path);
      toast.success('Copied', 'Path copied to clipboard');
    } catch {  }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Encode</h1>
        <p className="page-subtitle">Hide an encrypted payload inside a carrier image or audio file</p>
      </div>


      <div className="encode-files">
        <div className="card encode-file-card">
          <div className="encode-section-header">
            <span className="encode-section-title">Carrier</span>
            {carrierInfo && (
              <span className="encode-section-badge">{carrierInfo.format.toUpperCase()}</span>
            )}
          </div>
          <CarrierDropzone />
          {carrierInfo && <CapMiniBar info={carrierInfo} />}
        </div>

        <div className="card encode-file-card">
          <PayloadSection />
        </div>
      </div>


      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <div className="encode-section-header" style={{ marginBottom: 'var(--space-4)' }}>
          <span className="encode-section-title">Algorithm &amp; Options</span>
        </div>

        <AlgorithmPicker
          algorithm={algorithm}
          encryption={encryption}
          onAlgorithmChange={setAlgorithm}
          onEncryptionChange={setEncryption}
        />

        <div className="encode-options-row">
          {algorithm === 'lsb' && (
            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
              <Slider
                label="LSB Bits"
                value={lsbBits}
                onChange={setLsbBits}
                min={1}
                max={4}
                step={1}
                formatValue={(v) => `${v} bit${v > 1 ? 's' : ''} — ${['Imperceptible', 'Minimal', 'Low impact', 'Visible'][v - 1]}`}
              />
            </div>
          )}

          <Tooltip content="Randomises pixel/sample selection — must use same seed to decode" side="top">
            <div className="form-group" style={{ flex: '0 1 160px', minWidth: 120 }}>
              <label className="form-label">Shuffle seed</label>
              <input
                className="input mono"
                type="number"
                placeholder="None"
                value={shuffleSeed}
                onChange={(e) => setShuffleSeed(e.target.value)}
              />
            </div>
          </Tooltip>

          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2, flexShrink: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={stripExif}
                onChange={(e) => setStripExif(e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: 14, height: 14 }}
              />
              Strip EXIF
            </label>
          </div>
        </div>
      </div>


      <div className="card encode-action-card">

        <div className="encode-password-col">
          <div className="encode-section-header" style={{ marginBottom: 'var(--space-3)' }}>
            <span className="encode-section-title">Encryption Password</span>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              className="input input-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter encryption password…"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canEncode && handleEncode()}
              style={{ paddingRight: 40, width: '100%' }}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1 }}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
          {password.length > 0 && (
            <div style={{ marginTop: 'var(--space-2)' }}>
              <div className="password-strength-bar">
                <div
                  className="password-strength-fill"
                  style={{ width: `${(strength.level / 5) * 100}%`, backgroundColor: strength.color }}
                />
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: strength.color }}>{strength.label}</span>
            </div>
          )}
        </div>


        <div className="encode-action-divider" />


        <div className="encode-capacity-col">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <CapacityArc pct={usedPct} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1, minWidth: 0 }}>
              <div className="quality-indicator">
                <div className="quality-dot" style={{ background: quality.color }} />
                <span className="quality-label">Quality</span>
                <span className="quality-value" style={{ color: quality.color }}>{quality.label}</span>
              </div>
              {capacityBytes > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 'var(--font-size-xs)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Payload</span>
                    <span className="mono">{formatBytes(effectivePayloadSize)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Available</span>
                    <span className="mono" style={{ color: usedPct > 85 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                      {formatBytes(Math.max(0, capacityBytes - effectivePayloadSize))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button variant="primary" size="lg" onClick={handleEncode} disabled={!canEncode} style={{ width: '100%', marginTop: 'var(--space-3)' }} icon={<LockIcon />}>
            Encode &amp; Save
          </Button>
        </div>
      </div>


      <AnimatePresence>
        {jobStatus !== 'idle' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <EncodeProgress />
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {jobStatus === 'done' && encodeResult && (
          <motion.div
            className="success-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="success-card-header">
              <CheckIcon />
              Payload successfully hidden
            </div>
            <Tooltip content={encodeResult.output_path} side="top">
              <div className="success-card-path">{encodeResult.output_path}</div>
            </Tooltip>
            <div className="success-card-stats">
              <div className="success-card-stat">
                <span className="success-card-stat-label">Payload</span>
                <span className="success-card-stat-val">{formatBytes(encodeResult.payload_bytes)}</span>
              </div>
              <div className="success-card-stat">
                <span className="success-card-stat-label">Capacity used</span>
                <span className="success-card-stat-val">{encodeResult.capacity_used_pct.toFixed(1)}%</span>
              </div>
              <div className="success-card-stat">
                <span className="success-card-stat-label">Output size</span>
                <span className="success-card-stat-val">{formatBytes(encodeResult.capacity_bytes)}</span>
              </div>
            </div>
            <div className="success-card-actions">
              <Button variant="secondary" size="sm" onClick={handleCopyPath}>Copy path</Button>
              <Button variant="secondary" size="sm" onClick={handleOpenFolder}>Open folder</Button>
            </div>
          </motion.div>
        )}
        {jobStatus === 'error' && jobError && (
          <motion.div
            className="card"
            style={{ padding: 'var(--space-4)', color: 'var(--accent-danger)', fontSize: 'var(--font-size-sm)', overflowWrap: 'break-word', wordBreak: 'break-word' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            ✕ {jobError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="7" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="var(--accent-success)" strokeWidth="1.5"/>
      <path d="M5 8l2 2 4-4" stroke="var(--accent-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function FileIcon({ dim }: { dim?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none"
      style={{ color: dim ? 'var(--text-muted)' : 'var(--accent-primary)', flexShrink: 0 }}>
      <rect x="4" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M14 2l6 6v16H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
