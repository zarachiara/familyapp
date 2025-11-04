import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider, useApp } from "@/contexts/AppContext";
import Header from "@/components/layout/Header";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Fairness from "./pages/Fairness";
import FairnessSync from "./pages/FairnessSync";
import Templates from "./pages/Templates";
import Family from "./pages/Family";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

// Only import EmailTesting in development
let EmailTesting: React.LazyExoticComponent<() => JSX.Element> | null = null;
if (import.meta.env.DEV) {
  EmailTesting = React.lazy(() => import("./pages/EmailTesting"));
}

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Onboarding check wrapper
const OnboardingCheck = ({ children }: { children: React.ReactNode }) => {
  const { isOnboardingComplete } = useApp();
  const location = useLocation();
  
  // Allow access to onboarding and sync pages
  if (location.pathname === '/onboarding' || location.pathname === '/sync') {
    return <>{children}</>;
  }
  
  // Redirect to onboarding if not complete
  if (!isOnboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  const { initializeApp } = useApp();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Email Testing - Development only, requires auth but bypasses onboarding */}
      {EmailTesting && (
        <Route
          path="/email-testing"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <React.Suspense fallback={<div className="flex items-center justify-center h-screen">Loading Email Testing...</div>}>
                  <EmailTesting />
                </React.Suspense>
              </div>
            </ProtectedRoute>
          }
        />
      )}
      
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingCheck>
              <Onboarding />
            </OnboardingCheck>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sync"
        element={
          <ProtectedRoute>
            <OnboardingCheck>
              <FairnessSync />
            </OnboardingCheck>
          </ProtectedRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <OnboardingCheck>
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
            </OnboardingCheck>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppProvider>
              <AppContent />
            </AppProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;