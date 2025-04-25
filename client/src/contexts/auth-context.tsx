import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { ZodError } from "zod";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
}

interface RegisterData {
  username: string;
  password: string;
  businessType: string;
  businessHours: string;
}

// Create a default context with no-op functions
const defaultAuthContext: AuthContextType = {
  user: null,
  loading: false,
  error: null,
  login: async () => { console.warn("Auth provider not initialized"); },
  logout: async () => { console.warn("Auth provider not initialized"); },
  register: async () => { console.warn("Auth provider not initialized"); },
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const queryClient = useQueryClient();

  // Fetch current user
  const { data, isLoading, isError, refetch } = useQuery<User>({
    queryKey: ["/api/me"],
    retry: false,
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include"
        });
        
        if (res.status === 401) {
          return null;
        }
        
        if (!res.ok) {
          throw new Error(`Failed to fetch user: ${res.status}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    }
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Login failed");
      }
      
      const userData = await response.json();
      setUser(userData);
      
      // Invalidate queries and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      
      navigate("/");
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`,
      });
    } catch (err) {
      setError("Invalid username or password");
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      throw err;
    }
  };

  const logout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      
      setUser(null);
      
      // Clear any cached queries
      queryClient.clear();
      
      navigate("/auth");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (err) {
      setError("Failed to logout");
      toast({
        title: "Logout failed",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setError(null);
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }
      
      const newUser = await response.json();
      setUser(newUser);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      
      navigate("/client-setup");
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
    } catch (err) {
      let errorMessage = "Failed to register. Username may already exist.";
      if (err instanceof ZodError) {
        errorMessage = "Invalid registration data";
      }
      setError(errorMessage);
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isLoading,
        error: isError ? "Failed to fetch user" : error,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
