import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

const AuthPage = () => {
  const [username, setUsername] = useState("demo"); // Prefill with test user
  const [password, setPassword] = useState("password"); // Prefill with test password
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [, navigate] = useLocation();
  const { login, user } = useAuth();
  
  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    
    if (!username || !password) {
      setAuthError("Username and password are required");
      setIsLoggingIn(false);
      return;
    }
    
    try {
      console.log("Attempting login with:", { username, password });
      await login(username, password);
      // Login function in auth context handles navigation and success toast
    } catch (error) {
      console.error("Login error:", error);
      setAuthError("Invalid username or password");
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-primary-600 text-white p-4 rounded-full">
            <MapPin className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mt-4 text-center text-primary-600">Welcome to OnSight</h1>
          <p className="text-sm text-gray-500 text-center mt-1">Location tracking for your business</p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1"
                />
              </div>
              
              {authError && (
                <div className="text-red-500 text-sm">
                  {authError}
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <>
                    <span className="animate-spin mr-2 inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              
              <div className="text-center text-sm">
                <span className="text-gray-500">Don't have an account? </span>
                <Link href="/onboarding" className="text-primary-600 hover:text-primary-700">
                  Register
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;