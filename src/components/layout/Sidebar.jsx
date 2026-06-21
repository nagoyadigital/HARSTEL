import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Car, Wrench, Package, UserCog,
  Receipt, Calendar, BarChart3, ChevronLeft, ChevronRight,
  LogOut, Warehouse, Search, ShieldCheck, Database, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LogoutConfirmModal from '@/components/shared/LogoutConfirmModal';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Search, label: 'Cari Kendaraan', path: '/vehicle-lookup' },
  { icon: Users, label: 'Pelanggan', path: '/customers' },
  { icon: Car, label: 'Kendaraan', path: '/vehicles' },
  { icon: Wrench, label: 'Work Order', path: '/work-orders' },
  { icon: Package, label: 'Sparepart', path: '/spareparts' },
  { icon: Warehouse, label: 'Inventori', path: '/inventory' },
  { icon: UserCog, label: 'Mekanik', path: '/mechanics' },
  { icon: ShieldCheck, label: 'Shaken (車検)', path: '/shaken' },
  { icon: Receipt, label: 'Kasir / POS', path: '/pos' },
  { icon: FileText, label: 'Invoice (請求書)', path: '/invoice' },
  { icon: Calendar, label: 'Booking', path: '/bookings' },
  { icon: BarChart3, label: 'Laporan', path: '/reports' },
  { icon: Database, label: 'Master Data', path: '/master-data' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground z-50 flex flex-col transition-all duration-300 border-r border-sidebar-border",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Wrench className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-heading font-bold text-sm text-sidebar-primary-foreground whitespace-nowrap">
                HARSTEL
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-sidebar-border space-y-1">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 w-full"
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 w-full"
          >
            {collapsed ? <ChevronRight className="w-[18px] h-[18px]" /> : <ChevronLeft className="w-[18px] h-[18px]" />}
            {!collapsed && <span>Tutup Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />
    </>
  );
}
