import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Wrench, ShieldCheck } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getShakenStatus, formatDaysRemaining } from '@/lib/shaken-utils';
import ShakenStatusBadge from '@/components/shaken/ShakenStatusBadge';
import { Link } from 'react-router-dom';

const COLORS = ['hsl(355,85%,45%)','hsl(355,70%,55%)','hsl(355,55%,40%)','hsl(0,70%,50%)','hsl(355,80%,35%)'];

export default function Reports() {
  const { data: transactions = [] } = useQuery({ queryKey:['transactions'], queryFn:()=>base44.entities.Transaction.list('-created_date',500) });
  const { data: workOrders = [] } = useQuery({ queryKey:['workOrders'], queryFn:()=>base44.entities.WorkOrder.list('-created_date',500) });
  const { data: mechanics = [] } = useQuery({ queryKey:['mechanics'], queryFn:()=>base44.entities.Mechanic.list() });
  const { data: shakenRecords = [] } = useQuery({ queryKey:['shaken'], queryFn:()=>base44.entities.Shaken.list('-shaken_expiry') });
  const { data: vehicles = [] } = useQuery({ queryKey:['vehicles'], queryFn:()=>base44.entities.Vehicle.list() });

  // Monthly revenue
  const monthlyMap = {};
  transactions.filter(t=>t.type==='Pemasukan').forEach(t => {
    const m = (t.date||'').slice(0,7);
    if(m) monthlyMap[m] = (monthlyMap[m]||0) + (t.amount||0);
  });
  const monthlyData = Object.entries(monthlyMap).sort().slice(-12).map(([m,v])=>({month:m.slice(5)+'/'+m.slice(2,4),revenue:v}));

  // Category breakdown (income)
  const catMap = {};
  transactions.filter(t=>t.type==='Pemasukan').forEach(t => {
    catMap[t.category||'Lainnya'] = (catMap[t.category||'Lainnya']||0) + (t.amount||0);
  });
  const catData = Object.entries(catMap).map(([name,value])=>({name,value}));

  // Mechanic performance
  const mechData = mechanics.map(m => {
    const wos = workOrders.filter(wo=>wo.mechanic_id===m.id && ['Selesai','Sudah Diambil'].includes(wo.status));
    return { name: m.name, jobs: wos.length, revenue: wos.reduce((s,wo)=>s+(wo.total_cost||0),0) };
  }).filter(d=>d.jobs>0).sort((a,b)=>b.jobs-a.jobs);

  const totalRevenue = transactions.filter(t=>t.type==='Pemasukan').reduce((s,t)=>s+(t.amount||0),0);
  const totalExpense = transactions.filter(t=>t.type==='Pengeluaran').reduce((s,t)=>s+(t.amount||0),0);
  const completedWOs = workOrders.filter(wo=>['Selesai','Sudah Diambil'].includes(wo.status)).length;

  const recentWOs = workOrders.slice(0,10);

  const woColumns = [
    { header:'No. WO', render:(row)=><span className="font-mono font-semibold text-primary">{row.wo_number||`WO-${row.id?.slice(-6)}`}</span> },
    { header:'Pelanggan', key:'customer_name' },
    { header:'Tanggal', render:(row)=>row.created_date?format(new Date(row.created_date),'dd MMM yyyy'):'-' },
    { header:'Total', render:(row)=><span className="font-semibold">¥ {(row.total_cost||0).toLocaleString('ja-JP')}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan" description="Analisis bisnis bengkel"/>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`¥ ${totalRevenue.toLocaleString('ja-JP')}`} icon={DollarSign}/>
        <StatCard title="Total Biaya" value={`¥ ${totalExpense.toLocaleString('ja-JP')}`} icon={TrendingUp}/>
        <StatCard title="Laba Bersih" value={`¥ ${(totalRevenue-totalExpense).toLocaleString('ja-JP')}`} icon={TrendingUp}/>
        <StatCard title="WO Selesai" value={completedWOs} icon={Wrench}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Revenue Bulanan</h3>
          {monthlyData.length>0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/><XAxis dataKey="month" tick={{fontSize:11}} stroke="hsl(var(--muted-foreground))"/><YAxis tick={{fontSize:11}} stroke="hsl(var(--muted-foreground))"/><Tooltip/><Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4,4,0,0]}/></BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Belum ada data</div>}
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Kategori Pemasukan</h3>
          {catData.length>0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart><Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value">{catData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Belum ada data</div>}
          <div className="flex flex-wrap gap-2 mt-2">{catData.map((d,i)=><div key={d.name} className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full" style={{background:COLORS[i%COLORS.length]}}/><span className="text-muted-foreground">{d.name}</span></div>)}</div>
        </div>
      </div>

      {mechData.length>0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Performa Mekanik</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mechData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/><XAxis type="number" tick={{fontSize:11}} stroke="hsl(var(--muted-foreground))"/><YAxis dataKey="name" type="category" width={120} tick={{fontSize:11}} stroke="hsl(var(--muted-foreground))"/><Tooltip/><Bar dataKey="jobs" fill="hsl(var(--primary))" radius={[0,4,4,0]} name="Jobs"/></BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold mb-4">Work Order Terbaru</h3>
        <DataTable columns={woColumns} data={recentWOs} isLoading={false} emptyMessage="Belum ada WO"/>
      </div>

      {/* Shaken Report Section */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold">Laporan Shaken (車検)</h3>
          </div>
          <Link to="/shaken" className="text-xs text-primary hover:underline">Lihat semua</Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Data</p>
            <p className="text-lg font-bold">{shakenRecords.length}</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-center">
            <p className="text-xs text-emerald-600">Aktif</p>
            <p className="text-lg font-bold text-emerald-600">{shakenRecords.filter(r => { const s = getShakenStatus(r.shaken_expiry); return s.daysRemaining > 90; }).length}</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-center">
            <p className="text-xs text-amber-600">Akan Habis</p>
            <p className="text-lg font-bold text-amber-600">{shakenRecords.filter(r => { const s = getShakenStatus(r.shaken_expiry); return s.daysRemaining !== null && s.daysRemaining >= 0 && s.daysRemaining <= 90; }).length}</p>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-center">
            <p className="text-xs text-red-600">Expired</p>
            <p className="text-lg font-bold text-red-600">{shakenRecords.filter(r => { const s = getShakenStatus(r.shaken_expiry); return s.daysRemaining !== null && s.daysRemaining < 0; }).length}</p>
          </div>
        </div>

        {/* Upcoming expirations */}
        {(() => {
          const upcoming = shakenRecords
            .filter(r => { const s = getShakenStatus(r.shaken_expiry); return s.daysRemaining !== null && s.daysRemaining >= 0 && s.daysRemaining <= 90; })
            .sort((a, b) => new Date(a.shaken_expiry) - new Date(b.shaken_expiry));
          if (upcoming.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">Tidak ada Shaken yang akan jatuh tempo dalam 90 hari</p>;
          const shakenColumns = [
            { header: 'Kendaraan', render: (row) => <div><p className="font-semibold text-sm">{row.vehicle_plate}</p><p className="text-xs text-muted-foreground">{row.vehicle_info}</p></div> },
            { header: 'Pelanggan', key: 'customer_name' },
            { header: 'Kadaluarsa', render: (row) => row.shaken_expiry ? format(new Date(row.shaken_expiry), 'dd MMM yyyy') : '-' },
            { header: 'Sisa Hari', render: (row) => { const { daysRemaining, color } = getShakenStatus(row.shaken_expiry); const c = color === 'red' ? 'text-red-500' : color === 'amber' ? 'text-amber-500' : 'text-emerald-500'; return <span className={`font-semibold ${c}`}>{formatDaysRemaining(daysRemaining)}</span>; } },
            { header: 'Status', render: (row) => <ShakenStatusBadge expiryDate={row.shaken_expiry} /> },
            { header: 'Est. Biaya', render: (row) => <span className="font-semibold">¥ {(row.total_estimated_cost || 0).toLocaleString('ja-JP')}</span> },
          ];
          return <DataTable columns={shakenColumns} data={upcoming.slice(0, 10)} isLoading={false} emptyMessage="Tidak ada data" />;
        })()}
      </div>
    </div>
  );
}