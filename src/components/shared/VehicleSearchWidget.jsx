import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import {
  Search, Car, User, Wrench, ChevronDown, ChevronUp, Clock, MapPin, Phone, Mail, Calendar,
  ClipboardList, Package, BadgeCheck, DollarSign, AlertCircle, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import StatusBadge from '@/components/shared/StatusBadge';
import ShakengBadge from '@/components/shared/ShakengBadge';

const formatCurrency = (n) => `¥ ${(n || 0).toLocaleString('ja-JP')}`;

export default function VehicleSearchWidget() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('chassis');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [expandedWO, setExpandedWO] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const filterField = searchType === 'chassis' ? 'chassis_number' : 'engine_number';
      const vehicles = await base44.entities.Vehicle.filter({ [filterField]: query.trim() }, '-created_date', 5);
      if (!vehicles || vehicles.length === 0) {
        setError('Kendaraan tidak ditemukan. Periksa kembali nomor rangka/mesin.');
        setLoading(false);
        return;
      }

      const vehicle = vehicles[0];
      let customer = null;
      let workOrders = [];

      if (vehicle.customer_id) {
        try { customer = await base44.entities.Customer.get(vehicle.customer_id); } catch (e) {}
        workOrders = await base44.entities.WorkOrder.filter({ vehicle_id: vehicle.id }, '-created_date', 50);
      }

      setResult({ vehicle, customer, workOrders });
    } catch (e) {
      setError('Gagal mencari data. Coba lagi.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Search Card */}
      <div className="bg-card rounded-xl border border-primary/20 p-5 shadow-lg shadow-primary/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-heading">Cari Riwayat Kendaraan</h2>
            <p className="text-xs text-muted-foreground">Telusuri berdasarkan nomor rangka atau nomor mesin</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden w-full sm:w-auto">
            <button
              onClick={() => setSearchType('chassis')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${searchType === 'chassis' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
            >
              No. Rangka
            </button>
            <button
              onClick={() => setSearchType('engine')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${searchType === 'engine' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
            >
              No. Mesin
            </button>
          </div>
          <div className="flex-1 flex gap-2">
            <Input
              placeholder={searchType === 'chassis' ? 'Masukkan nomor rangka...' : 'Masukkan nomor mesin...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 h-11"
            />
            <Button onClick={handleSearch} disabled={loading} className="h-11 px-5">
              <Search className="w-4 h-4 mr-2" />
              {loading ? 'Mencari...' : 'Cari'}
            </Button>
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Info Cards Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Customer Card */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <h3 className="font-semibold text-sm">Data Pemilik</h3>
              </div>
              {result.customer ? (
                <div className="space-y-2">
                  <p className="text-base font-bold">{result.customer.name}</p>
                  <div className="grid gap-1.5">
                    {result.customer.phone && <div className="flex items-center gap-2 text-xs"><Phone className="w-3 h-3 text-muted-foreground" /><span>{result.customer.phone}</span></div>}
                    {result.customer.email && <div className="flex items-center gap-2 text-xs"><Mail className="w-3 h-3 text-muted-foreground" /><span>{result.customer.email}</span></div>}
                    {result.customer.address && <div className="flex items-start gap-2 text-xs"><MapPin className="w-3 h-3 text-muted-foreground mt-0.5" /><span>{result.customer.address}</span></div>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                    <div className="bg-muted/30 rounded-lg p-2.5 text-center"><p className="text-[10px] text-muted-foreground">Kunjungan</p><p className="text-lg font-bold text-primary">{result.customer.total_visits || 0}x</p></div>
                    <div className="bg-muted/30 rounded-lg p-2.5 text-center"><p className="text-[10px] text-muted-foreground">Spending</p><p className="text-lg font-bold text-primary">{formatCurrency(result.customer.total_spending)}</p></div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Data tidak tersedia</p>
              )}
            </div>

            {/* Vehicle Card */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Car className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-sm">Data Kendaraan</h3>
              </div>
              <p className="text-base font-bold">{result.vehicle.brand} {result.vehicle.model} ({result.vehicle.year})</p>
              <p className="text-xs text-muted-foreground">{result.vehicle.plate_number} • {result.vehicle.color}</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="bg-muted/30 rounded-lg p-2"><p className="text-[10px] text-muted-foreground">Rangka</p><p className="font-mono text-[11px] font-medium break-all">{result.vehicle.chassis_number || '-'}</p></div>
                <div className="bg-muted/30 rounded-lg p-2"><p className="text-[10px] text-muted-foreground">Mesin</p><p className="font-mono text-[11px] font-medium break-all">{result.vehicle.engine_number || '-'}</p></div>
                <div className="bg-muted/30 rounded-lg p-2"><p className="text-[10px] text-muted-foreground">BBM / Transmisi</p><p className="font-medium">{result.vehicle.fuel_type || '-'} / {result.vehicle.transmission || '-'}</p></div>
                <div className="bg-muted/30 rounded-lg p-2"><p className="text-[10px] text-muted-foreground">Odometer</p><p className="font-medium">{result.vehicle.last_odometer ? `${result.vehicle.last_odometer.toLocaleString('ja-JP')} km` : '-'}</p></div>
              </div>
              <div className="mt-2 bg-muted/30 rounded-lg p-2">
                <ShakengBadge status={result.vehicle.shakeng_status || (result.vehicle.shakeng_expiry ? (new Date(result.vehicle.shakeng_expiry) < new Date() ? 'Habis' : 'Segera Habis') : '')} />
                {result.vehicle.shakeng_expiry && <p className="text-[10px] text-muted-foreground mt-1">Berlaku: {format(new Date(result.vehicle.shakeng_expiry), 'dd MMM yyyy')}</p>}
              </div>
            </div>
          </div>

          {/* Service History */}
          {result.workOrders.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-purple-500" />
                  <h3 className="font-semibold text-sm">Riwayat Service ({result.workOrders.length} WO)</h3>
                </div>
              </div>
              <div className="space-y-2">
                {result.workOrders.slice(0, 5).map(wo => {
                  const isExpanded = expandedWO === wo.id;
                  const totalCost = (wo.service_cost || 0) + (wo.parts_cost || 0) + (wo.tax || 0) - (wo.discount || 0);
                  return (
                    <div key={wo.id} className="border border-border rounded-lg overflow-hidden">
                      <button onClick={() => setExpandedWO(isExpanded ? null : wo.id)} className="w-full flex items-center justify-between p-3 hover:bg-muted/20 transition-colors text-left">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-semibold">{wo.wo_number || `WO-${wo.id?.slice(-6)}`}</p>
                            <p className="text-[10px] text-muted-foreground">{wo.created_date ? format(new Date(wo.created_date), 'dd MMM yyyy') : '-'} • {wo.mechanic_name || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={wo.status} />
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-muted/30 rounded p-2"><p className="text-[10px] font-semibold text-muted-foreground">Keluhan</p><p className="text-xs">{wo.complaint || '-'}</p></div>
                            <div className="bg-muted/30 rounded p-2"><p className="text-[10px] font-semibold text-muted-foreground">Diagnosa</p><p className="text-xs">{wo.diagnosis || '-'}</p></div>
                          </div>
                          {wo.items?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground mb-1">Item</p>
                              <div className="border border-border rounded overflow-hidden">
                                <table className="w-full text-[10px]">
                                  <thead className="bg-muted/30"><tr>
                                    <th className="text-left p-1.5 text-muted-foreground">Jenis</th>
                                    <th className="text-left p-1.5 text-muted-foreground">Item</th>
                                    <th className="text-center p-1.5 text-muted-foreground">Qty</th>
                                    <th className="text-right p-1.5 text-muted-foreground">Harga</th>
                                    <th className="text-right p-1.5 text-muted-foreground">Total</th>
                                  </tr></thead>
                                  <tbody>
                                    {wo.items.map((it, i) => (
                                      <tr key={i} className="border-t border-border">
                                        <td className="p-1.5"><span className={`text-[9px] px-1 py-0.5 rounded ${it.type==='service'?'bg-blue-500/10 text-blue-600':'bg-amber-500/10 text-amber-600'}`}>{it.type==='service'?'Jasa':'Part'}</span></td>
                                        <td className="p-1.5">{it.name}</td>
                                        <td className="p-1.5 text-center">{it.qty}</td>
                                        <td className="p-1.5 text-right">{formatCurrency(it.price)}</td>
                                        <td className="p-1.5 text-right font-medium">{formatCurrency(it.total)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          {wo.inspection && Object.values(wo.inspection).some(v => v) && (
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground mb-1">Inspeksi</p>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(wo.inspection).map(([k, v]) => {
                                  if (!v) return null;
                                  const s = v === 'Baik' ? 'bg-emerald-500/10 text-emerald-700' : v === 'Perlu Perhatian' ? 'bg-amber-500/10 text-amber-700' : 'bg-red-500/10 text-red-700';
                                  return <span key={k} className={`px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1 ${s}`}><BadgeCheck className="w-2.5 h-2.5" />{k.replace(/_/g,' ')}</span>;
                                })}
                              </div>
                            </div>
                          )}
                          {wo.technician_notes && <div className="bg-muted/30 rounded p-2"><p className="text-[10px] font-semibold text-muted-foreground">Catatan</p><p className="text-xs">{wo.technician_notes}</p></div>}
                          <div className="bg-muted/30 rounded p-2 flex justify-between items-center">
                            <span className="text-xs font-semibold">Total</span>
                            <span className="text-sm font-bold text-primary">{formatCurrency(wo.total_cost || totalCost)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}