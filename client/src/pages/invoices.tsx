import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading";
import { Search, ChevronRight } from "lucide-react";
import { Client, Visit, Invoice } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/location-utils";
import { format } from "date-fns";
import { Link } from "wouter";
import EndOfDayModal from "@/components/modals/end-of-day-modal";

const Invoices = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "paid">("all");
  const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false);
  const [endOfDayModalOpen, setEndOfDayModalOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | undefined>(undefined);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isPaid, setIsPaid] = useState<boolean>(false);
  
  // Fetch invoices
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });
  
  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });
  
  // Fetch uninvoiced visits
  const { data: uninvoicedVisits = [], isLoading: isLoadingVisits } = useQuery<Visit[]>({
    queryKey: ["/api/visits/uninvoiced"],
    enabled: createInvoiceDialogOpen,
  });
  
  // Create invoice mutation
  const createInvoice = useMutation({
    mutationFn: async () => {
      if (!selectedVisitId && !selectedClientId) {
        throw new Error("Either a visit or a client must be selected");
      }
      
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error("Amount must be a positive number");
      }
      
      const payload = {
        visitId: selectedVisitId,
        clientId: selectedClientId ? parseInt(selectedClientId) : undefined,
        amount: parseFloat(amount),
        notes,
        isPaid,
      };
      
      const response = await apiRequest("POST", "/api/invoices", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/visits/uninvoiced"] });
      setCreateInvoiceDialogOpen(false);
      resetInvoiceForm();
      toast({
        title: "Invoice created",
        description: "Invoice has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating invoice",
        description: error instanceof Error ? error.message : "There was a problem creating the invoice",
        variant: "destructive",
      });
    },
  });
  
  // Filter invoices based on search query and active filter
  const filteredInvoices = invoices.filter((invoice) => {
    // Filter by search query
    const clientName = clients.find(c => c.id === invoice.clientId)?.name || "Unknown Client";
    const searchMatch = 
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status
    if (activeFilter === "all") return searchMatch;
    if (activeFilter === "pending") return searchMatch && !invoice.isPaid;
    if (activeFilter === "paid") return searchMatch && invoice.isPaid;
    
    return searchMatch;
  });
  
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    createInvoice.mutate();
  };
  
  const resetInvoiceForm = () => {
    setSelectedVisitId(undefined);
    setSelectedClientId("");
    setAmount("");
    setNotes("");
    setIsPaid(false);
  };
  
  // Open create invoice dialog
  const openCreateInvoiceDialog = () => {
    resetInvoiceForm();
    setCreateInvoiceDialogOpen(true);
  };
  
  // Get client name by ID
  const getClientName = (clientId: number | null | undefined) => {
    if (!clientId) return "Unknown Client";
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : "Unknown Client";
  };
  
  // Handle visit selection in the form
  const handleVisitSelect = (visitId: string) => {
    if (visitId === "") {
      setSelectedVisitId(undefined);
      return;
    }
    
    const visit = uninvoicedVisits.find(v => v.id === parseInt(visitId));
    if (visit) {
      setSelectedVisitId(visit.id);
      // If visit has a client, auto-select that client
      if (visit.clientId) {
        setSelectedClientId(visit.clientId.toString());
      }
      
      // Suggest an amount based on duration (e.g., $1 per minute)
      if (visit.duration) {
        setAmount(visit.duration.toString());
      }
    }
  };
  
  return (
    <div className="min-h-screen pb-24 px-4 pt-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Invoices</h2>
        <Button
          size="sm"
          onClick={openCreateInvoiceDialog}
          className="bg-primary-600 text-white shadow-sm hover:bg-primary-700"
        >
          New Invoice
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex space-x-2 mb-3">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className={activeFilter === "all" ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300" : ""}
            >
              All
            </Button>
            <Button
              variant={activeFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("pending")}
              className={activeFilter === "pending" ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300" : ""}
            >
              Pending
            </Button>
            <Button
              variant={activeFilter === "paid" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("paid")}
              className={activeFilter === "paid" ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300" : ""}
            >
              Paid
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="search"
              id="search-invoices"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2"
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-3 mb-6">
        {isLoadingInvoices ? (
          <div className="text-center py-4">
            <LoadingSpinner />
            <p className="mt-2 text-sm text-gray-500">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{getClientName(invoice.clientId)}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {invoice.date ? format(new Date(invoice.date), "MMMM d, yyyy") : "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-semibold">{formatPrice(invoice.amount)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 ${
                      invoice.isPaid
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300"
                        : "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300"
                    }`}>
                      {invoice.isPaid ? "Paid" : "Pending"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <span>Invoice #</span>
                    <span className="font-medium ml-1">{invoice.invoiceNumber}</span>
                  </div>
                  <Link href={`/invoices/${invoice.id}`}>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary-600 text-sm font-medium flex items-center p-0 h-auto"
                    >
                      View
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {searchQuery || activeFilter !== "all"
              ? "No invoices match your filters"
              : "No invoices created yet. Click 'New Invoice' to create one."}
          </div>
        )}
      </div>
      
      {/* Create Invoice Dialog */}
      <Dialog open={createInvoiceDialogOpen} onOpenChange={setCreateInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateInvoice} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-visit">From Visit (Optional)</Label>
              <Select value={selectedVisitId?.toString() || ""} onValueChange={handleVisitSelect}>
                <SelectTrigger id="invoice-visit">
                  <SelectValue placeholder="-- Select a visit --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- No specific visit --</SelectItem>
                  {isLoadingVisits ? (
                    <SelectItem value="loading">Loading visits...</SelectItem>
                  ) : (
                    uninvoicedVisits.map((visit) => {
                      const visitDate = visit.date ? format(new Date(visit.date), "MMM d") : "N/A";
                      const clientName = visit.clientId 
                        ? getClientName(visit.clientId)
                        : visit.address || "Unknown location";
                      
                      return (
                        <SelectItem key={visit.id} value={visit.id.toString()}>
                          {visitDate} - {clientName}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invoice-client">Client</Label>
              <Select 
                value={selectedClientId} 
                onValueChange={setSelectedClientId}
                disabled={selectedVisitId !== undefined}
              >
                <SelectTrigger id="invoice-client">
                  <SelectValue placeholder="-- Select a client --" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invoice-amount">Amount ($)</Label>
              <Input
                id="invoice-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invoice-notes">Notes (Optional)</Label>
              <Textarea
                id="invoice-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Service description, terms, etc."
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="invoice-paid"
                checked={isPaid}
                onChange={() => setIsPaid(!isPaid)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <Label htmlFor="invoice-paid" className="text-sm">Mark as paid</Label>
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateInvoiceDialogOpen(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createInvoice.isPending || (!selectedVisitId && !selectedClientId) || !amount}
              >
                {createInvoice.isPending ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Invoice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* End of Day Modal */}
      <EndOfDayModal
        open={endOfDayModalOpen}
        onClose={() => setEndOfDayModalOpen(false)}
        visits={uninvoicedVisits}
      />
    </div>
  );
};

export default Invoices;
