import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Car, Fuel, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import ShakengBadge from '@/components/shared/ShakengBadge';
import { toast } from 'sonner';
import { getAllBrands, getModelsForBrand, FUEL_TYPES, TRANSMISSION_TYPES, VEHICLE_CATEGORIES } from '@/lib/vehicle-master-data';

const emptyForm = {
  customer_id: '', plate_number: '', brand: '', model: '', year: '', color: '',
  chassis_number: '', engine_number: '', fuel_type: '', transmission: '',
  last_odometer: '', shakeng_date: '', shakeng_expiry: '', vehicle_category: '',
  _manualModel: false,
};

function computeShakeng(expiry) {
  if (!expiry) return '';
  const diff = Math.ceil((new Date(expiry) - new Date()) / 86400000);
  if (diff < 0) return 'Habis';
  if (diff <= 30) return 'Segera Habis';
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
  const { data: customBrands = [] } = useQuery({
    queryKey: ['vehicleBrands'],
    queryFn: () => base44.entities.VehicleBrand.list('name'),
  });

  const allBrands = getAllBrands(customBrands);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const cust = customers.find(c => c.id === data.customer_id);
      const vehicleData = {
        ...data,
        customer_name: cust?.name || '',
        year: data.year ? Number(data.year) : undefined,
        last_odometer: data.last_odometer ? Number(data.last_odometer) : undefined,
        shakeng_status: computeShakeng(data.shakeng_expiry),
      };
      const created = await base44.entities.Vehicle.create(vehicleData);
      // Auto-sync ke modul Shaken jika ada data shaken
      if (data.shakeng_date && data.shakeng_expiry) {
        await base44.entities.Shaken.create({
          vehicle_id: created.id,
          vehicle_plate: data.plate_number,
          vehicle_info: `${data.brand} ${data.model} ${data.year || ''}`.trim(),
          customer_id: data.customer_id,
          customer_name: cust?.name || '',
          shaken_date: data.shakeng_date,
          shaken_expiry: data.shakeng_expiry,
          reminder_days: [90, 60, 30, 14, 7, 1],
        });
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['shaken'] });
      resetForm();
      toast.success('Kendaraan berhasil ditambahkan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const cust = customers.find(c => c.id === data.customer_id);
      const vehicleData = {
        ...data,
        customer_name: cust?.name || '',
        year: data.year ? Number(data.year) : undefined,
        last_odometer: data.last_odometer ? Number(data.last_odometer) : undefined,
        shakeng_status: computeShakeng(data.shakeng_expiry),
      };
      await base44.entities.Vehicle.update(id, vehicleData);
      // Auto-sync ke modul Shaken
      if (data.shakeng_date && data.shakeng_expiry) {
        // Cek apakah sudah ada record shaken untuk kendaraan ini
        const existing = await base44.entities.Shaken.filter({ vehicle_id: id });
        const shakenData = {
          vehicle_id: id,
          vehicle_plate: data.plate_number,
          vehicle_info: `${data.brand} ${data.model} ${data.year || ''}`.trim(),
          customer_id: data.customer_id,
          customer_name: cust?.name || '',
          shaken_date: data.shakeng_date,
          shaken_expiry: data.shakeng_expiry,
        };
        if (existing.length > 0) {
          // Update record terbaru
          await base44.entities.Shaken.update(existing[0].id, shakenData);
        } else {
          await base44.entities.Shaken.create({ ...shakenData, reminder_days: [90, 60, 30, 14, 7, 1] });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['shaken'] });
      resetForm();
      toast.success('Kendaraan berhasil diperbarui');
    },
  });

  const resetForm = () => { setFormData(emptyForm); setEditId(null); setShowForm(false); };

  const handleEdit = (v) => {
    setFormData({
      customer_id: v.customer_id || '', plate_number: v.plate_number || '', brand: v.brand || '',
      model: v.model || '', year: v.year || '', color: v.color || '', chassis_number: v.chassis_number || '',
      engine_number: v.engine_number || '', fuel_type: v.fuel_type || '', transmission: v.transmission || '',
      last_odometer: v.last_odometer || '', shakeng_date: v.shakeng_date || '', shakeng_expiry: v.shakeng_expiry || '',
      vehicle_category: v.vehicle_category || '',
    });
    setEditId(v.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.plate_number || !formData.brand || !formData.model || !formData.customer_id) {
      toast.error('Pemilik, Nomor Polisi, Merk, dan Model wajib diisi');
      return;
    }
    if (editId) updateMutation.mutate({ id: editId, data: formData });
    else createMutation.mutate(formData);
  };

  // Search supports Japanese and Romaji
  const filtered = vehicles.filter(v =>
    v.plate_number?.toLowerCase().includes(search.toLowerCase()) ||
    v.plate_number?.includes(search) ||
    v.brand?.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase()) ||
    v.customer_name?.includes(search) ||
    v.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.vehicle_category?.includes(search)
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
    { header: 'Kategori', render: (row) => <span className="text-xs">{row.vehicle_category || '-'}</span> },
    { header: 'Shaken', render: (row) => <ShakengBadge status={row.shakeng_status || computeShakeng(row.shakeng_expiry)} /> },
    { header: 'BBM', render: (row) => row.fuel_type ? <span className="flex items-center gap-1.5 text-xs"><Fuel className="w-3.5 h-3.5 text-muted-foreground" />{row.fuel_type}</span> : '-' },
    { header: 'Odometer', render: (row) => row.last_odometer ? <span className="flex items-center gap-1.5 text-xs"><Gauge className="w-3.5 h-3.5 text-muted-foreground" />{row.last_odometer?.toLocaleString()} km</span> : '-' },
  ];

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const modelsForBrand = getModelsForBrand(formData.brand, customBrands);

  return (
    <div className="space-y-6">
      <PageHeader title="Kendaraan" description={`${vehicles.length} kendaraan terdaftar`}
        actions={<Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" />Tambah Kendaraan</Button>}
      />
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari nomor polisi, merk, pelanggan..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
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
            <div className="col-span-2">
              <Label>Nomor Polisi Jepang *</Label>
              <Input value={formData.plate_number} onChange={(e) => set('plate_number', e.target.value)} placeholder="名古屋 500 あ 1234" />
              <p className="text-[10px] text-muted-foreground mt-1">Contoh: 名古屋 500 あ 1234</p>
            </div>
            <div>
              <Label>Merk *</Label>
              <Select value={formData.brand} onValueChange={(v) => { set('brand', v); set('model', ''); }}>
                <SelectTrigger><SelectValue placeholder="Pilih merk" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {allBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Model *</Label>
              {!formData._manualModel ? (
                <Select value={formData.model} onValueChange={(v) => {
                  if (v === '__other') {
                    set('_manualModel', true);
                    set('model', '');
                  } else {
                    set('model', v);
                  }
                }} disabled={!formData.brand}>
                  <SelectTrigger><SelectValue placeholder={formData.brand ? 'Pilih model' : 'Pilih merk dulu'} /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {modelsForBrand.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    <SelectItem value="__other">Lainnya (ketik manual)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <Input placeholder="Ketik nama model kendaraan" value={formData.model} onChange={(e) => set('model', e.target.value)} autoFocus />
                  <button type="button" onClick={() => { set('_manualModel', false); set('model', ''); }} className="text-xs text-primary hover:underline">
                    Kembali ke daftar model
                  </button>
                </div>
              )}
            </div>
            <div><Label>Tahun</Label><Input type="number" value={formData.year} onChange={(e) => set('year', e.target.value)} placeholder="2024" /></div>
            <div><Label>Warna</Label><Input value={formData.color} onChange={(e) => set('color', e.target.value)} placeholder="白 / ホワイトパール" /></div>
            <div>
              <Label>Kategori Kendaraan</Label>
              <Select value={formData.vehicle_category} onValueChange={(v) => set('vehicle_category', v)}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {VEHICLE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>BBM</Label>
              <Select value={formData.fuel_type} onValueChange={(v) => set('fuel_type', v)}>
                <SelectTrigger><SelectValue placeholder="Pilih BBM" /></SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Transmisi</Label>
              <Select value={formData.transmission} onValueChange={(v) => set('transmission', v)}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {TRANSMISSION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Odometer (km)</Label><Input type="number" value={formData.last_odometer} onChange={(e) => set('last_odometer', e.target.value)} placeholder="50000" /></div>
            <div><Label>Nomor Rangka</Label><Input value={formData.chassis_number} onChange={(e) => set('chassis_number', e.target.value)} placeholder="ZVW30-1234567" /></div>
            <div><Label>Nomor Mesin</Label><Input value={formData.engine_number} onChange={(e) => set('engine_number', e.target.value)} placeholder="2ZR-FXE" /></div>
            <div className="col-span-2 border-t border-border pt-3"><Label className="text-primary font-semibold mb-2 block">Shaken (車検)</Label></div>
            <div><Label>Tgl Shaken</Label><Input type="date" value={formData.shakeng_date} onChange={(e) => set('shakeng_date', e.target.value)} /></div>
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
