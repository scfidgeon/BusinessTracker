import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import useGeolocation from "@/hooks/use-geolocation";
import { useTime } from "@/hooks/use-time";
import { useAuth } from "./auth-context";
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

// Initial default values
const defaultLocationContext: LocationContextType = {
  tracking: false,
  startTracking: () => {},
  stopTracking: () => {},
  currentLocation: {
    latitude: null,
    longitude: null,
    address: null,
  },
  currentVisit: null,
  loading: false,
  error: null,
};

// Create the context with default values
export const LocationContext = createContext<LocationContextType>(defaultLocationContext);

export function LocationProvider({ children }: { children: ReactNode }) {
  // Get auth state from auth context
  const { user } = useAuth();
  
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
    watch: tracking && !!user,
    enableHighAccuracy: true,
  });
  
  // Safely parse business hours from user data
  let businessHours = null;
  try {
    if (user && user.businessHours) {
      businessHours = JSON.parse(user.businessHours);
    }
  } catch (err) {
    console.error("Failed to parse business hours in LocationContext:", err);
  }
  
  // Get business hours status
  const { isBusinessHours } = useTime(businessHours);
  
  // Fetch current visit if any
  const { 
    data: visitData,
    isLoading: isVisitLoading,
    refetch: refetchCurrentVisit
  } = useQuery<Visit>({
    queryKey: ["/api/visits/current"],
    refetchInterval: tracking ? 30000 : false, // Refetch every 30 seconds while tracking
    retry: 1,
    enabled: !!user, // Only run query if user is authenticated
    refetchOnWindowFocus: true,
    // Don't throw on 404 errors
    throwOnError: false
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
    if (!user) {
      console.log("Cannot start tracking when not logged in");
      return;
    }
    startVisitMutation.mutate();
  };
  
  const stopTracking = () => {
    if (!user) {
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
    if (autoTracking && isBusinessHours && !tracking && user) {
      startTracking();
    }
  }, [autoTracking, isBusinessHours, tracking, user]);
  
  // Prepare context value
  const contextValue: LocationContextType = {
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
  };
  
  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  return context;
}
