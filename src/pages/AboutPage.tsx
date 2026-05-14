import { tauriApi } from '../lib/tauri';

const LINKS = [
  {
    label: 'GitHub',
    sub: 'TheHolyOneZ/ZStego',
    url: 'https://github.com/TheHolyOneZ/ZStego',
    icon: <GithubIcon />,
    accent: 'var(--text-primary)',
  },
  {
    label: 'Download & Docs',
    sub: 'zsync.eu/zstego',
    url: 'https://zsync.eu/zstego/',
    icon: <DownloadIcon />,
    accent: 'var(--accent-primary)',
  },
  {
    label: 'More Projects',
    sub: 'zsync.eu',
    url: 'https://zsync.eu',
    icon: <GridIcon />,
    accent: 'var(--accent-secondary)',
  },
];

const STACK = [
  { name: 'Tauri v2',              role: 'App shell & IPC',           color: 'var(--accent-primary)' },
  { name: 'Rust',                  role: 'Backend — stego & crypto',  color: '#f74c00' },
  { name: 'React + TypeScript',    role: 'Frontend UI',               color: '#3ecfcf' },
  { name: 'Vite',                  role: 'Build & HMR',               color: '#a259ff' },
  { name: 'AES-256-GCM',          role: 'Symmetric encryption',       color: 'var(--accent-success)' },
  { name: 'ChaCha20-Poly1305',    role: 'Symmetric encryption',       color: 'var(--accent-success)' },
  { name: 'Argon2id',             role: 'Key derivation',             color: 'var(--accent-warning)' },
  { name: 'zstd',                 role: 'Payload compression',        color: 'var(--text-secondary)' },
  { name: 'LSB steganography',    role: 'Image & audio embedding',    color: 'var(--accent-primary)' },
];

function open(url: string) {
  tauriApi.openUrl(url).catch(() => {
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}

export function AboutPage() {
  return (
    <div className="page" style={{ maxWidth: 720, margin: '0 auto' }}>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-2)', textAlign: 'center' }}>
        <ZLogoLarge />
        <div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
            Z<span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>-Stego</span>
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            v0.1.0 · GPL-3.0
          </p>
        </div>
        <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-secondary)', maxWidth: 480, lineHeight: 1.6, margin: 0 }}>
          Cross-platform desktop app for hiding encrypted files inside images and audio. Everything runs locally — no servers, no telemetry, no cloud.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
        {LINKS.map((link) => (
          <button
            key={link.url}
            onClick={() => open(link.url)}
            className="about-link-card"
            style={{ '--link-accent': link.accent } as React.CSSProperties}
          >
            <span className="about-link-icon">{link.icon}</span>
            <span className="about-link-label">{link.label}</span>
            <span className="about-link-sub">{link.sub}</span>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 'var(--space-3)' }}>
          Tech Stack
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {STACK.map((item) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0, boxShadow: `0 0 6px ${item.color}88` }} />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', minWidth: 0, flex: '0 0 auto' }}>
                {item.name}
              </span>
              <span style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', flex: 1 }}>
                {item.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 'var(--space-3)' }}>
          License
        </p>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
          Z-Stego is free and open-source software released under the{' '}
          <button
            onClick={() => open('https://www.gnu.org/licenses/gpl-3.0.html')}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-primary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            GNU General Public License v3.0
          </button>
          . You are free to use, study, modify, and distribute it under the same terms.
        </p>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-3)', marginBottom: 0, fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}>
          Copyright (C) 2026 TheHolyOneZ — GPL 3.0
        </p>
      </div>

    </div>
  );
}

function ZLogoLarge() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill="url(#aboutGradBg)" opacity="0.15" />
      <rect width="64" height="64" rx="16" stroke="url(#aboutGrad)" strokeWidth="1.5" fill="none" opacity="0.4" />
      <path
        d="M14 14h36L14 50h36"
        stroke="url(#aboutGrad)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="aboutGrad" x1="14" y1="14" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c5cfc"/>
          <stop offset="1" stopColor="#3ecfcf"/>
        </linearGradient>
        <linearGradient id="aboutGradBg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c5cfc"/>
          <stop offset="1" stopColor="#3ecfcf"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill="currentColor"/>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2v13M8 11l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
