import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/shared/StatusBadge';
import InspectionForm from './InspectionForm';
import { Trash2, Wrench, Package, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getShakenStatus, formatDaysRemaining } from '@/lib/shaken-utils';

const STATUSES = ['Menunggu', 'Inspeksi', 'Estimasi', 'Menunggu Approval', 'Sedang Dikerjakan', 'Menunggu Sparepart', 'Quality Check', 'Selesai', 'Menunggu Pembayaran', 'Sudah Diambil'];

export default function WorkOrderDetail({ workOrder, open, onClose, onUpdate }) {
  const [status, setStatus] = useState(workOrder.status);
  const [notes, setNotes] = useState(workOrder.technician_notes || '');
  const [items, setItems] = useState(workOrder.items || []);
  const [diagnosis, setDiagnosis] = useState(workOrder.diagnosis || '');
  const [inspection, setInspection] = useState(workOrder.inspection || {});

  // Fetch vehicle to check shaken status
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });
  const vehicle = vehicles.find(v => v.id === workOrder.vehicle_id);
  const shakenInfo = vehicle?.shakeng_expiry ? getShakenStatus(vehicle.shakeng_expiry) : null;
  const showShakenWarning = shakenInfo && shakenInfo.daysRemaining !== null && shakenInfo.daysRemaining <= 90;

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkOrder.update(workOrder.id, data),
    onSuccess: () => { toast.success('Work Order diperbarui'); onUpdate(); },
  });

  const addItem = (type) => {
    setItems([...items, { type, name: '', qty: 1, price: 0, total: 0 }]);
  };

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'qty' || field === 'price') {
      updated[idx].total = (updated[idx].qty || 0) * (updated[idx].price || 0);
    }
    setItems(updated);
  };

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const serviceCost = items.filter(i => i.type === 'service').reduce((s, i) => s + (i.total || 0), 0);
  const partsCost = items.filter(i => i.type === 'sparepart').reduce((s, i) => s + (i.total || 0), 0);
  const subtotal = serviceCost + partsCost;
  const tax = Math.round(subtotal * 0.1);
  const totalCost = subtotal + tax;

  const handleSave = () => {
    updateMutation.mutate({
      status,
      diagnosis,
      technician_notes: notes,
      items,
      inspection,
      service_cost: serviceCost,
      parts_cost: partsCost,
      tax,
      total_cost: totalCost,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <span className="font-mono">{workOrder.wo_number || `WO-${workOrder.id?.slice(-6)}`}</span>
              <StatusBadge status={status} />
            </DialogTitle>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
            <span>Pelanggan: <strong className="text-foreground">{workOrder.customer_name}</strong></span>
            <span>Kendaraan: <strong className="text-foreground">{workOrder.vehicle_info}</strong></span>
            {workOrder.mechanic_name && <span>Mekanik: <strong className="text-foreground">{workOrder.mechanic_name}</strong></span>}
          </div>
        </DialogHeader>

        <Tabs defaultValue="detail" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="detail">Detail</TabsTrigger>
            <TabsTrigger value="inspection">Inspeksi</TabsTrigger>
            <TabsTrigger value="items">Item & Biaya</TabsTrigger>
          </TabsList>

          {/* Shaken Warning Banner */}
          {showShakenWarning && (
            <div className={`mt-3 rounded-lg border p-3 ${shakenInfo.color === 'red' ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-4 h-4 ${shakenInfo.color === 'red' ? 'text-red-500' : 'text-amber-500'}`} />
                <p className={`text-sm font-semibold ${shakenInfo.color === 'red' ? 'text-red-500' : 'text-amber-500'}`}>
                  Shaken (車検) {shakenInfo.status === 'Expired' ? 'Expired!' : 'Akan Habis!'}
                </p>
                <span className="text-xs text-muted-foreground ml-auto">{formatDaysRemaining(shakenInfo.daysRemaining)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">Informasikan pelanggan untuk perpanjangan Shaken.</p>
            </div>
          )}

          <TabsContent value="detail" className="space-y-4 mt-4">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Keluhan</Label>
              <p className="text-sm p-3 bg-muted rounded-lg mt-1">{workOrder.complaint}</p>
            </div>
            <div>
              <Label>Diagnosa</Label>
              <Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Hasil diagnosa..." />
            </div>
            <div>
              <Label>Catatan Teknisi</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan tambahan..." />
            </div>
          </TabsContent>

          <TabsContent value="inspection" className="mt-4">
            <InspectionForm inspection={inspection} onChange={setInspection} />
          </TabsContent>

          <TabsContent value="items" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => addItem('service')} className="gap-1.5">
                <Wrench className="w-3.5 h-3.5" />Tambah Jasa
              </Button>
              <Button variant="outline" size="sm" onClick={() => addItem('sparepart')} className="gap-1.5">
                <Package className="w-3.5 h-3.5" />Tambah Sparepart
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.type === 'service' ? 'bg-primary/10 text-primary' : 'bg-accent/20 text-accent-foreground'}`}>
                    {item.type === 'service' ? 'Jasa' : 'Part'}
                  </span>
                  <Input className="flex-1" placeholder="Nama item" value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} />
                  <Input className="w-16" type="number" placeholder="Qty" value={item.qty} onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))} />
                  <Input className="w-28" type="number" placeholder="Harga" value={item.price} onChange={(e) => updateItem(idx, 'price', Number(e.target.value))} />
                  <span className="w-28 text-sm font-medium text-right">¥ {(item.total || 0).toLocaleString('ja-JP')}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
            </div>

            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Biaya Jasa</span><span>¥ {serviceCost.toLocaleString('ja-JP')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Biaya Sparepart</span><span>¥ {partsCost.toLocaleString('ja-JP')}</span></div>
              <div className="flex justify-between tax-line"><span className="text-muted-foreground">Pajak 10%</span><span>¥ {Math.round(totalCost * 0.1).toLocaleString('ja-JP')}</span></div>
              <Separator />
              <div className="flex justify-between text-base font-bold"><span>Total (Termasuk Pajak)</span><span className="text-primary">¥ {(totalCost + Math.round(totalCost * 0.1)).toLocaleString('ja-JP')}</span></div>
              <div className="text-xs text-muted-foreground italic text-right">* Harga sudah termasuk pajak 10%</div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center gap-2 mt-4">
          <div className="flex gap-2">
            {/* Invoice & Payment actions - only show when WO has items */}
            {items.length > 0 && ['Selesai', 'Quality Check', 'Sedang Dikerjakan'].includes(status) && !workOrder.payment_status && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => {
                  handleSave();
                  // Set status to Menunggu Pembayaran and update
                  updateMutation.mutate({
                    status: 'Menunggu Pembayaran',
                    diagnosis,
                    technician_notes: notes,
                    items,
                    inspection,
                    service_cost: serviceCost,
                    parts_cost: partsCost,
                    tax,
                    total_cost: totalCost,
                    invoice_number: workOrder.invoice_number || `INV-${format(new Date(), 'yyyyMMdd')}-${workOrder.id?.slice(-4) || '0001'}`,
                  });
                  toast.success('Invoice dibuat & dikirim ke Kasir');
                }}>
                  Buat Invoice & Kirim ke Kasir
                </Button>
              </>
            )}
            {workOrder.payment_status === 'Lunas' && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 px-2">🟢 Lunas</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Tutup</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>Simpan Perubahan</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}