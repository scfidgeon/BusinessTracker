import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/onboarding";
import ClientSetup from "@/pages/client-setup";
import Home from "@/pages/home";
import HomePage from "@/pages/home-page";
import ClientsPage from "@/pages/clients-new";
// Removed ClientsStatic import - using ClientsPage instead
import ClientDetail from "@/pages/client-detail";
import Invoices from "@/pages/invoices";
import InvoiceDetail from "@/pages/invoice-detail";
import Settings from "@/pages/settings";
import AuthPage from "@/pages/auth-page";
import { LoadingScreen } from "@/components/ui/loading";
import BottomNavigation from "@/components/layout/bottom-navigation";
import StatusBar from "@/components/layout/status-bar";

function Router() {
  // Try-catch to handle potential auth context errors
  try {
    const { user, isLoading } = useAuth();
    const [location, setLocation] = useLocation();

    // Redirect to auth if not logged in (but allow access to special pages)
    useEffect(() => {
      if (!isLoading && !user && 
          location !== "/auth" && 
          location !== "/onboarding" && 
          location !== "/") {
        setLocation("/auth");
      }
    }, [user, isLoading, location, setLocation]);

    if (isLoading) {
      return <LoadingScreen />;
    }

    return (
      <div className="flex flex-col h-full">
        {user && <StatusBar />}
        
        <div className="flex-1 overflow-hidden">
          <Switch>
            <Route path="/auth" component={AuthPage} />
            <Route path="/onboarding" component={Onboarding} />
            <Route path="/client-setup" component={ClientSetup} />
            <Route path="/clients" component={ClientsPage} />
            <Route path="/clients/:id" component={ClientDetail} />
            {/* Clients-static now points to the same component as /clients */}
            <Route path="/clients-static" component={ClientsPage} />
            <Route path="/invoices" component={Invoices} />
            <Route path="/invoices/:id" component={InvoiceDetail} />
            <Route path="/settings" component={Settings} />
            <Route path="/home" component={Home} />
            <Route path="/" component={HomePage} />
            <Route component={NotFound} />
          </Switch>
        </div>
        
        {user && location !== "/onboarding" && location !== "/client-setup" && location !== "/auth" && (
          <BottomNavigation />
        )}
      </div>
    );
  } catch (error) {
    // Fallback UI when auth context isn't available
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <Switch>
            <Route path="/auth" component={AuthPage} />
            {/* Fallback clients-static route */}
            <Route path="/clients-static" component={ClientsPage} />
            <Route path="/" component={HomePage} />
            <Route component={AuthPage} />
          </Switch>
        </div>
      </div>
    );
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="h-full flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
          <Router />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
