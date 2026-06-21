import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Search, Car, User, MapPin, Phone, Mail, Calendar, Wrench,
  ClipboardList, Package, ChevronDown, ChevronUp, AlertCircle,
  Clock, BadgeCheck, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import StatusBadge from '@/components/shared/StatusBadge';
import ShakengBadge from '@/components/shared/ShakengBadge';

export default function VehicleLookup() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('chassis');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [expandedWO, setExpandedWO] = useState(null);

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
        try {
          customer = await base44.entities.Customer.get(vehicle.customer_id);
        } catch (e) { /* customer might be deleted */ }
        workOrders = await base44.entities.WorkOrder.filter({ vehicle_id: vehicle.id }, '-created_date', 50);
      }

      setResult({ vehicle, customer, workOrders });
    } catch (e) {
      setError('Gagal mencari data. Coba lagi.');
    }
    setLoading(false);
  };

  const formatCurrency = (n) => `¥ ${(n || 0).toLocaleString('ja-JP')}`;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold font-heading">Cari Riwayat Kendaraan</h1>
        <p className="text-sm text-muted-foreground mt-1">Cari berdasarkan nomor rangka atau nomor mesin</p>
      </div>

      {/* Search Bar */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden w-full sm:w-auto">
            <button
              onClick={() => setSearchType('chassis')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${searchType === 'chassis' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
            >
              No. Rangka
            </button>
            <button
              onClick={() => setSearchType('engine')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${searchType === 'engine' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
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
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
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

      {/* Result */}
      {result && (
        <div className="space-y-5">
          {/* Info Pelanggan & Kendaraan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Customer Card */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-500" />
                </div>
                <h3 className="font-semibold text-sm">Data Pemilik</h3>
              </div>
              {result.customer ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-lg font-bold">{result.customer.name}</p>
                  </div>
                  <div className="grid gap-2">
                    {result.customer.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>{result.customer.phone}</span>
                      </div>
                    )}
                    {result.customer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>{result.customer.email}</span>
                      </div>
                    )}
                    {result.customer.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span>{result.customer.address}</span>
                      </div>
                    )}
                    {result.customer.join_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>Bergabung: {format(new Date(result.customer.join_date), 'yyyy/MM/dd')}</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Total Kunjungan</p>
                      <p className="text-xl font-bold text-primary">{result.customer.total_visits || 0}x</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Total Spending</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(result.customer.total_spending)}</p>
                    </div>
                  </div>
                  {result.customer.notes && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs text-amber-700 font-medium">Catatan: {result.customer.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Data pelanggan tidak tersedia</p>
              )}
            </div>

            {/* Vehicle Card */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Car className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-sm">Data Kendaraan</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-bold">{result.vehicle.brand} {result.vehicle.model} ({result.vehicle.year})</p>
                  <p className="text-sm text-muted-foreground">{result.vehicle.plate_number} • {result.vehicle.color}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/30 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground">No. Rangka</p>
                    <p className="font-mono text-xs font-medium break-all">{result.vehicle.chassis_number || '-'}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground">No. Mesin</p>
                    <p className="font-mono text-xs font-medium break-all">{result.vehicle.engine_number || '-'}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground">BBM / Transmisi</p>
                    <p className="font-medium">{result.vehicle.fuel_type || '-'} / {result.vehicle.transmission || '-'}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground">Odometer Terakhir</p>
                    <p className="font-medium">{result.vehicle.last_odometer ? `${result.vehicle.last_odometer.toLocaleString('ja-JP')} km` : '-'}</p>
                  </div>
                  <div className="col-span-2 bg-muted/30 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground mb-1">Status Shakeng (車検)</p>
                    <ShakengBadge status={result.vehicle.shakeng_status || (result.vehicle.shakeng_expiry ? (new Date(result.vehicle.shakeng_expiry) < new Date() ? 'Habis' : (Math.ceil((new Date(result.vehicle.shakeng_expiry) - new Date()) / (86400000)) <= 30 ? 'Segera Habis' : 'Valid')) : '')} />
                    {result.vehicle.shakeng_expiry && <p className="text-xs text-muted-foreground mt-1">Berlaku sampai: {format(new Date(result.vehicle.shakeng_expiry), 'yyyy/MM/dd')}</p>}
                  </div>
                </div>
                {result.vehicle.purchase_date && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Dibeli: {format(new Date(result.vehicle.purchase_date), 'yyyy/MM/dd')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Riwayat Service */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Riwayat Service Lengkap</h3>
                <p className="text-xs text-muted-foreground">{result.workOrders.length} work order ditemukan</p>
              </div>
            </div>

            {result.workOrders.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="p-3 rounded-xl bg-muted/50 mb-3">
                  <Clock className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Belum ada riwayat service</p>
              </div>
            ) : (
              <div className="space-y-3">
                {result.workOrders.map((wo, idx) => {
                  const isExpanded = expandedWO === wo.id;
                  const totalCost = (wo.service_cost || 0) + (wo.parts_cost || 0) + (wo.tax || 0) - (wo.discount || 0);
                  return (
                    <div key={wo.id} className="border border-border rounded-lg overflow-hidden">
                      {/* WO Header */}
                      <button
                        onClick={() => setExpandedWO(isExpanded ? null : wo.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Wrench className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{wo.wo_number || `WO-${wo.id?.slice(-6)}`}</p>
                            <p className="text-xs text-muted-foreground">
                              {wo.created_date ? format(new Date(wo.created_date), 'yyyy/MM/dd') : '-'} • {wo.mechanic_name || 'Belum ditugaskan'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={wo.status} />
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>

                      {/* WO Detail */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                          {/* Complaint & Diagnosis */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-muted/30 rounded-lg p-3">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Keluhan</p>
                              <p className="text-sm">{wo.complaint || '-'}</p>
                            </div>
                            <div className="bg-muted/30 rounded-lg p-3">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Diagnosa</p>
                              <p className="text-sm">{wo.diagnosis || '-'}</p>
                            </div>
                          </div>

                          {/* Items */}
                          {wo.items && wo.items.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Item Pekerjaan & Sparepart</p>
                              <div className="border border-border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-muted/30">
                                    <tr>
                                      <th className="text-left p-2 text-xs font-semibold text-muted-foreground">Jenis</th>
                                      <th className="text-left p-2 text-xs font-semibold text-muted-foreground">Item</th>
                                      <th className="text-center p-2 text-xs font-semibold text-muted-foreground">Qty</th>
                                      <th className="text-right p-2 text-xs font-semibold text-muted-foreground">Harga</th>
                                      <th className="text-right p-2 text-xs font-semibold text-muted-foreground">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {wo.items.map((item, i) => (
                                      <tr key={i} className="border-t border-border">
                                        <td className="p-2">
                                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${item.type === 'service' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                            {item.type === 'service' ? 'Jasa' : 'Part'}
                                          </span>
                                        </td>
                                        <td className="p-2 text-xs">{item.name}</td>
                                        <td className="p-2 text-center text-xs">{item.qty}</td>
                                        <td className="p-2 text-right text-xs">{formatCurrency(item.price)}</td>
                                        <td className="p-2 text-right text-xs font-medium">{formatCurrency(item.total)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Inspection */}
                          {wo.inspection && Object.values(wo.inspection).some(v => v) && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Hasil Inspeksi</p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                                {Object.entries(wo.inspection).map(([key, val]) => {
                                  if (!val) return null;
                                  const isGood = val === 'Baik';
                                  const isWarn = val === 'Perlu Perhatian';
                                  const isBad = val === 'Harus Diganti';
                                  return (
                                    <div key={key} className={`px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 ${
                                      isGood ? 'bg-emerald-500/10 text-emerald-700' :
                                      isWarn ? 'bg-amber-500/10 text-amber-700' :
                                      'bg-red-500/10 text-red-700'
                                    }`}>
                                      {isGood ? <BadgeCheck className="w-3 h-3" /> :
                                       isWarn ? <AlertCircle className="w-3 h-3" /> :
                                       <AlertCircle className="w-3 h-3" />}
                                      <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Technician Notes */}
                          {wo.technician_notes && (
                            <div className="bg-muted/30 rounded-lg p-3">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Catatan Teknisi</p>
                              <p className="text-sm">{wo.technician_notes}</p>
                            </div>
                          )}

                          {/* Cost Summary */}
                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Biaya Jasa</span>
                              <span>{formatCurrency(wo.service_cost)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Biaya Sparepart</span>
                              <span>{formatCurrency(wo.parts_cost)}</span>
                            </div>
                            {wo.discount > 0 && (
                              <div className="flex justify-between text-sm mb-1 text-emerald-600">
                                <span>Diskon</span>
                                <span>-{formatCurrency(wo.discount)}</span>
                              </div>
                            )}
                            {wo.tax > 0 && (
                              <div className="flex justify-between text-sm mb-1 tax-line">
                                <span className="text-muted-foreground">Pajak 10%</span>
                                <span>{formatCurrency(wo.tax)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm font-bold pt-1 border-t border-border">
                              <span>Total (Termasuk Pajak)</span>
                              <span className="text-primary">{formatCurrency(wo.total_cost || totalCost)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}