import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, CreditCard, Banknote, QrCode, Building2 } from 'lucide-react';
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

const PAYMENT_METHODS = [{value:'Tunai',icon:Banknote},{value:'Kartu Kredit',icon:CreditCard},{value:'QRIS',icon:QrCode},{value:'Transfer Bank',icon:Building2}];

export default function POS() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type:'Pemasukan', category:'', description:'', amount:'', payment_method:'Tunai', customer_name:'' });
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({ queryKey:['transactions'], queryFn:()=>base44.entities.Transaction.list('-created_date',200) });
  const { data: completedWOs = [] } = useQuery({ queryKey:['completedWorkOrders'], queryFn:()=>base44.entities.WorkOrder.filter({status:'Selesai'}) });

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTx = transactions.filter(t=>t.date===today);
  const todayIncome = todayTx.filter(t=>t.type==='Pemasukan').reduce((s,t)=>s+(t.amount||0),0);
  const todayExpense = todayTx.filter(t=>t.type==='Pengeluaran').reduce((s,t)=>s+(t.amount||0),0);

  const createTx = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create({ transaction_number:`TX-${Date.now().toString().slice(-8)}`, type:data.type, category:data.category, description:data.description, amount:Number(data.amount), payment_method:data.payment_method, customer_name:data.customer_name, date:format(new Date(),'yyyy-MM-dd') }),
    onSuccess: ()=>{queryClient.invalidateQueries({queryKey:['transactions']});setShowForm(false);setForm({type:'Pemasukan',category:'',description:'',amount:'',payment_method:'Tunai',customer_name:''});toast.success('Transaksi dicatat');},
  });

  const processWOPayment = useMutation({
    mutationFn: async ({wo, paymentMethod}) => {
      await base44.entities.Transaction.create({ transaction_number:`TX-${Date.now().toString().slice(-8)}`, type:'Pemasukan', category:'Jasa Service', description:`Pembayaran ${wo.wo_number} - ${wo.customer_name}`, amount:wo.total_cost||0, payment_method:paymentMethod, work_order_id:wo.id, customer_id:wo.customer_id, customer_name:wo.customer_name, date:format(new Date(),'yyyy-MM-dd') });
      await base44.entities.WorkOrder.update(wo.id, { status:'Sudah Diambil' });
    },
    onSuccess: ()=>{queryClient.invalidateQueries({queryKey:['transactions']});queryClient.invalidateQueries({queryKey:['completedWorkOrders']});queryClient.invalidateQueries({queryKey:['workOrders']});toast.success('Pembayaran diproses');},
  });

  const [payWO, setPayWO] = useState(null);
  const [payMethod, setPayMethod] = useState('Tunai');

  const columns = [
    { header:'No. Transaksi', render:(row)=><span className="font-mono text-xs">{row.transaction_number}</span> },
    { header:'Tanggal', render:(row)=>row.date||'-' },
    { header:'Tipe', render:(row)=><Badge className={row.type==='Pemasukan'?'bg-emerald-100 text-emerald-800':'bg-red-100 text-red-800'}>{row.type}</Badge> },
    { header:'Kategori', render:(row)=><Badge variant="secondary">{row.category}</Badge> },
    { header:'Keterangan', key:'description' },
    { header:'Pembayaran', render:(row)=>row.payment_method||'-' },
    { header:'Jumlah', render:(row)=><span className={`font-semibold ${row.type==='Pemasukan'?'text-emerald-600':'text-red-500'}`}>{row.type==='Pemasukan'?'+':'-'}¥ {(row.amount||0).toLocaleString('ja-JP')}</span> },
  ];

  const categories = form.type==='Pemasukan'?['Jasa Service','Penjualan Sparepart','Lainnya']:['Pembelian Sparepart','Gaji','Operasional','Lainnya'];

  return (
    <div className="space-y-6">
      <PageHeader title="Kasir / POS" description="Point of Sale & Pembayaran"
        actions={<Button onClick={()=>setShowForm(true)} className="gap-2"><Plus className="w-4 h-4"/>Transaksi Baru</Button>}/>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Pemasukan Hari Ini" value={`¥ ${todayIncome.toLocaleString('ja-JP')}`} icon={Receipt}/>
        <StatCard title="Pengeluaran Hari Ini" value={`¥ ${todayExpense.toLocaleString('ja-JP')}`} icon={Receipt}/>
        <StatCard title="Laba Hari Ini" value={`¥ ${(todayIncome-todayExpense).toLocaleString('ja-JP')}`} icon={Receipt}/>
      </div>
      {completedWOs.length>0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-3">Work Order Menunggu Pembayaran</h3>
          <div className="space-y-2">{completedWOs.map(wo=>(<div key={wo.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"><div><p className="font-medium">{wo.wo_number} - {wo.customer_name}</p><p className="text-xs text-muted-foreground">{wo.vehicle_info}</p></div><div className="flex items-center gap-3"><span className="font-bold text-primary">¥ {(wo.total_cost||0).toLocaleString('ja-JP')}</span><Button size="sm" onClick={()=>setPayWO(wo)}>Bayar</Button></div></div>))}</div>
        </div>
      )}
      <DataTable columns={columns} data={transactions} isLoading={isLoading} emptyMessage="Belum ada transaksi"/>

      <Dialog open={showForm} onOpenChange={(o)=>{if(!o)setShowForm(false)}}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Transaksi Baru</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Tipe</Label><Select value={form.type} onValueChange={(v)=>setForm({...form,type:v,category:''})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Pemasukan">Pemasukan</SelectItem><SelectItem value="Pengeluaran">Pengeluaran</SelectItem></SelectContent></Select></div>
            <div><Label>Kategori *</Label><Select value={form.category} onValueChange={(v)=>setForm({...form,category:v})}><SelectTrigger><SelectValue placeholder="Pilih"/></SelectTrigger><SelectContent>{categories.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Keterangan</Label><Textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})}/></div>
            <div><Label>Jumlah *</Label><Input type="number" value={form.amount} onChange={(e)=>setForm({...form,amount:e.target.value})} placeholder="Rp"/></div>
            <div><Label>Metode Pembayaran</Label><Select value={form.payment_method} onValueChange={(v)=>setForm({...form,payment_method:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{PAYMENT_METHODS.map(p=><SelectItem key={p.value} value={p.value}>{p.value}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Nama Pelanggan</Label><Input value={form.customer_name} onChange={(e)=>setForm({...form,customer_name:e.target.value})}/></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setShowForm(false)}>Batal</Button><Button onClick={()=>createTx.mutate(form)} disabled={!form.category||!form.amount||createTx.isPending}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payWO} onOpenChange={(o)=>{if(!o)setPayWO(null)}}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Pembayaran Work Order</DialogTitle></DialogHeader>
          {payWO && <div className="space-y-4"><div className="text-center py-4"><p className="text-sm text-muted-foreground">{payWO.wo_number} - {payWO.customer_name}</p><p className="text-3xl font-bold text-primary mt-2">¥ {(payWO.total_cost||0).toLocaleString('ja-JP')}</p></div><div><Label>Metode Pembayaran</Label><Select value={payMethod} onValueChange={setPayMethod}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{PAYMENT_METHODS.map(p=><SelectItem key={p.value} value={p.value}>{p.value}</SelectItem>)}</SelectContent></Select></div></div>}
          <DialogFooter><Button variant="outline" onClick={()=>setPayWO(null)}>Batal</Button><Button onClick={()=>processWOPayment.mutate({wo:payWO,paymentMethod:payMethod})} disabled={processWOPayment.isPending}>Proses Pembayaran</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}