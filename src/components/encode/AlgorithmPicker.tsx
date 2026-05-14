const ALGORITHMS = [
  { value: 'lsb',    label: 'LSB',            desc: 'Least significant bit — images & audio', badge: 'High capacity', badgeClass: 'algo-badge-fast' },
  { value: 'dct',    label: 'DCT',             desc: 'DCT coefficients — JPEG resilient',       badge: 'JPEG-safe',     badgeClass: 'algo-badge-safe' },
  { value: 'phase',  label: 'Phase Coding',    desc: 'Phase shift — transparent audio hide',    badge: 'Audio',         badgeClass: 'algo-badge-audio' },
  { value: 'echo',   label: 'Echo Hiding',     desc: 'Echo delay — natural sounding',           badge: 'Audio',         badgeClass: 'algo-badge-audio' },
  { value: 'spread', label: 'Spread Spectrum', desc: 'PN spread — anti-steganalysis',           badge: 'Covert',        badgeClass: 'algo-badge-safe' },
];

const ENCRYPTION = [
  { value: 'aes-gcm',  label: 'AES-256-GCM',      sub: 'Standard AEAD' },
  { value: 'chacha20', label: 'ChaCha20',           sub: 'Constant-time' },
];

interface Props {
  algorithm: string;
  encryption: string;
  onAlgorithmChange: (v: string) => void;
  onEncryptionChange: (v: string) => void;
}

export function AlgorithmPicker({ algorithm, encryption, onAlgorithmChange, onEncryptionChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div>
        <div className="section-heading">Steganography Algorithm</div>
        <div className="algo-cards">
          {ALGORITHMS.map((a) => (
            <button
              key={a.value}
              className={`algo-card ${algorithm === a.value ? 'algo-card-active' : ''}`}
              onClick={() => onAlgorithmChange(a.value)}
              aria-pressed={algorithm === a.value}
            >
              <div className="algo-card-name">{a.label}</div>
              <div className="algo-card-desc">{a.desc}</div>
              <span className={`algo-card-badge ${a.badgeClass}`}>{a.badge}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="section-heading">Encryption</div>
        <div className="crypto-pills">
          {ENCRYPTION.map((e) => (
            <button
              key={e.value}
              className={`crypto-pill ${encryption === e.value ? 'crypto-pill-active' : ''}`}
              onClick={() => onEncryptionChange(e.value)}
              aria-pressed={encryption === e.value}
            >
              <div className="crypto-pill-name">{e.label}</div>
              <div className="crypto-pill-sub">{e.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
