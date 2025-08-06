export interface WeatherData {
  temperature: number;
  location: string;
  conditions: string;
  icon: string;
  high?: number;
  low?: number;
}

export class WeatherService {
  private supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  private supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  async getWeatherData(lat: number, lon: number): Promise<WeatherData> {
    try {
      console.log("🌤️ Fetching weather for coordinates:", { lat, lon });
      console.log("🌤️ Using Supabase URL:", this.supabaseUrl);
      console.log(
        "🌤️ Using Supabase Anon Key:",
        this.supabaseAnonKey ? "Present" : "Missing"
      );

      const url = `${this.supabaseUrl}/functions/v1/weather`;
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.supabaseAnonKey}`,
      };
      const body = JSON.stringify({ lat, lon });

      console.log("🌤️ Making request to:", url);
      console.log("🌤️ Request headers:", headers);
      console.log("🌤️ Request body:", body);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
      });

      console.log("🌤️ Weather API response status:", response.status);
      console.log(
        "🌤️ Weather API response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log("🌤️ Error response body:", errorText);
        throw new Error(`Weather API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("🌤️ Weather API response data:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error("Weather service error:", error);
      console.error("Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Return fallback data
      return {
        temperature: 72,
        location: "San Francisco, CA",
        conditions: "Sunny",
        icon: "https://api.weather.gov/icons/land/day/skc",
        high: 78,
        low: 65,
      };
    }
  }

  // Get weather icon based on conditions
  getWeatherIcon(conditions: string): string {
    const condition = conditions.toLowerCase();

    if (condition.includes("sunny") || condition.includes("clear")) {
      return "☀️";
    } else if (condition.includes("partly cloudy")) {
      return "⛅";
    } else if (condition.includes("cloudy")) {
      return "☁️";
    } else if (condition.includes("rain")) {
      return "🌧️";
    } else if (condition.includes("snow")) {
      return "❄️";
    } else if (condition.includes("thunder")) {
      return "⛈️";
    } else if (condition.includes("fog") || condition.includes("mist")) {
      return "🌫️";
    } else {
      return "🌤️"; // Default
    }
  }
}

export const weatherService = new WeatherService();
