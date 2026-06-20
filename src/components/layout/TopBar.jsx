import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import NotificationBell from './NotificationBell';
import HeaderVehicleSearch from '@/components/shared/HeaderVehicleSearch';

export default function TopBar() {
  const { user } = useAuth();
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex-1 max-w-lg">
        <HeaderVehicleSearch />
      </div>
      <div className="flex items-center gap-4 ml-4">
        <NotificationBell />
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">{user?.full_name || 'User'}</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{user?.role || 'admin'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}