import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface HistogramChartProps {
  histograms: number[][];
}

export function HistogramChart({ histograms }: HistogramChartProps) {
  const [r, g, b] = histograms;
  const data = Array.from({ length: 256 }, (_, i) => ({
    v: i,
    R: r[i],
    G: g[i],
    B: b[i],
  }));

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff4d6d" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3bdb8e" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#3bdb8e" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c5cfc" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#7c5cfc" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis dataKey="v" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)' }}
            labelStyle={{ color: 'var(--text-secondary)' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
          <Area type="monotone" dataKey="R" stroke="#ff4d6d" fill="url(#gR)" strokeWidth={1.5} dot={false} />
          <Area type="monotone" dataKey="G" stroke="#3bdb8e" fill="url(#gG)" strokeWidth={1.5} dot={false} />
          <Area type="monotone" dataKey="B" stroke="#7c5cfc" fill="url(#gB)" strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
