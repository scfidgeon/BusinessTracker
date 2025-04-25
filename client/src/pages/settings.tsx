import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/ui/loading";

const daysOfWeek = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

const Settings = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  
  // User information
  const [username, setUsername] = useState(user?.username || "");
  const [businessType, setBusinessType] = useState(user?.businessType || "");
  
  // Business hours
  const [businessHours, setBusinessHours] = useState<{
    days: string[];
    startTime: string;
    endTime: string;
  }>({ days: [], startTime: "08:00", endTime: "17:00" });
  
  // Settings
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(true);
  const [endOfDayPromptsEnabled, setEndOfDayPromptsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Edit dialogs
  const [editUsernameDialogOpen, setEditUsernameDialogOpen] = useState(false);
  const [editBusinessTypeDialogOpen, setEditBusinessTypeDialogOpen] = useState(false);
  const [editBusinessHoursDialogOpen, setEditBusinessHoursDialogOpen] = useState(false);
  
  // Form state for dialogs
  const [newUsername, setNewUsername] = useState("");
  const [newBusinessType, setNewBusinessType] = useState("");
  const [newBusinessHours, setNewBusinessHours] = useState<{
    days: string[];
    startTime: string;
    endTime: string;
  }>({ days: [], startTime: "", endTime: "" });
  
  // Parse business hours from user data
  useEffect(() => {
    if (user?.businessHours) {
      try {
        const parsedHours = JSON.parse(user.businessHours);
        setBusinessHours(parsedHours);
      } catch (error) {
        console.error("Error parsing business hours", error);
      }
    }
  }, [user]);
  
  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);
  
  // Format business hours for display
  const formatBusinessHours = (hours: { days: string[]; startTime: string; endTime: string }) => {
    if (!hours.days.length) return "Not set";
    
    const dayGroups: string[] = [];
    let currentGroup: string[] = [];
    
    // Sort days of week in order
    const sortedDays = hours.days.sort((a, b) => {
      const order = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
      return order[a as keyof typeof order] - order[b as keyof typeof order];
    });
    
    for (let i = 0; i < sortedDays.length; i++) {
      const day = sortedDays[i];
      const prevDay = i > 0 ? sortedDays[i - 1] : null;
      const nextDay = i < sortedDays.length - 1 ? sortedDays[i + 1] : null;
      
      const isPrevConsecutive = prevDay && isConsecutiveDay(prevDay, day);
      const isNextConsecutive = nextDay && isConsecutiveDay(day, nextDay);
      
      if (isPrevConsecutive) {
        currentGroup.push(day);
      } else {
        currentGroup = [day];
        dayGroups.push(currentGroup.join("-"));
      }
      
      if (!isNextConsecutive && currentGroup.length > 1) {
        dayGroups[dayGroups.length - 1] = `${currentGroup[0]}-${currentGroup[currentGroup.length - 1]}`;
      }
    }
    
    // Format days
    const daysStr = dayGroups.map(group => {
      const parts = group.split("-");
      if (parts.length === 2) {
        return `${formatDay(parts[0])}-${formatDay(parts[1])}`;
      }
      return formatDay(group);
    }).join(", ");
    
    // Format time
    const timeStr = `${formatTime(hours.startTime)} - ${formatTime(hours.endTime)}`;
    
    return `${daysStr}, ${timeStr}`;
  };
  
  const isConsecutiveDay = (day1: string, day2: string) => {
    const order = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
    return order[day2 as keyof typeof order] - order[day1 as keyof typeof order] === 1;
  };
  
  const formatDay = (day: string) => {
    const days: Record<string, string> = {
      mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun"
    };
    return days[day] || day;
  };
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  };
  
  // Toggle day selection in business hours edit
  const toggleDay = (day: string) => {
    setNewBusinessHours(prev => {
      if (prev.days.includes(day)) {
        return { ...prev, days: prev.days.filter(d => d !== day) };
      } else {
        return { ...prev, days: [...prev.days, day] };
      }
    });
  };
  
  // Update user mutation
  const updateUser = useMutation({
    mutationFn: async (userData: { [key: string]: any }) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}`, userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({
        title: "Settings updated",
        description: "Your settings have been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error updating settings",
        description: "There was a problem updating your settings",
        variant: "destructive",
      });
    },
  });
  
  // Handle edit username
  const handleEditUsername = () => {
    setNewUsername(username);
    setEditUsernameDialogOpen(true);
  };
  
  // Handle edit business type
  const handleEditBusinessType = () => {
    setNewBusinessType(businessType);
    setEditBusinessTypeDialogOpen(true);
  };
  
  // Handle edit business hours
  const handleEditBusinessHours = () => {
    setNewBusinessHours({...businessHours});
    setEditBusinessHoursDialogOpen(true);
  };
  
  // Submit username change
  const submitUsernameChange = () => {
    if (!newUsername.trim()) {
      toast({
        title: "Invalid username",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    updateUser.mutate({ username: newUsername });
    setUsername(newUsername);
    setEditUsernameDialogOpen(false);
  };
  
  // Submit business type change
  const submitBusinessTypeChange = () => {
    if (!newBusinessType.trim()) {
      toast({
        title: "Invalid business type",
        description: "Business type cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    updateUser.mutate({ businessType: newBusinessType });
    setBusinessType(newBusinessType);
    setEditBusinessTypeDialogOpen(false);
  };
  
  // Submit business hours change
  const submitBusinessHoursChange = () => {
    if (newBusinessHours.days.length === 0) {
      toast({
        title: "Invalid business hours",
        description: "You must select at least one day",
        variant: "destructive",
      });
      return;
    }
    
    const businessHoursJson = JSON.stringify(newBusinessHours);
    updateUser.mutate({ businessHours: businessHoursJson });
    setBusinessHours(newBusinessHours);
    setEditBusinessHoursDialogOpen(false);
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "There was a problem logging out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6">Settings</h2>
      
      <Card className="mb-6">
        <CardHeader className="p-4 border-b border-gray-100 dark:border-gray-700">
          <CardTitle className="text-base font-medium">Account Information</CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
            <div>
              <h4 className="text-sm font-medium">Username</h4>
              <p className="text-sm text-gray-500 mt-1">{username}</p>
            </div>
            <Button 
              variant="link" 
              className="text-primary-600 text-sm p-0 h-auto"
              onClick={handleEditUsername}
            >
              Edit
            </Button>
          </div>
          
          <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
            <div>
              <h4 className="text-sm font-medium">Business Type</h4>
              <p className="text-sm text-gray-500 mt-1">{businessType}</p>
            </div>
            <Button 
              variant="link" 
              className="text-primary-600 text-sm p-0 h-auto"
              onClick={handleEditBusinessType}
            >
              Edit
            </Button>
          </div>
          
          <div className="p-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Business Hours</h4>
              <p className="text-sm text-gray-500 mt-1">
                {formatBusinessHours(businessHours)}
              </p>
            </div>
            <Button 
              variant="link" 
              className="text-primary-600 text-sm p-0 h-auto"
              onClick={handleEditBusinessHours}
            >
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader className="p-4 border-b border-gray-100 dark:border-gray-700">
          <CardTitle className="text-base font-medium">Application Settings</CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
            <div>
              <h4 className="text-sm font-medium">Location Tracking</h4>
              <p className="text-sm text-gray-500 mt-1">Enable during business hours</p>
            </div>
            <Switch
              checked={locationTrackingEnabled}
              onCheckedChange={setLocationTrackingEnabled}
            />
          </div>
          
          <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
            <div>
              <h4 className="text-sm font-medium">End of Day Prompts</h4>
              <p className="text-sm text-gray-500 mt-1">Prompt for invoice creation</p>
            </div>
            <Switch
              checked={endOfDayPromptsEnabled}
              onCheckedChange={setEndOfDayPromptsEnabled}
            />
          </div>
          
          <div className="p-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Dark Mode</h4>
              <p className="text-sm text-gray-500 mt-1">Use dark theme</p>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>
        </CardContent>
      </Card>
      
      <Button
        variant="destructive"
        className="w-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 py-3 mb-6"
        onClick={handleLogout}
      >
        Log Out
      </Button>
      
      {/* Edit Username Dialog */}
      <Dialog open={editUsernameDialogOpen} onOpenChange={setEditUsernameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Username</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditUsernameDialogOpen(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={submitUsernameChange}
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Business Type Dialog */}
      <Dialog open={editBusinessTypeDialogOpen} onOpenChange={setEditBusinessTypeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Business Type</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-business-type">Business Type</Label>
              <Input
                id="edit-business-type"
                value={newBusinessType}
                onChange={(e) => setNewBusinessType(e.target.value)}
                placeholder="Landscaping, Plumbing, etc."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditBusinessTypeDialogOpen(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={submitBusinessTypeChange}
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Business Hours Dialog */}
      <Dialog open={editBusinessHoursDialogOpen} onOpenChange={setEditBusinessHoursDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Business Hours</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label className="block mb-2">Business Days</Label>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {daysOfWeek.map((day) => (
                    <div key={day.id} className="text-center text-xs font-medium text-gray-500">
                      {day.label}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {daysOfWeek.map((day) => {
                    const isActive = newBusinessHours.days.includes(day.id);
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
              </div>
              
              <div className="flex space-x-3">
                <TimePicker
                  id="edit-start-time"
                  label="Start Time"
                  value={newBusinessHours.startTime}
                  onChange={(time) => setNewBusinessHours(prev => ({ ...prev, startTime: time }))}
                  className="flex-1"
                />
                <TimePicker
                  id="edit-end-time"
                  label="End Time"
                  value={newBusinessHours.endTime}
                  onChange={(time) => setNewBusinessHours(prev => ({ ...prev, endTime: time }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditBusinessHoursDialogOpen(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={submitBusinessHoursChange}
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
