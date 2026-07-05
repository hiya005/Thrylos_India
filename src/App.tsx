import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useEffect } from "react";

// Pages
import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import Portfolio from "./pages/Portfolio";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import GetStarted from "./pages/GetStarted";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PMLogin from "./pages/pm/PMLogin";
import PMDashboard from "./pages/pm/PMDashboard";
import NotFound from "./pages/NotFound";
import ChooseManager from "./pages/ChooseManager";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsandConditions from "./pages/TermsandConditions";
import PaymentPolicy from "./pages/PaymentPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import ReviewsPage from "./pages/Reviews";
import VerificationPlans from "./pages/VerificationPlans";
import UserProfile from "./pages/UserProfile";
import SearchUsers from "./pages/SearchUsers";
import Contacts from "./pages/Contacts";
import Notifications from "./pages/Notifications";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import Blog from "./pages/Blog";
import BloggerAdmin from "./pages/BloggerAdmin";

const queryClient = new QueryClient();

const OAuthInitiateFallback = () => {
  useEffect(() => {
    const query = window.location.search || "";
    window.location.replace(`https://thrylosindia-techsite.lovable.app/~oauth/initiate${query}`);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 text-center">
      <div className="glass-card p-6 rounded-xl max-w-sm">
        <p className="text-sm text-muted-foreground">Connecting Google sign-in securely…</p>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <AuthProvider>
      <AdminAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/get-started" element={<GetStarted />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/choose-manager" element={<ChooseManager />} />
              <Route path="/search" element={<SearchUsers />} />
              <Route path="/user/:username" element={<UserProfile />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/analytics" element={<AdvancedAnalytics />} />
              <Route path="/coordinator-admin" element={<AdminLogin />} />
              <Route path="/coordinator-admin/dashboard" element={<AdminDashboard />} />
              <Route path="/pm/login" element={<PMLogin />} />
              <Route path="/pm/dashboard" element={<PMDashboard />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-and-conditions" element={<TermsandConditions />} />
              <Route path="/payment-policy" element={<PaymentPolicy />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/verification-plans" element={<VerificationPlans />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blogger-admin" element={<BloggerAdmin />} />
              <Route path="/~oauth/initiate" element={<OAuthInitiateFallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AdminAuthProvider>
    </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
