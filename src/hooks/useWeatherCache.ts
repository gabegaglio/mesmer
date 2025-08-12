import { useState, useEffect, useCallback, useRef } from "react";
import { weatherService, type WeatherData } from "../services/weatherService";

interface CachedLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface CachedWeather {
  data: WeatherData;
  timestamp: number;
  locationKey: string;
}

const LOCATION_CACHE_KEY = "mesmer_user_location";
const WEATHER_CACHE_KEY = "mesmer_weather_cache";
const LOCATION_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const WEATHER_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export function useWeatherCache() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if localStorage is available
  const isLocalStorageAvailable = useCallback(() => {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn("🌤️ localStorage not available:", e);
      return false;
    }
  }, []);

  // Location caching functions
  const saveLocationToCache = useCallback(
    (latitude: number, longitude: number, accuracy: number) => {
      if (!isLocalStorageAvailable()) return;
      
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
        console.log("🌤️ Location cached");
      } catch (error) {
        console.warn("🌤️ Failed to cache location:", error);
      }
    },
    [isLocalStorageAvailable]
  );

  const getLocationFromCache = useCallback((): CachedLocation | null => {
    if (!isLocalStorageAvailable()) return null;
    
    try {
      const cached = localStorage.getItem(LOCATION_CACHE_KEY);
      if (!cached) {
        console.log("🌤️ No cached location found");
        return null;
      }

      const location: CachedLocation = JSON.parse(cached);
      const isExpired =
        Date.now() - location.timestamp > LOCATION_CACHE_DURATION;

      if (isExpired) {
        console.log("🌤️ Cached location expired, removing");
        localStorage.removeItem(LOCATION_CACHE_KEY);
        return null;
      }

      console.log("🌤️ Using cached location");
      return location;
    } catch (error) {
      console.warn("🌤️ Failed to read cached location:", error);
      localStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }
  }, [isLocalStorageAvailable]);

  // Weather caching functions
  const getWeatherFromCache = useCallback((locationKey: string): WeatherData | null => {
    if (!isLocalStorageAvailable()) return null;
    
    try {
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (!cached) {
        console.log("🌤️ No cached weather found");
        return null;
      }

      const weatherCache: CachedWeather = JSON.parse(cached);
      const isExpired = Date.now() - weatherCache.timestamp > WEATHER_CACHE_DURATION;
      const isSameLocation = weatherCache.locationKey === locationKey;

      if (isExpired || !isSameLocation) {
        console.log("🌤️ Weather cache invalid, removing");
        localStorage.removeItem(WEATHER_CACHE_KEY);
        return null;
      }

      const cacheAge = Math.round((Date.now() - weatherCache.timestamp) / 1000 / 60);
      console.log(`🌤️ Using cached weather (${cacheAge} minutes old)`);
      return weatherCache.data;
    } catch (error) {
      console.warn("🌤️ Failed to read cached weather:", error);
      localStorage.removeItem(WEATHER_CACHE_KEY);
      return null;
    }
  }, [isLocalStorageAvailable]);

  const saveWeatherToCache = useCallback((data: WeatherData, locationKey: string) => {
    if (!isLocalStorageAvailable()) return;
    
    try {
      const weatherCache: CachedWeather = {
        data,
        timestamp: Date.now(),
        locationKey,
      };
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weatherCache));
      console.log("🌤️ Weather cached");
    } catch (error) {
      console.warn("🌤️ Failed to cache weather:", error);
    }
  }, [isLocalStorageAvailable]);

  const clearLocationCache = useCallback(() => {
    if (!isLocalStorageAvailable()) return;
    
    try {
      localStorage.removeItem(LOCATION_CACHE_KEY);
      localStorage.removeItem(WEATHER_CACHE_KEY);
      console.log("🌤️ Location and weather cache cleared");
    } catch (error) {
      console.warn("🌤️ Failed to clear location cache:", error);
    }
  }, [isLocalStorageAvailable]);

  // Main weather logic following pseudocode
  const checkAndUpdateWeather = useCallback(async (useFallbackLocation = false) => {
    if (isFetchingRef.current) {
      console.log("🌤️ Weather fetch already in progress, skipping");
      return;
    }

    console.log("🌤️ Checking weather cache...");
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    setShowRetry(false);

    try {
      let latitude: number, longitude: number;
      let locationKey: string;

      if (useFallbackLocation) {
        latitude = 37.7749;
        longitude = -122.4194;
        locationKey = `${latitude},${longitude}`;
        console.log("🌤️ Using fallback location");
      } else {
        const cachedLocation = getLocationFromCache();

        if (cachedLocation) {
          latitude = cachedLocation.latitude;
          longitude = cachedLocation.longitude;
          locationKey = `${latitude},${longitude}`;
          console.log("🌤️ Using cached location");
        } else {
          console.log("🌤️ Getting current position");
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              const timeoutId = setTimeout(() => {
                reject(new Error("Geolocation timeout"));
              }, 15000);

              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  clearTimeout(timeoutId);
                  resolve(pos);
                },
                (error) => {
                  clearTimeout(timeoutId);
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
          locationKey = `${latitude},${longitude}`;
          console.log("🌤️ Got current position");
          saveLocationToCache(latitude, longitude, position.coords.accuracy);
        }
      }

      // FOLLOWING YOUR PSEUDOCODE EXACTLY:
      // Check if cached weather exists
      const cachedWeather = getWeatherFromCache(locationKey);
      
      if (!cachedWeather) {
        // If not, get weather, display and cache
        console.log("🌤️ No cached weather, fetching fresh data");
        const data = await weatherService.getWeatherData(latitude, longitude);
        console.log("🌤️ Fresh weather data received");
        setWeatherData(data);
        saveWeatherToCache(data, locationKey);
      } else {
        // If it does exist, check if time > 15 minutes
        const cached = localStorage.getItem(WEATHER_CACHE_KEY);
        if (cached) {
          const weatherCache: CachedWeather = JSON.parse(cached);
          const timeSinceCache = Date.now() - weatherCache.timestamp;
          const isExpired = timeSinceCache > WEATHER_CACHE_DURATION;
          
          if (isExpired) {
            // If greater, re fetch and display
            console.log("🌤️ Cache expired, refreshing data");
            const data = await weatherService.getWeatherData(latitude, longitude);
            console.log("🌤️ Refreshed weather data received");
            setWeatherData(data);
            saveWeatherToCache(data, locationKey);
          } else {
            // If not, leave for another 15 minutes and repeat
            console.log("🌤️ Cache still valid, using cached data");
            setWeatherData(cachedWeather);
          }
        }
      }

      hasInitializedRef.current = true;
    } catch (err) {
      console.error("Weather fetch error:", err);

      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case 1:
            setError("Location access denied");
            clearLocationCache();
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
      }

      setShowRetry(true);
      setWeatherData(null); // No fallback data, just show nothing
      hasInitializedRef.current = true;
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [getLocationFromCache, saveLocationToCache, getWeatherFromCache, saveWeatherToCache, clearLocationCache]);

  // Set up the 15-minute refresh interval
  const setupRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    console.log("🌤️ Setting up 15-minute refresh interval");
    refreshIntervalRef.current = setInterval(() => {
      console.log("🌤️ 15-minute interval triggered, checking weather");
      // Call checkAndUpdateWeather directly without dependency
      if (!isFetchingRef.current) {
        checkAndUpdateWeather();
      }
    }, WEATHER_CACHE_DURATION);
  }, []); // No dependencies needed

  // Clear refresh interval
  const clearRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      console.log("🌤️ Clearing refresh interval");
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // Initial weather check on mount
  useEffect(() => {
    if (!hasInitializedRef.current) {
      console.log("🌤️ Initial weather check");
      checkAndUpdateWeather();
      setupRefreshInterval();
    }

    return () => {
      clearRefreshInterval();
    };
  }, []); // Empty dependency array - only run once on mount

  // Manual refresh function
  const refreshWeather = useCallback(async () => {
    console.log("🌤️ Manual refresh requested");
    await checkAndUpdateWeather();
  }, [checkAndUpdateWeather]);

  // Manual fetch function (for retry buttons)
  const fetchWeather = useCallback(async (useFallbackLocation = false) => {
    console.log("🌤️ Manual fetch requested");
    await checkAndUpdateWeather(useFallbackLocation);
  }, [checkAndUpdateWeather]);

  return {
    weatherData,
    loading,
    error,
    showRetry,
    isRefreshing,
    fetchWeather,
    refreshWeather,
    clearLocationCache,
  };
}
