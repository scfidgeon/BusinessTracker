import { useEffect, useState } from "react";
import { useLocation } from "@/contexts/location-context";
import { useTime } from "@/hooks/use-time";
import { useAuth } from "@/contexts/auth-context";

const StatusBar = () => {
  const { tracking, currentLocation } = useLocation();
  const { user } = useAuth();
  const { formattedTime, isBusinessHours } = useTime(
    user ? JSON.parse(user.businessHours) : null
  );
  
  // Determine status text based on tracking and businessHours
  let statusText = "Tracking inactive";
  let indicatorClass = "bg-gray-400"; // Inactive/default
  
  if (tracking) {
    statusText = "Tracking active";
    indicatorClass = "bg-green-400 location-pulse"; // Active/tracking
  } else if (isBusinessHours) {
    statusText = "Business hours - not tracking";
    indicatorClass = "bg-yellow-400"; // Business hours but not tracking
  }
  
  return (
    <div className="px-4 py-2 bg-primary-600 text-white flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className={`${indicatorClass} inline-block h-2 w-2 rounded-full`} id="location-indicator"></span>
        <span className="text-xs font-medium">{statusText}</span>
      </div>
      <div className="text-xs font-medium">
        <span>{formattedTime}</span>
      </div>
    </div>
  );
};

export default StatusBar;
