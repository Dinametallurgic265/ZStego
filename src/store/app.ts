import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '../lib/tauri';

interface RecentFile {
  path: string;
  kind: 'carrier' | 'output';
  timestamp: number;
  thumbnail?: string;
}

interface AppStore {
  theme: 'dark' | 'light';
  settings: AppSettings;
  recentFiles: RecentFile[];
  setTheme: (theme: 'dark' | 'light') => void;
  setSettings: (s: Partial<AppSettings>) => void;
  addRecentFile: (f: RecentFile) => void;
  clearRecentFiles: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  default_algorithm: 'lsb',
  default_encryption: 'aes-gcm',
  output_directory: null,
  strip_exif: true,
  theme: 'dark',
  font_size: 14,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      settings: DEFAULT_SETTINGS,
      recentFiles: [],

      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
      },

      setSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),

      addRecentFile: (f) =>
        set((state) => ({
          recentFiles: [f, ...state.recentFiles.filter((r) => r.path !== f.path)].slice(0, 20),
        })),

      clearRecentFiles: () => set({ recentFiles: [] }),
    }),
    { name: 'zstego-app' }
  )
);
