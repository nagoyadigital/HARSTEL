import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import PageTransition from '@/components/shared/PageTransition';
import ShakenAlertPopup from '@/components/shaken/ShakenAlertPopup';
import { generateShakenNotifications } from '@/lib/shaken-notification-checker';

export default function AppLayout() {
  // Auto-generate shaken notifications on app load
  useEffect(() => {
    generateShakenNotifications();
  }, []);

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Sidebar />
      <div className="ml-[240px] transition-all duration-300">
        <TopBar />
        <main className="p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* Shaken Priority Alert Popup */}
      <ShakenAlertPopup />
    </motion.div>
  );
}
