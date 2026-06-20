import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Car, Fuel, Gauge, Shield, UserCheck, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import ShakengBadge from '@/components/shared/ShakengBadge';
import { toast } from 'sonner';
import { format } from 'date-fns';

const emptyForm = { customer_id: '', plate_number: '', brand: '', model: '', year: '', color: '', chassis_number: '', engine_number: '', fuel_type: '', transmission: '', last_odometer: '', shakeng_date: '', shakeng_expiry: '' };

function computeShakeng(expiry) {
  if (!expiry) return '';
  const exp = new Date(expiry);
  const now = new Date();
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Habis';
  if (diffDays <= 30) return 'Segera Habis';
  return 'Valid';
}

export default function Vehicles() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list('-created_date'),
  });
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const cust = customers.find(c => c.id === data.customer_id);
      return base44.entities.Vehicle.create({
        ...data,
        customer_name: cust?.name || '',
        year: data.year ? Number(data.year) : undefined,
        last_odometer: data.last_odometer ? Number(data.last_odometer) : undefined,
        shakeng_status: computeShakeng(data.shakeng_expiry),
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicles'] }); resetForm(); toast.success('Kendaraan ditambahkan'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const cust = customers.find(c => c.id === data.customer_id);
      return base44.entities.Vehicle.update(id, {
        ...data,
        customer_name: cust?.name || '',
        year: data.year ? Number(data.year) : undefined,
        last_odometer: data.last_odometer ? Number(data.last_odometer) : undefined,
        shakeng_status: computeShakeng(data.shakeng_expiry),
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicles'] }); resetForm(); toast.success('Kendaraan diperbarui'); },
  });

  const resetForm = () => { setFormData(emptyForm); setEditId(null); setShowForm(false); };

  const handleEdit = (v) => {
    setFormData({
      customer_id: v.customer_id || '', plate_number: v.plate_number || '', brand: v.brand || '',
      model: v.model || '', year: v.year || '', color: v.color || '', chassis_number: v.chassis_number || '',
      engine_number: v.engine_number || '', fuel_type: v.fuel_type || '', transmission: v.transmission || '',
      last_odometer: v.last_odometer || '', shakeng_date: v.shakeng_date || '', shakeng_expiry: v.shakeng_expiry || '',
    });
    setEditId(v.id);
    setShowForm(true);
  };

  const handleTransferOwnership = async (vehicle, newCustomerId) => {
    const cust = customers.find(c => c.id === newCustomerId);
    if (!cust) return;
    await base44.entities.Vehicle.update(vehicle.id, {
      customer_id: newCustomerId,
      customer_name: cust.name,
    });
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    toast.success(`Kepemilikan dialihkan ke ${cust.name}`);
  };

  const handleSubmit = () => {
    if (!formData.plate_number || !formData.brand || !formData.model || !formData.customer_id) return;
    if (editId) updateMutation.mutate({ id: editId, data: formData });
    else createMutation.mutate(formData);
  };

  const filtered = vehicles.filter(v =>
    v.plate_number?.toLowerCase().includes(search.toLowerCase()) ||
    v.brand?.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase()) ||
    v.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Kendaraan',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Car className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{row.plate_number}</p>
            <p className="text-xs text-muted-foreground">{row.brand} {row.model} {row.year}</p>
          </div>
        </div>
      ),
    },
    { header: 'Warna', key: 'color' },
    { header: 'Pemilik', key: 'customer_name' },
    { header: 'Shakeng', render: (row) => <ShakengBadge status={row.shakeng_status || computeShakeng(row.shakeng_expiry)} expiry={row.shakeng_expiry} date={row.shakeng_date} /> },
    { header: 'BBM', render: (row) => row.fuel_type ? <span className="flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5 text-muted-foreground" />{row.fuel_type}</span> : '-' },
    { header: 'Transmisi', key: 'transmission' },
    { header: 'Odometer', render: (row) => row.last_odometer ? <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-muted-foreground" />{row.last_odometer?.toLocaleString()} km</span> : '-' },
  ];

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <PageHeader title="Kendaraan" description={`${vehicles.length} total kendaraan`}
        actions={<Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" />Tambah Kendaraan</Button>}
      />
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari kendaraan..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <DataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={handleEdit} />

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Pemilik *</Label>
              <Select value={formData.customer_id} onValueChange={(v) => set('customer_id', v)}>
                <SelectTrigger><SelectValue placeholder="Pilih pelanggan" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nomor Polisi *</Label><Input value={formData.plate_number} onChange={(e) => set('plate_number', e.target.value)} placeholder="B 1234 ABC" /></div>
            <div><Label>Warna</Label><Input value={formData.color} onChange={(e) => set('color', e.target.value)} /></div>
            <div><Label>Merk *</Label><Input value={formData.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Toyota" /></div>
            <div><Label>Model *</Label><Input value={formData.model} onChange={(e) => set('model', e.target.value)} placeholder="Avanza G" /></div>
            <div><Label>Tahun</Label><Input type="number" value={formData.year} onChange={(e) => set('year', e.target.value)} placeholder="2021" /></div>
            <div>
              <Label>BBM</Label>
              <Select value={formData.fuel_type} onValueChange={(v) => set('fuel_type', v)}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {['Bensin', 'Diesel', 'Hybrid', 'Listrik'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Transmisi</Label>
              <Select value={formData.transmission} onValueChange={(v) => set('transmission', v)}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {['Manual', 'Automatic', 'CVT'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Odometer (km)</Label><Input type="number" value={formData.last_odometer} onChange={(e) => set('last_odometer', e.target.value)} /></div>
            <div><Label>No. Rangka</Label><Input value={formData.chassis_number} onChange={(e) => set('chassis_number', e.target.value)} /></div>
            <div><Label>No. Mesin</Label><Input value={formData.engine_number} onChange={(e) => set('engine_number', e.target.value)} /></div>
            <div className="col-span-2 border-t border-border pt-2"><Label className="text-primary font-semibold mb-2 block">Shakeng (車検)</Label></div>
            <div><Label>Tgl Shakeng</Label><Input type="date" value={formData.shakeng_date} onChange={(e) => set('shakeng_date', e.target.value)} /></div>
            <div><Label>Tgl Kadaluarsa</Label><Input type="date" value={formData.shakeng_expiry} onChange={(e) => set('shakeng_expiry', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Batal</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>{editId ? 'Simpan' : 'Tambah'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}