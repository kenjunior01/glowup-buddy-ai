import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CelebrationProvider } from "@/components/CelebrationSystem";
import { SubscriptionProvider } from "@/hooks/useSubscription";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Progress = lazy(() => import("./pages/Progress"));
const Profile = lazy(() => import("./pages/Profile"));
const Premium = lazy(() => import("./pages/Premium"));
const Install = lazy(() => import("./pages/Install"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <LoadingSpinner size="lg" text="Carregando..." />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CelebrationProvider>
        <SubscriptionProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen">
            <Navbar />
          <main className="pt-16">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/premium" element={<Premium />} />
                <Route path="/install" element={<Install />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </main>
          </div>
        </BrowserRouter>
        </SubscriptionProvider>
      </CelebrationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
