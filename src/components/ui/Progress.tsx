import * as RadixProgress from '@radix-ui/react-progress';

interface ProgressProps {
  value: number;
  label?: string;
  color?: string;
  animated?: boolean;
}

export function Progress({ value, label, color, animated = true }: ProgressProps) {
  return (
    <div className="progress-wrapper">
      {label && (
        <div className="progress-header">
          <span className="progress-label">{label}</span>
          <span className="progress-pct mono">{value.toFixed(0)}%</span>
        </div>
      )}
      <RadixProgress.Root className="progress-root" value={value}>
        <RadixProgress.Indicator
          className={`progress-indicator ${animated && value > 0 && value < 100 ? 'progress-animated' : ''}`}
          style={{
            width: `${value}%`,
            ...(color ? { backgroundColor: color } : {}),
          }}
        />
      </RadixProgress.Root>
    </div>
  );
}
