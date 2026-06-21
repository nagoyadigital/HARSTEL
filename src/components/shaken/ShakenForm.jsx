import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { estimateShakenCost } from '@/lib/shaken-utils';

export default function ShakenForm({ open, onClose, onSuccess, editData }) {
  const isEdit = !!editData;

  const [form, setForm] = useState({
    vehicle_id: editData?.vehicle_id || '',
    shaken_date: editData?.shaken_date || '',
    shaken_expiry: editData?.shaken_expiry || '',
    jibaiseki_company: editData?.jibaiseki_company || '',
    jibaiseki_number: editData?.jibaiseki_number || '',
    jibaiseki_expiry: editData?.jibaiseki_expiry || '',
    jibaiseki_premium: editData?.jibaiseki_premium || '',
    nini_hoken_company: editData?.nini_hoken_company || '',
    nini_hoken_number: editData?.nini_hoken_number || '',
    nini_hoken_expiry: editData?.nini_hoken_expiry || '',
    nini_hoken_premium: editData?.nini_hoken_premium || '',
    annual_tax: editData?.annual_tax || '',
    annual_tax_due_date: editData?.annual_tax_due_date || '',
    weight_tax: editData?.weight_tax || '',
    notes: editData?.notes || '',
    reminder_whatsapp: editData?.reminder_whatsapp || false,
    reminder_email: editData?.reminder_email || false,
    reminder_sms: editData?.reminder_sms || false,
    reminder_days: editData?.reminder_days || [90, 60, 30],
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const selectedVehicle = vehicles.find(v => v.id === form.vehicle_id);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const vehicle = vehicles.find(v => v.id === data.vehicle_id);
      const age = vehicle?.year ? new Date().getFullYear() - vehicle.year : 5;
      const costs = estimateShakenCost({
        vehicleWeight: vehicle?.weight || 1500,
        vehicleAge: age,
        fuelType: vehicle?.fuel_type,
      });

      const payload = {
        ...data,
        vehicle_plate: vehicle?.plate_number || '',
        vehicle_info: vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year || ''}` : '',
        customer_id: vehicle?.customer_id || '',
        customer_name: vehicle?.customer_name || '',
        total_estimated_cost: costs.total,
        inspection_fee: costs.inspectionFee,
        maintenance_cost: costs.maintenanceCost,
        jibaiseki_premium: Number(data.jibaiseki_premium) || costs.jibaiseki,
        nini_hoken_premium: Number(data.nini_hoken_premium) || 0,
        annual_tax: Number(data.annual_tax) || 0,
        weight_tax: Number(data.weight_tax) || costs.weightTax,
      };

      if (isEdit) {
        return base44.entities.Shaken.update(editData.id, payload);
      }
      return base44.entities.Shaken.create(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Data Shaken diperbarui' : 'Data Shaken berhasil ditambahkan');
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || 'Gagal menyimpan data');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.vehicle_id || !form.shaken_date || !form.shaken_expiry) {
      toast.error('Kendaraan, tanggal Shaken, dan tanggal kadaluarsa wajib diisi');
      return;
    }
    createMutation.mutate(form);
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Data Shaken' : 'Tambah Data Shaken (車検)'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Selection */}
          <div className="space-y-2">
            <Label>Kendaraan *</Label>
            <Select value={form.vehicle_id} onValueChange={(v) => updateField('vehicle_id', v)}>
              <SelectTrigger><SelectValue placeholder="Pilih kendaraan" /></SelectTrigger>
              <SelectContent>
                {vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.plate_number} — {v.brand} {v.model} ({v.customer_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shaken Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Shaken Terakhir *</Label>
              <Input type="date" value={form.shaken_date} onChange={e => updateField('shaken_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Kadaluarsa Shaken *</Label>
              <Input type="date" value={form.shaken_expiry} onChange={e => updateField('shaken_expiry', e.target.value)} />
            </div>
          </div>

          <Separator />

          {/* Jibaiseki (自賠責保険) */}
          <div>
            <h4 className="text-sm font-semibold mb-3">自賠責保険 (Jibaiseki — Asuransi Wajib)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Perusahaan</Label>
                <Input value={form.jibaiseki_company} onChange={e => updateField('jibaiseki_company', e.target.value)} placeholder="Nama perusahaan asuransi" />
              </div>
              <div className="space-y-2">
                <Label>No. Polis</Label>
                <Input value={form.jibaiseki_number} onChange={e => updateField('jibaiseki_number', e.target.value)} placeholder="Nomor polis" />
              </div>
              <div className="space-y-2">
                <Label>Kadaluarsa</Label>
                <Input type="date" value={form.jibaiseki_expiry} onChange={e => updateField('jibaiseki_expiry', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Premi (¥)</Label>
                <Input type="number" value={form.jibaiseki_premium} onChange={e => updateField('jibaiseki_premium', e.target.value)} placeholder="20010" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Nini Hoken (任意保険) */}
          <div>
            <h4 className="text-sm font-semibold mb-3">任意保険 (Nini Hoken — Asuransi Sukarela)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Perusahaan</Label>
                <Input value={form.nini_hoken_company} onChange={e => updateField('nini_hoken_company', e.target.value)} placeholder="Nama perusahaan asuransi" />
              </div>
              <div className="space-y-2">
                <Label>No. Polis</Label>
                <Input value={form.nini_hoken_number} onChange={e => updateField('nini_hoken_number', e.target.value)} placeholder="Nomor polis" />
              </div>
              <div className="space-y-2">
                <Label>Kadaluarsa</Label>
                <Input type="date" value={form.nini_hoken_expiry} onChange={e => updateField('nini_hoken_expiry', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Premi (¥)</Label>
                <Input type="number" value={form.nini_hoken_premium} onChange={e => updateField('nini_hoken_premium', e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Tax Info */}
          <div>
            <h4 className="text-sm font-semibold mb-3">自動車税 (Pajak Kendaraan)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Pajak Tahunan (¥)</Label>
                <Input type="number" value={form.annual_tax} onChange={e => updateField('annual_tax', e.target.value)} placeholder="39500" />
              </div>
              <div className="space-y-2">
                <Label>Jatuh Tempo</Label>
                <Input type="date" value={form.annual_tax_due_date} onChange={e => updateField('annual_tax_due_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Pajak Bobot / 重量税 (¥)</Label>
                <Input type="number" value={form.weight_tax} onChange={e => updateField('weight_tax', e.target.value)} placeholder="24600" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Reminders */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Pengingat Otomatis</h4>
            <div className="flex flex-wrap gap-6 mb-4">
              <div className="flex items-center gap-2">
                <Checkbox id="rem-wa" checked={form.reminder_whatsapp} onCheckedChange={v => updateField('reminder_whatsapp', v)} />
                <Label htmlFor="rem-wa" className="cursor-pointer">WhatsApp</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="rem-email" checked={form.reminder_email} onCheckedChange={v => updateField('reminder_email', v)} />
                <Label htmlFor="rem-email" className="cursor-pointer">Email</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="rem-sms" checked={form.reminder_sms} onCheckedChange={v => updateField('reminder_sms', v)} />
                <Label htmlFor="rem-sms" className="cursor-pointer">SMS</Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Jadwal pengingat (centang yang aktif):</p>
            <div className="flex flex-wrap gap-3">
              {[90, 60, 30, 14, 7, 1].map(day => (
                <div key={day} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`day-${day}`}
                    checked={form.reminder_days.includes(day)}
                    onCheckedChange={(checked) => {
                      const days = checked
                        ? [...form.reminder_days, day].sort((a, b) => b - a)
                        : form.reminder_days.filter(d => d !== day);
                      updateField('reminder_days', days);
                    }}
                  />
                  <Label htmlFor={`day-${day}`} className="text-xs cursor-pointer">H-{day}</Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} placeholder="Catatan tambahan..." rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Simpan Perubahan' : 'Tambah Data Shaken'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
