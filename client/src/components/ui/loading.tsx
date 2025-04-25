import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      <p className="mt-2 text-sm text-gray-500">Loading...</p>
    </div>
  );
}

export function LoadingSpinner({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizeClass = {
    small: "h-4 w-4",
    default: "h-6 w-6",
    large: "h-8 w-8",
  };
  
  return <Loader2 className={`${sizeClass[size]} animate-spin text-primary-600`} />;
}
