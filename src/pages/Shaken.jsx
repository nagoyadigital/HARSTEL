import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { format } from 'date-fns';
import { getShakenStatus, formatDaysRemaining } from '@/lib/shaken-utils';
import ShakenForm from '@/components/shaken/ShakenForm';
import ShakenDetail from '@/components/shaken/ShakenDetail';
import ShakenStatusBadge from '@/components/shaken/ShakenStatusBadge';
import ReminderTemplateEditor from '@/components/shaken/ReminderTemplateEditor';

const STATUS_FILTERS = ['Semua', 'Aktif', 'Akan Habis (30 hari)', 'Akan Habis (60 hari)', 'Akan Habis (90 hari)', 'Expired'];

export default function Shaken() {
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const queryClient = useQueryClient();

  const { data: shakenRecords = [], isLoading } = useQuery({
    queryKey: ['shaken'],
    queryFn: () => base44.entities.Shaken.list('-shaken_expiry'),
  });

  const filtered = shakenRecords.filter(record => {
    const matchSearch =
      record.vehicle_plate?.toLowerCase().includes(search.toLowerCase()) ||
      record.vehicle_info?.toLowerCase().includes(search.toLowerCase()) ||
      record.customer_name?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (statusFilter === 'Semua') return true;

    const { daysRemaining } = getShakenStatus(record.shaken_expiry);
    if (daysRemaining === null) return false;

    switch (statusFilter) {
      case 'Aktif': return daysRemaining > 90;
      case 'Akan Habis (30 hari)': return daysRemaining >= 0 && daysRemaining <= 30;
      case 'Akan Habis (60 hari)': return daysRemaining >= 0 && daysRemaining <= 60;
      case 'Akan Habis (90 hari)': return daysRemaining >= 0 && daysRemaining <= 90;
      case 'Expired': return daysRemaining < 0;
      default: return true;
    }
  });

  // Stats
  const totalRecords = shakenRecords.length;
  const expiredCount = shakenRecords.filter(r => {
    const s = getShakenStatus(r.shaken_expiry);
    return s.daysRemaining !== null && s.daysRemaining < 0;
  }).length;
  const warningCount = shakenRecords.filter(r => {
    const s = getShakenStatus(r.shaken_expiry);
    return s.daysRemaining !== null && s.daysRemaining >= 0 && s.daysRemaining <= 90;
  }).length;
  const activeCount = shakenRecords.filter(r => {
    const s = getShakenStatus(r.shaken_expiry);
    return s.daysRemaining !== null && s.daysRemaining > 90;
  }).length;

  const columns = [
    {
      header: 'Kendaraan',
      render: (row) => (
        <div>
          <p className="font-semibold text-sm">{row.vehicle_plate}</p>
          <p className="text-xs text-muted-foreground">{row.vehicle_info}</p>
        </div>
      ),
    },
    { header: 'Pelanggan', key: 'customer_name' },
    {
      header: 'Shaken Terakhir',
      render: (row) => row.shaken_date ? format(new Date(row.shaken_date), 'yyyy/MM/dd') : '-',
    },
    {
      header: 'Kadaluarsa',
      render: (row) => row.shaken_expiry ? format(new Date(row.shaken_expiry), 'yyyy/MM/dd') : '-',
    },
    {
      header: 'Sisa Hari',
      render: (row) => {
        const { daysRemaining, color } = getShakenStatus(row.shaken_expiry);
        const colorClass = color === 'red' ? 'text-red-500' : color === 'amber' ? 'text-amber-500' : 'text-emerald-500';
        return <span className={`text-sm font-semibold ${colorClass}`}>{formatDaysRemaining(daysRemaining)}</span>;
      },
    },
    {
      header: 'Status',
      render: (row) => <ShakenStatusBadge expiryDate={row.shaken_expiry} />,
    },
    {
      header: 'Est. Biaya',
      render: (row) => (
        <span className="font-semibold text-sm">
          ¥ {(row.total_estimated_cost || 0).toLocaleString('ja-JP')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shaken (車検)"
        description="Manajemen inspeksi kendaraan, asuransi, dan pajak"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTemplates(true)} className="gap-2">
              <Settings className="w-4 h-4" />Template
            </Button>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />Tambah Data Shaken
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-xl font-bold mt-1">{totalRecords}</p>
        </div>
        <div className="bg-card rounded-xl border border-emerald-500/20 p-4 text-center">
          <p className="text-xs text-emerald-600 uppercase tracking-wider">Aktif</p>
          <p className="text-xl font-bold mt-1 text-emerald-600">{activeCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-amber-500/20 p-4 text-center">
          <p className="text-xs text-amber-600 uppercase tracking-wider">Akan Habis</p>
          <p className="text-xl font-bold mt-1 text-amber-600">{warningCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-red-500/20 p-4 text-center">
          <p className="text-xs text-red-600 uppercase tracking-wider">Expired</p>
          <p className="text-xl font-bold mt-1 text-red-600">{expiredCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari plat, kendaraan, pelanggan..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56">
            <Filter className="w-3.5 h-3.5 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        onRowClick={setSelectedRecord}
      />

      {/* Form Modal */}
      {showForm && (
        <ShakenForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['shaken'] });
            setShowForm(false);
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <ShakenDetail
          record={selectedRecord}
          open={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['shaken'] });
            setSelectedRecord(null);
          }}
        />
      )}

      {/* Template Editor Modal */}
      {showTemplates && (
        <ReminderTemplateEditor
          open={showTemplates}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
