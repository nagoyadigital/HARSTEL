import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowDownToLine, ArrowUpFromLine, RefreshCw, AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatCard from '@/components/shared/StatCard';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Inventory() {
  const [showMovement, setShowMovement] = useState(false);
  const [movementType, setMovementType] = useState('Masuk');
  const [form, setForm] = useState({ sparepart_id: '', quantity: '', reference: '', notes: '' });
  const queryClient = useQueryClient();

  const { data: spareparts = [] } = useQuery({ queryKey: ['spareparts'], queryFn: () => base44.entities.Sparepart.list() });
  const { data: movements = [], isLoading } = useQuery({ queryKey: ['stockMovements'], queryFn: () => base44.entities.StockMovement.list('-created_date', 100) });

  const lowStock = spareparts.filter(sp => (sp.stock||0) <= (sp.min_stock||5));
  const outOfStock = spareparts.filter(sp => (sp.stock||0) === 0);

  const createMovement = useMutation({
    mutationFn: async (data) => {
      const sp = spareparts.find(s => s.id === data.sparepart_id);
      const qty = Number(data.quantity);
      await base44.entities.StockMovement.create({
        sparepart_id: data.sparepart_id, sparepart_name: sp?.name || '', type: movementType,
        quantity: qty, reference: data.reference, notes: data.notes, date: format(new Date(), 'yyyy-MM-dd'),
      });
      if (sp) {
        const newStock = movementType === 'Masuk' ? (sp.stock||0)+qty : movementType === 'Keluar' ? Math.max(0,(sp.stock||0)-qty) : qty;
        await base44.entities.Sparepart.update(sp.id, { stock: newStock });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['spareparts'] }); queryClient.invalidateQueries({ queryKey: ['stockMovements'] }); setForm({ sparepart_id:'', quantity:'', reference:'', notes:'' }); setShowMovement(false); toast.success('Pergerakan stok tercatat'); },
  });

  const openMovement = (type) => { setMovementType(type); setShowMovement(true); };

  const columns = [
    { header:'Tanggal', render:(row) => row.date || format(new Date(row.created_date), 'yyyy/MM/dd') },
    { header:'Sparepart', render:(row) => <span className="font-medium">{row.sparepart_name}</span> },
    { header:'Tipe', render:(row) => { const c={Masuk:'bg-emerald-100 text-emerald-800',Keluar:'bg-red-100 text-red-800',Adjustment:'bg-blue-100 text-blue-800'}; return <Badge className={c[row.type]||'bg-muted'}>{row.type}</Badge>; }},
    { header:'Jumlah', render:(row) => <span className="font-semibold">{row.quantity}</span> },
    { header:'Referensi', key:'reference' },
    { header:'Catatan', key:'notes' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Inventori" description="Manajemen stok sparepart"
        actions={<div className="flex gap-2">
          <Button variant="outline" onClick={()=>openMovement('Masuk')} className="gap-1.5"><ArrowDownToLine className="w-4 h-4"/>Stok Masuk</Button>
          <Button variant="outline" onClick={()=>openMovement('Keluar')} className="gap-1.5"><ArrowUpFromLine className="w-4 h-4"/>Stok Keluar</Button>
          <Button onClick={()=>openMovement('Adjustment')} className="gap-1.5"><RefreshCw className="w-4 h-4"/>Adjustment</Button>
        </div>} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Item" value={spareparts.length} icon={Package}/>
        <StatCard title="Stok Menipis" value={lowStock.length} subtitle="perlu restock" icon={AlertTriangle}/>
        <StatCard title="Stok Habis" value={outOfStock.length} icon={AlertTriangle}/>
      </div>
      {lowStock.length>0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>Item Stok Menipis</h3>
          <div className="flex flex-wrap gap-2">{lowStock.map(sp=><Badge key={sp.id} variant="outline" className="border-amber-300 text-amber-700">{sp.name} (Stok: {sp.stock||0})</Badge>)}</div>
        </div>
      )}
      <DataTable columns={columns} data={movements} isLoading={isLoading} emptyMessage="Belum ada pergerakan stok"/>

      <Dialog open={showMovement} onOpenChange={(o)=>{if(!o)setShowMovement(false)}}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Stok {movementType}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Sparepart *</Label><Select value={form.sparepart_id} onValueChange={(v)=>setForm({...form,sparepart_id:v})}><SelectTrigger><SelectValue placeholder="Pilih sparepart"/></SelectTrigger><SelectContent>{spareparts.map(sp=><SelectItem key={sp.id} value={sp.id}>{sp.sku} - {sp.name} (Stok:{sp.stock||0})</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Jumlah *</Label><Input type="number" value={form.quantity} onChange={(e)=>setForm({...form,quantity:e.target.value})}/></div>
            <div><Label>Referensi</Label><Input value={form.reference} onChange={(e)=>setForm({...form,reference:e.target.value})} placeholder="PO/WO number"/></div>
            <div><Label>Catatan</Label><Textarea value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})}/></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setShowMovement(false)}>Batal</Button><Button onClick={()=>createMovement.mutate(form)} disabled={!form.sparepart_id||!form.quantity||createMovement.isPending}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}