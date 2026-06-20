import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Search, Car, Users, Wrench, Loader2, ArrowRight, X, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ShakengBadge from '@/components/shared/ShakengBadge';
import StatusBadge from '@/components/shared/StatusBadge';

const MIN_QUERY = 2;
const DEBOUNCE_MS = 300;
const LIMIT_PER_CATEGORY = 5;

function highlight(text, query) {
  if (!text || !query) return text;
  const idx = String(text).toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return String(text);
  return (
    <>
      {String(text).slice(0, idx)}
      <mark className="bg-primary/20 text-primary rounded px-0.5">{String(text).slice(idx, idx + query.length)}</mark>
      {String(text).slice(idx + query.length)}
    </>
  );
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null); // { customers: [], vehicles: [], workOrders: [] } or null
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const performSearch = useCallback(async (q) => {
    if (!q || q.length < MIN_QUERY) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const lowerQ = q.toLowerCase();

      const [customers, vehicles, workOrders] = await Promise.all([
        base44.entities.Customer.list('-created_date', 100).then(list => {
          return (list || []).filter(c =>
            (c.name?.toLowerCase() || '').includes(lowerQ) ||
            (c.phone?.toLowerCase() || '').includes(lowerQ) ||
            (c.email?.toLowerCase() || '').includes(lowerQ)
          ).slice(0, LIMIT_PER_CATEGORY);
        }).catch(() => []),

        base44.entities.Vehicle.list('-created_date', 100).then(list => {
          return (list || []).filter(v =>
            (v.plate_number?.toLowerCase() || '').includes(lowerQ) ||
            (v.brand?.toLowerCase() || '').includes(lowerQ) ||
            (v.model?.toLowerCase() || '').includes(lowerQ) ||
            String(v.year || '').includes(lowerQ)
          ).slice(0, LIMIT_PER_CATEGORY);
        }).catch(() => []),

        base44.entities.WorkOrder.list('-created_date', 200).then(list => {
          return (list || []).filter(wo =>
            (wo.wo_number?.toLowerCase() || '').includes(lowerQ) ||
            (wo.customer_name?.toLowerCase() || '').includes(lowerQ) ||
            (wo.vehicle_info?.toLowerCase() || '').includes(lowerQ) ||
            (wo.status?.toLowerCase() || '').includes(lowerQ)
          ).slice(0, LIMIT_PER_CATEGORY);
        }).catch(() => []),
      ]);

      setResults({ customers, vehicles, workOrders });
    } catch {
      setResults({ customers: [], vehicles: [], workOrders: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, performSearch]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(-1);
    if (val.length >= MIN_QUERY) {
      setOpen(true);
    } else {
      setOpen(false);
      setResults(null);
    }
  };

  const handleFocus = () => {
    if (query.length >= MIN_QUERY && results) setOpen(true);
  };

  const totalResults = results
    ? results.customers.length + results.vehicles.length + results.workOrders.length
    : 0;

  // Build flat list for keyboard navigation
  const flatItems = [];
  if (results?.customers.length) {
    results.customers.forEach(c => flatItems.push({ type: 'customer', data: c }));
  }
  if (results?.vehicles.length) {
    results.vehicles.forEach(v => flatItems.push({ type: 'vehicle', data: v }));
  }
  if (results?.workOrders.length) {
    results.workOrders.forEach(wo => flatItems.push({ type: 'workorder', data: wo }));
  }

  const navigateTo = (item) => {
    setOpen(false);
    setQuery('');
    setResults(null);
    if (item.type === 'customer') {
      navigate('/customers');
    } else if (item.type === 'vehicle') {
      navigate('/vehicle-lookup');
    } else if (item.type === 'workorder') {
      navigate('/work-orders');
    }
  };

  const handleKeyDown = (e) => {
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
        navigateTo(flatItems[selectedIndex]);
      } else if (flatItems.length > 0) {
        navigateTo(flatItems[0]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Cari pelanggan, kendaraan, nomor polisi, nomor WO, nomor telepon..."
          className="pl-11 pr-10 h-12 text-base bg-card border-border focus-visible:ring-primary rounded-xl"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={() => { setQuery(''); setResults(null); setOpen(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && query.length >= MIN_QUERY && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {loading && !results ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              <span className="text-sm text-muted-foreground ml-2">Mencari...</span>
            </div>
          ) : totalResults === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Search className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Tidak ada hasil untuk "{query}"</p>
              <p className="text-xs text-muted-foreground mt-1">Coba kata kunci yang berbeda</p>
            </div>
          ) : (
            <>
              {/* Customers */}
              {results?.customers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pelanggan</span>
                    <span className="text-xs text-muted-foreground ml-auto">{results.customers.length}</span>
                  </div>
                  {results.customers.map((c, i) => {
                    const idx = flatItems.findIndex(f => f.type === 'customer' && f.data.id === c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => navigateTo({ type: 'customer', data: c })}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left border-b border-border/50 ${idx === selectedIndex ? 'bg-muted/40' : ''}`}
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{c.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{highlight(c.name, query)}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {highlight(c.phone, query)} {c.email ? `• ${highlight(c.email, query)}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Vehicles */}
              {results?.vehicles.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border">
                    <Car className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kendaraan</span>
                    <span className="text-xs text-muted-foreground ml-auto">{results.vehicles.length}</span>
                  </div>
                  {results.vehicles.map((v, i) => {
                    const idx = flatItems.findIndex(f => f.type === 'vehicle' && f.data.id === v.id);
                    return (
                      <button
                        key={v.id}
                        onClick={() => navigateTo({ type: 'vehicle', data: v })}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left border-b border-border/50 ${idx === selectedIndex ? 'bg-muted/40' : ''}`}
                      >
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Car className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{highlight(v.plate_number, query)}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {highlight(v.brand, query)} {highlight(v.model, query)} ({v.year}) • {v.customer_name}
                          </p>
                        </div>
                        {v.shakeng_status && <ShakengBadge status={v.shakeng_status} />}
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Work Orders */}
              {results?.workOrders.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border">
                    <Wrench className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Work Order</span>
                    <span className="text-xs text-muted-foreground ml-auto">{results.workOrders.length}</span>
                  </div>
                  {results.workOrders.map((wo, i) => {
                    const idx = flatItems.findIndex(f => f.type === 'workorder' && f.data.id === wo.id);
                    return (
                      <button
                        key={wo.id}
                        onClick={() => navigateTo({ type: 'workorder', data: wo })}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left border-b border-border/50 ${idx === selectedIndex ? 'bg-muted/40' : ''}`}
                      >
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Wrench className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{highlight(wo.wo_number || `WO-${wo.id?.slice(-6)}`, query)}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {highlight(wo.customer_name, query)} • {highlight(wo.vehicle_info, query)}
                          </p>
                        </div>
                        <StatusBadge status={wo.status} />
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="px-4 py-2.5 bg-muted/20 border-t border-border text-center">
                <span className="text-xs text-muted-foreground">
                  Tekan <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">↑↓</kbd> navigasi • <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd> buka • <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Esc</kbd> tutup
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}