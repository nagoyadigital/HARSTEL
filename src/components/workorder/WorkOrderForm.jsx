import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';
import { getShakenStatus, formatDaysRemaining } from '@/lib/shaken-utils';

export default function WorkOrderForm({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    customer_id: '', vehicle_id: '', mechanic_id: '',
    complaint: '', estimated_cost: '', estimated_duration: '',
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'], queryFn: () => base44.entities.Customer.list(),
  });
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'], queryFn: () => base44.entities.Vehicle.list(),
  });
  const { data: mechanics = [] } = useQuery({
    queryKey: ['mechanics'], queryFn: () => base44.entities.Mechanic.filter({ status: 'Aktif' }),
  });

  const customerVehicles = vehicles.filter(v => v.customer_id === form.customer_id);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const cust = customers.find(c => c.id === data.customer_id);
      const veh = vehicles.find(v => v.id === data.vehicle_id);
      const mech = mechanics.find(m => m.id === data.mechanic_id);
      const woNum = `WO-${Date.now().toString().slice(-8)}`;
      return base44.entities.WorkOrder.create({
        wo_number: woNum,
        customer_id: data.customer_id,
        customer_name: cust?.name || '',
        vehicle_id: data.vehicle_id,
        vehicle_info: veh ? `${veh.plate_number} - ${veh.brand} ${veh.model}` : '',
        mechanic_id: data.mechanic_id || undefined,
        mechanic_name: mech?.name || undefined,
        complaint: data.complaint,
        status: 'Menunggu',
        estimated_cost: data.estimated_cost ? Number(data.estimated_cost) : 0,
        estimated_duration: data.estimated_duration,
        items: [],
      });
    },
    onSuccess: () => { toast.success('Work Order berhasil dibuat'); onSuccess(); },
  });

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Buat Work Order Baru</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Pelanggan *</Label>
            <Select value={form.customer_id} onValueChange={(v) => { set('customer_id', v); set('vehicle_id', ''); }}>
              <SelectTrigger><SelectValue placeholder="Pilih pelanggan" /></SelectTrigger>
              <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Kendaraan *</Label>
            <Select value={form.vehicle_id} onValueChange={(v) => set('vehicle_id', v)} disabled={!form.customer_id}>
              <SelectTrigger><SelectValue placeholder={form.customer_id ? "Pilih kendaraan" : "Pilih pelanggan dulu"} /></SelectTrigger>
              <SelectContent>{customerVehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate_number} - {v.brand} {v.model}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {/* Shaken Warning Alert */}
          {(() => {
            if (!form.vehicle_id) return null;
            const veh = vehicles.find(v => v.id === form.vehicle_id);
            if (!veh?.shakeng_expiry) return null;
            const { daysRemaining, color, status } = getShakenStatus(veh.shakeng_expiry);
            if (daysRemaining === null || daysRemaining > 90) return null;
            const borderColor = color === 'red' ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5';
            const textColor = color === 'red' ? 'text-red-500' : 'text-amber-500';
            return (
              <div className={`rounded-lg border p-3 ${borderColor}`}>
                <div className="flex items-start gap-2">
                  <ShieldAlert className={`w-4 h-4 mt-0.5 flex-shrink-0 ${textColor}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${textColor}`}>
                      Shaken (車検) {status === 'Expired' ? 'Sudah Expired!' : 'Akan Habis!'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {veh.plate_number} — {formatDaysRemaining(daysRemaining)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sarankan pelanggan untuk melakukan perpanjangan Shaken bersamaan dengan servis ini.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
          <div>
            <Label>Mekanik</Label>
            <Select value={form.mechanic_id} onValueChange={(v) => set('mechanic_id', v)}>
              <SelectTrigger><SelectValue placeholder="Pilih mekanik (opsional)" /></SelectTrigger>
              <SelectContent>{mechanics.map(m => <SelectItem key={m.id} value={m.id}>{m.name} - {m.position}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Keluhan Pelanggan *</Label>
            <Textarea value={form.complaint} onChange={(e) => set('complaint', e.target.value)} placeholder="Deskripsi keluhan..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Estimasi Biaya</Label><Input type="number" value={form.estimated_cost} onChange={(e) => set('estimated_cost', e.target.value)} placeholder="¥" /></div>
            <div><Label>Estimasi Waktu</Label><Input value={form.estimated_duration} onChange={(e) => set('estimated_duration', e.target.value)} placeholder="2 jam" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => createMutation.mutate(form)} disabled={!form.customer_id || !form.vehicle_id || !form.complaint || createMutation.isPending}>
            Buat Work Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}