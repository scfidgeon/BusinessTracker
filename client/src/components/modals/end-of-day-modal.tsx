import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Visit } from "@shared/schema";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceStrict, format } from "date-fns";
import { LoadingSpinner } from "../ui/loading";

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
      const response = await apiRequest("POST", "/api/invoices", {
        visitId,
        amount: calculateAmount(visits.find(v => v.id === visitId)!.duration || 0),
        notes: "Automatically generated from visit"
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
  
  // Simple placeholder calculation - $1 per minute
  const calculateAmount = (minutes: number) => {
    return minutes;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-800 w-11/12 max-w-md rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">End of Day Summary</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            You've completed your work day. Here's a summary of your visits:
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
                    <span className="text-sm text-gray-500">
                      {formatDistanceStrict(startTime, endTime, { unit: 'minute' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{formattedTimeRange}</p>
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
              <>
                <LoadingSpinner size="small" className="mr-2" />
                Processing...
              </>
            ) : (
              `Generate ${selectedVisits.length} Invoice${selectedVisits.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndOfDayModal;
