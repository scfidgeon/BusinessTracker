import { useState, useEffect } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string | null;
  error: string | null;
  loading: boolean;
}

interface UseGeolocationOptions {
  watch?: boolean;
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    watch = false,
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    address: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let watcher: number | null = null;
    
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        loading: false,
      }));
      return;
    }

    const onSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      
      // Try to reverse geocode the coordinates to get an address
      let address = null;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        if (data?.display_name) {
          address = data.display_name;
        }
      } catch (error) {
        console.error("Error reverse geocoding", error);
      }
      
      setState({
        latitude,
        longitude,
        accuracy,
        address,
        error: null,
        loading: false,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    };

    if (watch) {
      watcher = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        { enableHighAccuracy, timeout, maximumAge }
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        { enableHighAccuracy, timeout, maximumAge }
      );
    }

    return () => {
      if (watcher !== null) {
        navigator.geolocation.clearWatch(watcher);
      }
    };
  }, [watch, enableHighAccuracy, timeout, maximumAge]);

  return state;
}

export default useGeolocation;
