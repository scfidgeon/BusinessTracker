import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/contexts/location-context";
import { useTime } from "@/hooks/use-time";
import { useAuth } from "@/contexts/auth-context";
import { LoadingSpinner } from "@/components/ui/loading";
import { MapPin, Clock, ClipboardCheck, DollarSign } from "lucide-react";
import { Visit, Client } from "@shared/schema";
import { formatDuration, formatTimeRange, formatPrice } from "@/lib/location-utils";
import CheckInModal from "@/components/modals/check-in-modal";
import EndOfDayModal from "@/components/modals/end-of-day-modal";
import { differenceInSeconds } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Since useMutation is a React hook, we need to define a custom hook instead
function useEndVisitMutation() {
  const endVisitMutation = useMutation({
    mutationFn: async (visitId: number) => {
      const response = await apiRequest("POST", `/api/visits/${visitId}/end`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Visit ended",
        description: "Your visit has been ended successfully",
      });
      // Refresh visits data
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error ending visit",
        description: error.message || "Failed to end visit",
        variant: "destructive",
      });
    }
  });
  
  return endVisitMutation;
};

const Home = () => {
  // Try-catch for using each context to make component more resilient
  try {
    const { user } = useAuth();
    const { currentLocation, tracking, startTracking, stopTracking, currentVisit } = useLocation();
    const endVisitMutation = useEndVisitMutation();

    // Parse business hours safely
    let parsedBusinessHours = null;
    try {
      if (user && user.businessHours) {
        parsedBusinessHours = JSON.parse(user.businessHours);
      }
    } catch (err) {
      console.error("Failed to parse business hours:", err);
    }
    
    const { formattedDate, isBusinessHours, currentTime } = useTime(parsedBusinessHours);
    
    const [checkInModalOpen, setCheckInModalOpen] = useState(false);
    const [endOfDayModalOpen, setEndOfDayModalOpen] = useState(false);
    const [currentDuration, setCurrentDuration] = useState<number>(0);
    const [clientName, setClientName] = useState<string>("Unknown location");
    
    // Fetch today's visits
    const { data: todayVisits = [], isLoading: isLoadingVisits } = useQuery<Visit[]>({
      queryKey: ["/api/visits", { date: new Date().toISOString().split('T')[0] }],
    });
    
    // Fetch clients for name lookup
    const { data: clients = [] } = useQuery<Client[]>({
      queryKey: ["/api/clients"],
    });
    
    // Get client name for current visit
    useEffect(() => {
      if (currentVisit && clients.length > 0 && currentVisit.clientId) {
        const client = clients.find(c => c.id === currentVisit.clientId);
        if (client) {
          setClientName(client.name);
        } else {
          setClientName(currentVisit.address || "Unknown location");
        }
      } else if (currentVisit) {
        setClientName(currentVisit.address || "Unknown location");
      } else {
        setClientName("Not at a client location");
      }
    }, [currentVisit, clients]);
    
    // Update duration for current visit
    useEffect(() => {
      if (currentVisit && currentVisit.startTime) {
        const startTime = new Date(currentVisit.startTime);
        
        const intervalId = setInterval(() => {
          const seconds = differenceInSeconds(new Date(), startTime);
          setCurrentDuration(Math.floor(seconds / 60)); // Convert to minutes
        }, 10000); // Update every 10 seconds
        
        // Initial calculation
        const seconds = differenceInSeconds(new Date(), startTime);
        setCurrentDuration(Math.floor(seconds / 60));
        
        return () => clearInterval(intervalId);
      } else {
        setCurrentDuration(0);
      }
    }, [currentVisit]);
    
    // Get client name by ID
    const getClientName = (clientId: number | null) => {
      if (!clientId) return "Unknown location";
      const client = clients.find(c => c.id === clientId);
      return client ? client.name : "Unknown client";
    };
    
    // Check for uninvoiced visits at the end of the business day
    useEffect(() => {
      const checkEndOfDay = () => {
        // Check if there are uninvoiced completed visits
        const hasUninvoicedVisits = todayVisits.some(v => !v.hasInvoice && v.endTime);
        
        // Only show end of day modal if we have uninvoiced visits
        if (hasUninvoicedVisits) {
          setEndOfDayModalOpen(true);
        }
      };
      
      checkEndOfDay();
    }, [currentTime, isBusinessHours, todayVisits, user]);
    
    const handleManualCheckin = () => {
      setCheckInModalOpen(true);
    };
    
    const uninvoicedVisits = todayVisits.filter(visit => !visit.hasInvoice && visit.endTime);
    
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Dashboard</h2>
          <div className="text-sm font-medium text-gray-500">{formattedDate}</div>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-primary-100 dark:bg-primary-900 rounded-full p-2">
                <MapPin className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold">{tracking ? clientName : "Current Location"}</h3>
                <p className="text-sm text-gray-500">
                  {tracking
                    ? "Tracking active"
                    : "Not tracking location"}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-2 border-t border-gray-100 dark:border-gray-700">
              <div>
                <span className="text-xs text-gray-500">Time at location:</span>
                <span className="font-medium ml-1">{formatDuration(currentDuration)}</span>
              </div>
              
              {tracking ? (
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs px-3 py-1 h-auto"
                  onClick={stopTracking}
                >
                  Stop Tracking
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="text-xs px-3 py-1 h-auto"
                  onClick={handleManualCheckin}
                >
                  Check In Manually
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        <h3 className="font-medium text-lg mb-3">Today's Visits</h3>
        
        <div className="space-y-3 mb-6">
          {isLoadingVisits ? (
            <div className="text-center py-4">
              <div className="animate-spin mx-auto w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
              <p className="mt-2 text-sm text-gray-500">Loading visits...</p>
            </div>
          ) : todayVisits.length > 0 ? (
            todayVisits.map((visit) => {
              // Display all visits, including active ones
              return (
                <Card key={visit.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-semibold">
                          {getClientName(visit.clientId)}
                        </h4>
                        {visit.serviceType && (
                          <div className="flex items-center mt-1">
                            <ClipboardCheck className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {visit.serviceType}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">
                            {formatTimeRange(
                              new Date(visit.startTime),
                              visit.endTime ? new Date(visit.endTime) : null
                            )}
                          </span>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded ml-2">
                            {visit.endTime ? formatDuration(visit.duration) : "In Progress"}
                          </span>
                        </div>
                        {visit.billableAmount && (
                          <div className="flex items-center mt-1">
                            <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              {formatPrice(visit.billableAmount)}
                            </span>
                          </div>
                        )}
                        {visit.serviceDetails && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                            {visit.serviceDetails}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        {!visit.endTime ? (
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center">
                              <span className="w-2 h-2 bg-blue-600 rounded-full mr-1 animate-pulse"></span>
                              Active
                            </span>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs px-3 py-1 h-auto"
                              onClick={() => endVisitMutation.mutate(visit.id)}
                            >
                              End Visit
                            </Button>
                          </div>
                        ) : visit.hasInvoice ? (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full">
                            Invoiced
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 border-0 px-2 py-0.5 h-auto rounded-full"
                            onClick={() => setEndOfDayModalOpen(true)}
                          >
                            Create Invoice
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }).filter(Boolean) // Remove null entries
          ) : (
            <div className="text-center py-4 text-gray-500">
              No visits recorded today
            </div>
          )}
        </div>
        
        {/* Modals */}
        <CheckInModal
          open={checkInModalOpen}
          onClose={() => setCheckInModalOpen(false)}
          location={
            currentLocation.latitude && currentLocation.longitude
              ? {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  address: currentLocation.address || undefined,
                }
              : undefined
          }
        />
        
        <EndOfDayModal
          open={endOfDayModalOpen}
          onClose={() => setEndOfDayModalOpen(false)}
          visits={uninvoicedVisits}
        />
      </div>
    );
  } catch (error) {
    // Fallback UI when there's an error in the component
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Dashboard</h2>
          <div className="text-sm font-medium text-gray-500">
            {new Date().toLocaleDateString()}
          </div>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <h3 className="text-lg font-medium mb-2">Welcome to OnSight!</h3>
            <p className="text-center text-gray-500 mb-4">
              We're having trouble loading your location data. Please check back in a moment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
};

export default Home;
