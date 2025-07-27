import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { type ThemeMode } from "./useTheme";
import {
  type UserSettings,
  type UserSettingsUpdate,
} from "../types/userSettings";

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if we've already loaded settings for this user
  const hasLoadedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  // Pending updates state (no more debouncing)
  const [pendingUpdates, setPendingUpdates] = useState<UserSettingsUpdate>({});
  const lastUpdateRef = useRef<number>(0);

  // Minimum time between saves to prevent spam (only for immediate saves)
  const MIN_UPDATE_INTERVAL = 1000;

  // Load user settings from database
  const loadSettings = useCallback(
    async (forceReload = false) => {
      if (!user || !supabase) {
        setLoading(false);
        hasLoadedRef.current = false;
        currentUserIdRef.current = null;
        return;
      }

      // Check if we've already loaded settings for this user and don't need to reload
      if (
        !forceReload &&
        hasLoadedRef.current &&
        currentUserIdRef.current === user.id &&
        settings
      ) {
        return;
      }

      // If this is a different user, reset everything
      if (currentUserIdRef.current !== user.id) {
        hasLoadedRef.current = false;
        setSettings(null);
      }

      try {
        // Only show loading if we don't have settings yet
        if (!settings) {
          setLoading(true);
        }
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (fetchError) {
          // If no settings exist, create default settings
          if (fetchError.code === "PGRST116") {
            await createDefaultSettings();
          } else {
            throw fetchError;
          }
        } else {
          setSettings(data);
        }

        hasLoadedRef.current = true;
        currentUserIdRef.current = user.id;
      } catch (err) {
        console.error("Error loading user settings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load settings"
        );
      } finally {
        setLoading(false);
      }
    },
    [user, settings]
  );

  // Create default settings for new user
  const createDefaultSettings = async () => {
    if (!user || !supabase) return;

    try {
      const { data, error: insertError } = await supabase
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
      setSettings(data);
      hasLoadedRef.current = true;
      currentUserIdRef.current = user.id;
    } catch (err) {
      console.error("Error creating default settings:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create settings"
      );
    }
  };

  // Perform the actual database update
  const performDatabaseUpdate = async (updates: UserSettingsUpdate) => {
    if (!user || !supabase || !settings) return;

    try {
      setError(null);

      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;

      // If we updated too recently, wait a bit more
      if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
        console.log("⏳ Delaying update to prevent spam");
        setTimeout(
          () => performDatabaseUpdate(updates),
          MIN_UPDATE_INTERVAL - timeSinceLastUpdate
        );
        return;
      }

      const { data, error: updateError } = await supabase
        .from("user_settings")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setSettings(data);
      lastUpdateRef.current = now;

      console.log("💾 Settings saved to database:", updates);
    } catch (err) {
      console.error("Error updating settings:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update settings"
      );
    }
  };

  // Immediate UI update function (no more debouncing)
  const updateSettings = useCallback(
    (updates: UserSettingsUpdate) => {
      if (!user || !settings) return;

      // Immediately update local state for instant UI feedback
      setSettings((prev) => (prev ? { ...prev, ...updates } : null));

      // Accumulate pending updates (will be saved on logout/close)
      setPendingUpdates((prev) => ({ ...prev, ...updates }));

      console.log(
        "🔄 Settings updated locally, will save on logout/close:",
        updates
      );
    },
    [user, settings]
  );

  // Force immediate save (for logout, page unload, etc.)
  const saveImmediately = useCallback(() => {
    setPendingUpdates((current) => {
      if (Object.keys(current).length > 0) {
        console.log("🚀 Force saving pending updates:", current);
        performDatabaseUpdate(current);
        return {};
      }
      return current;
    });
  }, []);

  // Update theme mode
  const updateTheme = (theme_mode: ThemeMode) => {
    console.log(
      "🛠️ updateTheme called with:",
      theme_mode,
      "current settings:",
      settings?.theme_mode
    );
    updateSettings({ theme_mode });
  };

  // Update stars enabled
  const updateStarsEnabled = (stars_enabled: boolean) => {
    updateSettings({ stars_enabled });
  };

  // Update clock enabled
  const updateClockEnabled = (clock_enabled: boolean) => {
    updateSettings({ clock_enabled });
  };

  // Save on auth state changes (user logging out)
  useEffect(() => {
    // Save settings when user changes (logout scenario)
    if (
      currentUserIdRef.current &&
      !user &&
      Object.keys(pendingUpdates).length > 0
    ) {
      console.log("🔓 User logged out, saving pending updates");
      saveImmediately();
    }
  }, [user, saveImmediately, pendingUpdates]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveImmediately();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveImmediately]);

  // Save on component unmount (when user navigates away)
  useEffect(() => {
    return () => {
      // Use current state at time of unmount
      setPendingUpdates((current) => {
        if (Object.keys(current).length > 0) {
          console.log("🧹 Component unmounting, saving pending updates");
          performDatabaseUpdate(current);
        }
        return {};
      });
    };
  }, []);

  // Load settings only when user changes or on first mount
  useEffect(() => {
    loadSettings();
  }, [user?.id]); // Only depend on user.id, not the entire loadSettings function

  return {
    settings,
    loading,
    error,
    updateSettings,
    updateTheme,
    updateStarsEnabled,
    updateClockEnabled,
    saveImmediately,
    reloadSettings: () => loadSettings(true), // Force reload when explicitly called
    hasPendingUpdates: Object.keys(pendingUpdates).length > 0,
  };
}
