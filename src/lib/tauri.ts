import { invoke } from '@tauri-apps/api/core';
import { openPath, openUrl } from '@tauri-apps/plugin-opener';

export interface EncodeOptions {
  carrier_path: string;
  payload_path: string;
  output_path: string;
  algorithm: 'lsb' | 'dct' | 'phase' | 'echo' | 'spread';
  encryption: 'aes-gcm' | 'chacha20';
  password: string;
  lsb_bits: number;
  shuffle_seed: number | null;
  strip_exif: boolean;
}

export interface EncodeResult {
  output_path: string;
  payload_bytes: number;
  capacity_bytes: number;
  capacity_used_pct: number;
}

export interface DecodeOptions {
  carrier_path: string;
  output_path: string;
  password: string;
  shuffle_seed: number | null;
}

export interface DecodeResult {
  output_path: string;
  original_size: number;
  algorithm: string;
  encryption: string;
}

export interface CarrierInfo {
  format: string;
  width: number | null;
  height: number | null;
  sample_count: number | null;
  sample_rate: number | null;
  capacity_1bit: number;
  capacity_2bit: number;
  capacity_4bit: number;
  thumbnail: string | null;
}

export interface HeaderPeek {
  algo: string;
  encryption: string;
  lsb_bits: number;
  payload_size: number;
}

export interface FilePreview {
  kind: 'image' | 'text' | 'hex';
  data: string;
}

export interface ChannelData {
  width: number;
  height: number;
  r: number[];
  g: number[];
  b: number[];
  a: number[];
  r_lsb: number[];
  g_lsb: number[];
  b_lsb: number[];
  histograms: number[][];
}

export interface DiffData {
  width: number;
  height: number;
  diff_10x: string;
  diff_50x: string;
  diff_100x: string;
}

export interface AppSettings {
  default_algorithm: string;
  default_encryption: string;
  output_directory: string | null;
  strip_exif: boolean;
  theme: string;
  font_size: number;
}

export const tauriApi = {
  encodeFile: (opts: EncodeOptions) =>
    invoke<EncodeResult>('encode_file', { opts }),

  writeTempText: (content: string) =>
    invoke<string>('write_temp_text', { content }),

  decodeFile: (opts: DecodeOptions) =>
    invoke<DecodeResult>('decode_file', { opts }),

  analyzeCarrier: (path: string) =>
    invoke<CarrierInfo>('analyze_carrier', { path }),

  peekHeader: (path: string) =>
    invoke<HeaderPeek>('peek_header', { path }),

  readPreview: (path: string) =>
    invoke<FilePreview>('read_preview', { path }),

  getChannelData: (path: string) =>
    invoke<ChannelData>('get_channel_data', { path }),

  getDiffData: (originalPath: string, stegoPath: string) =>
    invoke<DiffData>('get_diff_data', { originalPath, stegoPath }),

  getSettings: () =>
    invoke<AppSettings>('get_settings'),

  setSettings: (settings: AppSettings) =>
    invoke<void>('set_settings', { settings }),

  openPath: (path: string) => openPath(path),
  openUrl:  (url: string)  => openUrl(url),
};
