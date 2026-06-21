import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Trash2, Edit, MessageCircle, Mail, Smartphone, Loader2, CheckCircle, XCircle } from 'lucide-react';
import ShakenStatusBadge from './ShakenStatusBadge';
import ShakenForm from './ShakenForm';
import { getShakenStatus, formatDaysRemaining } from '@/lib/shaken-utils';
import { sendReminder, getTemplates, openWhatsApp, openEmail } from '@/lib/shaken-reminder-engine';
import { useAuth } from '@/lib/AuthContext';

export default function ShakenDetail({ record, open, onClose, onUpdate }) {
  const [showEdit, setShowEdit] = useState(false);
  const [sendingMethod, setSendingMethod] = useState(null);
  const { daysRemaining, color } = getShakenStatus(record.shaken_expiry);
  const { user } = useAuth();

  // Get shaken history for this vehicle
  const { data: allShaken = [] } = useQuery({
    queryKey: ['shaken'],
    queryFn: () => base44.entities.Shaken.list('-shaken_date'),
  });
  const history = allShaken.filter(s => s.vehicle_id === record.vehicle_id && s.id !== record.id);

  // Get reminder history for this vehicle
  const { data: reminderHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ['reminderHistory', record.vehicle_id],
    queryFn: async () => {
      try {
        const all = await base44.entities.ReminderHistory.list('-sent_at', 200);
        return all.filter(r => r.vehicle_id === record.vehicle_id);
      } catch { return []; }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Shaken.delete(record.id),
    onSuccess: () => { toast.success('Data Shaken dihapus'); onUpdate(); },
  });

  // Manual send handler
  const handleManualSend = async (method) => {
    setSendingMethod(method);
    try {
      const vehicle = {
        id: record.vehicle_id,
        plate_number: record.vehicle_plate,
        brand: record.vehicle_info?.split(' ')[0] || '',
        model: record.vehicle_info?.split(' ').slice(1).join(' ') || '',
        customer_name: record.customer_name,
        customer_id: record.customer_id,
        shakeng_expiry: record.shaken_expiry,
      };

      const templates = getTemplates();

      if (method === 'whatsapp') {
        // Open WhatsApp directly with pre-filled message
        const { message } = await sendReminder({
          vehicle,
          customer: { name: record.customer_name, id: record.customer_id },
          method: 'whatsapp',
          template: templates.whatsapp,
          sentBy: user?.name || 'Admin',
        });
        openWhatsApp('', message);
        toast.success('WhatsApp dibuka dengan pesan reminder');
      } else if (method === 'email') {
        const { message } = await sendReminder({
          vehicle,
          customer: { name: record.customer_name, id: record.customer_id },
          method: 'email',
          template: templates.email,
          sentBy: user?.name || 'Admin',
        });
        openEmail('', `Reminder Shaken - ${record.vehicle_plate}`, message);
        toast.success('Email client dibuka dengan pesan reminder');
      } else if (method === 'sms') {
        await sendReminder({
          vehicle,
          customer: { name: record.customer_name, id: record.customer_id },
          method: 'sms',
          template: templates.sms,
          sentBy: user?.name || 'Admin',
        });
        toast.success('SMS reminder berhasil dikirim');
      }
      refetchHistory();
    } catch (err) {
      toast.error('Gagal mengirim reminder');
    } finally {
      setSendingMethod(null);
    }
  };

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
            <DialogTitle className="flex items-center gap-2 text-base">
              Detail Shaken — {record.vehicle_plate}
            </DialogTitle>
            <ShakenStatusBadge expiryDate={record.shaken_expiry} showDays />
          </div>
        </DialogHeader>

        {/* Manual Send Actions */}
        <div className="bg-muted/30 rounded-xl p-4 mt-2">
          <p className="text-xs text-muted-foreground font-semibold mb-2.5">Kirim Reminder Manual:</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
              onClick={() => handleManualSend('whatsapp')}
              disabled={!!sendingMethod}
            >
              {sendingMethod === 'whatsapp' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
              WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
              onClick={() => handleManualSend('email')}
              disabled={!!sendingMethod}
            >
              {sendingMethod === 'email' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              Email
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-purple-600 border-purple-500/30 hover:bg-purple-500/10"
              onClick={() => handleManualSend('sms')}
              disabled={!!sendingMethod}
            >
              {sendingMethod === 'sms' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
              SMS
            </Button>
          </div>
        </div>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="insurance">Asuransi</TabsTrigger>
            <TabsTrigger value="cost">Biaya</TabsTrigger>
            <TabsTrigger value="reminders">Reminder</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="bg-muted/30 rounded-xl p-4 space-y-1">
              <InfoRow label="Kendaraan" value={`${record.vehicle_plate} — ${record.vehicle_info}`} />
              <InfoRow label="Pelanggan" value={record.customer_name} />
              <Separator className="my-2" />
              <InfoRow label="Shaken Terakhir" value={record.shaken_date ? format(new Date(record.shaken_date), 'yyyy/MM/dd') : '-'} />
              <InfoRow label="Kadaluarsa" value={record.shaken_expiry ? format(new Date(record.shaken_expiry), 'yyyy/MM/dd') : '-'} />
              <InfoRow
                label="Sisa Hari"
                value={formatDaysRemaining(daysRemaining)}
                className={color === 'red' ? 'text-red-500' : color === 'amber' ? 'text-amber-500' : 'text-emerald-500'}
              />
              <Separator className="my-2" />
              <InfoRow label="Pajak Tahunan (自動車税)" value={record.annual_tax ? `¥ ${record.annual_tax.toLocaleString('ja-JP')}` : '-'} />
              <InfoRow label="Jatuh Tempo Pajak" value={record.annual_tax_due_date ? format(new Date(record.annual_tax_due_date), 'yyyy/MM/dd') : '-'} />
              <InfoRow label="Pajak Bobot (重量税)" value={record.weight_tax ? `¥ ${record.weight_tax.toLocaleString('ja-JP')}` : '-'} />
            </div>
            {record.notes && (
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Catatan:</p>
                <p className="text-sm">{record.notes}</p>
              </div>
            )}
          </TabsContent>

          {/* Insurance Tab */}
          <TabsContent value="insurance" className="space-y-4 mt-4">
            <div className="bg-muted/30 rounded-xl p-4 space-y-1">
              <h4 className="text-sm font-semibold mb-2">自賠責保険 (Jibaiseki)</h4>
              <InfoRow label="Perusahaan" value={record.jibaiseki_company} />
              <InfoRow label="No. Polis" value={record.jibaiseki_number} />
              <InfoRow label="Kadaluarsa" value={record.jibaiseki_expiry ? format(new Date(record.jibaiseki_expiry), 'yyyy/MM/dd') : '-'} />
              <InfoRow label="Premi" value={record.jibaiseki_premium ? `¥ ${record.jibaiseki_premium.toLocaleString('ja-JP')}` : '-'} />
            </div>
            <div className="bg-muted/30 rounded-xl p-4 space-y-1">
              <h4 className="text-sm font-semibold mb-2">任意保険 (Nini Hoken)</h4>
              <InfoRow label="Perusahaan" value={record.nini_hoken_company} />
              <InfoRow label="No. Polis" value={record.nini_hoken_number} />
              <InfoRow label="Kadaluarsa" value={record.nini_hoken_expiry ? format(new Date(record.nini_hoken_expiry), 'yyyy/MM/dd') : '-'} />
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

          {/* Reminders Tab - Sending History */}
          <TabsContent value="reminders" className="space-y-4 mt-4">
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Riwayat Pengiriman Reminder</h4>
                <span className="text-xs text-muted-foreground">{reminderHistory.length} total</span>
              </div>
              {reminderHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Belum ada reminder yang terkirim</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {reminderHistory.map(h => (
                    <div key={h.id} className="p-3 rounded-lg bg-background border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {h.method === 'whatsapp' && <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />}
                          {h.method === 'email' && <Mail className="w-3.5 h-3.5 text-blue-500" />}
                          {h.method === 'sms' && <Smartphone className="w-3.5 h-3.5 text-purple-500" />}
                          <span className="text-xs font-semibold capitalize">{h.method}</span>
                          <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                            {h.trigger === 'auto' ? 'Otomatis' : 'Manual'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {h.status === 'sent' ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                          )}
                          <span className={`text-xs font-medium ${h.status === 'sent' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {h.status === 'sent' ? 'Terkirim' : 'Gagal'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{h.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground">Oleh: {h.sent_by}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {h.sent_at ? format(new Date(h.sent_at), 'dd MMM yyyy HH:mm') : '-'}
                        </span>
                      </div>
                      {h.schedule_day && (
                        <span className="text-[10px] text-muted-foreground">Jadwal: H-{h.schedule_day}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reminder Settings Summary */}
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="text-xs text-muted-foreground font-semibold mb-2">Pengaturan Reminder Aktif:</h4>
              <div className="flex flex-wrap gap-2 mb-2">
                {record.reminder_whatsapp && <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full">WhatsApp</span>}
                {record.reminder_email && <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full">Email</span>}
                {record.reminder_sms && <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-1 rounded-full">SMS</span>}
                {!record.reminder_whatsapp && !record.reminder_email && !record.reminder_sms && (
                  <span className="text-xs text-muted-foreground">Tidak ada metode aktif</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(record.reminder_days || [90, 60, 30]).map(d => (
                  <span key={d} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">H-{d}</span>
                ))}
              </div>
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
                        <p className="text-sm font-medium">{h.shaken_date ? format(new Date(h.shaken_date), 'yyyy/MM/dd') : '-'}</p>
                        <p className="text-xs text-muted-foreground">s/d {h.shaken_expiry ? format(new Date(h.shaken_expiry), 'yyyy/MM/dd') : '-'}</p>
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
