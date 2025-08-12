import { useEffect } from "react";
import { type ThemeMode } from "../hooks/useTheme";
import { useWeatherCache } from "../hooks/useWeatherCache";
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  Snowflake, 
  Zap, 
  CloudFog,
  Wind
} from "lucide-react";

interface WeatherProps {
  themeMode: ThemeMode;
  className?: string;
  onWeatherAvailable?: (available: boolean) => void;
}

export function Weather({
  themeMode,
  className = "",
  onWeatherAvailable,
}: WeatherProps) {
  const {
    weatherData,
    loading,
    error,
    showRetry,
    isRefreshing,
    fetchWeather,
    refreshWeather,
    clearLocationCache,
  } = useWeatherCache();

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

  // Function to get weather icon based on conditions
  const getWeatherIcon = (conditions: string): string => {
    const condition = conditions.toLowerCase();

    if (condition.includes("sunny") || condition.includes("clear")) {
      return "Sun";
    } else if (condition.includes("partly cloudy") || condition.includes("partly")) {
      return "CloudSun";
    } else if (condition.includes("cloudy") || condition.includes("overcast")) {
      return "Cloud";
    } else if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("shower")) {
      return "CloudRain";
    } else if (condition.includes("snow") || condition.includes("sleet")) {
      return "Snowflake";
    } else if (condition.includes("thunder") || condition.includes("storm")) {
      return "Zap";
    } else if (condition.includes("fog") || condition.includes("mist") || condition.includes("haze")) {
      return "CloudFog";
    } else if (condition.includes("windy")) {
      return "Wind";
    } else {
      return "CloudSun"; // Default
    }
  };

  const weatherIcon = weatherData?.conditions ? getWeatherIcon(weatherData.conditions) : "CloudSun";

  // Function to render the appropriate Lucide icon
  const renderWeatherIcon = (iconName: string) => {
    switch (iconName) {
      case "Sun":
        return <Sun size={24} className="xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 drop-shadow-lg" />;
      case "CloudSun":
        return <CloudSun size={24} className="xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 drop-shadow-lg" />;
      case "Cloud":
        return <Cloud size={24} className="xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 drop-shadow-lg" />;
      case "CloudRain":
        return <CloudRain size={24} className="xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 drop-shadow-lg" />;
      case "Snowflake":
        return <Snowflake size={24} className="xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 drop-shadow-lg" />;
      case "Zap":
        return <Zap size={24} className="xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 drop-shadow-lg" />;
      case "CloudFog":
        return <CloudFog size={24} className="xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 drop-shadow-lg" />;
      case "Wind":
        return <Wind size={24} className="xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 drop-shadow-lg" />;
      default:
        return <CloudSun size={24} className="xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 drop-shadow-lg" />;
    }
  };

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
            {renderWeatherIcon(weatherIcon)}
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
                fetchWeather();
              }}
              className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
            >
              Retry Location
            </button>
            <button
              onClick={() => fetchWeather(true)}
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

