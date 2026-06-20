import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/shared/StatusBadge';

const inspectionGroups = [
  {
    title: 'Mesin',
    items: [
      { key: 'engine_oil', label: 'Oli Mesin' },
      { key: 'oil_filter', label: 'Filter Oli' },
      { key: 'radiator', label: 'Radiator' },
      { key: 'fan_belt', label: 'Fan Belt' },
      { key: 'battery', label: 'Aki' },
      { key: 'alternator', label: 'Alternator' },
    ],
  },
  {
    title: 'Kaki-Kaki',
    items: [
      { key: 'shockbreaker', label: 'Shockbreaker' },
      { key: 'ball_joint', label: 'Ball Joint' },
      { key: 'tie_rod', label: 'Tie Rod' },
      { key: 'bearing', label: 'Bearing' },
    ],
  },
  {
    title: 'Rem',
    items: [
      { key: 'brake_pad', label: 'Kampas Rem' },
      { key: 'disc_brake', label: 'Disc Brake' },
      { key: 'brake_fluid', label: 'Minyak Rem' },
    ],
  },
  {
    title: 'Ban',
    items: [
      { key: 'tire_depth', label: 'Ketebalan Ban' },
      { key: 'tire_pressure', label: 'Tekanan Ban' },
    ],
  },
];

const OPTIONS = ['Baik', 'Perlu Perhatian', 'Harus Diganti'];

export default function InspectionForm({ inspection, onChange }) {
  const set = (key, value) => onChange({ ...inspection, [key]: value });

  return (
    <div className="space-y-6">
      {inspectionGroups.map(group => (
        <div key={group.title}>
          <h4 className="text-sm font-semibold mb-3 text-foreground">{group.title}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.items.map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label className="text-sm">{item.label}</Label>
                <div className="flex items-center gap-2">
                  {inspection[item.key] && <StatusBadge status={inspection[item.key]} />}
                  <Select value={inspection[item.key] || ''} onValueChange={(v) => set(item.key, v)}>
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}