import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { TimePicker } from "@/components/ui/time-picker";
import { LoadingSpinner } from "@/components/ui/loading";
import { MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const daysOfWeek = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

const Onboarding = () => {
  const { register, error } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate form
    if (!username || !password || !businessType || selectedDays.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    // Create business hours JSON
    const businessHours = JSON.stringify({
      days: selectedDays,
      startTime,
      endTime,
    });
    
    try {
      await register({
        username,
        password,
        businessType,
        businessHours,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Registration failed",
        description: error || "There was a problem creating your account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen px-4 pt-6 pb-20 overflow-y-auto">
      <div className="flex flex-col items-center justify-center h-28 mb-8">
        <div className="bg-primary-600 text-white p-4 rounded-full">
          <MapPin className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold mt-4 text-center text-primary-600">Welcome to OnSight</h1>
        <p className="text-sm text-gray-500 text-center mt-1">Location tracking for your business</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="font-semibold text-lg mb-4">Let's set up your profile</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label 
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Username
              </Label>
              <Input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full"
                placeholder="johndoe"
              />
            </div>
            
            <div>
              <Label 
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Password
              </Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                placeholder="Enter a secure password"
              />
            </div>
            
            <div>
              <Label 
                htmlFor="business-type"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Business Type
              </Label>
              <Input
                type="text"
                id="business-type"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full"
                placeholder="Landscaping, Plumbing, etc."
              />
            </div>
            
            <div>
              <Label 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Business Hours
              </Label>
              
              <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map((day) => (
                  <div key={day.id} className="text-center text-xs font-medium text-gray-500">
                    {day.label}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-4">
                {daysOfWeek.map((day) => {
                  const isActive = selectedDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      className={`py-2 rounded-md text-xs font-medium transition ${
                        isActive
                          ? "bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-500"
                      }`}
                      onClick={() => toggleDay(day.id)}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              
              <div className="flex space-x-3 mb-3">
                <TimePicker
                  id="start-time"
                  label="Start Time"
                  value={startTime}
                  onChange={setStartTime}
                  className="flex-1"
                />
                <TimePicker
                  id="end-time"
                  label="End Time"
                  value={endTime}
                  onChange={setEndTime}
                  className="flex-1"
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full py-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Creating account...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
