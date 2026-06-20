import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Car, Users, Wrench, DollarSign, Clock, AlertCircle, UserCog, ArrowRight, ShieldAlert
} from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import ShakengBadge from '@/components/shared/ShakengBadge';
import GlobalSearch from '@/components/shared/GlobalSearch';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['hsl(355,85%,45%)', 'hsl(355,70%,55%)', 'hsl(355,55%,40%)', 'hsl(0,70%,50%)', 'hsl(355,80%,35%)'];

const IN_SERVICE_STATUSES = ['Inspeksi', 'Estimasi', 'Menunggu Approval', 'Sedang Dikerjakan', 'Menunggu Sparepart', 'Quality Check'];
const PENDING_STATUSES = ['Menunggu', 'Menunggu Approval', 'Menunggu Sparepart'];

export default function Dashboard() {
  const { data: workOrders = [] } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date', 200),
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 200),
  });
  const { data: mechanics = [] } = useQuery({
    queryKey: ['mechanics'],
    queryFn: () => base44.entities.Mechanic.list(),
  });
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list('-created_date'),
  });

  const today = format(new Date(), 'yyyy-MM-dd');

  // Mobil yang sedang diservis (WO yang aktif dikerjakan)
  const carsInService = workOrders.filter(wo => IN_SERVICE_STATUSES.includes(wo.status));
  const justArrived = workOrders.filter(wo => wo.status === 'Menunggu');

  // Pendapatan hari ini
  const todayRevenue = transactions
    .filter(t => t.type === 'Pemasukan' && t.date === today)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Completed today
  const completedToday = workOrders.filter(wo =>
    (wo.status === 'Selesai' || wo.status === 'Sudah Diambil') && wo.created_date?.startsWith(today)
  );

  // Tugas mekanik tertunda (WO pending + ada mekanik ditugaskan)
  const pendingTasks = workOrders.filter(wo =>
    PENDING_STATUSES.includes(wo.status) && wo.mechanic_id
  );

  // Group pending tasks by mechanic
  const tasksByMechanic = {};
  pendingTasks.forEach(wo => {
    const key = wo.mechanic_id;
    if (!tasksByMechanic[key]) {
      tasksByMechanic[key] = { mechanic: wo.mechanic_name || 'Belum Ditugaskan', wos: [] };
    }
    tasksByMechanic[key].wos.push(wo);
  });

  // Status distribution for active WOs
  const activeWOs = workOrders.filter(wo => !['Selesai', 'Sudah Diambil'].includes(wo.status));
  const statusDistribution = {};
  activeWOs.forEach(wo => {
    statusDistribution[wo.status] = (statusDistribution[wo.status] || 0) + 1;
  });
  const statusData = Object.entries(statusDistribution).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">HARSTEL WORKSHOP</h1>
        <p className="text-sm text-muted-foreground mt-1">Ringkasan operasional hari ini</p>
      </div>

      {/* Global Search */}
      <GlobalSearch />

      {/* Main Stats - 3 cards besar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Mobil Sedang Diservis"
          value={carsInService.length}
          subtitle={`${justArrived.length} mobil menunggu antrian`}
          icon={Car}
        />
        <StatCard
          title="Pendapatan Hari Ini"
          value={`¥ ${todayRevenue.toLocaleString('ja-JP')}`}
          subtitle={`${completedToday.length} kendaraan selesai`}
          icon={DollarSign}
        />
        <StatCard
          title="Tugas Mekanik Tertunda"
          value={pendingTasks.length}
          subtitle={`${Object.keys(tasksByMechanic).length} mekanik menunggu`}
          icon={AlertCircle}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">WO Aktif</p>
          <p className="text-xl font-bold mt-1">{activeWOs.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Mekanik Aktif</p>
          <p className="text-xl font-bold mt-1">{mechanics.filter(m => m.status === 'Aktif').length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Selesai Hari Ini</p>
          <p className="text-xl font-bold mt-1 text-emerald-600">{completedToday.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Menunggu</p>
          <p className="text-xl font-bold mt-1 text-amber-600">{justArrived.length}</p>
        </div>
      </div>

      {/* Dua Kolom: Status Pie + Tugas Mekanik Tertunda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status WO Pie */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Status Work Order Aktif</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">Tidak ada WO aktif</div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {statusData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daftar Tugas Mekanik Tertunda */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Tugas Mekanik Tertunda</h3>
            <Link to="/work-orders" className="text-xs text-primary hover:underline flex items-center gap-1">
              Lihat semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {Object.keys(tasksByMechanic).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="p-3 rounded-xl bg-muted/50 mb-3">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Tidak ada tugas tertunda</p>
              <p className="text-xs text-muted-foreground mt-1">Semua mekanik clear!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(tasksByMechanic).map(([mechId, group]) => (
                <div key={mechId} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {group.mechanic?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold">{group.mechanic}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{group.wos.length} WO</span>
                  </div>
                  <div className="space-y-1.5 ml-9">
                    {group.wos.map(wo => (
                      <div key={wo.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="text-xs font-medium">{wo.wo_number || `WO-${wo.id?.slice(-6)}`}</p>
                          <p className="text-xs text-muted-foreground">{wo.customer_name} • {wo.vehicle_info}</p>
                        </div>
                        <StatusBadge status={wo.status} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shakeng Alerts */}
      {(() => {
        const now = new Date();
        const expiringVehicles = vehicles.filter(v => {
          if (!v.shakeng_expiry) return false;
          const exp = new Date(v.shakeng_expiry);
          const diffDays = Math.ceil((exp - now) / (86400000));
          return diffDays <= 30;
        });
        if (expiringVehicles.length === 0) return null;
        return (
          <div className="bg-card rounded-xl border border-amber-500/20 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-semibold">Shakeng (車検) — Perhatian</h3>
              <span className="text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">{expiringVehicles.length} kendaraan</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {expiringVehicles.slice(0, 6).map(v => {
                const exp = new Date(v.shakeng_expiry);
                const diffDays = Math.ceil((exp - now) / (86400000));
                const status = diffDays < 0 ? 'Habis' : 'Segera Habis';
                return (
                  <Link key={v.id} to="/vehicle-lookup" className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold">{v.plate_number}</p>
                      <p className="text-xs text-muted-foreground">{v.brand} {v.model} • {v.customer_name}</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        {diffDays < 0 ? `Habis ${Math.abs(diffDays)} hari lalu` : `Sisa ${diffDays} hari`} — {format(exp, 'dd MMM yyyy')}
                      </p>
                    </div>
                    <ShakengBadge status={status} />
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}