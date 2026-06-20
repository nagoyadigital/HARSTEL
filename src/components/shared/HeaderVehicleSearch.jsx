import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, Car, User, Wrench } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import ShakengBadge from '@/components/shared/ShakengBadge';

const DEBOUNCE_MS = 300;
const LIMIT = 4;

export default function HeaderVehicleSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = async (q) => {
    if (!q || q.length < 2) { setResults(null); setLoading(false); return; }
    setLoading(true);
    try {
      const lower = q.toLowerCase();
      const [vehicles, customers, workOrders] = await Promise.all([
        base44.entities.Vehicle.list('-created_date', 50).then(list =>
          (list || []).filter(v =>
            (v.plate_number?.toLowerCase() || '').includes(lower) ||
            (v.chassis_number?.toLowerCase() || '').includes(lower) ||
            (v.engine_number?.toLowerCase() || '').includes(lower) ||
            (v.brand?.toLowerCase() || '').includes(lower) ||
            (v.model?.toLowerCase() || '').includes(lower) ||
            String(v.year || '').includes(lower)
          ).slice(0, LIMIT)
        ).catch(() => []),
        base44.entities.Customer.list('-created_date', 50).then(list =>
          (list || []).filter(c =>
            (c.name?.toLowerCase() || '').includes(lower) ||
            (c.phone?.toLowerCase() || '').includes(lower)
          ).slice(0, LIMIT)
        ).catch(() => []),
        base44.entities.WorkOrder.list('-created_date', 50).then(list =>
          (list || []).filter(wo =>
            (wo.wo_number?.toLowerCase() || '').includes(lower) ||
            (wo.customer_name?.toLowerCase() || '').includes(lower) ||
            (wo.vehicle_info?.toLowerCase() || '').includes(lower)
          ).slice(0, LIMIT)
        ).catch(() => []),
      ]);
      setResults({ vehicles, customers, workOrders });
    } catch {
      setResults({ vehicles: [], customers: [], workOrders: [] });
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.length >= 2) {
      setOpen(true);
      debounceRef.current = setTimeout(() => search(v), DEBOUNCE_MS);
    } else {
      setOpen(false);
      setResults(null);
    }
  };

  const total = results ? results.vehicles.length + results.customers.length + results.workOrders.length : 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => { if (query.length >= 2 && results) setOpen(true); }}
          placeholder="Cari no. rangka / mesin / plat / pelanggan / WO..."
          className="w-full h-9 pl-9 pr-8 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition-all"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />}
        {!loading && query && (
          <button onClick={() => { setQuery(''); setResults(null); setOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-2xl z-50 overflow-hidden max-h-[500px] overflow-y-auto">
          {loading && !results ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /><span className="text-xs text-muted-foreground ml-2">Mencari...</span></div>
          ) : total === 0 ? (
            <div className="py-6 text-center"><p className="text-xs text-muted-foreground">Tidak ada hasil</p></div>
          ) : (
            <>
              {results?.vehicles.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 bg-muted/30 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Kendaraan</div>
                  {results.vehicles.map(v => (
                    <button key={v.id} onClick={() => { setOpen(false); setQuery(''); navigate('/vehicle-lookup'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors text-left">
                      <Car className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{v.plate_number} — {v.brand} {v.model} ({v.year})</p>
                        <p className="text-[10px] text-muted-foreground">Rangka: {v.chassis_number || '-'} | Mesin: {v.engine_number || '-'}</p>
                      </div>
                      {v.shakeng_status && <ShakengBadge status={v.shakeng_status} />}
                    </button>
                  ))}
                </div>
              )}
              {results?.customers.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 bg-muted/30 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Pelanggan</div>
                  {results.customers.map(c => (
                    <button key={c.id} onClick={() => { setOpen(false); setQuery(''); navigate('/customers'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors text-left">
                      <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.phone} {c.email ? `• ${c.email}` : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results?.workOrders.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 bg-muted/30 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Work Order</div>
                  {results.workOrders.map(wo => (
                    <button key={wo.id} onClick={() => { setOpen(false); setQuery(''); navigate('/work-orders'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors text-left">
                      <Wrench className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{wo.wo_number || `WO-${wo.id?.slice(-6)}`}</p>
                        <p className="text-[10px] text-muted-foreground">{wo.customer_name} • {wo.vehicle_info}</p>
                      </div>
                      <StatusBadge status={wo.status} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}