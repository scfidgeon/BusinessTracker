import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading";
import { MapPin } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const [username, setUsername] = useState("demo"); // Prefill with test user
  const [password, setPassword] = useState("password"); // Prefill with test password
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [, navigate] = useLocation();
  
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
      // Direct fetch call for login
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Login failed");
      }
      
      const userData = await response.json();
      console.log("Login successful:", userData);
      
      // Show success message
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`,
      });
      
      // Navigate to homepage
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      setAuthError("Invalid username or password");
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
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

export default Auth;
