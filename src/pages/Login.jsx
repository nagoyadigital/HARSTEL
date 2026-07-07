import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Lock, Loader2, Eye, EyeOff, Wrench, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Premium easing curves
const premiumEase = [0.25, 0.46, 0.45, 0.94];
const smoothEase = [0.4, 0.0, 0.2, 1.0];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username wajib diisi");
      return;
    }
    if (!password.trim()) {
      setError("Password wajib diisi");
      return;
    }

    setLoading(true);
    try {
      await base44.auth.loginViaUsernamePassword(username.trim(), password, rememberMe);
      // Trigger success animation before navigating
      setLoginSuccess(true);
      await checkUserAuth();
      // Wait for exit animation to complete before navigating
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 600);
    } catch (err) {
      setError(err.message || "Username atau password salah");
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen w-full relative flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: premiumEase }}
    >
      {/* Background Image - Porsche 911 */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1920&q=80')`,
        }}
        initial={{ scale: 1.05 }}
        animate={{ scale: loginSuccess ? 1.12 : 1.0 }}
        transition={{ duration: loginSuccess ? 0.8 : 1.2, ease: smoothEase }}
      />

      {/* Dark Overlay with gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/85"
        animate={{ opacity: loginSuccess ? 0.95 : 1 }}
        transition={{ duration: 0.6, ease: smoothEase }}
      />

      {/* Subtle blur overlay */}
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Cinematic light effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-red-950/20 via-transparent to-transparent" />
      <motion.div
        className="absolute top-0 left-1/3 w-96 h-96 bg-red-600/5 rounded-full blur-[100px]"
        animate={{ opacity: loginSuccess ? 0.15 : 0.05 }}
        transition={{ duration: 0.8 }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-[80px]"
        animate={{ opacity: loginSuccess ? 0.15 : 0.05 }}
        transition={{ duration: 0.8 }}
      />

      {/* Login Card */}
      <AnimatePresence mode="wait">
        {!loginSuccess ? (
          <motion.div
            key="login-card"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: -20,
              scale: 0.97,
              filter: "blur(8px)",
              transition: { duration: 0.5, ease: premiumEase },
            }}
            transition={{ duration: 0.6, ease: premiumEase }}
            className="relative z-10 w-full max-w-[420px] mx-4"
          >
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-8 md:p-10">
              {/* Logo & Branding */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: premiumEase }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 shadow-lg shadow-red-600/30 mb-4">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  HARSTEL
                </h1>
                <p className="text-sm text-white/50 mt-1">Workshop Management System</p>
              </motion.div>

              {/* Error Message */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.3, ease: premiumEase }}
                    className="mb-6"
                  >
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5, ease: premiumEase }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-white/80">
                    Nama User
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
                    <Input
                      id="username"
                      type="text"
                      autoComplete="username"
                      autoFocus
                      placeholder="Masukkan username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-red-500/50 focus:ring-red-500/20 transition-all duration-200"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-white/80">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-red-500/50 focus:ring-red-500/20 transition-all duration-200"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors duration-200"
                      tabIndex={-1}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                    className="border-white/20 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-white/60 cursor-pointer select-none"
                  >
                    Ingat saya
                  </Label>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-12 font-semibold text-sm bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-600/25 transition-all duration-300 hover:shadow-red-600/40 hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memproses...</span>
                      </motion.div>
                    ) : (
                      <motion.span
                        key="text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        Masuk
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.form>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5, ease: premiumEase }}
                className="mt-8 pt-6 border-t border-white/5"
              >
                <p className="text-center text-xs text-white/30">
                  &copy; {new Date().getFullYear()} HARSTEL Workshop Management System
                </p>
                <p className="text-center text-xs text-white/20 mt-1">
                  Powered by Nagoya Digital
                </p>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* Success state - brief flash before navigation */
          <motion.div
            key="success-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: premiumEase }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, ease: premiumEase, delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/30"
            >
              <motion.svg
                className="w-8 h-8 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.2, ease: premiumEase }}
                />
              </motion.svg>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="text-white/80 text-sm font-medium"
            >
              Login berhasil
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
