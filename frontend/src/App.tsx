import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import Header from "@/components/layout/Header";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Fairness from "./pages/Fairness";
import FairnessSync from "./pages/FairnessSync";
import Templates from "./pages/Templates";
import Family from "./pages/Family";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppProvider>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/sync" element={<FairnessSync />} />
            <Route
              path="/*"
              element={
                <div className="min-h-screen bg-gray-50">
                  <Header />
                  <main className="container mx-auto px-4 py-6">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/fairness" element={<Fairness />} />
                      <Route path="/templates" element={<Templates />} />
                      <Route path="/family" element={<Family />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              }
            />
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;