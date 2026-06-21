import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import WorkOrderForm from '@/components/workorder/WorkOrderForm';
import WorkOrderDetail from '@/components/workorder/WorkOrderDetail';
import { format } from 'date-fns';

const STATUSES = ['Semua', 'Menunggu', 'Inspeksi', 'Estimasi', 'Menunggu Approval', 'Sedang Dikerjakan', 'Menunggu Sparepart', 'Quality Check', 'Selesai', 'Sudah Diambil'];

export default function WorkOrders() {
  const [showForm, setShowForm] = useState(false);
  const [selectedWO, setSelectedWO] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const queryClient = useQueryClient();

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
  });

  const filtered = workOrders.filter(wo => {
    const matchSearch = wo.wo_number?.toLowerCase().includes(search.toLowerCase()) ||
      wo.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      wo.vehicle_info?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Semua' || wo.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    { header: 'No. WO', render: (row) => <span className="font-mono font-semibold text-primary">{row.wo_number || `WO-${row.id?.slice(-6)}`}</span> },
    { header: 'Pelanggan', render: (row) => <div><p className="font-medium">{row.customer_name}</p><p className="text-xs text-muted-foreground">{row.vehicle_info}</p></div> },
    { header: 'Keluhan', render: (row) => <p className="text-sm text-muted-foreground max-w-[200px] truncate">{row.complaint}</p> },
    { header: 'Mekanik', key: 'mechanic_name' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Total', render: (row) => <span className="font-semibold">¥ {(row.total_cost || 0).toLocaleString('ja-JP')}</span> },
    { header: 'Tanggal', render: (row) => row.created_date ? format(new Date(row.created_date), 'yyyy/MM/dd') : '-' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Work Order" description={`${workOrders.length} total work order`}
        actions={<Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" />Buat Work Order</Button>}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari WO, pelanggan, kendaraan..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><Filter className="w-3.5 h-3.5 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={setSelectedWO} />

      {showForm && (
        <WorkOrderForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['workOrders'] }); setShowForm(false); }}
        />
      )}

      {selectedWO && (
        <WorkOrderDetail
          workOrder={selectedWO}
          open={!!selectedWO}
          onClose={() => setSelectedWO(null)}
          onUpdate={() => { queryClient.invalidateQueries({ queryKey: ['workOrders'] }); setSelectedWO(null); }}
        />
      )}
    </div>
  );
}