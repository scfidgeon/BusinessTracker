import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Client, SERVICE_TYPES, Service } from "@shared/schema";
import { LoadingSpinner } from "../ui/loading";
import { Input } from "../ui/input";
import { useAuth } from "@/hooks/use-auth";

interface CheckInModalProps {
  open: boolean;
  onClose: () => void;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

const CheckInModal = ({ open, onClose, location }: CheckInModalProps) => {
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [serviceType, setServiceType] = useState<string>("");
  const [serviceDetails, setServiceDetails] = useState<string>("");
  const [billableAmount, setBillableAmount] = useState<string>("");
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const queryClient = useQueryClient();
  
  // Set available services based on business type
  useEffect(() => {
    if (user?.businessType) {
      // Type guard to check if the business type is a valid key
      const businessType = user.businessType as keyof typeof SERVICE_TYPES;
      if (Object.keys(SERVICE_TYPES).includes(businessType)) {
        setAvailableServices(SERVICE_TYPES[businessType]);
      } else {
        // Default to Service Provider if business type not found
        setAvailableServices(SERVICE_TYPES["Service Provider"]);
      }
    } else {
      // Default to Service Provider if no business type
      setAvailableServices(SERVICE_TYPES["Service Provider"]);
    }
  }, [user]);
  
  // Fetch clients
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: open,
  });
  
  // Start visit mutation
  const startVisit = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/visits/start", {
        latitude: location?.latitude,
        longitude: location?.longitude,
        address: location?.address,
        clientId: selectedClient && selectedClient !== "no-client" ? parseInt(selectedClient) : undefined,
        serviceType,
        serviceDetails: serviceDetails || notes,
        billableAmount: billableAmount ? parseFloat(billableAmount) : undefined,
        notes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      toast({
        title: "Check-in successful",
        description: "Your visit has been started with service details",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Check-in failed",
        description: "There was a problem starting your visit",
        variant: "destructive",
      });
    },
  });
  
  // Handle selecting a service
  const handleServiceChange = (value: string) => {
    setServiceType(value);
    // Find the service to get its description
    const service = availableServices.find(s => s.id === value);
    if (service && service.description) {
      setServiceDetails(service.description);
    }
  };
  
  const handleSubmit = () => {
    if (location) {
      if (!selectedClient || (selectedClient !== "no-client" && selectedClient === "")) {
        toast({
          title: "Client selection required",
          description: "Please select a client for this visit",
          variant: "destructive",
        });
        return;
      }
      
      if (!serviceType) {
        toast({
          title: "Service type required",
          description: "Please select the type of service you're providing",
          variant: "destructive",
        });
        return;
      }
      
      startVisit.mutate();
    } else {
      toast({
        title: "Location required",
        description: "Unable to get your current location",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-800 w-11/12 max-w-md rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Service Check-In</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Record details about the service you're providing
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="checkin-client" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Client *
            </Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger id="checkin-client" className="w-full">
                <SelectValue placeholder="-- Select Client --" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingClients ? (
                  <SelectItem value="loading">Loading clients...</SelectItem>
                ) : (
                  <>
                    <SelectItem value="no-client">-- Select a client --</SelectItem>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="service-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Service Type *
            </Label>
            <Select value={serviceType} onValueChange={handleServiceChange}>
              <SelectTrigger id="service-type" className="w-full">
                <SelectValue placeholder="-- Select Service Type --" />
              </SelectTrigger>
              <SelectContent>
                {availableServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="service-details" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Service Details
            </Label>
            <Textarea
              id="service-details"
              placeholder="Details about the work to be performed"
              rows={2}
              value={serviceDetails}
              onChange={(e) => setServiceDetails(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          
          <div>
            <Label htmlFor="billable-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Billable Amount ($)
            </Label>
            <Input
              id="billable-amount"
              type="number"
              placeholder="0.00"
              value={billableAmount}
              onChange={(e) => setBillableAmount(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="checkin-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Additional Notes
            </Label>
            <Textarea
              id="checkin-notes"
              placeholder="Any additional information..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          
          {location && (
            <div className="text-xs text-gray-500">
              <p>Location: {location.address || "Unknown address"}</p>
              <p className="mt-0.5">
                Coordinates: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={startVisit.isPending || !location}
          >
            {startVisit.isPending ? (
              <div className="flex items-center">
                <span className="mr-2"><LoadingSpinner size="small" /></span>
                <span>Starting Service...</span>
              </div>
            ) : (
              "Start Service"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CheckInModal;
