
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ReportPage from "./pages/ReportPage";
import GitHubCallback from "./pages/GitHubCallback";
import CosmoChatbot from "./components/CosmoChatbot";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/migration" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/legacy" element={<Index />} />
            <Route path="/report/:reportId" element={<ReportPage />} />
            <Route path="/github-callback" element={<GitHubCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          {/* Cosmo Agents Chatbot - Available on all screens */}
          <CosmoChatbot />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
