import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
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

  // Only show WOs that have items (billable)
  const billableWOs = workOrders.filter(wo =>
    (wo.items && wo.items.length > 0) || wo.total_cost > 0
  );

  const filtered = billableWOs.filter(wo => {
    const matchSearch =
      wo.wo_number?.toLowerCase().includes(search.toLowerCase()) ||
      wo.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      wo.customer_name?.includes(search) ||
      wo.vehicle_info?.includes(search);
    if (!matchSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'completed') return ['Selesai', 'Sudah Diambil'].includes(wo.status);
    if (filter === 'active') return !['Selesai', 'Sudah Diambil'].includes(wo.status);
    return true;
  });

  const columns = [
    { header: 'No. WO', render: (row) => <span className="font-mono font-semibold text-primary text-xs">{row.wo_number || `WO-${row.id?.slice(-6)}`}</span> },
    { header: '顧客', render: (row) => <div><p className="font-medium text-sm">{row.customer_name}</p><p className="text-xs text-muted-foreground">{row.vehicle_info}</p></div> },
    { header: 'ステータス', render: (row) => <StatusBadge status={row.status} /> },
    { header: '合計', render: (row) => <span className="font-bold">¥ {(row.total_cost || 0).toLocaleString('ja-JP')}</span> },
    { header: '日付', render: (row) => formatDateJP(row.created_date) },
    { header: '操作', render: (row) => (
      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedWO(row); }}>
        <Eye className="w-3.5 h-3.5" /> 請求書
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="請求書 (Invoice)"
        description="Work Orderから請求書を発行・印刷"
        actions={
          <Button variant="outline" onClick={() => setShowSettings(true)} className="gap-2">
            <Settings className="w-4 h-4" />設定
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="WO番号・顧客名・車両で検索..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="completed">完了済み</SelectItem>
            <SelectItem value="active">作業中</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={setSelectedWO} />

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
