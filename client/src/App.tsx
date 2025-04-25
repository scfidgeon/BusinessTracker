import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/onboarding";
import ClientSetup from "@/pages/client-setup";
import Home from "@/pages/home";
import ClientsPage from "@/pages/clients-new";
import Invoices from "@/pages/invoices";
import Settings from "@/pages/settings";
import AuthPage from "@/pages/auth-page";
import { LoadingScreen } from "@/components/ui/loading";
import BottomNavigation from "@/components/layout/bottom-navigation";
import StatusBar from "@/components/layout/status-bar";

function Router() {
  // Try-catch to handle potential auth context errors
  try {
    const { user, loading } = useAuth();
    const [location, setLocation] = useLocation();

    // Redirect to auth if not logged in
    useEffect(() => {
      if (!loading && !user && location !== "/auth" && location !== "/onboarding") {
        setLocation("/auth");
      }
    }, [user, loading, location, setLocation]);

    if (loading) {
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
            <Route path="/invoices" component={Invoices} />
            <Route path="/settings" component={Settings} />
            <Route path="/" component={Home} />
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
            <Route component={AuthPage} />
          </Switch>
        </div>
      </div>
    );
  }
}

function App() {
  return (
    <div className="h-full flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Router />
    </div>
  );
}

export default App;
