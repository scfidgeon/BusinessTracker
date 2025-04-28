import { useState } from "react";
import { useLocation as useWouter } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading";
import { MoreVertical } from "lucide-react";
import { Client } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

const ClientSetup = () => {
  const [, navigate] = useWouter();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  
  // Fetch existing clients
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });
  
  // Add client mutation
  const addClient = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/clients", {
        name,
        address,
        notes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setName("");
      setAddress("");
      setNotes("");
      toast({
        title: "Client added",
        description: "Client has been added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error adding client",
        description: "There was a problem adding the client",
        variant: "destructive",
      });
    },
  });
  
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !address) {
      toast({
        title: "Missing information",
        description: "Client name and address are required",
        variant: "destructive",
      });
      return;
    }
    
    addClient.mutate();
  };
  
  const handleFinishSetup = () => {
    navigate("/");
  };
  
  return (
    <div className="min-h-screen px-4 pt-6 pb-20 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Add Your Clients</h2>
      <p className="text-sm text-gray-500 mb-6">
        Add clients and their locations to start tracking your visits.
      </p>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleAddClient} className="space-y-4">
            <div>
              <Label 
                htmlFor="client-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Client Name
              </Label>
              <Input
                type="text"
                id="client-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
                placeholder="ABC Company"
              />
            </div>
            
            <div>
              <Label 
                htmlFor="client-address"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Client Address
              </Label>
              <Input
                type="text"
                id="client-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full"
                placeholder="123 Main St, City, State"
              />
            </div>

            <div>
              <Label 
                htmlFor="client-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email Address (Optional)
              </Label>
              <Input
                type="email"
                id="client-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                placeholder="client@example.com"
              />
            </div>

            <div>
              <Label 
                htmlFor="client-phone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Phone Number (Optional)
              </Label>
              <Input
                type="tel"
                id="client-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full"
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div>
              <Label 
                htmlFor="client-notes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Notes (Optional)
              </Label>
              <Textarea
                id="client-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full"
                placeholder="Gate code, parking information, etc."
              />
            </div>
            
            <Button
              type="submit"
              className="w-full py-2"
              disabled={addClient.isPending}
            >
              {addClient.isPending ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Adding...
                </>
              ) : (
                "Add Client"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <h3 className="font-medium text-lg mb-3">Your Clients</h3>
      
      <div className="space-y-3 mb-6">
        {isLoadingClients ? (
          <div className="text-center py-4">
            <LoadingSpinner />
            <p className="mt-2 text-sm text-gray-500">Loading clients...</p>
          </div>
        ) : clients && clients.length > 0 ? (
          clients.map((client) => (
            <div
              key={client.id}
              className="client-card bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-primary-500"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{client.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{client.address}</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            No clients added yet
          </div>
        )}
      </div>
      
      <Button
        onClick={handleFinishSetup}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 mb-4"
      >
        Finish Setup
      </Button>
    </div>
  );
};

export default ClientSetup;
