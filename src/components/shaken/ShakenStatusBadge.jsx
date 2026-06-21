import React from 'react';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion } from 'lucide-react';
import { getShakenStatus } from '@/lib/shaken-utils';

const config = {
  green: { icon: ShieldCheck, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Aktif' },
  amber: { icon: ShieldAlert, className: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Akan Habis' },
  red: { icon: ShieldX, className: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Expired' },
  gray: { icon: ShieldQuestion, className: 'bg-muted text-muted-foreground border-border', label: 'N/A' },
};

export default function ShakenStatusBadge({ expiryDate, showDays = false }) {
  const { status, daysRemaining, color } = getShakenStatus(expiryDate);
  const c = config[color] || config.gray;
  const Icon = c.icon;

  // For "Akan Habis" show correct label based on status
  const label = status === 'Expired' ? 'Expired' : status === 'Akan Habis' ? 'Akan Habis' : c.label;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
      c.className
    )}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      {showDays && daysRemaining !== null && (
        <span className="opacity-70">({daysRemaining}d)</span>
      )}
    </div>
  );
}
