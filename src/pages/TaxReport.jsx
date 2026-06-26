import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Calculator, TrendingUp, FileText, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatCard from '@/components/shared/StatCard';

const TAX_RATE = 0.10; // 10% consumption tax

export default function TaxReport() {
  const [period, setPeriod] = useState('all');
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState('');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 1000),
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date', 500),
  });

  // Filter by period
  const filtered = transactions.filter(t => {
    if (t.type !== 'Pemasukan') return false;
    if (!t.date) return false;
    if (yearFilter && !t.date.startsWith(yearFilter)) return false;
    if (monthFilter && !t.date.startsWith(`${yearFilter}-${monthFilter}`)) return false;
    return true;
  });

  // Calculate tax from all income transactions
  // Tax is calculated internally: amount / 1.1 = base price, amount - base = tax
  const taxData = filtered.map(t => {
    const totalWithTax = t.amount || 0;
    const baseAmount = Math.round(totalWithTax / (1 + TAX_RATE));
    const taxAmount = totalWithTax - baseAmount;
    return { ...t, baseAmount, taxAmount, totalWithTax };
  });

  // Summary stats
  const totalRevenue = taxData.reduce((s, t) => s + t.totalWithTax, 0);
  const totalBase = taxData.reduce((s, t) => s + t.baseAmount, 0);
  const totalTax = taxData.reduce((s, t) => s + t.taxAmount, 0);
  const txCount = taxData.length;

  // Monthly breakdown
  const monthlyMap = {};
  taxData.forEach(t => {
    const month = (t.date || '').slice(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { revenue: 0, base: 0, tax: 0, count: 0 };
    monthlyMap[month].revenue += t.totalWithTax;
    monthlyMap[month].base += t.baseAmount;
    monthlyMap[month].tax += t.taxAmount;
    monthlyMap[month].count += 1;
  });
  const monthlyData = Object.entries(monthlyMap).sort().map(([month, d]) => ({ month, ...d }));

  // Columns for detail table
  const columns = [
    { header: 'Tanggal', render: (row) => row.date || '-' },
    { header: 'No. Transaksi', render: (row) => <span className="font-mono text-xs">{row.transaction_number}</span> },
    { header: 'Pelanggan', key: 'customer_name' },
    { header: 'Kategori', key: 'category' },
    { header: 'Harga Jual (税込)', render: (row) => <span className="font-semibold">¥ {row.totalWithTax.toLocaleString('ja-JP')}</span> },
    { header: 'Harga Dasar (税抜)', render: (row) => <span>¥ {row.baseAmount.toLocaleString('ja-JP')}</span> },
    { header: 'Pajak 10%', render: (row) => <span className="text-amber-500 font-semibold">¥ {row.taxAmount.toLocaleString('ja-JP')}</span> },
  ];

  const monthColumns = [
    { header: 'Bulan', render: (row) => row.month },
    { header: 'Jumlah Transaksi', render: (row) => row.count },
    { header: 'Total Penjualan (税込)', render: (row) => <span className="font-semibold">¥ {row.revenue.toLocaleString('ja-JP')}</span> },
    { header: 'Harga Dasar (税抜)', render: (row) => <span>¥ {row.base.toLocaleString('ja-JP')}</span> },
    { header: 'Total Pajak 10%', render: (row) => <span className="text-amber-500 font-bold">¥ {row.tax.toLocaleString('ja-JP')}</span> },
  ];

  const years = [...new Set(transactions.filter(t => t.date).map(t => t.date.slice(0, 4)))].sort().reverse();
  const months = [
    { value: '', label: 'Semua Bulan' },
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' }, { value: '03', label: 'Maret' },
    { value: '04', label: 'April' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' }, { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Pajak"
        description="Laporan internal konsumsi pajak (消費税) — TIDAK ditampilkan ke pelanggan"
      />

      {/* Info Banner */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Calculator className="w-4 h-4 text-amber-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-500">Laporan Internal</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pajak dihitung otomatis dari setiap transaksi pemasukan (10% consumption tax / 消費税).
              Data ini hanya untuk keperluan akuntansi, audit, dan pelaporan pajak internal.
              Invoice pelanggan tetap menampilkan harga final tanpa rincian pajak.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Tahun" /></SelectTrigger>
            <SelectContent>
              {years.length > 0 ? years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>) : <SelectItem value={String(new Date().getFullYear())}>{new Date().getFullYear()}</SelectItem>}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Bulan" /></SelectTrigger>
            <SelectContent>
              {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Penjualan" value={`¥ ${totalRevenue.toLocaleString('ja-JP')}`} icon={TrendingUp} />
        <StatCard title="Harga Dasar (税抜)" value={`¥ ${totalBase.toLocaleString('ja-JP')}`} icon={FileText} />
        <StatCard title="Total Pajak 10%" value={`¥ ${totalTax.toLocaleString('ja-JP')}`} icon={Calculator} />
        <StatCard title="Transaksi" value={txCount} icon={Calendar} />
      </div>

      {/* Monthly Summary */}
      {monthlyData.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Ringkasan Bulanan</h3>
          <DataTable columns={monthColumns} data={monthlyData} isLoading={false} emptyMessage="Belum ada data" />
        </div>
      )}

      {/* Detail Table */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold mb-4">Detail Transaksi & Pajak</h3>
        <DataTable columns={columns} data={taxData} isLoading={isLoading} emptyMessage="Belum ada transaksi pemasukan" />
      </div>
    </div>
  );
}
