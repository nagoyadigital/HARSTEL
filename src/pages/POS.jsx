import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, Banknote, CheckCircle, Clock, Eye, Search, FileText, Trash2, Printer } from 'lucide-react';
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
  const [manualForm, setManualForm] = useState({ type: 'Pemasukan', category: '', description: '', customer_name: '' });
  const [invoiceItems, setInvoiceItems] = useState([{ name: '', qty: 1, price: 0 }]);
  const [shakenPayment, setShakenPayment] = useState({ weight_tax: '', jibaiseki: '', stamp_fee: '', service_fee: '', maintenance: '', other: '' });
  const [lastSavedInvoice, setLastSavedInvoice] = useState(null);
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

  const itemSubtotal = invoiceItems.reduce((sum, item) => sum + Math.round((item.qty || 0) * (item.price || 0) * 1.1), 0);
  const shakenSubtotal = Object.values(shakenPayment).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const grandTotal = itemSubtotal + shakenSubtotal;

  const addInvoiceItem = () => setInvoiceItems([...invoiceItems, { name: '', qty: 1, price: 0 }]);
  const removeInvoiceItem = (idx) => setInvoiceItems(invoiceItems.filter((_, i) => i !== idx));
  const updateInvoiceItem = (idx, field, value) => {
    const updated = [...invoiceItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setInvoiceItems(updated);
  };

  const createManualTx = useMutation({
    mutationFn: (data) => {
      const items = invoiceItems
        .filter(i => i.name && i.price > 0)
        .map(i => ({ name: i.name, qty: i.qty || 1, price: Number(i.price), subtotal: Math.round((i.qty || 1) * Number(i.price) * 1.1) }));
      const total = items.reduce((sum, i) => sum + i.subtotal, 0);
      const invNumber = generateInvoiceNumber();

      const txData = {
        transaction_number: `TX-${Date.now().toString().slice(-8)}`,
        invoice_number: invNumber,
        type: data.type,
        category: data.category,
        description: data.description,
        amount: total + shakenSubtotal,
        invoice_items: items,
        shaken_payment: shakenPayment,
        shaken_subtotal: shakenSubtotal,
        payment_method: 'Cash',
        customer_name: data.customer_name,
        date: format(new Date(), 'yyyy-MM-dd'),
      };

      // Save for print after success
      setLastSavedInvoice({ ...txData, items, shaken_payment: shakenPayment, shaken_subtotal: shakenSubtotal });
      return base44.entities.Transaction.create(txData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowManualForm(false);
      setManualForm({ type: 'Pemasukan', category: '', description: '', customer_name: '' });
      setInvoiceItems([{ name: '', qty: 1, price: 0 }]);
      setShakenPayment({ weight_tax: '', jibaiseki: '', stamp_fee: '', service_fee: '', maintenance: '', other: '' });
      toast.success('Transaksi berhasil disimpan! Klik Print untuk mencetak invoice.');
    },
  });

  const categories = manualForm.type === 'Pemasukan' ? ['Jasa Service', 'Penjualan Sparepart', 'Lainnya'] : ['Pembelian Sparepart', 'Gaji', 'Operasional', 'Lainnya'];

  const printManualInvoice = (invoice) => {
    const d = new Date(invoice.date || new Date());
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();

    const items = invoice.items || [];
    const shaken = invoice.shaken_payment || {};
    const shakenSub = invoice.shaken_subtotal || 0;
    const itemTotal = items.reduce((s, i) => s + (i.subtotal || 0), 0);
    const grandTotal = itemTotal + shakenSub;

    // Item rows
    const itemRows = items.map((item, idx) =>
      `<tr><td class="td num">${idx + 1}</td><td class="td name">${item.name}</td><td class="td amount">¥ ${item.subtotal.toLocaleString('ja-JP')}</td></tr>`
    ).join('');
    const emptyRows = Array(Math.max(0, 8 - items.length)).fill(
      `<tr><td class="td num">&nbsp;</td><td class="td name"></td><td class="td amount"></td></tr>`
    ).join('');

    // Shaken rows
    const shakenEntries = [
      { name: 'JIBAISEKI HOKEN', amount: Number(shaken.jibaiseki) || 0 },
      { name: 'JURYOZE', amount: Number(shaken.weight_tax) || 0 },
      { name: 'INSHIDAI', amount: Number(shaken.stamp_fee) || 0 },
      { name: 'SHAKEN INSPECTION', amount: Number(shaken.service_fee) || 0 },
      { name: 'MAINTENANCE PACKAGE', amount: Number(shaken.maintenance) || 0 },
      { name: 'LAIN-LAIN', amount: Number(shaken.other) || 0 },
    ];
    const shakenRows = shakenEntries.map(item =>
      `<tr><td class="td name" colspan="2" style="text-align:right;padding-right:20px;font-size:12px;font-weight:700">${item.name}</td><td class="td amount" style="font-size:12px;font-weight:700">¥ ${item.amount > 0 ? item.amount.toLocaleString('ja-JP') : '0'}</td></tr>`
    ).join('');

    const pw = window.open('', '_blank');
    pw.document.write(`<!DOCTYPE html><html><head><title>請求書</title>
<style>
@page { size: A4 portrait; margin: 8mm 10mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Yu Gothic', 'Meiryo', 'MS Gothic', sans-serif; color: #000; font-size: 12px; font-weight: 700; max-height: 100vh; overflow: hidden; }
table { border-collapse: collapse; width: 100%; page-break-inside: avoid; }
.td { border: 1px solid #000; padding: 3px 6px; font-size: 12px; font-weight: 700; }
.td.num { width: 30px; text-align: center; }
.td.name { text-align: left; }
.td.amount { width: 120px; text-align: right; }
.header td { border: 1px solid #000; padding: 4px 8px; font-weight: 700; font-size: 12px; }
.center { text-align: center; }
.right { text-align: right; }
.bold { font-weight: 700; }
.total-row td { border: 2px solid #000; padding: 10px; font-weight: 700; }
</style></head><body>

<!-- ===== HEADER: INVOICE + DATE ===== -->
<table class="header">
<tr>
  <td style="width:50%;font-size:12px;font-weight:700;text-decoration:underline;letter-spacing:3px">INVOICE</td>
  <td class="center" style="width:6%">年</td>
  <td class="center bold" style="width:11%;font-size:12px">${year}</td>
  <td class="center" style="width:6%">月</td>
  <td class="center bold" style="width:8%;font-size:12px">${month}</td>
  <td class="center" style="width:6%">日</td>
  <td class="center bold" style="width:8%;font-size:12px">${day}</td>
</tr>
</table>

<!-- ===== TITLE: 請求書 ===== -->
<table class="header">
<tr><td class="center bold" style="font-size:18px;letter-spacing:12px;padding:6px">請 求 書</td></tr>
</table>

<!-- ===== CUSTOMER + COMPANY ===== -->
<table class="header">
<tr>
  <!-- LEFT: Customer -->
  <td style="width:50%;vertical-align:top;padding:8px" rowspan="2">
    <div style="font-size:22px;font-weight:700;border-bottom:2px solid #000;display:inline-block;padding-bottom:4px;margin-bottom:8px">
      ${invoice.customer_name || '　　　　　　'}　様
    </div>
    <div style="margin-top:8px;font-size:12px;font-weight:700">下記のとおり御請求申し上げます</div>
    <div style="font-size:12px;font-weight:700;margin-top:6px">税込合計金額</div>
    <div style="font-size:22px;font-weight:700;margin-top:4px">¥ ${grandTotal.toLocaleString('ja-JP')}</div>
  </td>
  <!-- RIGHT: Company (centered) -->
  <td style="width:50%;text-align:center;vertical-align:middle;padding:8px">
    <div style="font-size:22px;font-weight:700;margin-bottom:4px">HARSTEL</div>
    <div style="font-size:12px;font-weight:700">登録番号：T3810590640185</div>
    <div style="font-size:12px;font-weight:700;margin-top:3px">愛知県碧南市湖西町２−８３</div>
    <div style="font-size:12px;font-weight:700;margin-top:3px">TEL: 0566-57-6225</div>
    <div style="font-size:12px;font-weight:700;margin-top:2px">MOBILE: 090-6357-9803</div>
  </td>
</tr>
<tr>
  <!-- RIGHT: Bank info (centered) -->
  <td style="text-align:center;padding:8px;font-size:12px;font-weight:700;vertical-align:middle">
    <div style="font-size:12px;margin-bottom:3px">振込先</div>
    <div>ゆうちょ銀行　店番: 208</div>
    <div>普通口座：12060-11454171</div>
    <div>口座名義：ハリープラセティヤ</div>
  </td>
</tr>
</table>

<!-- ===== ITEMS TABLE ===== -->
<table style="margin-top:6px">
<thead>
  <tr>
    <td class="td num bold center" style="background:#000;color:#fff">No</td>
    <td class="td name bold center" style="background:#000;color:#fff">品　名</td>
    <td class="td amount bold center" style="background:#000;color:#fff">金　額</td>
  </tr>
</thead>
<tbody>
${itemRows}
${emptyRows}
</tbody>
</table>

<!-- ===== SUBTOTAL ===== -->
<table>
<tr class="total-row">
  <td style="width:65%;text-align:center;border:2px solid #000;font-size:12px;font-weight:700">SUBTOTAL</td>
  <td style="width:35%;text-align:right;border:2px solid #000;font-size:12px;font-weight:700;padding-right:12px">¥ ${itemTotal.toLocaleString('ja-JP')}</td>
</tr>
</table>

<!-- ===== SHAKEN SECTION ===== -->
${shakenSub > 0 ? `
<table style="margin-top:6px">
<tr><td class="td bold center" colspan="3" style="background:#eee;font-size:11px">車検費用</td></tr>
${shakenRows}
<tr class="total-row">
  <td style="text-align:center;border:2px solid #000;font-size:11px" colspan="2">TOTAL SHAKEN</td>
  <td style="text-align:right;border:2px solid #000;font-size:13px;padding-right:12px;width:130px">¥ ${shakenSub.toLocaleString('ja-JP')}</td>
</tr>
</table>
` : ''}

<!-- ===== GRAND TOTAL ===== -->
<table style="margin-top:6px">
<tr>
  <td style="width:65%;text-align:center;border:3px solid #000;padding:10px;font-size:16px;font-weight:700;letter-spacing:6px">合　計</td>
  <td style="width:35%;text-align:right;border:3px solid #000;padding:10px 12px;font-size:22px;font-weight:700">¥ ${grandTotal.toLocaleString('ja-JP')}</td>
</tr>
</table>

</body></html>`);
    pw.document.close();
    pw.focus();
    setTimeout(() => { pw.print(); }, 300);
  };

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
              { header: '', render: (row) => row.invoice_items ? (
                <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={(e) => { e.stopPropagation(); printManualInvoice({ ...row, items: row.invoice_items }); }}>
                  <Printer className="w-3 h-3" /> Print
                </Button>
              ) : null },
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

      {/* Manual Transaction Dialog with Detail Invoice */}
      <Dialog open={showManualForm} onOpenChange={(o) => { if (!o) setShowManualForm(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Transaksi Manual — Detail Invoice</DialogTitle></DialogHeader>
          <div className="space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipe</Label>
                <Select value={manualForm.type} onValueChange={(v) => setManualForm({ ...manualForm, type: v, category: '' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                    <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kategori *</Label>
                <Select value={manualForm.category} onValueChange={(v) => setManualForm({ ...manualForm, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Nama Pelanggan</Label>
                <Input value={manualForm.customer_name} onChange={(e) => setManualForm({ ...manualForm, customer_name: e.target.value })} placeholder="Nama pelanggan atau perusahaan" />
              </div>
            </div>

            {/* Detail Invoice Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Detail Invoice</Label>
                <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addInvoiceItem}>
                  <Plus className="w-3.5 h-3.5" /> Tambah Item
                </Button>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-[1fr_70px_110px_110px_36px] gap-2 mb-2 px-1">
                <span className="text-xs text-muted-foreground font-medium">Nama Barang/Jasa</span>
                <span className="text-xs text-muted-foreground font-medium text-center">Qty</span>
                <span className="text-xs text-muted-foreground font-medium text-right">Harga Satuan</span>
                <span className="text-xs text-muted-foreground font-medium text-right">Subtotal</span>
                <span></span>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {invoiceItems.map((item, idx) => {
                  const subtotal = Math.round((item.qty || 0) * (item.price || 0) * 1.1);
                  return (
                    <div key={idx} className="grid grid-cols-[1fr_70px_110px_110px_36px] gap-2 items-center">
                      <Input
                        placeholder="Nama item..."
                        value={item.name}
                        onChange={(e) => updateInvoiceItem(idx, 'name', e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="1"
                        value={item.qty}
                        onChange={(e) => updateInvoiceItem(idx, 'qty', Number(e.target.value))}
                        className="h-9 text-sm text-center"
                      />
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.price}
                        onChange={(e) => updateInvoiceItem(idx, 'price', Number(e.target.value))}
                        className="h-9 text-sm text-right"
                      />
                      <span className="text-sm font-medium text-right pr-1">¥ {subtotal.toLocaleString('ja-JP')}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeInvoiceItem(idx)}
                        disabled={invoiceItems.length <= 1}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Item Subtotal */}
              <div className="flex justify-end mt-4 pt-3 border-t border-border">
                <div className="text-right">
                  <span className="text-sm text-muted-foreground mr-4">Subtotal Item:</span>
                  <span className="text-base font-semibold">¥ {itemSubtotal.toLocaleString('ja-JP')}</span>
                </div>
              </div>
            </div>

            {/* Shaken Payment Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Pembayaran Shaken / 車検支払い</Label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">重量税 / Weight Tax</Label>
                  <Input type="number" placeholder="0" value={shakenPayment.weight_tax} onChange={(e) => setShakenPayment({ ...shakenPayment, weight_tax: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">自賠責保険 / Jibaiseki</Label>
                  <Input type="number" placeholder="0" value={shakenPayment.jibaiseki} onChange={(e) => setShakenPayment({ ...shakenPayment, jibaiseki: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">印紙代 / Stamp Fee</Label>
                  <Input type="number" placeholder="0" value={shakenPayment.stamp_fee} onChange={(e) => setShakenPayment({ ...shakenPayment, stamp_fee: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">代行手数料 / Service Fee</Label>
                  <Input type="number" placeholder="0" value={shakenPayment.service_fee} onChange={(e) => setShakenPayment({ ...shakenPayment, service_fee: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">整備費用 / Maintenance</Label>
                  <Input type="number" placeholder="0" value={shakenPayment.maintenance} onChange={(e) => setShakenPayment({ ...shakenPayment, maintenance: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">その他 / Other</Label>
                  <Input type="number" placeholder="0" value={shakenPayment.other} onChange={(e) => setShakenPayment({ ...shakenPayment, other: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <span className="text-sm text-muted-foreground mr-4">Shaken Subtotal:</span>
                <span className="text-base font-semibold">¥ {shakenSubtotal.toLocaleString('ja-JP')}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="bg-muted/30 rounded-xl p-4 flex justify-between items-center">
              <span className="text-sm font-semibold">Grand Total:</span>
              <span className="text-2xl font-bold text-primary">¥ {grandTotal.toLocaleString('ja-JP')}</span>
            </div>

            {/* Notes */}
            <div>
              <Label>Keterangan / Catatan</Label>
              <Textarea
                value={manualForm.description}
                onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                placeholder="Catatan umum invoice..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualForm(false)}>Batal</Button>
            <Button
              onClick={() => createManualTx.mutate(manualForm)}
              disabled={!manualForm.category || grandTotal <= 0 || createManualTx.isPending}
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Simpan & Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview */}
      {previewWO && <InvoicePreview workOrder={previewWO} open={!!previewWO} onClose={() => setPreviewWO(null)} />}

      {/* Print Saved Manual Invoice */}
      {lastSavedInvoice && (
        <Dialog open={!!lastSavedInvoice} onOpenChange={(o) => { if (!o) setLastSavedInvoice(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Transaksi Berhasil</DialogTitle></DialogHeader>
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-sm font-medium">Invoice berhasil dibuat</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{lastSavedInvoice.invoice_number}</p>
              <p className="text-2xl font-bold text-primary mt-3">¥ {(lastSavedInvoice.amount || 0).toLocaleString('ja-JP')}</p>
              <p className="text-xs text-muted-foreground mt-1">{lastSavedInvoice.customer_name || '-'}</p>
            </div>
            <DialogFooter className="flex gap-2 sm:justify-center">
              <Button variant="outline" onClick={() => setLastSavedInvoice(null)}>Tutup</Button>
              <Button className="gap-2" onClick={() => printManualInvoice(lastSavedInvoice)}>
                <Printer className="w-4 h-4" /> Print Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Invoice Settings */}
      {showSettings && <InvoiceSettings open={showSettings} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
