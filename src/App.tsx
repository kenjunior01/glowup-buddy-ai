import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Social from "./pages/Social";
import Challenges from "./pages/Challenges";
import ChatPage from "./pages/Chat";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Install from "./pages/Install";
import Marketplace from "./pages/Marketplace";
import ProductDetails from "./pages/ProductDetails";
import SellerDashboard from "./pages/SellerDashboard";
import CreateProduct from "./pages/CreateProduct";
import EditProduct from "./pages/EditProduct";
import MyPurchases from "./pages/MyPurchases";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Advertising from "./pages/Advertising";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen">
          <Navbar />
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/social" element={<ProtectedRoute><Social /></ProtectedRoute>} />
              <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:id" element={<ProductDetails />} />
              <Route path="/seller-dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
              <Route path="/create-product" element={<ProtectedRoute><CreateProduct /></ProtectedRoute>} />
              <Route path="/edit-product/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
              <Route path="/my-purchases" element={<ProtectedRoute><MyPurchases /></ProtectedRoute>} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />
              <Route path="/install" element={<Install />} />
              <Route path="/advertising" element={<ProtectedRoute><Advertising /></ProtectedRoute>} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
