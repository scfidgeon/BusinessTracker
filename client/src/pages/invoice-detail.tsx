import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { ArrowLeft, FileText, Download, Printer, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Client, Invoice, Visit } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/location-utils";
import { format } from "date-fns";

const InvoiceDetail = () => {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [isPrintMode, setIsPrintMode] = useState(false);
  
  // Extract invoice ID from URL
  const invoiceId = location.split("/").pop();
  
  // Fetch invoice data
  const { data: invoice, isLoading: isLoadingInvoice } = useQuery<Invoice>({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
  });
  
  // Fetch client data
  const { data: client, isLoading: isLoadingClient } = useQuery<Client>({
    queryKey: [`/api/clients/${invoice?.clientId}`],
    enabled: !!invoice?.clientId,
  });
  
  // Fetch visit data if the invoice is associated with a visit
  const { data: visit, isLoading: isLoadingVisit } = useQuery<Visit>({
    queryKey: [`/api/visits/${invoice?.visitId}`],
    enabled: !!invoice?.visitId,
  });
  
  // Toggle paid status mutation
  const togglePaidStatus = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error("Invoice not found");
      
      const response = await apiRequest("PUT", `/api/invoices/${invoice.id}`, {
        isPaid: !invoice.isPaid,
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      toast({
        title: `Invoice marked as ${invoice?.isPaid ? "unpaid" : "paid"}`,
        description: `Invoice #${invoice?.invoiceNumber} has been updated`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating invoice",
        description: error instanceof Error ? error.message : "There was a problem updating the invoice",
        variant: "destructive",
      });
    },
  });
  
  // Handle print functionality
  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };
  
  // Handle download (mock functionality)
  const handleDownload = () => {
    toast({
      title: "Download started",
      description: `Invoice #${invoice?.invoiceNumber} is being prepared for download`,
    });
  };
  
  // If still loading, show a loading spinner
  if (isLoadingInvoice || isLoadingClient || (invoice?.visitId && isLoadingVisit)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mx-auto mb-4 w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
          <p className="text-gray-500">Loading invoice details...</p>
        </div>
      </div>
    );
  }
  
  // If invoice not found
  if (!invoice) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Invoice Not Found</h2>
          <p className="text-gray-500 mb-6">The invoice you're looking for doesn't exist or has been removed.</p>
          <Link href="/invoices">
            <Button>Back to Invoices</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Format date for display
  const formattedDate = invoice.date ? format(new Date(invoice.date), "MMMM d, yyyy") : "N/A";
  
  return (
    <div className={`min-h-screen pb-24 pt-4 ${isPrintMode ? 'print-mode' : ''}`}>
      {/* Header controls - hidden in print mode */}
      {!isPrintMode && (
        <div className="px-4 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4 max-w-4xl mx-auto">
            <Link href="/invoices">
              <Button variant="outline" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Invoices
              </Button>
            </Link>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex items-center"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              <Button 
                variant={invoice.isPaid ? "outline" : "default"}
                className="flex items-center"
                onClick={() => togglePaidStatus.mutate()}
                disabled={togglePaidStatus.isPending}
              >
                {togglePaidStatus.isPending ? (
                  <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full mr-2" />
                ) : invoice.isPaid ? (
                  <XCircle className="h-4 w-4 mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {invoice.isPaid ? "Mark as Unpaid" : "Mark as Paid"}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Invoice document */}
      <div className="px-4">
        <Card className="max-w-4xl mx-auto shadow-sm print:shadow-none">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-2xl font-bold text-primary-600 flex items-center mb-2">
                  <FileText className="h-6 w-6 mr-2" />
                  Invoice
                </h1>
                <div className="text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Invoice #:</span>
                    <span>{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  invoice.isPaid 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                }`}>
                  {invoice.isPaid ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Paid
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Unpaid
                    </>
                  )}
                </div>
                
                <div className="text-3xl font-bold mt-3">
                  {formatPrice(invoice.amount)}
                </div>
              </div>
            </div>
            
            {/* Bill To */}
            <div className="mb-8">
              <h3 className="font-medium text-gray-500 mb-2">Bill To:</h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                <h4 className="font-bold">{client?.name || "Unknown Client"}</h4>
                <p className="text-gray-600 dark:text-gray-300">{client?.address || "No address provided"}</p>
              </div>
            </div>
            
            {/* Service Details */}
            <div className="mb-8">
              <h3 className="font-medium text-gray-500 mb-2">Service Details:</h3>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-4 py-3">
                        {visit?.serviceType ? (
                          <div>
                            <div className="font-medium">{visit.serviceType}</div>
                            {visit.serviceDetails && (
                              <div className="text-gray-500 mt-1">{visit.serviceDetails}</div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">Professional Services</div>
                            {invoice.notes && (
                              <div className="text-gray-500 mt-1">{invoice.notes}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{formatPrice(invoice.amount)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                      <th className="px-4 py-3 text-right font-medium">{formatPrice(invoice.amount)}</th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            {/* Notes */}
            {invoice.notes && (
              <div className="mb-8">
                <h3 className="font-medium text-gray-500 mb-2">Notes:</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md whitespace-pre-line">
                  {invoice.notes}
                </div>
              </div>
            )}
            
            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>Thank you for your business!</p>
              <p className="mt-1">
                Please contact us if you have any questions about this invoice.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Print styles are defined in index.css */}
    </div>
  );
};

export default InvoiceDetail;