import { useState, useEffect, useCallback, useRef } from "react";
import { type ThemeMode } from "../hooks/useTheme";
import { weatherService, type WeatherData } from "../services/weatherService";

interface WeatherProps {
  themeMode: ThemeMode;
  className?: string;
  onWeatherAvailable?: (available: boolean) => void;
}

interface CachedLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

const LOCATION_CACHE_KEY = "mesmer_user_location";
const LOCATION_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const DEBOUNCE_DELAY = 1000; // 1 second
const WEATHER_UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes

export function Weather({
  themeMode,
  className = "",
  onWeatherAvailable,
}: WeatherProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const getWeatherStyles = (mode: ThemeMode) => {
    switch (mode) {
      case "slate":
        return { textColor: "text-white", opacity: 0.15, mobileOpacity: 0.4 };
      case "day":
        return { textColor: "text-white", opacity: 0.65, mobileOpacity: 0.8 };
      case "night":
        return { textColor: "text-white", opacity: 0.2, mobileOpacity: 0.5 };
      case "midnight":
        return { textColor: "text-white", opacity: 0.35, mobileOpacity: 0.6 };
      default:
        return { textColor: "text-white", opacity: 0.15, mobileOpacity: 0.4 };
    }
  };

  const styles = getWeatherStyles(themeMode);

  // Secure location caching functions
  const saveLocationToCache = useCallback(
    (latitude: number, longitude: number, accuracy: number) => {
      try {
        const cachedLocation: CachedLocation = {
          latitude,
          longitude,
          accuracy,
          timestamp: Date.now(),
        };
        localStorage.setItem(
          LOCATION_CACHE_KEY,
          JSON.stringify(cachedLocation)
        );
        console.log("🌤️ Location cached securely");
      } catch (error) {
        console.warn("🌤️ Failed to cache location:", error);
      }
    },
    []
  );

  const getLocationFromCache = useCallback((): CachedLocation | null => {
    try {
      const cached = localStorage.getItem(LOCATION_CACHE_KEY);
      if (!cached) return null;

      const location: CachedLocation = JSON.parse(cached);
      const isExpired =
        Date.now() - location.timestamp > LOCATION_CACHE_DURATION;

      if (isExpired) {
        localStorage.removeItem(LOCATION_CACHE_KEY);
        console.log("🌤️ Cached location expired");
        return null;
      }

      console.log("🌤️ Using cached location");
      return location;
    } catch (error) {
      console.warn("🌤️ Failed to read cached location:", error);
      localStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }
  }, []);

  const clearLocationCache = useCallback(() => {
    try {
      localStorage.removeItem(LOCATION_CACHE_KEY);
      console.log("🌤️ Location cache cleared");
    } catch (error) {
      console.warn("🌤️ Failed to clear location cache:", error);
    }
  }, []);

  const fetchWeather = useCallback(
    async (useFallbackLocation = false) => {
      // Prevent multiple simultaneous calls
      if (isFetchingRef.current) {
        console.log("🌤️ Weather fetch already in progress, skipping");
        return;
      }

      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      setShowRetry(false);

      console.log(
        "🌤️ Starting weather fetch, useFallbackLocation:",
        useFallbackLocation
      );

      try {
        let latitude: number, longitude: number;

        if (useFallbackLocation) {
          latitude = 37.7749;
          longitude = -122.4194;
          console.log("🌤️ Using fallback location (San Francisco):", {
            latitude,
            longitude,
          });
        } else {
          // Try to get location from cache first
          const cachedLocation = getLocationFromCache();

          if (cachedLocation) {
            latitude = cachedLocation.latitude;
            longitude = cachedLocation.longitude;
            console.log("🌤️ Using cached location:", { latitude, longitude });
          } else {
            console.log("🌤️ Requesting user location...");

            const position = await new Promise<GeolocationPosition>(
              (resolve, reject) => {
                const timeoutId = setTimeout(() => {
                  reject(new Error("Geolocation timeout"));
                }, 15000);

                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    clearTimeout(timeoutId);
                    console.log(
                      "🌤️ Location obtained successfully:",
                      pos.coords
                    );
                    resolve(pos);
                  },
                  (error) => {
                    clearTimeout(timeoutId);
                    console.log("🌤️ Location error:", error);
                    reject(error);
                  },
                  {
                    timeout: 10000,
                    enableHighAccuracy: false,
                    maximumAge: 5 * 60 * 1000,
                  }
                );
              }
            );

            latitude = position.coords.latitude;
            longitude = position.coords.longitude;

            // Cache the new location
            saveLocationToCache(latitude, longitude, position.coords.accuracy);
            console.log("🌤️ Using fresh location:", { latitude, longitude });
          }
        }

        console.log("🌤️ Calling weather service with coordinates:", {
          latitude,
          longitude,
        });
        const data = await weatherService.getWeatherData(latitude, longitude);
        console.log("🌤️ Weather data received:", data);
        setWeatherData(data);
      } catch (err) {
        console.error("Weather fetch error:", err);

        if (err instanceof GeolocationPositionError) {
          console.log("🌤️ Geolocation error code:", err.code);
          switch (err.code) {
            case 1:
              setError("Location access denied");
              clearLocationCache(); // Clear invalid cache
              break;
            case 2:
              setError("Location unavailable");
              clearLocationCache();
              break;
            case 3:
              setError("Location request timed out");
              clearLocationCache();
              break;
            default:
              setError("Unable to get location");
              clearLocationCache();
          }
        } else {
          setError("Unable to get weather data");
          console.log("🌤️ Non-geolocation error:", err);
        }

        setShowRetry(true);
        setWeatherData({
          temperature: 72,
          location: "San Francisco, CA",
          conditions: "Sunny",
          icon: "https://api.weather.gov/icons/land/day/skc",
        });
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [getLocationFromCache, saveLocationToCache, clearLocationCache]
  );

  // Debounced weather fetch
  const debouncedFetchWeather = useCallback(
    (useFallbackLocation = false) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        fetchWeather(useFallbackLocation);
      }, DEBOUNCE_DELAY);
    },
    [fetchWeather]
  );

  // Refresh weather data using cached location
  const refreshWeather = useCallback(async () => {
    if (isFetchingRef.current) {
      console.log("🌤️ Weather refresh already in progress, skipping");
      return;
    }

    const cachedLocation = getLocationFromCache();
    if (!cachedLocation) {
      console.log("🌤️ No cached location available for refresh");
      return;
    }

    console.log("🌤️ Refreshing weather data...");
    isFetchingRef.current = true;
    setIsRefreshing(true);
    setError(null);

    try {
      const data = await weatherService.getWeatherData(
        cachedLocation.latitude,
        cachedLocation.longitude
      );
      console.log("🌤️ Weather data refreshed:", data);
      setWeatherData(data);
    } catch (err) {
      console.error("Weather refresh error:", err);
      setError("Weather update failed");
    } finally {
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [getLocationFromCache]);

  // Get user location and fetch weather
  useEffect(() => {
    debouncedFetchWeather();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [debouncedFetchWeather]);

  // Set up automatic weather updates every 15 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("🌤️ Auto-refreshing weather data...");
      refreshWeather();
    }, WEATHER_UPDATE_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshWeather]);

  // Notify parent about weather availability
  useEffect(() => {
    if (onWeatherAvailable) {
      const isAvailable = !!(weatherData && !error && !loading);
      onWeatherAvailable(isAvailable);
    }
  }, [weatherData, error, loading, onWeatherAvailable]);

  // Don't render if no weather data
  if (!weatherData) {
    return null;
  }

  const weatherIcon = weatherService.getWeatherIcon(weatherData.conditions);

  return (
    <>
      <style>
        {`
          .weather-mobile { opacity: ${styles.mobileOpacity}; }
          @media (min-width: 768px) {
            .weather-mobile { opacity: ${styles.opacity}; }
          }
        `}
      </style>
      <div
        className={`fixed select-none z-10 top-32 left-1/2 transform -translate-x-1/2 sm:top-36 md:top-32 lg:top-1/2 lg:-translate-y-full lg:-mt-32 transition-all duration-500 ${styles.textColor} weather-mobile ${className}`}
        style={{
          fontFamily: "'Inter', 'SF Pro Display', 'Segoe UI', sans-serif",
        }}
      >
        {/* Weather Display - All on one line */}
        <div className="flex items-center justify-center gap-4 text-center">
          {/* Weather Icon */}
          <div className="relative">
            <span className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl">
              {weatherIcon}
            </span>
          </div>

          {/* Temperature */}
          <span className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-black tracking-tight drop-shadow-lg">
            {weatherData.temperature}°F
          </span>

          {/* Separator */}
          <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl opacity-60">
            •
          </span>

          {/* Location */}
          <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-medium tracking-wide drop-shadow-lg">
            {weatherData.location}
          </span>

          {/* Separator */}
          <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl opacity-60 hidden sm:inline">
            •
          </span>

          {/* Conditions */}
          <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl opacity-80 tracking-wide drop-shadow-lg hidden sm:inline">
            {weatherData.conditions}
          </span>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center mt-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}

        {/* Refresh indicator */}
        {isRefreshing && (
          <div className="flex items-center justify-center mt-2">
            <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
          </div>
        )}

        {/* Error indicator */}
        {error && (
          <div className="flex items-center justify-center mt-2 text-xs opacity-60">
            {error}
          </div>
        )}

        {/* Retry button */}
        {showRetry && (
          <div className="flex items-center justify-center mt-2 gap-2">
            <button
              onClick={() => {
                clearLocationCache(); // Clear cache before retry
                debouncedFetchWeather();
              }}
              className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
            >
              Retry Location
            </button>
            <button
              onClick={() => debouncedFetchWeather(true)}
              className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
            >
              Use Default
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default Weather;
