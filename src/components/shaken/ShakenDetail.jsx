import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Trash2, Edit, ShieldCheck } from 'lucide-react';
import ShakenStatusBadge from './ShakenStatusBadge';
import ShakenForm from './ShakenForm';
import { getShakenStatus, formatDaysRemaining } from '@/lib/shaken-utils';

export default function ShakenDetail({ record, open, onClose, onUpdate }) {
  const [showEdit, setShowEdit] = useState(false);
  const { daysRemaining, color } = getShakenStatus(record.shaken_expiry);

  // Get shaken history for this vehicle
  const { data: allShaken = [] } = useQuery({
    queryKey: ['shaken'],
    queryFn: () => base44.entities.Shaken.list('-shaken_date'),
  });
  const history = allShaken.filter(s => s.vehicle_id === record.vehicle_id && s.id !== record.id);

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Shaken.delete(record.id),
    onSuccess: () => { toast.success('Data Shaken dihapus'); onUpdate(); },
  });

  const InfoRow = ({ label, value, className = '' }) => (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${className}`}>{value || '-'}</span>
    </div>
  );

  if (showEdit) {
    return (
      <ShakenForm
        open={true}
        onClose={() => setShowEdit(false)}
        onSuccess={() => { setShowEdit(false); onUpdate(); }}
        editData={record}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Detail Shaken — {record.vehicle_plate}
            </DialogTitle>
            <ShakenStatusBadge expiryDate={record.shaken_expiry} showDays />
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="insurance">Asuransi</TabsTrigger>
            <TabsTrigger value="cost">Biaya</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="bg-muted/30 rounded-xl p-4 space-y-1">
              <InfoRow label="Kendaraan" value={`${record.vehicle_plate} — ${record.vehicle_info}`} />
              <InfoRow label="Pelanggan" value={record.customer_name} />
              <Separator className="my-2" />
              <InfoRow label="Shaken Terakhir" value={record.shaken_date ? format(new Date(record.shaken_date), 'dd MMMM yyyy') : '-'} />
              <InfoRow label="Kadaluarsa" value={record.shaken_expiry ? format(new Date(record.shaken_expiry), 'dd MMMM yyyy') : '-'} />
              <InfoRow
                label="Sisa Hari"
                value={formatDaysRemaining(daysRemaining)}
                className={color === 'red' ? 'text-red-500' : color === 'amber' ? 'text-amber-500' : 'text-emerald-500'}
              />
              <Separator className="my-2" />
              <InfoRow label="Pajak Tahunan (自動車税)" value={record.annual_tax ? `¥ ${record.annual_tax.toLocaleString('ja-JP')}` : '-'} />
              <InfoRow label="Jatuh Tempo Pajak" value={record.annual_tax_due_date ? format(new Date(record.annual_tax_due_date), 'dd MMM yyyy') : '-'} />
              <InfoRow label="Pajak Bobot (重量税)" value={record.weight_tax ? `¥ ${record.weight_tax.toLocaleString('ja-JP')}` : '-'} />
            </div>
            {record.notes && (
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Catatan:</p>
                <p className="text-sm">{record.notes}</p>
              </div>
            )}
            {/* Reminder status */}
            <div className="bg-muted/30 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2 font-semibold">Pengingat Aktif:</p>
              <div className="flex gap-3">
                {record.reminder_whatsapp && <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full">WhatsApp</span>}
                {record.reminder_email && <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full">Email</span>}
                {record.reminder_sms && <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-1 rounded-full">SMS</span>}
                {!record.reminder_whatsapp && !record.reminder_email && !record.reminder_sms && (
                  <span className="text-xs text-muted-foreground">Tidak ada reminder aktif</span>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Insurance Tab */}
          <TabsContent value="insurance" className="space-y-4 mt-4">
            <div className="bg-muted/30 rounded-xl p-4 space-y-1">
              <h4 className="text-sm font-semibold mb-2">自賠責保険 (Jibaiseki)</h4>
              <InfoRow label="Perusahaan" value={record.jibaiseki_company} />
              <InfoRow label="No. Polis" value={record.jibaiseki_number} />
              <InfoRow label="Kadaluarsa" value={record.jibaiseki_expiry ? format(new Date(record.jibaiseki_expiry), 'dd MMM yyyy') : '-'} />
              <InfoRow label="Premi" value={record.jibaiseki_premium ? `¥ ${record.jibaiseki_premium.toLocaleString('ja-JP')}` : '-'} />
            </div>
            <div className="bg-muted/30 rounded-xl p-4 space-y-1">
              <h4 className="text-sm font-semibold mb-2">任意保険 (Nini Hoken)</h4>
              <InfoRow label="Perusahaan" value={record.nini_hoken_company} />
              <InfoRow label="No. Polis" value={record.nini_hoken_number} />
              <InfoRow label="Kadaluarsa" value={record.nini_hoken_expiry ? format(new Date(record.nini_hoken_expiry), 'dd MMM yyyy') : '-'} />
              <InfoRow label="Premi" value={record.nini_hoken_premium ? `¥ ${record.nini_hoken_premium.toLocaleString('ja-JP')}` : '-'} />
            </div>
          </TabsContent>

          {/* Cost Tab */}
          <TabsContent value="cost" className="space-y-4 mt-4">
            <div className="bg-muted/30 rounded-xl p-4 space-y-1">
              <h4 className="text-sm font-semibold mb-2">Estimasi Biaya Shaken Berikutnya</h4>
              <InfoRow label="Pajak Bobot (重量税)" value={record.weight_tax ? `¥ ${record.weight_tax.toLocaleString('ja-JP')}` : '-'} />
              <InfoRow label="Jibaiseki (自賠責)" value={record.jibaiseki_premium ? `¥ ${record.jibaiseki_premium.toLocaleString('ja-JP')}` : '-'} />
              <InfoRow label="Biaya Inspeksi" value={record.inspection_fee ? `¥ ${record.inspection_fee.toLocaleString('ja-JP')}` : '-'} />
              <InfoRow label="Biaya Perawatan" value={record.maintenance_cost ? `¥ ${record.maintenance_cost.toLocaleString('ja-JP')}` : '-'} />
              <Separator className="my-2" />
              <InfoRow
                label="TOTAL ESTIMASI"
                value={record.total_estimated_cost ? `¥ ${record.total_estimated_cost.toLocaleString('ja-JP')}` : '-'}
                className="text-primary font-bold"
              />
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="text-sm font-semibold mb-3">Riwayat Shaken — {record.vehicle_plate}</h4>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat sebelumnya</p>
              ) : (
                <div className="space-y-2">
                  {history.map(h => (
                    <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                      <div>
                        <p className="text-sm font-medium">{h.shaken_date ? format(new Date(h.shaken_date), 'dd MMM yyyy') : '-'}</p>
                        <p className="text-xs text-muted-foreground">s/d {h.shaken_expiry ? format(new Date(h.shaken_expiry), 'dd MMM yyyy') : '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">¥ {(h.total_estimated_cost || 0).toLocaleString('ja-JP')}</p>
                        <ShakenStatusBadge expiryDate={h.shaken_expiry} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="gap-2" onClick={() => setShowEdit(true)}>
            <Edit className="w-4 h-4" /> Edit
          </Button>
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => {
              if (confirm('Hapus data Shaken ini?')) deleteMutation.mutate();
            }}
          >
            <Trash2 className="w-4 h-4" /> Hapus
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
