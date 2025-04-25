import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, ChevronRight, History, MapPin, Navigation, Map } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ClientData {
  id: number;
  name: string;
  address: string;
  notes: string | null;
}

const ClientsStatic = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  
  // Client data with useState to enable adding new clients
  const [clients, setClients] = useState<ClientData[]>([
    {
      id: 1,
      name: "Test Client",
      address: "123 Main St, Anytown, USA",
      notes: "This is a test client for demonstration purposes"
    }
  ]);
  
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
    
    // Create a new client and add it to the list
    const newClient: ClientData = {
      id: clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1,
      name,
      address,
      notes: notes || null
    };
    
    setClients([...clients, newClient]);
    
    toast({
      title: "Client added",
      description: "Client has been added successfully",
    });
    
    setAddClientDialogOpen(false);
    setName("");
    setAddress("");
    setNotes("");
  };
  
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.address.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="min-h-screen pb-24 px-4 pt-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Your Clients</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMapDialogOpen(true)}
          >
            <MapPin className="h-4 w-4 mr-1" />
            Map Clients
          </Button>
          <Button
            onClick={() => setAddClientDialogOpen(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Client
          </Button>
        </div>
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="search"
          id="search-clients"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-3 py-2"
        />
      </div>
      
      <div className="space-y-3 mb-6">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            return (
              <Card key={client.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{client.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{client.address}</p>
                      {client.notes && (
                        <p className="text-xs text-gray-400 mt-1 italic">
                          {client.notes}
                        </p>
                      )}
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </CardContent>
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-b-lg flex justify-between text-sm">
                  <div className="flex items-center">
                    <History className="text-gray-400 h-4 w-4 mr-1" />
                    <span className="text-gray-500">No visits yet</span>
                  </div>
                  <div className="text-primary font-medium">
                    0 visits
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12 px-4">
            {searchQuery ? (
              <div className="text-gray-500">No clients match your search</div>
            ) : (
              <div className="space-y-4">
                <div className="inline-flex mx-auto bg-gray-100 dark:bg-gray-800 rounded-full p-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">No clients yet</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Add your first client to start tracking visits and creating invoices.
                </p>
                <Button 
                  onClick={() => setAddClientDialogOpen(true)}
                  className="mt-2"
                >
                  Add Your First Client
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add Client Dialog */}
      <Dialog open={addClientDialogOpen} onOpenChange={setAddClientDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Enter your client's information below
            </p>
          </DialogHeader>
          
          <form onSubmit={handleAddClient} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Client Name</Label>
              <Input
                id="client-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ABC Company"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client-address">Client Address</Label>
              <Input
                id="client-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client-notes">Notes (Optional)</Label>
              <Textarea
                id="client-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Gate code, parking information, etc."
                rows={3}
              />
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                type="submit"
              >
                Add Client
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Map Clients Dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Client Locations</DialogTitle>
            <DialogDescription>
              View all your client locations on a map
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="relative bg-gray-100 dark:bg-gray-800 h-[400px] rounded-md overflow-hidden flex flex-col items-center justify-center">
              <Map className="h-16 w-16 text-gray-400 mb-4" />
              <div className="text-center px-4">
                <h3 className="text-lg font-medium mb-2">Map Visualization</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  This would display an interactive map with all your client locations. 
                  Each pin would represent a client address, and you could click on them for more details.
                </p>
                
                <div className="space-y-3 max-w-md mx-auto">
                  {clients.map(client => (
                    <div key={client.id} className="flex items-center p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm">
                      <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-full mr-3">
                        <MapPin className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{client.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{client.address}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-2">
                        <Navigation className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              onClick={() => setMapDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsStatic;