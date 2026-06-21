import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye, Settings, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatDateJP } from '@/lib/date-utils';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import InvoiceSettings from '@/components/invoice/InvoiceSettings';

export default function Invoice() {
  const [selectedWO, setSelectedWO] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
  });

  // Stats
  const totalWOs = workOrders.length;
  const withInvoice = workOrders.filter(wo => wo.invoice_number).length;
  const paid = workOrders.filter(wo => wo.payment_status === 'Lunas').length;
  const pending = workOrders.filter(wo => ['Selesai', 'Menunggu Pembayaran'].includes(wo.status) && !wo.payment_status).length;

  const filtered = workOrders.filter(wo => {
    const matchSearch =
      wo.wo_number?.toLowerCase().includes(search.toLowerCase()) ||
      wo.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      wo.customer_name?.includes(search) ||
      wo.vehicle_info?.includes(search) ||
      wo.invoice_number?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'invoiced') return !!wo.invoice_number;
    if (filter === 'paid') return wo.payment_status === 'Lunas';
    if (filter === 'pending') return ['Selesai', 'Menunggu Pembayaran'].includes(wo.status) && !wo.payment_status;
    if (filter === 'active') return !['Selesai', 'Sudah Diambil', 'Menunggu Pembayaran'].includes(wo.status);
    return true;
  });

  const columns = [
    { header: 'No. WO / Invoice', render: (row) => (
      <div>
        <span className="font-mono font-semibold text-primary text-xs">{row.wo_number || `WO-${row.id?.slice(-6)}`}</span>
        {row.invoice_number && <p className="font-mono text-[10px] text-muted-foreground">{row.invoice_number}</p>}
      </div>
    )},
    { header: 'Pelanggan', render: (row) => <div><p className="font-medium text-sm">{row.customer_name}</p><p className="text-xs text-muted-foreground">{row.vehicle_info}</p></div> },
    { header: 'Status WO', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Pembayaran', render: (row) => {
      if (row.payment_status === 'Lunas') return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">🟢 Lunas</Badge>;
      if (row.status === 'Menunggu Pembayaran') return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">🟡 Menunggu</Badge>;
      if (row.status === 'Selesai') return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">🟡 Siap Invoice</Badge>;
      return <Badge className="bg-muted text-muted-foreground text-xs">— Belum</Badge>;
    }},
    { header: 'Total', render: (row) => <span className="font-bold">¥ {(row.total_cost || 0).toLocaleString('ja-JP')}</span> },
    { header: 'Tanggal', render: (row) => formatDateJP(row.created_date) },
    { header: 'Aksi', render: (row) => (
      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedWO(row); }}>
        <Eye className="w-3.5 h-3.5" /> Lihat Invoice
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice (請求書)"
        description="Invoice otomatis dari Work Order — preview & cetak"
        actions={
          <Button variant="outline" onClick={() => setShowSettings(true)} className="gap-2">
            <Settings className="w-4 h-4" />Pengaturan
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Work Order" value={totalWOs} icon={FileText} />
        <StatCard title="Invoice Dibuat" value={withInvoice} icon={CheckCircle} />
        <StatCard title="Menunggu Bayar" value={pending} icon={Clock} />
        <StatCard title="Sudah Lunas" value={paid} icon={CheckCircle} />
      </div>

      {/* Info Banner */}
      <div className="bg-muted/30 border border-border rounded-xl p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium">Alur Invoice</p>
            <p className="text-xs text-muted-foreground mt-1">
              Work Order → Tambah item jasa/sparepart → Klik "Buat Invoice & Kirim ke Kasir" di detail WO → Invoice otomatis dibuat → Bayar di Kasir/POS
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari WO, invoice, pelanggan, kendaraan..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="invoiced">Sudah Invoice</SelectItem>
            <SelectItem value="paid">Lunas</SelectItem>
            <SelectItem value="pending">Menunggu Bayar</SelectItem>
            <SelectItem value="active">Masih Proses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={setSelectedWO} emptyMessage="Belum ada Work Order. Buat Work Order terlebih dahulu." />

      {selectedWO && (
        <InvoicePreview
          workOrder={selectedWO}
          open={!!selectedWO}
          onClose={() => setSelectedWO(null)}
        />
      )}

      {showSettings && (
        <InvoiceSettings
          open={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
