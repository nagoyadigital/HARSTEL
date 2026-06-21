import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, ShieldAlert, Wrench, Package, AlertTriangle, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const typeIcons = {
  shakeng: ShieldAlert,
  workorder: Wrench,
  stock: Package,
  system: AlertTriangle,
};

const typeColors = {
  shakeng: 'text-amber-500 bg-amber-500/10',
  workorder: 'text-blue-500 bg-blue-500/10',
  stock: 'text-red-500 bg-red-500/10',
  system: 'text-slate-500 bg-slate-500/10',
};

const priorityBorder = {
  critical: 'border-l-2 border-l-red-500',
  high: 'border-l-2 border-l-amber-500',
  medium: 'border-l-2 border-l-amber-400/50',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  // Use react-query for auto-refresh every 60s
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 30),
    refetchInterval: 60000, // Refresh every 60 seconds
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAsRead = async (id) => {
    await base44.entities.Notification.update(id, { read: true });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await base44.entities.Notification.update(n.id, { read: true });
    }
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors duration-200"
        aria-label={`Notifikasi${unreadCount > 0 ? ` (${unreadCount} belum dibaca)` : ''}`}
      >
        <Bell className="w-[18px] h-[18px] text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-xl shadow-2xl shadow-black/30 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Notifikasi</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {unreadCount} baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Check className="w-3 h-3" /> Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <Bell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Belum ada notifikasi</p>
                <p className="text-xs text-muted-foreground mt-1">Notifikasi Shaken akan muncul otomatis</p>
              </div>
            ) : (
              notifications.map(n => {
                const Icon = typeIcons[n.type] || AlertTriangle;
                const borderClass = priorityBorder[n.priority] || '';
                return (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.read) markAsRead(n.id); }}
                    className={cn(
                      "flex items-start gap-3 p-3 border-b border-border/50 hover:bg-muted/30 transition-colors duration-150 cursor-pointer",
                      !n.read && "bg-primary/5",
                      borderClass
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", typeColors[n.type] || 'bg-muted')}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-tight", !n.read ? "font-semibold" : "text-muted-foreground")}>{n.title}</p>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                        {n.created_date ? format(new Date(n.created_date), 'yyyy/MM/dd HH:mm') : n.date || ''}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
