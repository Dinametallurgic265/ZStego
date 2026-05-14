export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatPct(pct: number): string {
  return `${pct.toFixed(1)}%`;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function basename(path: string): string {
  return path.replace(/.*[\\/]/, '');
}

export function extname(path: string): string {
  const m = path.match(/\.([^.]+)$/);
  return m ? m[1].toLowerCase() : '';
}

export function isImageExt(ext: string): boolean {
  return ['png', 'bmp', 'jpg', 'jpeg'].includes(ext);
}

export function isAudioExt(ext: string): boolean {
  return ['wav', 'flac', 'mp3'].includes(ext);
}

export function capacityForBits(carrierBytes: number, lsbBits: number): number {
  return Math.floor((carrierBytes * lsbBits) / 8);
}

export function nowTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
