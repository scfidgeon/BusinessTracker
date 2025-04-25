import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { MapPin, Users, FileText, Settings, Clock } from "lucide-react";

const HomePage = () => {
  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-primary-600 text-white p-4 rounded-full inline-flex">
            <MapPin className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold mt-4 text-center text-primary-600">OnSight</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            Location tracking and business management
          </p>
        </div>
        
        {/* Main sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <Users className="h-5 w-5 mr-2 text-primary-600" />
                Client Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Manage your clients, track visits, and maintain important contact information.
              </p>
              <Link href="/clients">
                <Button variant="default" className="w-full">
                  View Clients
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <MapPin className="h-5 w-5 mr-2 text-primary-600" />
                Visit Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Track your location during client visits, record work time, and log activities.
              </p>
              <Link href="/home">
                <Button variant="outline" className="w-full">
                  Track Visits
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FileText className="h-5 w-5 mr-2 text-primary-600" />
                Invoicing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Generate professional invoices based on client visits and track payments.
              </p>
              <Link href="/invoices">
                <Button variant="outline" className="w-full">
                  Manage Invoices
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <Clock className="h-5 w-5 mr-2 text-primary-600" />
                Time & Reporting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                View time reports, analyze business hours, and optimize your work schedule.
              </p>
              <Link href="/settings">
                <Button variant="outline" className="w-full">
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        {/* Login Button */}
        <div className="flex flex-col items-center">
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Access your account to use all features
          </p>
          <div className="flex space-x-4">
            <Link href="/auth">
              <Button size="lg">
                Sign In / Register
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" size="lg">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;