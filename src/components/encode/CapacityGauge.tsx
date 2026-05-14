import { motion } from 'framer-motion';
import { useSessionStore } from '../../store/session';
import { formatBytes } from '../../lib/utils';

interface CapacityGaugeProps {
  lsbBits: number;
}

export function CapacityGauge({ lsbBits }: CapacityGaugeProps) {
  const { carrierInfo, payloadSize } = useSessionStore();
  if (!carrierInfo) return null;

  const capacity = lsbBits === 1
    ? carrierInfo.capacity_1bit
    : lsbBits === 2
    ? carrierInfo.capacity_2bit
    : carrierInfo.capacity_4bit;

  const used = payloadSize ?? 0;
  const pct = capacity > 0 ? Math.min(100, (used / capacity) * 100) : 0;
  const overCapacity = used > capacity;

  const color = overCapacity
    ? 'var(--accent-danger)'
    : pct > 80
    ? 'var(--accent-warning)'
    : 'var(--accent-success)';

  return (
    <div className="capacity-gauge">
      <div className="capacity-header">
        <span className="form-label" style={{ marginBottom: 0 }}>Capacity</span>
        <span className="mono" style={{ fontSize: 'var(--font-size-sm)', color }}>
          {formatBytes(used)} / {formatBytes(capacity)}
        </span>
      </div>

      <div className="capacity-bar-bg">
        <motion.div
          className="capacity-bar-fill"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className="capacity-labels">
        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
          {overCapacity ? '⚠ Payload too large for carrier' : `${(100 - pct).toFixed(1)}% free at ${lsbBits} LSB bit${lsbBits > 1 ? 's' : ''}`}
        </span>
        <span className="mono" style={{ color, fontSize: 'var(--font-size-xs)' }}>
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
