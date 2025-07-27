import { type ThemeMode } from "../hooks/useTheme";

export interface UserSettings {
  id: string;
  user_id: string;
  theme_mode: ThemeMode;
  stars_enabled: boolean;
  clock_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsUpdate {
  theme_mode?: ThemeMode;
  stars_enabled?: boolean;
  clock_enabled?: boolean;
}

export interface UserSettingsInsert {
  user_id: string;
  theme_mode?: ThemeMode;
  stars_enabled?: boolean;
  clock_enabled?: boolean;
}
