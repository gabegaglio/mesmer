import { type ThemeMode } from "../hooks/useTheme";

export interface ThemeColors {
  background: string;
  text: string;
  border: string;
  hover?: string;
}

export interface ButtonThemeColors extends ThemeColors {
  hover: string;
}

export interface CompleteThemeColors {
  button: ButtonThemeColors;
  panel: ThemeColors;
  text: string;
  accent: string;
  toggle: string;
}

/**
 * Get standardized button styles for any theme mode
 */
export function getButtonTheme(mode: ThemeMode): ButtonThemeColors {
  switch (mode) {
    case "slate":
      return {
        background: "bg-white/20 backdrop-blur-xl",
        text: "text-gray-800",
        border: "border border-white/30",
        hover: "hover:bg-white/30",
      };
    case "day":
      return {
        background: "bg-white/20 backdrop-blur-xl",
        text: "text-white",
        border: "border border-white/30",
        hover: "hover:bg-white/30",
      };
    case "night":
      return {
        background: "bg-white/10 backdrop-blur-xl",
        text: "text-white",
        border: "border border-white/20",
        hover: "hover:bg-white/20",
      };
    case "midnight":
      return {
        background: "bg-white/10 backdrop-blur-xl",
        text: "text-white",
        border: "border border-white/20",
        hover: "hover:bg-white/20",
      };
    default:
      return {
        background: "bg-white/20 backdrop-blur-xl",
        text: "text-gray-800",
        border: "border border-white/30",
        hover: "hover:bg-white/30",
      };
  }
}

/**
 * Get button style classes as a single string
 */
export function getButtonStyleClasses(mode: ThemeMode): string {
  const theme = getButtonTheme(mode);
  return `${theme.background} ${theme.text} ${theme.border} ${theme.hover}`;
}

/**
 * Get complete theme colors for complex components like SideTaskBar
 */
export function getCompleteTheme(mode: ThemeMode): CompleteThemeColors {
  switch (mode) {
    case "slate":
      return {
        button: {
          background: "bg-gray-50/80",
          text: "text-gray-700",
          border: "border-gray-200/50",
          hover: "hover:bg-gray-100/80",
        },
        panel: {
          background: "bg-white/98",
          text: "text-gray-700",
          border: "border-gray-200/50",
        },
        text: "text-gray-700",
        accent: "text-gray-500",
        toggle: "bg-gray-100",
      };
    case "day":
      return {
        button: {
          background: "bg-white/20 backdrop-blur-xl",
          text: "text-white",
          border: "border-white/30",
          hover: "hover:bg-white/30",
        },
        panel: {
          background: "bg-white/20 backdrop-blur-xl",
          text: "text-white",
          border: "border-white/30",
        },
        text: "text-white",
        accent: "text-white/80",
        toggle: "bg-white/30",
      };
    case "night":
      return {
        button: {
          background: "bg-white/10 backdrop-blur-xl",
          text: "text-white",
          border: "border-white/20",
          hover: "hover:bg-white/20",
        },
        panel: {
          background: "bg-white/10 backdrop-blur-xl",
          text: "text-white",
          border: "border-white/20",
        },
        text: "text-white",
        accent: "text-white/80",
        toggle: "bg-white/30",
      };
    case "midnight":
      return {
        button: {
          background: "bg-white/10 backdrop-blur-xl",
          text: "text-white",
          border: "border-white/20",
          hover: "hover:bg-white/20",
        },
        panel: {
          background: "bg-white/10 backdrop-blur-xl",
          text: "text-white",
          border: "border-white/20",
        },
        text: "text-white",
        accent: "text-white/80",
        toggle: "bg-white/30",
      };
    default:
      return getCompleteTheme("slate");
  }
}

/**
 * Determine if icons should be inverted (for light themes)
 */
export function shouldInvertIcons(mode: ThemeMode): boolean {
  // For day, night, and midnight themes, invert icons to make them white
  return mode === "day" || mode === "night" || mode === "midnight";
}

/**
 * Get dark theme boolean for backward compatibility
 */
export function isDarkTheme(mode: ThemeMode): boolean {
  return mode === "night" || mode === "midnight";
}
