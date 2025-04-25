import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Link } from "wouter";

const Home = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen pb-24 px-4 pt-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <div className="text-sm font-medium text-gray-500">
          {new Date().toLocaleDateString()}
        </div>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-medium mb-2">Welcome to OnSight!</h3>
          <p className="text-center text-gray-500 mb-4">
            We're currently in maintenance mode. Features related to location tracking and visit management 
            will be back soon.
          </p>
          
          <div className="flex flex-col space-y-3 w-full max-w-xs">
            <Link href="/clients">
              <Button className="w-full">
                Manage Clients
              </Button>
            </Link>
            <Link href="/invoices">
              <Button variant="outline" className="w-full">
                View Invoices
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full">
                Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
