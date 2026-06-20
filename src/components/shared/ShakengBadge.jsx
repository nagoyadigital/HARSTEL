import React from 'react';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

const shakengConfig = {
  'Valid': { icon: ShieldCheck, bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Valid' },
  'Segera Habis': { icon: ShieldAlert, bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Segera Habis' },
  'Habis': { icon: ShieldX, bg: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Habis' },
};

export default function ShakengBadge({ status, expiry, date }) {
  const config = shakengConfig[status] || { icon: ShieldCheck, bg: 'bg-muted text-muted-foreground border-border', label: status || '-' };
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", config.bg)}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </div>
  );
}