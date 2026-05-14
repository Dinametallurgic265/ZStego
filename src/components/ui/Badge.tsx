type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'accent';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const colors: Record<BadgeVariant, string> = {
  default: 'var(--text-secondary)',
  success: 'var(--accent-success)',
  danger:  'var(--accent-danger)',
  warning: 'var(--accent-warning)',
  accent:  'var(--accent-primary)',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`badge ${className}`}
      style={{ '--badge-color': colors[variant] } as React.CSSProperties}
    >
      {children}
    </span>
  );
}
