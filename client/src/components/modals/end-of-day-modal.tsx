import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Visit } from "@shared/schema";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceStrict, format } from "date-fns";
import { LoadingSpinner } from "../ui/loading";
import { DollarSign, ClipboardCheck, Clock } from "lucide-react";
import { formatPrice } from "@/lib/location-utils";

interface EndOfDayModalProps {
  open: boolean;
  onClose: () => void;
  visits: Visit[];
}

const EndOfDayModal = ({ open, onClose, visits }: EndOfDayModalProps) => {
  const [selectedVisits, setSelectedVisits] = useState<number[]>([]);
  const queryClient = useQueryClient();
  
  const generateInvoice = useMutation({
    mutationFn: async (visitId: number) => {
      const visit = visits.find(v => v.id === visitId);
      
      if (!visit) {
        throw new Error("Visit not found");
      }
      
      // Calculate the amount based on billable amount if available
      const amount = calculateAmount(visit);
      
      const response = await apiRequest("POST", "/api/invoices", {
        visitId,
        amount,
        notes: `Service: ${visit.serviceType || "Unknown"}\n${visit.serviceDetails || ""}`
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
  });
  
  const isGeneratingInvoice = generateInvoice.isPending;
  
  const handleToggleVisit = (visitId: number) => {
    setSelectedVisits(prev => 
      prev.includes(visitId) 
        ? prev.filter(id => id !== visitId)
        : [...prev, visitId]
    );
  };
  
  const handleCompleteAll = async () => {
    try {
      for (const visitId of selectedVisits) {
        await generateInvoice.mutateAsync(visitId);
      }
      toast({
        title: "Invoices generated",
        description: `Successfully generated ${selectedVisits.length} invoice(s)`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error generating invoices",
        description: "There was a problem generating invoices",
        variant: "destructive",
      });
    }
  };
  
  // Calculate invoice amount based on available data
  const calculateAmount = (visit: Visit): number => {
    // If billable amount is set, use that
    if (visit.billableAmount) {
      return visit.billableAmount;
    }
    
    // Otherwise calculate based on duration (default rate: $1 per minute)
    const minutes = visit.duration || 0;
    const hourlyRate = 60; // $60/hour
    return (minutes / 60) * hourlyRate;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-800 w-11/12 max-w-md rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">End of Day Summary</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Select completed visits to generate invoices
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
          {visits.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No visits to display for today
            </div>
          ) : (
            visits.map((visit) => {
              const isSelected = selectedVisits.includes(visit.id);
              const startTime = new Date(visit.startTime);
              const endTime = new Date(visit.endTime || new Date());
              const duration = visit.duration || 0;
              const formattedTimeRange = `${format(startTime, "h:mm a")} - ${format(endTime, "h:mm a")}`;
              const amount = calculateAmount(visit);
              
              return (
                <div 
                  key={visit.id} 
                  className={`visit-summary rounded-lg p-3 cursor-pointer transition-colors ${
                    isSelected 
                      ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800" 
                      : "bg-gray-50 dark:bg-gray-900"
                  }`}
                  onClick={() => handleToggleVisit(visit.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">
                      {visit.address}
                    </h4>
                    <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300 text-xs rounded-full">
                      {formatPrice(amount)}
                    </span>
                  </div>
                  
                  {visit.serviceType && (
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <ClipboardCheck className="h-3 w-3 mr-1" />
                      <span>{visit.serviceType}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formattedTimeRange} ({duration} min)</span>
                  </div>
                  
                  {visit.serviceDetails && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{visit.serviceDetails}</p>
                  )}
                  
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisit(visit.id);
                      }}
                      className="text-xs px-3 py-1 h-auto"
                    >
                      {isSelected ? "Selected" : "Select for Invoice"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {selectedVisits.length > 0 && (
          <div className="flex justify-between items-center py-2 border-t border-gray-200 dark:border-gray-700 mb-2">
            <span className="text-sm font-medium">Total value:</span>
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
              {formatPrice(
                selectedVisits.reduce((sum, visitId) => {
                  const visit = visits.find(v => v.id === visitId);
                  return sum + (visit ? calculateAmount(visit) : 0);
                }, 0)
              )}
            </span>
          </div>
        )}

        <DialogFooter className="flex justify-between gap-2">
          <Button 
            variant="outline" 
            className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            onClick={onClose}
            disabled={isGeneratingInvoice}
          >
            Skip For Now
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleCompleteAll}
            disabled={selectedVisits.length === 0 || isGeneratingInvoice}
          >
            {isGeneratingInvoice ? (
              <div className="flex items-center">
                <span className="mr-2"><LoadingSpinner size="small" /></span>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>Generate {selectedVisits.length} Invoice{selectedVisits.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndOfDayModal;
