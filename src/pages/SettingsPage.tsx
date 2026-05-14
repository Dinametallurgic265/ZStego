import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Slider } from '../components/ui/Slider';
import { toast } from '../components/ui/Toast';
import { tauriApi } from '../lib/tauri';
import { useAppStore } from '../store/app';

const ALGO_OPTIONS = [
  { value: 'lsb',    label: 'LSB' },
  { value: 'dct',    label: 'DCT' },
  { value: 'phase',  label: 'Phase Coding' },
  { value: 'echo',   label: 'Echo Hiding' },
  { value: 'spread', label: 'Spread Spectrum' },
];

const ENCRYPTION_OPTIONS = [
  { value: 'aes-gcm',  label: 'AES-256-GCM' },
  { value: 'chacha20', label: 'ChaCha20-Poly1305' },
];

export function SettingsPage() {
  const { settings, setSettings, theme, setTheme } = useAppStore();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await tauriApi.setSettings(settings);
      toast.success('Settings saved');
    } catch (e: any) {
      toast.error('Failed to save settings', e?.message);
    } finally {
      setSaving(false);
    }
  };

  const pickOutputDir = async () => {
    const dir = await open({ directory: true, multiple: false });
    if (typeof dir === 'string') setSettings({ output_directory: dir });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure defaults, appearance, and output preferences</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 560 }}>

        <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>Appearance</h2>
          <div className="form-group">
            <Select
              label="Theme"
              value={theme}
              onValueChange={(v) => setTheme(v as 'dark' | 'light')}
              options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]}
            />
          </div>
          <Slider
            label="Font Size"
            value={settings.font_size}
            onChange={(v) => setSettings({ font_size: v })}
            min={11}
            max={20}
            step={1}
            formatValue={(v) => `${v}px`}
          />
        </div>


        <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>Encoding Defaults</h2>
          <Select
            label="Default Algorithm"
            value={settings.default_algorithm}
            onValueChange={(v) => setSettings({ default_algorithm: v })}
            options={ALGO_OPTIONS}
          />
          <Select
            label="Default Encryption"
            value={settings.default_encryption}
            onValueChange={(v) => setSettings({ default_encryption: v })}
            options={ENCRYPTION_OPTIONS}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <input
              type="checkbox"
              id="strip-exif-settings"
              checked={settings.strip_exif}
              onChange={(e) => setSettings({ strip_exif: e.target.checked })}
              style={{ accentColor: 'var(--accent-primary)', width: 16, height: 16 }}
            />
            <label htmlFor="strip-exif-settings" style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
              Strip EXIF by default
            </label>
          </div>
        </div>


        <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>Output</h2>
          <div className="form-group">
            <label className="form-label">Default Output Directory</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                className="input mono"
                readOnly
                value={settings.output_directory ?? 'Not set — will prompt each time'}
                title={settings.output_directory ?? undefined}
                style={{ flex: 1, color: settings.output_directory ? 'var(--text-primary)' : 'var(--text-muted)', minWidth: 0 }}
              />
              <Button variant="secondary" size="md" onClick={pickOutputDir}>Browse</Button>
              {settings.output_directory && (
                <Button variant="ghost" size="md" onClick={() => setSettings({ output_directory: null })}>Clear</Button>
              )}
            </div>
          </div>
        </div>


        <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>About</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-md)' }}>
            <strong style={{ color: 'var(--accent-primary)' }}>Z-Stego</strong> v0.1.0
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
            A steganography tool for hiding encrypted files inside images and audio. Licensed under the GNU General Public License v3.0.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            This program is free software: you can redistribute it and/or modify it under the terms of the GNU GPL as published by the Free Software Foundation.
          </p>
        </div>

        <Button variant="primary" size="lg" loading={saving} onClick={handleSave} style={{ alignSelf: 'flex-start' }}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
