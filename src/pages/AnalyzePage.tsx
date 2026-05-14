import { useState, useRef, useCallback } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { tauriApi, type CarrierInfo, type ChannelData } from '../lib/tauri';
import { HistogramChart } from '../components/visualize/HistogramChart';
import { ChannelInspector } from '../components/visualize/ChannelInspector';
import { BitViewer } from '../components/visualize/BitViewer';
import { Badge } from '../components/ui/Badge';
import { toast } from '../components/ui/Toast';
import { basename, formatBytes, isImageExt, extname } from '../lib/utils';
import { useTauriDrop, pickCarrier } from '../lib/fileDrop';

export function AnalyzePage() {
  const [carrierPath, setCarrierPath] = useState<string | null>(null);
  const [info, setInfo] = useState<CarrierInfo | null>(null);
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handlePaths = useCallback(async (paths: string[]) => {
    const path = paths[0];
    if (!path) return;
    setCarrierPath(path);
    setLoading(true);
    setInfo(null);
    setChannelData(null);
    try {
      const [infoRes, chanRes] = await Promise.all([
        tauriApi.analyzeCarrier(path),
        isImageExt(extname(path)) ? tauriApi.getChannelData(path) : Promise.resolve(null),
      ]);
      setInfo(infoRes);
      setChannelData(chanRes);
    } catch (e: any) {
      toast.error('Analysis failed', e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const { isOver } = useTauriDrop(dropRef, handlePaths);

  const handleClick = async () => {
    const path = await pickCarrier();
    if (path) await handlePaths([path]);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Analyze</h1>
        <p className="page-subtitle">Inspect carrier files, visualize channels, histograms, and bit patterns</p>
      </div>

      <div className="card" style={{ padding: 'var(--space-4)' }}>
        <div
          ref={dropRef}
          className={`dropzone dropzone-sm ${isOver ? 'dropzone-active' : ''} ${carrierPath && !loading ? 'dropzone-filled' : ''}`}
          onClick={handleClick}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
          role="button"
          tabIndex={0}
          aria-label={carrierPath ? `Analyzing: ${basename(carrierPath)}. Click to load a different file` : 'Click or drop a carrier file to analyze'}
          style={{ cursor: 'pointer' }}
        >
          <div className="dropzone-empty">
            {loading ? (
              <>
                <span className="btn-spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(124,92,252,0.3)', borderTopColor: 'var(--accent-primary)' }} />
                <span className="dropzone-hint">Analyzing…</span>
              </>
            ) : carrierPath ? (
              <>
                <span
                  className="dropzone-hint"
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
                  title={carrierPath}
                >
                  {basename(carrierPath)}
                </span>
                <span className="dropzone-sub">Click or drop to replace</span>
              </>
            ) : (
              <>
                <span className="dropzone-hint">{isOver ? 'Drop here' : 'Drop any carrier to analyze'}</span>
                <span className="dropzone-sub">PNG, BMP, JPEG, WAV, FLAC, MP3</span>
              </>
            )}
            {info && !loading && (
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Badge variant="accent">{info.format.toUpperCase()}</Badge>
                {info.width && <Badge variant="default">{info.width}×{info.height}</Badge>}
                {info.sample_rate && <Badge variant="default">{(info.sample_rate / 1000).toFixed(1)} kHz</Badge>}
                <Badge variant="success">Cap: {formatBytes(info.capacity_1bit)}</Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {info && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <p className="form-label" style={{ marginBottom: 'var(--space-3)' }}>Capacity by LSB depth</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                {[
                  { label: '1 bit', value: info.capacity_1bit },
                  { label: '2 bits', value: info.capacity_2bit },
                  { label: '4 bits', value: info.capacity_4bit },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', textAlign: 'center' }}>
                    <div className="mono" style={{ fontSize: 'var(--font-size-xl)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                      {formatBytes(value)}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {channelData && (
              <RadixTabs.Root defaultValue="histogram" className="card" style={{ padding: 'var(--space-4)' }}>
                <RadixTabs.List style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', padding: 3, borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', border: '1px solid var(--border-subtle)' }}>
                  {['Histogram', 'Channels', 'Bit Viewer'].map((tab) => (
                    <RadixTabs.Trigger
                      key={tab}
                      value={tab.toLowerCase().replace(' ', '-')}
                      style={{ flex: 1, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13, background: 'transparent', color: 'var(--text-secondary)', transition: 'all var(--duration-fast)' }}
                    >
                      {tab}
                    </RadixTabs.Trigger>
                  ))}
                </RadixTabs.List>

                <RadixTabs.Content value="histogram">
                  <HistogramChart histograms={channelData.histograms} />
                </RadixTabs.Content>
                <RadixTabs.Content value="channels">
                  <ChannelInspector data={channelData} />
                </RadixTabs.Content>
                <RadixTabs.Content value="bit-viewer">
                  <BitViewer data={channelData} />
                </RadixTabs.Content>
              </RadixTabs.Root>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
