import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { type ThemeMode } from "./useTheme";
import {
  type UserSettings,
  type UserSettingsUpdate,
} from "../types/userSettings";

export function useUserSettings() {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track the current user to prevent redundant loads
  const currentUserIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  // Debounced save state
  const [pendingUpdates, setPendingUpdates] = useState<UserSettingsUpdate>({});
  const saveTimeoutRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Debounce settings for database saves
  const DEBOUNCE_DELAY = 1000; // 1 second
  const MIN_UPDATE_INTERVAL = 2000; // 2 seconds minimum between saves

  // Perform the actual database update
  const performDatabaseUpdate = useCallback(
    async (updates: UserSettingsUpdate) => {
      if (!user || !supabase || !settings) {
        // console.log("❌ Cannot perform database update: missing requirements");
        return;
      }

      try {
        setError(null);

        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateRef.current;

        // Rate limiting
        if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
          // console.log(
          //   "⏳ Rate limiting update, will retry in:",
          //   MIN_UPDATE_INTERVAL - timeSinceLastUpdate,
          //   "ms"
          // );
          setTimeout(
            () => performDatabaseUpdate(updates),
            MIN_UPDATE_INTERVAL - timeSinceLastUpdate
          );
          return;
        }

        // console.log("📡 Updating settings in database:", updates);
        const { data, error: updateError } = await supabase
          .from("user_settings")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .select()
          .single();

        if (updateError) {
          console.error("❌ Database update error:", updateError);
          throw updateError;
        }

        // console.log("✅ Settings saved to database successfully");
        setSettings(data);
        lastUpdateRef.current = now;
      } catch (err) {
        console.error("❌ Error updating settings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to update settings"
        );
      }
    },
    [user, settings]
  );

  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      setPendingUpdates((current) => {
        if (Object.keys(current).length > 0) {
          // console.log("🚀 Debounced save triggered:", current);
          performDatabaseUpdate(current);
          return {};
        }
        return current;
      });
    }, DEBOUNCE_DELAY);
  }, [performDatabaseUpdate]);

  // Update settings with immediate UI feedback and debounced save
  const updateSettings = useCallback(
    (updates: UserSettingsUpdate) => {
      if (!user || !settings) {
        // console.log("❌ Cannot update settings: no user or settings loaded");
        return;
      }

      // Immediately update local state for instant UI feedback
      setSettings((prev) => (prev ? { ...prev, ...updates } : null));

      // Accumulate pending updates for batched save
      setPendingUpdates((prev) => ({ ...prev, ...updates }));

      // console.log(
      //   "🔄 Settings updated locally, will save after debounce:",
      //   updates
      // );

      // Trigger debounced save
      debouncedSave();
    },
    [user, settings, debouncedSave]
  );

  // Force immediate save
  const saveImmediately = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    setPendingUpdates((current) => {
      if (Object.keys(current).length > 0) {
        // console.log("🚀 Force saving pending updates:", current);
        performDatabaseUpdate(current);
        return {};
      }
      return current;
    });
  }, [performDatabaseUpdate]);

  // Theme update functions
  const updateTheme = useCallback(
    (theme_mode: ThemeMode) => {
      // console.log("🎨 Updating theme:", theme_mode);
      updateSettings({ theme_mode });
    },
    [updateSettings]
  );

  const updateStarsEnabled = useCallback(
    (stars_enabled: boolean) => {
      // console.log("⭐ Updating stars enabled:", stars_enabled);
      updateSettings({ stars_enabled });
    },
    [updateSettings]
  );

  const updateClockEnabled = useCallback(
    (clock_enabled: boolean) => {
      // console.log("🕐 Updating clock enabled:", clock_enabled);
      updateSettings({ clock_enabled });
    },
    [updateSettings]
  );

  const updateWeatherEnabled = useCallback(
    (weather_enabled: boolean) => {
      // console.log("🌤️ Updating weather enabled:", weather_enabled);
      updateSettings({ weather_enabled });
    },
    [updateSettings]
  );

  // MAIN EFFECT: Handle auth state and initialize settings
  useEffect(() => {
    const handleAuthStateChange = async () => {
      // console.log("🔄 Auth state evaluation:", {
      //   authLoading,
      //   hasUser: !!user,
      //   userId: user?.id,
      //   currentUserId: currentUserIdRef.current,
      //   hasInitialized: hasInitializedRef.current,
      // });

      // Step 1: Wait for auth to complete
      if (authLoading) {
        // console.log("⏳ Auth still loading, waiting...");
        setLoading(true);
        return;
      }

      // Step 2: Handle no user (logged out)
      if (!user) {
        // console.log("👤 No user found, clearing settings");
        if (hasInitializedRef.current) {
          // Save any pending updates before clearing
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
          }

          setPendingUpdates((current) => {
            if (Object.keys(current).length > 0) {
              // console.log(
              //   "🚀 Force saving pending updates before logout:",
              //   current
              // );
              performDatabaseUpdate(current);
            }
            return {};
          });
        }

        // Clear settings inline
        // console.log("🧹 Clearing user settings");
        setSettings(null);
        setError(null);
        setLoading(false);
        currentUserIdRef.current = null;
        hasInitializedRef.current = false;
        setPendingUpdates({});
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        return;
      }

      // Step 3: Check if user has changed
      if (currentUserIdRef.current && currentUserIdRef.current !== user.id) {
        // console.log(
        //   "🔄 User changed, saving previous user's updates and clearing"
        // );

        // Save immediately inline
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }

        setPendingUpdates((current) => {
          if (Object.keys(current).length > 0) {
            // console.log(
            //   "🚀 Force saving pending updates for user change:",
            //   current
            // );
            performDatabaseUpdate(current);
          }
          return {};
        });

        // Clear settings inline
        // console.log("🧹 Clearing user settings for user change");
        setSettings(null);
        setError(null);
        setLoading(false);
        currentUserIdRef.current = null;
        hasInitializedRef.current = false;
        setPendingUpdates({});
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
      }

      // Step 4: Initialize settings for current user (only once)
      if (!hasInitializedRef.current || currentUserIdRef.current !== user.id) {
        // console.log("🚀 Initializing settings for user:", user.id);
        hasInitializedRef.current = true;

        // Initialize settings inline
        try {
          setLoading(true);
          setError(null);

          // Load settings inline
          if (!supabase) {
            throw new Error("Supabase not available");
          }

          // console.log("📡 Fetching settings from database for user:", user.id);
          const { data, error: fetchError } = await supabase
            .from("user_settings")
            .select("*")
            .eq("user_id", user.id)
            .single();

          let userSettings;
          if (fetchError) {
            // If no settings exist, create default settings
            if (fetchError.code === "PGRST116") {
              // console.log("📝 No settings found, creating defaults");

              // Create defaults inline
              // console.log("📝 Creating default settings for user:", user.id);
              const { data: defaultData, error: insertError } = await supabase
                .from("user_settings")
                .insert({
                  user_id: user.id,
                  theme_mode: "slate" as ThemeMode,
                  stars_enabled: true,
                  clock_enabled: true,
                })
                .select()
                .single();

              if (insertError) throw insertError;
              // console.log(
              //   "✅ Default settings created successfully:",
              //   defaultData
              // );
              userSettings = defaultData;
            } else {
              throw fetchError;
            }
          } else {
            // console.log("✅ Settings loaded successfully:", data);
            userSettings = data;
          }

          setSettings(userSettings);
          currentUserIdRef.current = user.id;
          // console.log("🎉 User settings initialized for user:", user.id);
        } catch (err) {
          console.error("❌ Error initializing user settings:", err);
          setError(
            err instanceof Error ? err.message : "Failed to load settings"
          );
          setSettings(null);
        } finally {
          setLoading(false);
        }
      } else {
        // console.log("✅ Settings already initialized for this user");
        setLoading(false);
      }
    };

    handleAuthStateChange();
  }, [authLoading, user?.id]); // Only depend on auth state and user ID

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Save any pending updates
      setPendingUpdates((current) => {
        if (Object.keys(current).length > 0) {
          // console.log("🧹 Component unmounting, saving pending updates");
          performDatabaseUpdate(current);
        }
        return {};
      });
    };
  }, [performDatabaseUpdate]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveImmediately();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveImmediately]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    updateTheme,
    updateStarsEnabled,
    updateClockEnabled,
    updateWeatherEnabled,
    saveImmediately,
    reloadSettings: async () => {
      if (user?.id) {
        hasInitializedRef.current = false;
        // Initialize settings inline
        try {
          setLoading(true);
          setError(null);

          // Load settings inline
          if (!supabase) {
            throw new Error("Supabase not available");
          }

          // console.log("📡 Fetching settings from database for user:", user.id);
          const { data, error: fetchError } = await supabase
            .from("user_settings")
            .select("*")
            .eq("user_id", user.id)
            .single();

          let userSettings;
          if (fetchError) {
            // If no settings exist, create default settings
            if (fetchError.code === "PGRST116") {
              // console.log("📝 No settings found, creating defaults");

              // Create defaults inline
              // console.log("📝 Creating default settings for user:", user.id);
              const { data: defaultData, error: insertError } = await supabase
                .from("user_settings")
                .insert({
                  user_id: user.id,
                  theme_mode: "slate" as ThemeMode,
                  stars_enabled: true,
                  clock_enabled: true,
                })
                .select()
                .single();

              if (insertError) throw insertError;
              // console.log(
              //   "✅ Default settings created successfully:",
              //   defaultData
              // );
              userSettings = defaultData;
            } else {
              throw fetchError;
            }
          } else {
            // console.log("✅ Settings loaded successfully:", data);
            userSettings = data;
          }

          setSettings(userSettings);
          currentUserIdRef.current = user.id;
          // console.log("🎉 User settings initialized for user:", user.id);
        } catch (err) {
          console.error("❌ Error initializing user settings:", err);
          setError(
            err instanceof Error ? err.message : "Failed to load settings"
          );
          setSettings(null);
        } finally {
          setLoading(false);
        }
      }
    },
    hasPendingUpdates: Object.keys(pendingUpdates).length > 0,
    isDebouncing: saveTimeoutRef.current !== null,
  };
}
