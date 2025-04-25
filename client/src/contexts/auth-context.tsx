import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
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

  // Fetch current user
  const { data, isLoading, isError, refetch } = useQuery<User>({
    queryKey: ["/api/me"],
    retry: false
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      const response = await apiRequest("POST", "/api/login", { username, password });
      const userData = await response.json();
      setUser(userData);
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
      await apiRequest("POST", "/api/logout", {});
      setUser(null);
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
      const response = await apiRequest("POST", "/api/register", userData);
      const newUser = await response.json();
      setUser(newUser);
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
