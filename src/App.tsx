import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Monitors from "./pages/Monitors";
import Incidents from "./pages/Incidents";
import Alerts from "./pages/Alerts";
import StatusPages from "./pages/StatusPages";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import UserManagement from "./pages/UserManagement";
import OrganizationManagement from "./pages/OrganizationManagement";
import Maintenance from "./pages/Maintenance";
import Reports from "./pages/Reports";
import URLPerformanceReport from "./pages/URLPerformanceReport";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/monitors" element={<Monitors />} />
                <Route path="/incidents" element={<Incidents />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/reports/performance" element={<URLPerformanceReport />} />
                <Route path="/status-pages" element={<StatusPages />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/organization" element={<OrganizationManagement />} />
              </Route>

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
