import { useState, useEffect } from "react";
import { format } from "date-fns";

interface UseTimeResult {
  currentTime: Date;
  formattedTime: string;
  formattedDate: string;
  isBusinessHours: boolean;
}

interface BusinessHours {
  days: string[];
  startTime: string;
  endTime: string;
}

export function useTime(businessHours?: BusinessHours | null): UseTimeResult {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  useEffect(() => {
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Format time as 12-hour time (e.g., 9:41 AM)
  const formattedTime = format(currentTime, "h:mm a");
  
  // Format date as Day, Month DD (e.g., Monday, July 10)
  const formattedDate = format(currentTime, "EEEE, MMMM d");
  
  // Check if current time is within business hours
  const isBusinessHours = useDetermineBusinessHours(currentTime, businessHours);
  
  return {
    currentTime,
    formattedTime,
    formattedDate,
    isBusinessHours,
  };
}

function useDetermineBusinessHours(
  currentTime: Date,
  businessHours?: BusinessHours | null
): boolean {
  try {
    // Check if business hours exist and have required properties
    if (!businessHours || !businessHours.days || !businessHours.startTime || !businessHours.endTime) {
      return false;
    }
    
    const { days, startTime, endTime } = businessHours;
    
    // Validate days array
    if (!Array.isArray(days) || days.length === 0) {
      return false;
    }
    
    // Get current day in lowercase (e.g., "mon", "tue")
    const currentDay = format(currentTime, "EEE").toLowerCase();
    
    // Check if today is a business day
    if (!days.includes(currentDay)) {
      return false;
    }
    
    // Validate time format
    if (!startTime.includes(":") || !endTime.includes(":")) {
      return false;
    }
    
    // Parse start and end times
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    
    // Validate parsed time values
    if (
      isNaN(startHour) || isNaN(startMinute) || 
      isNaN(endHour) || isNaN(endMinute) ||
      startHour < 0 || startHour > 23 || 
      endHour < 0 || endHour > 23 ||
      startMinute < 0 || startMinute > 59 || 
      endMinute < 0 || endMinute > 59
    ) {
      return false;
    }
    
    // Create Date objects for start and end times today
    const businessStart = new Date(currentTime);
    businessStart.setHours(startHour, startMinute, 0);
    
    const businessEnd = new Date(currentTime);
    businessEnd.setHours(endHour, endMinute, 0);
    
    // Check if current time is between start and end
    return currentTime >= businessStart && currentTime <= businessEnd;
  } catch (error) {
    console.error("Error determining business hours:", error);
    return false;
  }
}

export default useTime;
