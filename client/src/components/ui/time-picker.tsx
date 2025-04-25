import { forwardRef, useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TimePickerProps {
  id: string;
  label?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  ({ id, label, defaultValue = "08:00", value, onChange, className = "", ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    
    // Sync with external value prop
    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(newValue);
    };
    
    return (
      <div className={`${className}`}>
        {label && (
          <Label 
            htmlFor={id}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </Label>
        )}
        <Input
          ref={ref}
          type="time"
          id={id}
          value={internalValue}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
          {...props}
        />
      </div>
    );
  }
);

TimePicker.displayName = "TimePicker";

export { TimePicker };
