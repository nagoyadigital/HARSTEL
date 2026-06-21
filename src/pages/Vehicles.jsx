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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicles'] }); resetForm(); toast.success('車両が追加されました'); },
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicles'] }); resetForm(); toast.success('車両情報が更新されました'); },
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
      toast.error('顧客、ナンバー、メーカー、車種は必須です');
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
      header: '車両',
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
    { header: '色', key: 'color' },
    { header: '所有者', key: 'customer_name' },
    { header: '区分', render: (row) => <span className="text-xs">{row.vehicle_category || '-'}</span> },
    { header: '車検', render: (row) => <ShakengBadge status={row.shakeng_status || computeShakeng(row.shakeng_expiry)} /> },
    { header: '燃料', render: (row) => row.fuel_type ? <span className="flex items-center gap-1.5 text-xs"><Fuel className="w-3.5 h-3.5 text-muted-foreground" />{row.fuel_type}</span> : '-' },
    { header: '走行距離', render: (row) => row.last_odometer ? <span className="flex items-center gap-1.5 text-xs"><Gauge className="w-3.5 h-3.5 text-muted-foreground" />{row.last_odometer?.toLocaleString()} km</span> : '-' },
  ];

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const modelsForBrand = getModelsForBrand(formData.brand, customBrands);

  return (
    <div className="space-y-6">
      <PageHeader title="車両管理" description={`${vehicles.length} 台の車両`}
        actions={<Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" />車両追加</Button>}
      />
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="ナンバー・メーカー・顧客名で検索..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <DataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={handleEdit} />

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? '車両情報の編集' : '新規車両登録'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>所有者 (顧客) *</Label>
              <Select value={formData.customer_id} onValueChange={(v) => set('customer_id', v)}>
                <SelectTrigger><SelectValue placeholder="顧客を選択" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>ナンバープレート *</Label>
              <Input value={formData.plate_number} onChange={(e) => set('plate_number', e.target.value)} placeholder="名古屋 500 あ 1234" />
              <p className="text-[10px] text-muted-foreground mt-1">例: 名古屋 500 あ 1234</p>
            </div>
            <div>
              <Label>メーカー *</Label>
              <Select value={formData.brand} onValueChange={(v) => { set('brand', v); set('model', ''); }}>
                <SelectTrigger><SelectValue placeholder="メーカー選択" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {allBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>車種 *</Label>
              <Select value={formData.model} onValueChange={(v) => set('model', v)} disabled={!formData.brand}>
                <SelectTrigger><SelectValue placeholder={formData.brand ? '車種選択' : 'メーカーを先に選択'} /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {modelsForBrand.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  <SelectItem value="__other">その他 (手動入力)</SelectItem>
                </SelectContent>
              </Select>
              {formData.model === '__other' && (
                <Input className="mt-2" placeholder="車種名を入力" onChange={(e) => set('model', e.target.value)} />
              )}
            </div>
            <div><Label>年式</Label><Input type="number" value={formData.year} onChange={(e) => set('year', e.target.value)} placeholder="2024" /></div>
            <div><Label>色</Label><Input value={formData.color} onChange={(e) => set('color', e.target.value)} placeholder="白 / ホワイトパール" /></div>
            <div>
              <Label>車両区分</Label>
              <Select value={formData.vehicle_category} onValueChange={(v) => set('vehicle_category', v)}>
                <SelectTrigger><SelectValue placeholder="区分を選択" /></SelectTrigger>
                <SelectContent>
                  {VEHICLE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>燃料</Label>
              <Select value={formData.fuel_type} onValueChange={(v) => set('fuel_type', v)}>
                <SelectTrigger><SelectValue placeholder="燃料選択" /></SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ミッション</Label>
              <Select value={formData.transmission} onValueChange={(v) => set('transmission', v)}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>
                  {TRANSMISSION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>走行距離 (km)</Label><Input type="number" value={formData.last_odometer} onChange={(e) => set('last_odometer', e.target.value)} placeholder="50000" /></div>
            <div><Label>車台番号</Label><Input value={formData.chassis_number} onChange={(e) => set('chassis_number', e.target.value)} placeholder="ZVW30-1234567" /></div>
            <div><Label>エンジン型式</Label><Input value={formData.engine_number} onChange={(e) => set('engine_number', e.target.value)} placeholder="2ZR-FXE" /></div>
            <div className="col-span-2 border-t border-border pt-3"><Label className="text-primary font-semibold mb-2 block">車検 (Shaken)</Label></div>
            <div><Label>車検日</Label><Input type="date" value={formData.shakeng_date} onChange={(e) => set('shakeng_date', e.target.value)} /></div>
            <div><Label>有効期限</Label><Input type="date" value={formData.shakeng_expiry} onChange={(e) => set('shakeng_expiry', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>キャンセル</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>{editId ? '保存' : '登録'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
