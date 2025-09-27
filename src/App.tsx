import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LeagueProvider } from "@/contexts/LeagueContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Roster from "./pages/Roster";
import League from "./pages/League";
import Matchup from "./pages/Matchup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LeagueProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/league" element={<League />} />
              <Route path="/roster" element={
                <ProtectedRoute>
                  <Roster />
                </ProtectedRoute>
              } />
              <Route path="/matchup" element={
                <ProtectedRoute>
                  <Matchup />
                </ProtectedRoute>
              } />
              <Route path="/players" element={
                <ProtectedRoute>
                  <div>Players Page - Coming Soon</div>
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LeagueProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
