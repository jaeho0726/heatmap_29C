import { useCallback, useState } from "react";
import type { Coordinates } from "../types";

export interface UseGeolocationResult {
  location: Coordinates | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
}

const getGeolocationErrorMessage = (error: GeolocationPositionError) => {
  if (error.code === error.PERMISSION_DENIED) {
    return "위치 권한이 거부되었습니다.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "현재 위치 정보를 사용할 수 없습니다.";
  }

  if (error.code === error.TIMEOUT) {
    return "현재 위치 확인 시간이 초과되었습니다.";
  }

  return "현재 위치를 확인할 수 없습니다.";
};

export default function useGeolocation(): UseGeolocationResult {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocation(null);
      setLoading(false);
      setError("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
      return;
    }

    setLocation(null);
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
        setError(null);
      },
      (geolocationError) => {
        setLocation(null);
        setLoading(false);
        setError(getGeolocationErrorMessage(geolocationError));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, []);

  return { location, loading, error, requestLocation };
}
