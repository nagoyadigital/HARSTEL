import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, Banknote, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';
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
import InvoicePreview from '@/components/invoice/InvoicePreview';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { generateInvoiceNumber } from '@/lib/invoice-utils';

export default function POS() {
  const [payWO, setPayWO] = useState(null);
  const [previewWO, setPreviewWO] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({ type: 'Pemasukan', category: '', description: '', amount: '', customer_name: '' });
  const queryClient = useQueryClient();

  // Fetch WOs that are "Menunggu Pembayaran" or "Selesai" (ready for payment)
  const { data: allWOs = [] } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
  });
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 200),
  });

  // WOs waiting for payment (status = Selesai or Menunggu Pembayaran, and not yet paid)
  const pendingPaymentWOs = allWOs.filter(wo =>
    ['Selesai', 'Menunggu Pembayaran'].includes(wo.status) && !wo.payment_status
  );

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTx = transactions.filter(t => t.date === today);
  const todayIncome = todayTx.filter(t => t.type === 'Pemasukan').reduce((s, t) => s + (t.amount || 0), 0);
  const todayCount = todayTx.filter(t => t.type === 'Pemasukan').length;

  const processPayment = useMutation({
    mutationFn: async ({ wo }) => {
      const invNumber = wo.invoice_number || generateInvoiceNumber();
      // Create transaction
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
      // Update WO status
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

  const paymentStatusBadge = (wo) => {
    if (wo.payment_status === 'Lunas') return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">🟢 Lunas</Badge>;
    if (wo.status === 'Menunggu Pembayaran') return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">🟡 Menunggu</Badge>;
    return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">🔴 Belum Dibayar</Badge>;
  };

  const categories = manualForm.type === 'Pemasukan' ? ['Jasa Service', 'Penjualan Sparepart', 'Lainnya'] : ['Pembelian Sparepart', 'Gaji', 'Operasional', 'Lainnya'];

  return (
    <div className="space-y-6">
      <PageHeader title="Kasir / POS" description="Pembayaran Work Order & Transaksi"
        actions={<Button onClick={() => setShowManualForm(true)} className="gap-2"><Plus className="w-4 h-4" />Transaksi Manual</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Pemasukan Hari Ini" value={`¥ ${todayIncome.toLocaleString('ja-JP')}`} icon={Receipt} />
        <StatCard title="Transaksi Hari Ini" value={todayCount} icon={Banknote} />
        <StatCard title="Menunggu Pembayaran" value={pendingPaymentWOs.length} icon={Clock} />
      </div>

      {/* Pending Payment from Work Orders */}
      {pendingPaymentWOs.length > 0 && (
        <div className="bg-card rounded-xl border border-amber-500/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Work Order Menunggu Pembayaran</h3>
            <Badge className="bg-amber-500/10 text-amber-600 text-xs">{pendingPaymentWOs.length}</Badge>
          </div>
          <div className="space-y-2">
            {pendingPaymentWOs.map(wo => (
              <div key={wo.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-primary font-semibold">{wo.wo_number}</span>
                    {wo.invoice_number && <span className="font-mono text-[10px] text-muted-foreground">→ {wo.invoice_number}</span>}
                  </div>
                  <p className="text-sm font-medium mt-0.5">{wo.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{wo.vehicle_info}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary text-lg">¥ {(wo.total_cost || 0).toLocaleString('ja-JP')}</span>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setPreviewWO(wo)}>
                      <Eye className="w-3.5 h-3.5" /> Invoice
                    </Button>
                    <Button size="sm" className="gap-1 text-xs" onClick={() => setPayWO(wo)}>
                      <Banknote className="w-3.5 h-3.5" /> Bayar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold mb-4">Riwayat Transaksi</h3>
        <DataTable
          columns={[
            { header: 'No.', render: (row) => <span className="font-mono text-xs">{row.transaction_number}</span> },
            { header: 'Tanggal', render: (row) => row.date || '-' },
            { header: 'Keterangan', key: 'description' },
            { header: 'WO', render: (row) => row.work_order_id ? <span className="font-mono text-xs text-primary">{row.invoice_number || '-'}</span> : '-' },
            { header: 'Pelanggan', key: 'customer_name' },
            { header: 'Jumlah', render: (row) => <span className={`font-semibold ${row.type === 'Pemasukan' ? 'text-emerald-600' : 'text-red-500'}`}>{row.type === 'Pemasukan' ? '+' : '-'}¥ {(row.amount || 0).toLocaleString('ja-JP')}</span> },
          ]}
          data={transactions}
          isLoading={isLoading}
          emptyMessage="Belum ada transaksi"
        />
      </div>

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
      {previewWO && (
        <InvoicePreview workOrder={previewWO} open={!!previewWO} onClose={() => setPreviewWO(null)} />
      )}
    </div>
  );
}
