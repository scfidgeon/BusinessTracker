import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, ChevronRight, History } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ClientsStatic = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  
  // Mock client data
  const clients = [
    {
      id: 1,
      name: "Test Client",
      address: "123 Main St, Anytown, USA"
    }
  ];
  
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
        <Button
          onClick={() => setAddClientDialogOpen(true)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Client
        </Button>
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
    </div>
  );
};

export default ClientsStatic;