import { type ThemeMode } from "../hooks/useTheme";

/**
 * STREAMLINED THEME SYSTEM
 *
 * This system simplifies theming by:
 * 1. Only the background changes based on theme mode (slate/day/night/midnight)
 * 2. All text is consistently white across all themes
 * 3. All components use glassmorphic styling (backdrop-blur with transparent backgrounds)
 * 4. No more complex switch cases - just a few utility functions
 *
 * Key Functions:
 * - getGlassmorphicClasses() - Standard button/component styling
 * - getModalGlassmorphicStyles() - Modal/dropdown styling
 * - getInputGlassmorphicStyles() - Input field styling
 * - getSelectedGlassmorphicStyles() - Selected/active state styling
 * - getErrorGlassmorphicStyles() - Error state styling
 * - shouldInvertIcons() - Always returns true (white icons)
 *
 * Background themes are handled at the App/layout level, not in individual components.
 */

/**
 * Get glassmorphic button/panel styles (consistent across all themes)
 */
export function getGlassmorphicStyles(): string {
  return "bg-white/10 backdrop-blur-xl border border-white/20 text-white";
}

/**
 * Get glassmorphic button hover styles
 */
export function getGlassmorphicHover(): string {
  return "hover:bg-white/20 hover:border-white/30";
}

/**
 * Get complete glassmorphic component classes
 */
export function getGlassmorphicClasses(): string {
  return `${getGlassmorphicStyles()} ${getGlassmorphicHover()}`;
}

/**
 * Get modal/dropdown glassmorphic styles
 */
export function getModalGlassmorphicStyles(): string {
  return "bg-white/15 backdrop-blur-xl border border-white/25 text-white";
}

/**
 * Get input glassmorphic styles
 */
export function getInputGlassmorphicStyles(): string {
  return "bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60";
}

/**
 * Get selected/active state styles
 */
export function getSelectedGlassmorphicStyles(): string {
  return "bg-white/25 border-white/40 text-white";
}

/**
 * Get error state styles
 */
export function getErrorGlassmorphicStyles(): string {
  return "bg-red-500/20 border-red-400/30 text-red-300";
}

/**
 * Determine if icons should be inverted (always true since text is always white)
 */
export function shouldInvertIcons(mode?: ThemeMode): boolean {
  return true; // Always invert icons to make them white
}

/**
 * Get dark theme boolean (for backward compatibility)
 */
export function isDarkTheme(mode: ThemeMode): boolean {
  return mode === "night" || mode === "midnight";
}

/**
 * Get light theme boolean (for specific star/effect logic)
 */
export function isLightTheme(mode: ThemeMode): boolean {
  return mode === "day";
}

/**
 * Check if theme is slate (for any remaining slate-specific logic)
 */
export function isSlateTheme(mode: ThemeMode): boolean {
  return mode === "slate";
}

/**
 * LEGACY SUPPORT - keeping these for gradual migration
 * @deprecated Use glassmorphic utilities instead
 */
export function getButtonTheme(mode: ThemeMode): {
  background: string;
  text: string;
  border: string;
  hover: string;
} {
  return {
    background: "bg-white/10 backdrop-blur-xl",
    text: "text-white",
    border: "border border-white/20",
    hover: "hover:bg-white/20",
  };
}

/**
 * @deprecated Use glassmorphic utilities instead
 */
export function getButtonStyleClasses(mode: ThemeMode): string {
  return getGlassmorphicClasses();
}

/**
 * @deprecated Use glassmorphic utilities instead
 */
export function getCompleteTheme(mode: ThemeMode): {
  button: { background: string; text: string; border: string; hover: string };
  panel: { background: string; text: string; border: string };
  text: string;
  accent: string;
  toggle: string;
} {
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
}
