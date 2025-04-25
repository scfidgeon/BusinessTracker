import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import useGeolocation from "@/hooks/use-geolocation";
import { useTime } from "@/hooks/use-time";
import { useAuth, AuthContext } from "./auth-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Visit } from "@shared/schema";

interface LocationContextType {
  tracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  currentLocation: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
  };
  currentVisit: Visit | null;
  loading: boolean;
  error: string | null;
}

export const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  // Create a default context structure that will be populated when authenticated
  const [locationState, setLocationState] = useState<LocationContextType>({
    tracking: false,
    startTracking: () => {
      console.log("Location tracking not initialized yet");
    },
    stopTracking: () => {
      console.log("Location tracking not initialized yet");
    },
    currentLocation: {
      latitude: null,
      longitude: null,
      address: null,
    },
    currentVisit: null,
    loading: false,
    error: null,
  });

  const [isInitialized, setIsInitialized] = useState(false);
  
  // Try to use the AuthContext
  let authContext;
  try {
    authContext = useContext(AuthContext);
  } catch (err) {
    console.error("Failed to get auth context in LocationProvider:", err);
    return <>{children}</>; // Just render children and let higher components handle auth
  }
  
  // Set up tracking state
  const [tracking, setTracking] = useState(false);
  const [currentVisit, setCurrentVisit] = useState<Visit | null>(null);
  const [autoTracking] = useState(true); // Auto-track during business hours
  const queryClient = useQueryClient();
  
  // Get current geolocation if user is authenticated
  const { 
    latitude, 
    longitude, 
    address,
    error: geoError, 
    loading: geoLoading 
  } = useGeolocation({
    watch: tracking && !!authContext?.user,
    enableHighAccuracy: true,
  });
  
  // Get business hours from user if available
  const user = authContext?.user;
  let businessHours = null;
  try {
    if (user && user.businessHours) {
      businessHours = JSON.parse(user.businessHours);
    }
  } catch (err) {
    console.error("Failed to parse business hours in LocationContext:", err);
  }
  const { isBusinessHours } = useTime(businessHours);
  
  // Fetch current visit if any
  const { 
    data: visitData,
    isLoading: isVisitLoading,
  } = useQuery<Visit>({
    queryKey: ["/api/visits/current"],
    refetchInterval: tracking ? 60000 : false, // Refetch every minute while tracking
    retry: false,
    enabled: !!authContext?.user, // Only run query if user is authenticated
  });
  
  // Start visit mutation
  const startVisitMutation = useMutation({
    mutationFn: async () => {
      if (!latitude || !longitude) {
        throw new Error("Location not available");
      }
      
      const response = await apiRequest("POST", "/api/visits/start", {
        latitude,
        longitude,
        address
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentVisit(data);
      setTracking(true);
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      toast({
        title: "Tracking started",
        description: "Your location is now being tracked",
      });
    },
    onError: () => {
      toast({
        title: "Tracking failed",
        description: "Unable to start tracking your location",
        variant: "destructive",
      });
    },
  });
  
  // End visit mutation
  const endVisitMutation = useMutation({
    mutationFn: async () => {
      if (!currentVisit) {
        throw new Error("No active visit");
      }
      
      const response = await apiRequest("POST", `/api/visits/${currentVisit.id}/end`, {});
      return response.json();
    },
    onSuccess: () => {
      setCurrentVisit(null);
      setTracking(false);
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      toast({
        title: "Tracking stopped",
        description: "Your visit has been recorded",
      });
    },
    onError: () => {
      toast({
        title: "Error stopping tracking",
        description: "Failed to stop the current visit",
        variant: "destructive",
      });
    },
  });
  
  // Define tracking functions
  const startTracking = () => {
    if (!authContext?.user) {
      console.log("Cannot start tracking when not logged in");
      return;
    }
    startVisitMutation.mutate();
  };
  
  const stopTracking = () => {
    if (!authContext?.user) {
      console.log("Cannot stop tracking when not logged in");
      return;
    }
    endVisitMutation.mutate();
  };
  
  // Update visit data when it changes
  useEffect(() => {
    if (visitData) {
      setCurrentVisit(visitData);
      setTracking(true);
    }
  }, [visitData]);
  
  // Auto-start tracking during business hours
  useEffect(() => {
    if (autoTracking && isBusinessHours && !tracking && authContext?.user) {
      startTracking();
    }
  }, [autoTracking, isBusinessHours, tracking, authContext?.user]);
  
  // Update context value when auth state or tracking state changes
  useEffect(() => {
    setLocationState({
      tracking,
      startTracking,
      stopTracking,
      currentLocation: {
        latitude,
        longitude,
        address,
      },
      currentVisit,
      loading: geoLoading || isVisitLoading,
      error: geoError || null,
    });
    
    setIsInitialized(true);
  }, [
    tracking, 
    latitude, 
    longitude, 
    address, 
    currentVisit, 
    geoLoading, 
    isVisitLoading, 
    geoError,
    authContext?.user
  ]);
  
  return (
    <LocationContext.Provider value={locationState}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};
