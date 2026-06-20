import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { toast } from 'sonner';

const CATEGORIES = ['Oli','Filter','Rem','Ban','Aki','Lampu','Suspensi','Transmisi','Mesin','Body','Aksesoris','Lainnya'];
const emptyForm = { sku:'', name:'', brand:'', category:'', supplier:'', buy_price:'', sell_price:'', stock:'', min_stock:'5', location:'' };

export default function Spareparts() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const queryClient = useQueryClient();

  const { data: spareparts = [], isLoading } = useQuery({
    queryKey: ['spareparts'], queryFn: () => base44.entities.Sparepart.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Sparepart.create({
      ...data, buy_price: Number(data.buy_price)||0, sell_price: Number(data.sell_price)||0,
      stock: Number(data.stock)||0, min_stock: Number(data.min_stock)||5,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['spareparts'] }); resetForm(); toast.success('Sparepart ditambahkan'); },
  });
  const updateMutation = useMutation({
    mutationFn: ({id, data}) => base44.entities.Sparepart.update(id, {
      ...data, buy_price: Number(data.buy_price)||0, sell_price: Number(data.sell_price)||0,
      stock: Number(data.stock)||0, min_stock: Number(data.min_stock)||5,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['spareparts'] }); resetForm(); toast.success('Sparepart diperbarui'); },
  });

  const resetForm = () => { setFormData(emptyForm); setEditId(null); setShowForm(false); };
  const handleEdit = (sp) => {
    setFormData({ sku:sp.sku, name:sp.name, brand:sp.brand||'', category:sp.category||'', supplier:sp.supplier||'', buy_price:sp.buy_price||'', sell_price:sp.sell_price||'', stock:sp.stock||'', min_stock:sp.min_stock||'5', location:sp.location||'' });
    setEditId(sp.id); setShowForm(true);
  };
  const handleSubmit = () => {
    if (!formData.sku || !formData.name || !formData.sell_price) return;
    if (editId) updateMutation.mutate({ id: editId, data: formData });
    else createMutation.mutate(formData);
  };

  const filtered = spareparts.filter(sp => sp.name?.toLowerCase().includes(search.toLowerCase()) || sp.sku?.toLowerCase().includes(search.toLowerCase()));
  const set = (f,v) => setFormData(prev => ({...prev, [f]:v}));

  const columns = [
    { header:'SKU', render:(row) => <span className="font-mono text-xs">{row.sku}</span> },
    { header:'Nama Part', render:(row) => <div><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.brand}</p></div> },
    { header:'Kategori', render:(row) => row.category ? <Badge variant="secondary">{row.category}</Badge> : '-' },
    { header:'Harga Beli', render:(row) => <span className="text-muted-foreground">¥ {(row.buy_price||0).toLocaleString('ja-JP')}</span> },
    { header:'Harga Jual', render:(row) => <span className="font-semibold">¥ {(row.sell_price||0).toLocaleString('ja-JP')}</span> },
    { header:'Stok', render:(row) => <div className="flex items-center gap-2"><span className="font-semibold">{row.stock||0}</span>{(row.stock||0)<=(row.min_stock||5) && <AlertTriangle className="w-4 h-4 text-amber-500"/>}</div> },
    { header:'Lokasi', key:'location' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Sparepart" description={`${spareparts.length} total item`}
        actions={<Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4"/>Tambah Sparepart</Button>} />
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input placeholder="Cari sparepart..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)}/></div>
      <DataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={handleEdit}/>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Sparepart' : 'Tambah Sparepart Baru'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>SKU *</Label><Input value={formData.sku} onChange={(e)=>set('sku',e.target.value)} placeholder="OLI-001"/></div>
            <div><Label>Merk</Label><Input value={formData.brand} onChange={(e)=>set('brand',e.target.value)}/></div>
            <div className="col-span-2"><Label>Nama Part *</Label><Input value={formData.name} onChange={(e)=>set('name',e.target.value)} placeholder="Castrol Magnatec"/></div>
            <div><Label>Kategori</Label><Select value={formData.category} onValueChange={(v)=>set('category',v)}><SelectTrigger><SelectValue placeholder="Pilih"/></SelectTrigger><SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Supplier</Label><Input value={formData.supplier} onChange={(e)=>set('supplier',e.target.value)}/></div>
            <div><Label>Harga Beli</Label><Input type="number" value={formData.buy_price} onChange={(e)=>set('buy_price',e.target.value)}/></div>
            <div><Label>Harga Jual *</Label><Input type="number" value={formData.sell_price} onChange={(e)=>set('sell_price',e.target.value)}/></div>
            <div><Label>Stok</Label><Input type="number" value={formData.stock} onChange={(e)=>set('stock',e.target.value)}/></div>
            <div><Label>Stok Minimum</Label><Input type="number" value={formData.min_stock} onChange={(e)=>set('min_stock',e.target.value)}/></div>
            <div className="col-span-2"><Label>Lokasi Rak</Label><Input value={formData.location} onChange={(e)=>set('location',e.target.value)} placeholder="Rak A-01"/></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={resetForm}>Batal</Button><Button onClick={handleSubmit} disabled={createMutation.isPending||updateMutation.isPending}>{editId?'Simpan':'Tambah'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}