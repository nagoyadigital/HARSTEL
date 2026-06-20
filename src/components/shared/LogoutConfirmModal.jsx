import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 5,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function LogoutConfirmModal({ open, onClose }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    setLoggingOut(true);
    // Small delay for the loading animation to be visible
    await new Promise((r) => setTimeout(r, 400));
    await logout();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loggingOut) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleOverlayClick}
        >
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          {/* Modal Card */}
          <motion.div
            className="relative w-full max-w-[380px] bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Close button */}
            {!loggingOut && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors duration-200"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="p-6 pt-8">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <motion.div
                  className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <LogOut className="w-6 h-6 text-red-500" />
                </motion.div>
              </div>

              {/* Text */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-1.5">
                  Keluar dari Sistem
                </h3>
                <p className="text-sm text-muted-foreground">
                  Apakah Anda yakin ingin keluar? Sesi Anda akan diakhiri.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-11 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  onClick={onClose}
                  disabled={loggingOut}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 h-11 font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-600/20 transition-all duration-300 hover:shadow-red-600/35 hover:scale-[1.02] active:scale-[0.98]"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <AnimatePresence mode="wait">
                    {loggingOut ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Keluar...</span>
                      </motion.div>
                    ) : (
                      <motion.span
                        key="text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        Logout
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
