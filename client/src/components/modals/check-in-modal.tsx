import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Client } from "@shared/schema";
import { LoadingSpinner } from "../ui/loading";

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
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const queryClient = useQueryClient();
  
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
        clientId: selectedClient ? parseInt(selectedClient) : undefined,
        notes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      toast({
        title: "Check-in successful",
        description: "Your visit has been started",
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
  
  const handleSubmit = () => {
    if (location) {
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
          <DialogTitle className="text-lg font-bold">Manual Check-In</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="checkin-client" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Client
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
                    <SelectItem value="">-- No specific client --</SelectItem>
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
            <Label htmlFor="checkin-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </Label>
            <Textarea
              id="checkin-notes"
              placeholder="Service description, notes, etc."
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
              <>
                <LoadingSpinner size="small" className="mr-2" />
                Checking in...
              </>
            ) : (
              "Check In"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CheckInModal;
