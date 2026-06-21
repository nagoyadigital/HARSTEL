import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, Banknote, CheckCircle, Clock, Eye, Search, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import InvoiceSettings from '@/components/invoice/InvoiceSettings';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatDateJP } from '@/lib/date-utils';
import { generateInvoiceNumber } from '@/lib/invoice-utils';
import { Settings } from 'lucide-react';

export default function POS() {
  const [payWO, setPayWO] = useState(null);
  const [previewWO, setPreviewWO] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [manualForm, setManualForm] = useState({ type: 'Pemasukan', category: '', description: '', amount: '', customer_name: '' });
  const queryClient = useQueryClient();

  const { data: allWOs = [] } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
  });
  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 200),
  });

  // Pending payment WOs
  const pendingPaymentWOs = allWOs.filter(wo =>
    ['Selesai', 'Menunggu Pembayaran'].includes(wo.status) && !wo.payment_status
  );

  // Stats
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTx = transactions.filter(t => t.date === today);
  const todayIncome = todayTx.filter(t => t.type === 'Pemasukan').reduce((s, t) => s + (t.amount || 0), 0);
  const paidCount = allWOs.filter(wo => wo.payment_status === 'Lunas').length;
  const invoicedCount = allWOs.filter(wo => wo.invoice_number).length;

  // Filtered WOs for invoice tab
  const filteredWOs = allWOs.filter(wo => {
    const matchSearch =
      wo.wo_number?.toLowerCase().includes(search.toLowerCase()) ||
      wo.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      wo.customer_name?.includes(search) ||
      wo.vehicle_info?.includes(search) ||
      wo.invoice_number?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'paid') return wo.payment_status === 'Lunas';
    if (filter === 'pending') return ['Selesai', 'Menunggu Pembayaran'].includes(wo.status) && !wo.payment_status;
    if (filter === 'active') return !['Selesai', 'Sudah Diambil', 'Menunggu Pembayaran'].includes(wo.status);
    return true;
  });

  const processPayment = useMutation({
    mutationFn: async ({ wo }) => {
      const invNumber = wo.invoice_number || generateInvoiceNumber();
      await base44.entities.Transaction.create({
        transaction_number: `TX-${Date.now().toString().slice(-8)}`,
        type: 'Pemasukan',
        category: 'Jasa Service',
        description: `Pembayaran ${wo.wo_number} - ${wo.customer_name}`,
        amount: wo.total_cost || 0,
        payment_method: 'Cash',
        work_order_id: wo.id,
        invoice_number: invNumber,
        customer_id: wo.customer_id,
        customer_name: wo.customer_name,
        vehicle_info: wo.vehicle_info,
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      await base44.entities.WorkOrder.update(wo.id, {
        status: 'Sudah Diambil',
        payment_status: 'Lunas',
        payment_date: new Date().toISOString(),
        invoice_number: invNumber,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      setPayWO(null);
      toast.success('Pembayaran berhasil diproses');
    },
  });

  const createManualTx = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create({
      transaction_number: `TX-${Date.now().toString().slice(-8)}`,
      type: data.type,
      category: data.category,
      description: data.description,
      amount: Number(data.amount),
      payment_method: 'Cash',
      customer_name: data.customer_name,
      date: format(new Date(), 'yyyy-MM-dd'),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowManualForm(false);
      setManualForm({ type: 'Pemasukan', category: '', description: '', amount: '', customer_name: '' });
      toast.success('Transaksi dicatat');
    },
  });

  const categories = manualForm.type === 'Pemasukan' ? ['Jasa Service', 'Penjualan Sparepart', 'Lainnya'] : ['Pembelian Sparepart', 'Gaji', 'Operasional', 'Lainnya'];

  return (
    <div className="space-y-6">
      <PageHeader title="Kasir & Invoice" description="Pembayaran, Invoice, & Riwayat Transaksi"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSettings(true)} className="gap-2 text-xs"><Settings className="w-3.5 h-3.5" />Pengaturan Invoice</Button>
            <Button onClick={() => setShowManualForm(true)} className="gap-2"><Plus className="w-4 h-4" />Transaksi Manual</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Pemasukan Hari Ini" value={`¥ ${todayIncome.toLocaleString('ja-JP')}`} icon={Receipt} />
        <StatCard title="Menunggu Bayar" value={pendingPaymentWOs.length} icon={Clock} />
        <StatCard title="Invoice Dibuat" value={invoicedCount} icon={FileText} />
        <StatCard title="Lunas" value={paidCount} icon={CheckCircle} />
      </div>

      <Tabs defaultValue="payment" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payment" className="gap-1.5"><Banknote className="w-3.5 h-3.5" /> Pembayaran</TabsTrigger>
          <TabsTrigger value="invoice" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Invoice</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><Receipt className="w-3.5 h-3.5" /> Riwayat</TabsTrigger>
        </TabsList>

        {/* === TAB: Pembayaran === */}
        <TabsContent value="payment" className="mt-4 space-y-4">
          {pendingPaymentWOs.length > 0 ? (
            <div className="space-y-2">
              {pendingPaymentWOs.map(wo => (
                <div key={wo.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-primary font-semibold">{wo.wo_number}</span>
                      {wo.invoice_number && <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{wo.invoice_number}</span>}
                    </div>
                    <p className="text-sm font-medium mt-1">{wo.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{wo.vehicle_info}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-primary">¥ {(wo.total_cost || 0).toLocaleString('ja-JP')}</span>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setPreviewWO(wo)}><Eye className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" onClick={() => setPayWO(wo)} className="gap-1.5"><Banknote className="w-3.5 h-3.5" /> Bayar</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-2xl bg-muted/50 mb-4"><CheckCircle className="w-8 h-8 text-emerald-500" /></div>
              <p className="text-sm font-medium">Tidak ada pembayaran pending</p>
              <p className="text-xs text-muted-foreground mt-1">Semua Work Order sudah lunas atau masih dalam proses</p>
            </div>
          )}
        </TabsContent>

        {/* === TAB: Invoice === */}
        <TabsContent value="invoice" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari WO, invoice, pelanggan..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
                <SelectItem value="pending">Menunggu Bayar</SelectItem>
                <SelectItem value="active">Masih Proses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DataTable
            columns={[
              { header: 'No. WO / Invoice', render: (row) => (
                <div>
                  <span className="font-mono font-semibold text-primary text-xs">{row.wo_number || `WO-${row.id?.slice(-6)}`}</span>
                  {row.invoice_number && <p className="font-mono text-[10px] text-muted-foreground">{row.invoice_number}</p>}
                </div>
              )},
              { header: 'Pelanggan', render: (row) => <div><p className="font-medium text-sm">{row.customer_name}</p><p className="text-xs text-muted-foreground">{row.vehicle_info}</p></div> },
              { header: 'Status', render: (row) => {
                if (row.payment_status === 'Lunas') return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">🟢 Lunas</Badge>;
                if (['Selesai', 'Menunggu Pembayaran'].includes(row.status)) return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">🟡 Menunggu</Badge>;
                return <StatusBadge status={row.status} />;
              }},
              { header: 'Total', render: (row) => <span className="font-bold">¥ {(row.total_cost || 0).toLocaleString('ja-JP')}</span> },
              { header: 'Tanggal', render: (row) => formatDateJP(row.created_date) },
              { header: '', render: (row) => (
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); setPreviewWO(row); }}>
                  <Eye className="w-3.5 h-3.5" /> Invoice
                </Button>
              )},
            ]}
            data={filteredWOs}
            isLoading={false}
            onRowClick={setPreviewWO}
            emptyMessage="Belum ada Work Order"
          />
        </TabsContent>

        {/* === TAB: Riwayat === */}
        <TabsContent value="history" className="mt-4">
          <DataTable
            columns={[
              { header: 'No.', render: (row) => <span className="font-mono text-xs">{row.transaction_number}</span> },
              { header: 'Tanggal', render: (row) => row.date || '-' },
              { header: 'Keterangan', key: 'description' },
              { header: 'Invoice', render: (row) => row.invoice_number ? <span className="font-mono text-xs text-primary">{row.invoice_number}</span> : '-' },
              { header: 'Pelanggan', key: 'customer_name' },
              { header: 'Jumlah', render: (row) => <span className={`font-semibold ${row.type === 'Pemasukan' ? 'text-emerald-600' : 'text-red-500'}`}>{row.type === 'Pemasukan' ? '+' : '-'}¥ {(row.amount || 0).toLocaleString('ja-JP')}</span> },
            ]}
            data={transactions}
            isLoading={txLoading}
            emptyMessage="Belum ada transaksi"
          />
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={!!payWO} onOpenChange={(o) => { if (!o) setPayWO(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Proses Pembayaran</DialogTitle></DialogHeader>
          {payWO && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">{payWO.wo_number}</p>
                <p className="text-sm font-medium mt-1">{payWO.customer_name}</p>
                <p className="text-xs text-muted-foreground">{payWO.vehicle_info}</p>
                <p className="text-3xl font-bold text-primary mt-3">¥ {(payWO.total_cost || 0).toLocaleString('ja-JP')}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Metode Pembayaran</p>
                <p className="text-sm font-semibold flex items-center gap-2"><Banknote className="w-4 h-4" /> Cash</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayWO(null)}>Batal</Button>
            <Button onClick={() => processPayment.mutate({ wo: payWO })} disabled={processPayment.isPending} className="gap-2">
              <CheckCircle className="w-4 h-4" /> Terima Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Transaction Dialog */}
      <Dialog open={showManualForm} onOpenChange={(o) => { if (!o) setShowManualForm(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Transaksi Manual</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Tipe</Label><Select value={manualForm.type} onValueChange={(v) => setManualForm({ ...manualForm, type: v, category: '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Pemasukan">Pemasukan</SelectItem><SelectItem value="Pengeluaran">Pengeluaran</SelectItem></SelectContent></Select></div>
            <div><Label>Kategori *</Label><Select value={manualForm.category} onValueChange={(v) => setManualForm({ ...manualForm, category: v })}><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Keterangan</Label><Textarea value={manualForm.description} onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })} /></div>
            <div><Label>Jumlah *</Label><Input type="number" value={manualForm.amount} onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })} placeholder="¥" /></div>
            <div><Label>Nama Pelanggan</Label><Input value={manualForm.customer_name} onChange={(e) => setManualForm({ ...manualForm, customer_name: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualForm(false)}>Batal</Button>
            <Button onClick={() => createManualTx.mutate(manualForm)} disabled={!manualForm.category || !manualForm.amount || createManualTx.isPending}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview */}
      {previewWO && <InvoicePreview workOrder={previewWO} open={!!previewWO} onClose={() => setPreviewWO(null)} />}

      {/* Invoice Settings */}
      {showSettings && <InvoiceSettings open={showSettings} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
