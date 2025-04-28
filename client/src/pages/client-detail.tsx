import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock,
  FileText,
  ChevronRight,
  Settings,
  Phone,
  Mail
} from "lucide-react";
import { Client, Visit, Invoice } from "@shared/schema";
import { formatPrice, formatTimeRange } from "@/lib/location-utils";
import { format } from "date-fns";

const ClientDetail = () => {
  const { id } = useParams();
  const clientId = id ? parseInt(id) : 0;
  const [activeTab, setActiveTab] = useState("visits");
  
  // Fetch client details
  const { data: client, isLoading: isLoadingClient } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch client details");
      }
      return response.json();
    },
  });
  
  // Fetch client visits
  const { data: visits = [], isLoading: isLoadingVisits } = useQuery<Visit[]>({
    queryKey: ["/api/visits"],
    select: (visits) => visits.filter(visit => visit.clientId === clientId)
                              .sort((a, b) => {
                                const dateA = a.date ? new Date(a.date).getTime() : 0;
                                const dateB = b.date ? new Date(b.date).getTime() : 0;
                                return dateB - dateA;
                              }),
  });
  
  // Fetch client invoices
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    select: (invoices) => invoices.filter(invoice => invoice.clientId === clientId)
                                 .sort((a, b) => {
                                   const dateA = a.date ? new Date(a.date).getTime() : 0;
                                   const dateB = b.date ? new Date(b.date).getTime() : 0;
                                   return dateB - dateA;
                                 }),
  });
  
  // If loading, show loading spinner
  if (isLoadingClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mx-auto mb-4 w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
          <p className="text-gray-500">Loading client details...</p>
        </div>
      </div>
    );
  }
  
  // If client not found
  if (!client) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-3xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Client Not Found</h2>
          <p className="text-gray-500 mb-6">The client you're looking for doesn't exist or has been removed.</p>
          <Link href="/clients">
            <Button>Back to Clients</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-24 pt-4 overflow-y-auto">
      {/* Header with back button */}
      <div className="px-4 mb-6">
        <div className="flex flex-wrap justify-between items-center max-w-4xl mx-auto">
          <Link href="/clients">
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </Link>
          
          <Link href={`/client-setup?id=${clientId}`}>
            <Button variant="outline" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Client info card */}
      <div className="px-4 mb-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{client.name}</h1>
                <div className="flex items-start text-gray-500 mb-2">
                  <MapPin className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>{client.address}</span>
                </div>
                
                {client.phone && (
                  <div className="flex items-start text-gray-500 mb-2">
                    <Phone className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                    <a href={`tel:${client.phone}`} className="hover:underline">
                      {client.phone}
                    </a>
                  </div>
                )}
                
                {client.email && (
                  <div className="flex items-start text-gray-500 mb-2">
                    <Mail className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                    <a href={`mailto:${client.email}`} className="hover:underline">
                      {client.email}
                    </a>
                  </div>
                )}
                
                {client.notes && (
                  <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                    <h3 className="font-medium mb-1">Notes:</h3>
                    <p>{client.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center sm:items-end bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-gray-500 text-sm mb-1">Total Visits</div>
                <div className="text-3xl font-bold text-primary-600">{visits.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for visits and invoices */}
      <div className="px-4">
        <div className="max-w-4xl mx-auto">
          <Tabs 
            defaultValue="visits" 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="visits">
                Visit History
              </TabsTrigger>
              <TabsTrigger value="invoices">
                Invoices
              </TabsTrigger>
            </TabsList>
            
            {/* Visits tab */}
            <TabsContent value="visits" className="space-y-4">
              {isLoadingVisits ? (
                <div className="text-center py-8">
                  <div className="animate-spin mx-auto mb-4 w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
                  <p className="text-gray-500">Loading visits...</p>
                </div>
              ) : visits.length > 0 ? (
                <div className="space-y-3">
                  {visits.map((visit) => {
                    const visitDate = visit.date ? format(new Date(visit.date), "MMM d, yyyy") : "N/A";
                    const startTime = visit.startTime ? new Date(visit.startTime) : null;
                    const endTime = visit.endTime ? new Date(visit.endTime) : null;
                    const timeRange = startTime ? formatTimeRange(startTime, endTime) : "N/A";
                    
                    return (
                      <Card key={visit.id} className="shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{visitDate}</span>
                                {!visit.endTime && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                    In Progress
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-sm text-gray-500 mt-1 flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                {timeRange}
                              </div>
                              
                              {visit.serviceType && (
                                <div className="mt-3">
                                  <div className="font-medium text-gray-700 dark:text-gray-300">
                                    {visit.serviceType}
                                  </div>
                                  {visit.serviceDetails && (
                                    <div className="text-sm text-gray-500 mt-0.5">
                                      {visit.serviceDetails}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right">
                              {visit.billableAmount ? (
                                <div className="font-bold">{formatPrice(visit.billableAmount)}</div>
                              ) : null}
                              
                              {visit.hasInvoice && (
                                <span className="text-xs px-2 py-0.5 rounded-full mt-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                  Invoiced
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No visits recorded for this client yet.
                </div>
              )}
            </TabsContent>
            
            {/* Invoices tab */}
            <TabsContent value="invoices" className="space-y-4">
              {isLoadingInvoices ? (
                <div className="text-center py-8">
                  <div className="animate-spin mx-auto mb-4 w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
                  <p className="text-gray-500">Loading invoices...</p>
                </div>
              ) : invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.map((invoice) => {
                    const invoiceDate = invoice.date ? format(new Date(invoice.date), "MMM d, yyyy") : "N/A";
                    
                    return (
                      <Card key={invoice.id} className="shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">Invoice #{invoice.invoiceNumber}</h4>
                              <div className="text-sm text-gray-500 mt-1 flex items-center">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                {invoiceDate}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-bold">{formatPrice(invoice.amount)}</div>
                              <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                                invoice.isPaid
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                              }`}>
                                {invoice.isPaid ? "Paid" : "Unpaid"}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-end">
                            <Link href={`/invoices/${invoice.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary-600 text-sm font-medium flex items-center h-auto p-0"
                              >
                                View Invoice
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No invoices created for this client yet.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;