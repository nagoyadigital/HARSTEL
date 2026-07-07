import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Dashboard from '@/pages/Dashboard';
import Customers from '@/pages/Customers';
import Vehicles from '@/pages/Vehicles';
import WorkOrders from '@/pages/WorkOrders';
import Spareparts from '@/pages/Spareparts';
import Inventory from '@/pages/Inventory';
import Mechanics from '@/pages/Mechanics';
import POS from '@/pages/POS';
import Bookings from '@/pages/Bookings';
import Reports from '@/pages/Reports';
import VehicleLookup from '@/pages/VehicleLookup';
import Shaken from '@/pages/Shaken';
import MasterData from '@/pages/MasterData';
import TaxReport from '@/pages/TaxReport';
import Settings from '@/pages/Settings';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';

/**
 * PublicRoute - redirects authenticated users to dashboard
 * Prevents logged-in users from accessing login page
 */
function PublicRoute({ children }) {
  const { isAuthenticated, isLoadingAuth, authChecked } = useAuth();

  // While still checking auth, show nothing (prevent flash)
  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-white/20 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - redirect to dashboard if already logged in */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />

      {/* Protected routes - require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/spareparts" element={<Spareparts />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/mechanics" element={<Mechanics />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/shaken" element={<Shaken />} />
          <Route path="/tax-report" element={<TaxReport />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/master-data" element={<MasterData />} />
          <Route path="/vehicle-lookup" element={<VehicleLookup />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
