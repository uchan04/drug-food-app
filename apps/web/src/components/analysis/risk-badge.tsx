interface RiskBadgeProps {
  level: 'caution' | 'warning' | 'contraindicated';
}

const RISK_CONFIG = {
  caution: { label: 'CAUTION', className: 'risk-caution' },
  warning: { label: 'WARNING', className: 'risk-warning' },
  contraindicated: { label: 'CRITICAL', className: 'risk-contraindicated' },
} as const;

export function RiskBadge({ level }: RiskBadgeProps) {
  const config = RISK_CONFIG[level];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold tracking-wider rounded-full border ${config.className}`}
      data-testid={`risk-badge-${level}`}
      role="status"
    >
      {config.label}
    </span>
  );
}
