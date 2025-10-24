import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { FinancialProvider } from "./contexts/FinancialContext";
import { InvestmentProvider } from "./contexts/InvestmentContext";
import { GoalsProvider } from "./contexts/GoalsContext";
import { BudgetProvider } from "./contexts/BudgetContext";
import Index from "./pages/Index";
import CapitalDashboard from "./pages/CapitalDashboard";
import { AuthCallback } from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import AuthScreen from "./components/AuthScreen";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { isAuthenticated, isDemoMode, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isDemoMode) {
    return <AuthScreen />;
  }

  return (
    <FinancialProvider>
      <InvestmentProvider>
        <GoalsProvider>
          <BudgetProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/capital" element={<CapitalDashboard />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BudgetProvider>
        </GoalsProvider>
      </InvestmentProvider>
    </FinancialProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ProtectedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
