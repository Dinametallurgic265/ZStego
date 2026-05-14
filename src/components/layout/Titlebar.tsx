import { getCurrentWindow } from '@tauri-apps/api/window';
import { useAppStore } from '../../store/app';

export function Titlebar() {
  const { theme, setTheme } = useAppStore();

  return (
    <div className="titlebar" data-tauri-drag-region>
      <div className="titlebar-logo" data-tauri-drag-region>
        <ZLogoMark />
        <span className="titlebar-name">
          Z<span className="titlebar-stego">-Stego</span>
        </span>
      </div>

      <div className="titlebar-actions" style={{ pointerEvents: 'auto' }}>
        <button
          className="titlebar-btn titlebar-theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <button className="titlebar-btn" onClick={() => getCurrentWindow().minimize()} title="Minimize" aria-label="Minimize window">─</button>
        <button className="titlebar-btn" onClick={() => getCurrentWindow().toggleMaximize()} title="Maximize" aria-label="Maximize window">□</button>
        <button className="titlebar-btn titlebar-close" onClick={() => getCurrentWindow().close()} title="Close" aria-label="Close window">✕</button>
      </div>
    </div>
  );
}

function ZLogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M4 4h14l-14 14h14"
        stroke="url(#zgrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="zgrad" x1="4" y1="4" x2="18" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c5cfc"/>
          <stop offset="1" stopColor="#3ecfcf"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
