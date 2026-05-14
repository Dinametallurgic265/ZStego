import { useState, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import { tauriApi } from '../lib/tauri';
import { useTauriDrop, pickCarrier } from '../lib/fileDrop';
import { basename } from '../lib/utils';


const TEST_PAYLOAD = 'ZStego Roundtrip OK — 0123456789 — \u2713';


interface TestCase {
  id: string;
  label: string;
  group: string;
  algorithm: string;
  encryption: string;
  lsb_bits: number;
  shuffle_seed: number | null;
  strip_exif: boolean;
}

const TEST_CASES: TestCase[] = [

  { id: 'lsb-1-aes',         label: 'LSB 1-bit · AES-GCM',                   group: 'LSB / AES-GCM',    algorithm: 'lsb',    encryption: 'aes-gcm',  lsb_bits: 1, shuffle_seed: null,   strip_exif: false },
  { id: 'lsb-2-aes',         label: 'LSB 2-bit · AES-GCM',                   group: 'LSB / AES-GCM',    algorithm: 'lsb',    encryption: 'aes-gcm',  lsb_bits: 2, shuffle_seed: null,   strip_exif: false },
  { id: 'lsb-4-aes',         label: 'LSB 4-bit · AES-GCM',                   group: 'LSB / AES-GCM',    algorithm: 'lsb',    encryption: 'aes-gcm',  lsb_bits: 4, shuffle_seed: null,   strip_exif: false },

  { id: 'lsb-1-cha',         label: 'LSB 1-bit · ChaCha20',                  group: 'LSB / ChaCha20',   algorithm: 'lsb',    encryption: 'chacha20', lsb_bits: 1, shuffle_seed: null,   strip_exif: false },
  { id: 'lsb-2-cha',         label: 'LSB 2-bit · ChaCha20',                  group: 'LSB / ChaCha20',   algorithm: 'lsb',    encryption: 'chacha20', lsb_bits: 2, shuffle_seed: null,   strip_exif: false },
  { id: 'lsb-4-cha',         label: 'LSB 4-bit · ChaCha20',                  group: 'LSB / ChaCha20',   algorithm: 'lsb',    encryption: 'chacha20', lsb_bits: 4, shuffle_seed: null,   strip_exif: false },

  { id: 'lsb-1-aes-seed',    label: 'LSB 1-bit · AES-GCM · seed=42',        group: 'LSB + Seed',       algorithm: 'lsb',    encryption: 'aes-gcm',  lsb_bits: 1, shuffle_seed: 42,     strip_exif: false },
  { id: 'lsb-2-aes-seed',    label: 'LSB 2-bit · AES-GCM · seed=42',        group: 'LSB + Seed',       algorithm: 'lsb',    encryption: 'aes-gcm',  lsb_bits: 2, shuffle_seed: 42,     strip_exif: false },
  { id: 'lsb-4-aes-seed',    label: 'LSB 4-bit · AES-GCM · seed=42',        group: 'LSB + Seed',       algorithm: 'lsb',    encryption: 'aes-gcm',  lsb_bits: 4, shuffle_seed: 42,     strip_exif: false },
  { id: 'lsb-1-cha-seed',    label: 'LSB 1-bit · ChaCha20 · seed=42',       group: 'LSB + Seed',       algorithm: 'lsb',    encryption: 'chacha20', lsb_bits: 1, shuffle_seed: 42,     strip_exif: false },
  { id: 'lsb-4-cha-seed',    label: 'LSB 4-bit · ChaCha20 · seed=42',       group: 'LSB + Seed',       algorithm: 'lsb',    encryption: 'chacha20', lsb_bits: 4, shuffle_seed: 42,     strip_exif: false },

  { id: 'lsb-1-aes-exif',    label: 'LSB 1-bit · AES-GCM · strip EXIF',     group: 'Strip EXIF',       algorithm: 'lsb',    encryption: 'aes-gcm',  lsb_bits: 1, shuffle_seed: null,   strip_exif: true  },
  { id: 'lsb-1-cha-exif',    label: 'LSB 1-bit · ChaCha20 · strip EXIF',    group: 'Strip EXIF',       algorithm: 'lsb',    encryption: 'chacha20', lsb_bits: 1, shuffle_seed: null,   strip_exif: true  },

  { id: 'lsb-4-cha-all',     label: 'LSB 4-bit · ChaCha20 · seed + EXIF',   group: 'Combined',         algorithm: 'lsb',    encryption: 'chacha20', lsb_bits: 4, shuffle_seed: 999999, strip_exif: true  },
  { id: 'lsb-4-aes-all',     label: 'LSB 4-bit · AES-GCM · seed + EXIF',    group: 'Combined',         algorithm: 'lsb',    encryption: 'aes-gcm',  lsb_bits: 4, shuffle_seed: 999999, strip_exif: true  },

  { id: 'dct-1-aes',         label: 'DCT · AES-GCM',                         group: 'Other Algos',      algorithm: 'dct',    encryption: 'aes-gcm',  lsb_bits: 1, shuffle_seed: null,   strip_exif: false },
  { id: 'dct-1-cha',         label: 'DCT · ChaCha20',                        group: 'Other Algos',      algorithm: 'dct',    encryption: 'chacha20', lsb_bits: 1, shuffle_seed: null,   strip_exif: false },
  { id: 'phase-1-aes',       label: 'Phase · AES-GCM',                       group: 'Other Algos',      algorithm: 'phase',  encryption: 'aes-gcm',  lsb_bits: 1, shuffle_seed: null,   strip_exif: false },
  { id: 'echo-1-aes',        label: 'Echo · AES-GCM',                        group: 'Other Algos',      algorithm: 'echo',   encryption: 'aes-gcm',  lsb_bits: 1, shuffle_seed: null,   strip_exif: false },
  { id: 'spread-1-aes',      label: 'Spread · AES-GCM',                      group: 'Other Algos',      algorithm: 'spread', encryption: 'aes-gcm',  lsb_bits: 1, shuffle_seed: null,   strip_exif: false },
];


type TestStatus = 'idle' | 'running' | 'pass' | 'fail' | 'error';

interface TestResult {
  status: TestStatus;
  encodeMs?: number;
  decodeMs?: number;
  totalMs?: number;
  password?: string;
  error?: string;
}

type Results = Record<string, TestResult>;


function randomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  let pw = '';
  for (let i = 0; i < 18; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

function fmt(ms: number | undefined): string {
  if (ms === undefined) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}

const GROUPS = [...new Set(TEST_CASES.map((tc) => tc.group))];


function StatusBadge({ status }: { status: TestStatus }) {
  const map: Record<TestStatus, { label: string; color: string; bg: string }> = {
    idle:    { label: 'PENDING', color: 'var(--text-muted)',     bg: 'var(--bg-input)' },
    running: { label: 'RUNNING', color: 'var(--accent-primary)', bg: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)' },
    pass:    { label: 'PASS',    color: 'var(--accent-success)', bg: 'color-mix(in srgb, var(--accent-success) 12%, transparent)' },
    fail:    { label: 'FAIL',    color: 'var(--accent-warning)', bg: 'color-mix(in srgb, var(--accent-warning) 12%, transparent)' },
    error:   { label: 'ERROR',   color: 'var(--accent-danger)',  bg: 'color-mix(in srgb, var(--accent-danger)  12%, transparent)' },
  };
  const { label, color, bg } = map[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
      {status === 'running' && <SpinnerIcon />}
      {status === 'pass'    && '✓ '}
      {status === 'error' || status === 'fail' ? '✕ ' : ''}
      {label}
    </span>
  );
}


export function TestBenchPage() {
  const [carrierPath, setCarrierPath] = useState<string | null>(null);
  const [results, setResults] = useState<Results>({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const abortRef = useRef(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handlePaths = useCallback((paths: string[]) => {
    const p = paths[0];
    if (p) { setCarrierPath(p); setResults({}); }
  }, []);

  const { isOver } = useTauriDrop(dropRef, handlePaths);

  const handleClick = async () => {
    const p = await pickCarrier();
    if (p) { setCarrierPath(p); setResults({}); }
  };


  const resultList = TEST_CASES.map((tc) => results[tc.id]);
  const passed  = resultList.filter((r) => r?.status === 'pass').length;
  const failed  = resultList.filter((r) => r?.status === 'fail' || r?.status === 'error').length;
  const running = resultList.filter((r) => r?.status === 'running').length;
  const done    = passed + failed;
  const total   = TEST_CASES.length;

  const handleRun = async () => {
    if (!carrierPath || isRunning) return;
    abortRef.current = false;
    setIsRunning(true);
    setCurrentId(null);


    const init: Results = {};
    TEST_CASES.forEach((tc) => { init[tc.id] = { status: 'idle' }; });
    setResults(init);


    let payloadPath: string;
    try {
      payloadPath = await invoke<string>('write_temp_text', { content: TEST_PAYLOAD });
    } catch (e: any) {
      setIsRunning(false);
      return;
    }

    for (const tc of TEST_CASES) {
      if (abortRef.current) break;

      setCurrentId(tc.id);
      setResults((prev) => ({ ...prev, [tc.id]: { status: 'running' } }));

      const password   = randomPassword();
      const encodedPath = await invoke<string>('create_temp_path', { ext: 'png' });
      const decodedPath = await invoke<string>('create_temp_path', { ext: 'txt' });
      const tStart     = performance.now();
      let encodeMs = 0;

      try {

        const tEncode = performance.now();
        await tauriApi.encodeFile({
          carrier_path: carrierPath,
          payload_path: payloadPath,
          output_path:  encodedPath,
          algorithm:    tc.algorithm as any,
          encryption:   tc.encryption as any,
          password,
          lsb_bits:     tc.lsb_bits,
          shuffle_seed: tc.shuffle_seed,
          strip_exif:   tc.strip_exif,
        });
        encodeMs = Math.round(performance.now() - tEncode);


        const tDecode = performance.now();
        await tauriApi.decodeFile({
          carrier_path: encodedPath,
          output_path:  decodedPath,
          password,
          shuffle_seed: tc.shuffle_seed,
        });
        const decodeMs = Math.round(performance.now() - tDecode);


        const decoded = await invoke<string>('read_text_file', { path: decodedPath });
        const ok = decoded === TEST_PAYLOAD;

        setResults((prev) => ({
          ...prev,
          [tc.id]: {
            status:   ok ? 'pass' : 'fail',
            encodeMs,
            decodeMs,
            totalMs:  Math.round(performance.now() - tStart),
            password,
            error:    ok ? undefined : `Payload mismatch — got: "${decoded.slice(0, 60)}"`,
          },
        }));
      } catch (e: any) {
        setResults((prev) => ({
          ...prev,
          [tc.id]: {
            status:   'error',
            encodeMs,
            totalMs:  Math.round(performance.now() - tStart),
            password,
            error:    e?.message ?? String(e),
          },
        }));
      } finally {
        try { await invoke('remove_file', { path: encodedPath }); } catch {  }
        try { await invoke('remove_file', { path: decodedPath }); } catch {  }
      }
    }

    try { await invoke('remove_file', { path: payloadPath }); } catch {  }
    setCurrentId(null);
    setIsRunning(false);
  };

  const handleAbort = () => { abortRef.current = true; };

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const lines: string[] = [];
    const ts = new Date().toISOString();
    lines.push(`ZStego Test Bench Results — ${ts}`);
    lines.push(`Carrier: ${carrierPath ?? 'unknown'}`);
    lines.push(`Payload: "${TEST_PAYLOAD}"`);
    lines.push(`Tests: ${passed} passed / ${failed} failed / ${total} total`);
    lines.push('');

    for (const group of GROUPS) {
      lines.push(`── ${group} ──`);
      for (const tc of TEST_CASES.filter((t) => t.group === group)) {
        const r = results[tc.id];
        if (!r || r.status === 'idle') continue;
        const status  = r.status.toUpperCase().padEnd(7);
        const timing  = r.totalMs !== undefined ? fmt(r.totalMs).padStart(7) : '      —';
        const enc     = r.encodeMs !== undefined ? `enc ${fmt(r.encodeMs)}` : '';
        const dec     = r.decodeMs !== undefined ? `dec ${fmt(r.decodeMs)}` : '';
        const pw      = r.password ? `pw: ${r.password}` : '';
        const err     = r.error    ? `  !! ${r.error}`   : '';
        lines.push(`  ${status} ${timing}  ${tc.label.padEnd(48)} ${[enc, dec, pw].filter(Boolean).join('  ')}${err}`);
      }
      lines.push('');
    }

    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasResults = Object.keys(results).length > 0;
  const hasFinishedResults = hasResults && !isRunning && done > 0;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Test Bench</h1>
        <p className="page-subtitle">Automated roundtrip verification — every algorithm, encryption, and option combination</p>
      </div>


      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div
          ref={dropRef}
          className={`dropzone dropzone-sm ${isOver ? 'dropzone-active' : ''} ${carrierPath ? 'dropzone-filled' : ''}`}
          onClick={handleClick}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
          role="button"
          tabIndex={0}
          aria-label={carrierPath ? `Carrier: ${basename(carrierPath)}. Click to change` : 'Click or drop carrier image to test with'}
          style={{ cursor: 'pointer', flex: '1 1 260px', minHeight: 72, minWidth: 0 }}
        >
          <div className="dropzone-empty">
            {carrierPath ? (
              <>
                <CarrierIcon />
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }} title={carrierPath}>
                  {basename(carrierPath)}
                </span>
                <span className="dropzone-sub">Click or drop to replace</span>
              </>
            ) : (
              <>
                <CarrierIcon dim />
                <span className="dropzone-hint">{isOver ? 'Drop carrier here' : 'Drop carrier image to test'}</span>
                <span className="dropzone-sub">PNG or BMP recommended · larger image = more test capacity</span>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flexShrink: 0 }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{total}</span> test cases ·{' '}
            payload: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>"{TEST_PAYLOAD.slice(0, 24)}…"</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {isRunning ? (
              <button className="btn btn-danger btn-md" onClick={handleAbort} style={{ minWidth: 130 }}>
                <StopIcon /> Abort
              </button>
            ) : (
              <button className="btn btn-primary btn-md" onClick={handleRun} disabled={!carrierPath} style={{ minWidth: 130 }}>
                <PlayIcon /> Run All Tests
              </button>
            )}
            {hasFinishedResults && (
              <button className="btn btn-secondary btn-md" onClick={handleCopy} style={{ minWidth: 110 }}>
                <CopyIcon /> {copied ? 'Copied!' : 'Copy Results'}
              </button>
            )}
          </div>
        </div>
      </div>


      <AnimatePresence>
        {hasResults && (
          <motion.div
            className="card"
            style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>✓ {passed} passed</span>
                {failed > 0 && <span style={{ color: 'var(--accent-danger)', fontWeight: 600 }}>✕ {failed} failed</span>}
                {running > 0 && <span style={{ color: 'var(--accent-primary)' }}>⟳ running</span>}
                <span style={{ color: 'var(--text-muted)' }}>{done}/{total}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-sm)', color: isRunning ? 'var(--accent-primary)' : done === total ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                {progressPct}%
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', borderRadius: 'var(--radius-full)', background: failed > 0 ? 'linear-gradient(90deg, var(--accent-success), var(--accent-danger))' : 'linear-gradient(90deg, var(--accent-primary), var(--accent-success))', originX: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {hasResults && (
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {GROUPS.map((group) => {
              const cases = TEST_CASES.filter((tc) => tc.group === group);
              return (
                <div key={group} className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{group}</span>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {cases.filter((tc) => results[tc.id]?.status === 'pass').length}/{cases.length}
                    </span>
                  </div>
                  <div>
                    {cases.map((tc, i) => {
                      const r = results[tc.id];
                      const isCurrentlyRunning = currentId === tc.id;
                      return (
                        <motion.div
                          key={tc.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto auto auto auto',
                            gap: 'var(--space-3)',
                            alignItems: 'center',
                            padding: 'var(--space-3) var(--space-4)',
                            borderBottom: i < cases.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                            background: isCurrentlyRunning ? 'color-mix(in srgb, var(--accent-primary) 5%, transparent)' : 'transparent',
                            transition: 'background 0.2s',
                            minWidth: 0,
                          }}
                          animate={isCurrentlyRunning ? { opacity: [1, 0.7, 1] } : { opacity: 1 }}
                          transition={isCurrentlyRunning ? { duration: 1.2, repeat: Infinity } : {}}
                        >

                          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                            {tc.label}
                          </span>


                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap', textAlign: 'right' }}>
                            {r?.encodeMs !== undefined ? (
                              <span title={`Encode ${fmt(r.encodeMs)} · Decode ${fmt(r.decodeMs)}`}>
                                {fmt(r.totalMs)}
                              </span>
                            ) : '—'}
                          </span>


                          <span
                            style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            title={r?.password ?? ''}
                          >
                            {r?.password ?? ''}
                          </span>


                          <span
                            style={{ fontSize: 11, color: 'var(--accent-danger)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={r?.error ?? ''}
                          >
                            {r?.error ?? ''}
                          </span>


                          <StatusBadge status={r?.status ?? 'idle'} />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>


      {!hasResults && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', padding: 'var(--space-8)', color: 'var(--text-muted)', textAlign: 'center' }}>
          <FlaskIcon />
          <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-muted)' }}>
            {carrierPath ? 'Click "Run All Tests" to start the automated roundtrip verification.' : 'Drop a carrier image above, then run the tests.'}
          </p>
        </div>
      )}
    </div>
  );
}


function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <polygon points="3,2 12,7 3,12" fill="currentColor"/>
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <rect x="1" y="1" width="10" height="10" rx="2" fill="currentColor"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', flexShrink: 0 }} />
  );
}

function CarrierIcon({ dim }: { dim?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ color: dim ? 'var(--text-muted)' : 'var(--accent-primary)', flexShrink: 0 }}>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
      <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 5V3.5A1.5 1.5 0 009.5 2H3.5A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
      <path d="M15 4v14L6 32a4 4 0 003.5 6h21A4 4 0 0034 32L25 18V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 4h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="14" cy="28" r="2" fill="currentColor" opacity="0.5"/>
      <circle cx="22" cy="33" r="1.5" fill="currentColor" opacity="0.5"/>
    </svg>
  );
}
