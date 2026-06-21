import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldX, AlertTriangle, ArrowRight, X, Clock, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { checkShakenNotifications } from '@/lib/shaken-notification-checker';
import { format } from 'date-fns';

const DISMISS_KEY = 'harstel_shaken_popup_dismissed';
const DISMISS_TOMORROW_KEY = 'harstel_shaken_popup_tomorrow';

export default function ShakenAlertPopup() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    checkAndShow();
  }, []);

  const checkAndShow = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');

    // Check if already dismissed today (max 1x per day per login)
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed === today) return;

    // Check "Ingatkan Besok" - only show again tomorrow
    const tomorrow = localStorage.getItem(DISMISS_TOMORROW_KEY);
    if (tomorrow === today) return;

    try {
      const results = await checkShakenNotifications();
      const totalAlerts = results.expired.length + results.critical30.length +
        results.warning60.length + results.warning90.length;

      if (totalAlerts > 0) {
        setData(results);
        setVisible(true);
      }
    } catch (e) {
      console.error('Shaken check failed:', e);
    }
  };

  const handleClose = () => {
    // Dismissed for today (won't show again today)
    localStorage.setItem(DISMISS_KEY, format(new Date(), 'yyyy-MM-dd'));
    setVisible(false);
  };

  const handleRemindTomorrow = () => {
    // Set to remind again tomorrow
    localStorage.setItem(DISMISS_TOMORROW_KEY, format(new Date(), 'yyyy-MM-dd'));
    localStorage.setItem(DISMISS_KEY, format(new Date(), 'yyyy-MM-dd'));
    setVisible(false);
  };

  if (!visible || !data) return null;

  const { expired, critical30, warning60, warning90 } = data;
  const totalAlerts = expired.length + critical30.length + warning60.length + warning90.length;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600/10 to-amber-600/10 border-b border-border p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Peringatan Shaken (車検)</h2>
                    <p className="text-xs text-muted-foreground">{totalAlerts} kendaraan memerlukan perhatian</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {expired.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-center">
                    <ShieldX className="w-5 h-5 text-red-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-red-500">{expired.length}</p>
                    <p className="text-[10px] text-red-400 uppercase tracking-wider">Expired</p>
                  </div>
                )}
                {critical30.length > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-center">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-amber-500">{critical30.length}</p>
                    <p className="text-[10px] text-amber-400 uppercase tracking-wider">&lt; 30 Hari</p>
                  </div>
                )}
                {(warning60.length + warning90.length) > 0 && (
                  <div className="bg-amber-500/5 border border-amber-400/15 rounded-xl p-3 text-center">
                    <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-amber-400">{warning60.length + warning90.length}</p>
                    <p className="text-[10px] text-amber-300 uppercase tracking-wider">&lt; 90 Hari</p>
                  </div>
                )}
              </div>

              {/* Vehicle List */}
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {expired.slice(0, 2).map(v => (
                  <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
                    <div>
                      <p className="text-sm font-semibold">{v.plate_number}</p>
                      <p className="text-xs text-muted-foreground">{v.brand} {v.model} • {v.customer_name}</p>
                    </div>
                    <span className="text-xs font-semibold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                      Expired {Math.abs(v.daysRemaining)}d
                    </span>
                  </div>
                ))}
                {critical30.slice(0, 3).map(v => (
                  <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <div>
                      <p className="text-sm font-semibold">{v.plate_number}</p>
                      <p className="text-xs text-muted-foreground">{v.brand} {v.model} • {v.customer_name}</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {v.daysRemaining} hari
                    </span>
                  </div>
                ))}
                {totalAlerts > 5 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{totalAlerts - Math.min(expired.length, 2) - Math.min(critical30.length, 3)} kendaraan lainnya...
                  </p>
                )}
              </div>
            </div>

            {/* Actions - 3 buttons */}
            <div className="p-5 pt-0 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={handleClose}
              >
                <X className="w-3.5 h-3.5" /> Tutup
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={handleRemindTomorrow}
              >
                <CalendarClock className="w-3.5 h-3.5" /> Ingatkan Besok
              </Button>
              <Link to="/shaken" className="flex-1" onClick={() => setVisible(false)}>
                <Button size="sm" className="w-full gap-1.5 text-xs bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600">
                  Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
