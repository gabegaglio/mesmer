import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { type ThemeMode } from "../hooks/useTheme";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { getGlassmorphicClasses, shouldInvertIcons } from "../utils/themeUtils";
import { useActivityDetection } from "../hooks/useScrollDetection";

// SVG icon paths from public directory
const starSvg = "/mesmer/svg/star.svg";
const menuSvg = "/mesmer/svg/menu.svg";

interface SideTaskBarProps {
  themeMode: ThemeMode;
  nightEffectsEnabled: boolean;
  clockEnabled: boolean;
  weatherEnabled: boolean;
  weatherAvailable: boolean;
  onCycleTheme: () => void;
  onToggleNightEffects: (enabled: boolean) => void;
  onToggleClock: (enabled: boolean) => void;
  onToggleWeather: (enabled: boolean) => void;
  onSetTheme?: (theme: ThemeMode) => void;
  hasPendingUpdates?: boolean;
}

export function SideTaskBar({
  themeMode,
  nightEffectsEnabled,
  clockEnabled,
  weatherEnabled,
  weatherAvailable,
  onCycleTheme,
  onToggleNightEffects,
  onToggleClock,
  onToggleWeather,
  onSetTheme,
  hasPendingUpdates = false,
}: SideTaskBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [userRole, setUserRole] = useState<string>("user");

  // Use activity detection for medium screens
  const { isVisible, isMediumScreen } = useActivityDetection({
    inactivityTimeout: 3000, // 3 seconds
    minScreenWidth: 768, // medium screens and up
  });

  // Always show on mobile, show/hide based on activity on medium+
  const shouldShow = !isMediumScreen || isVisible;

  // Fetch user role from public.users table
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user && supabase) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

          if (data && !error) {
            setUserRole(data.role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const isAdmin = userRole === "admin";

  const getThemeName = (theme: ThemeMode) => {
    switch (theme) {
      case "slate":
        return "Slate";
      case "day":
        return "Day";
      case "night":
        return "Night";
      case "midnight":
        return "Midnight";
    }
  };

  const handleThemeSelect = (selectedTheme: ThemeMode) => {
    if (onSetTheme) {
      onSetTheme(selectedTheme);
    } else {
      onCycleTheme();
    }
  };

  const themes: ThemeMode[] = ["slate", "day", "night", "midnight"];

  const getNextTheme = () => {
    const currentIndex = themes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % themes.length;
    return themes[nextIndex];
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="fixed left-0 top-4 z-50"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
            delay: isMediumScreen ? 0 : 0.1, // Faster animation on mobile
          }}
        >
          {/* Floating Settings Button */}
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative w-10 h-10 rounded-r-xl backdrop-blur-sm border-r border-t border-b transition-all duration-200 flex items-center justify-center cursor-pointer ${
              themeMode === "slate"
                ? "bg-white/15 border-white/25 text-gray-700 hover:bg-white/25"
                : themeMode === "day"
                ? "bg-white/20 border-white/30 text-gray-700 hover:bg-white/30"
                : "bg-black/20 border-white/10 text-white hover:bg-black/30"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.img
              src={menuSvg}
              alt="Menu"
              className={`w-5 h-5 ${
                shouldInvertIcons(themeMode) ? "brightness-0 invert" : ""
              }`}
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            />

            {/* Pending Changes Indicator */}
            {user && hasPendingUpdates && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>

          {/* Panel */}
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                  onClick={() => setIsOpen(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />

                <motion.div
                  className={`fixed left-0 top-16 w-56 backdrop-blur-xl rounded-r-2xl border-r border-t border-b shadow-xl z-50 ${
                    themeMode === "slate"
                      ? "bg-white/15 border-white/25"
                      : themeMode === "day"
                      ? "bg-white/20 border-white/30"
                      : "bg-black/20 border-white/10"
                  }`}
                  initial={{ opacity: 0, x: -200 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -200 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="p-4 space-y-4">
                    {/* Unsaved Changes Notice */}
                    {user && hasPendingUpdates && (
                      <motion.div
                        className={`p-2 rounded-lg border text-xs ${
                          themeMode === "slate"
                            ? "bg-orange-100/20 border-orange-300/30 text-orange-800"
                            : themeMode === "day"
                            ? "bg-orange-100/30 border-orange-300/40 text-orange-800"
                            : "bg-orange-900/30 border-orange-500/40 text-orange-200"
                        }`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                          <span>Changes will save on logout</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Theme Cycle Button - Sleek Style */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                        themeMode === "slate"
                          ? "bg-white/5 text-white hover:bg-white/10"
                          : themeMode === "day"
                          ? "bg-white/10 text-white hover:bg-white/15"
                          : "bg-white/5 text-white hover:bg-white/10"
                      }`}
                      onClick={() => handleThemeSelect(getNextTheme())}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <motion.span
                            className="text-sm opacity-40"
                            whileHover={{ x: -1 }}
                            transition={{ duration: 0.2 }}
                          >
                            ‹
                          </motion.span>
                          <motion.span
                            className="text-sm opacity-40"
                            whileHover={{ x: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            ›
                          </motion.span>
                        </div>
                        <span className="text-sm">
                          {getThemeName(themeMode)}
                        </span>
                      </div>
                    </div>

                    {/* Stars */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${
                        themeMode === "slate"
                          ? "bg-white/5 text-white"
                          : themeMode === "day"
                          ? "bg-white/10 text-white"
                          : "bg-white/5 text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={starSvg}
                          alt="Stars"
                          className={`w-4 h-4 ${
                            themeMode === "slate" || themeMode === "day"
                              ? "brightness-0 invert"
                              : shouldInvertIcons(themeMode)
                              ? "brightness-0 invert"
                              : ""
                          } ${
                            nightEffectsEnabled ? "opacity-100" : "opacity-40"
                          }`}
                        />
                        <span className="text-sm">Stars</span>
                      </div>
                      <motion.button
                        onClick={() =>
                          onToggleNightEffects(!nightEffectsEnabled)
                        }
                        className={`w-10 h-5 rounded-full transition-all duration-300 cursor-pointer ${
                          nightEffectsEnabled ? "bg-blue-500" : "bg-white/20"
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full shadow-sm mt-0.5"
                          animate={{ x: nightEffectsEnabled ? 24 : 2 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      </motion.button>
                    </div>

                    {/* Clock */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${
                        themeMode === "slate"
                          ? "bg-white/5 text-white"
                          : themeMode === "day"
                          ? "bg-white/10 text-white"
                          : "bg-white/5 text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-4 h-4 opacity-70"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12,2A10,10,0,1,0,22,12,10.01,10.01,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8.01,8.01,0,0,1,12,20Z" />
                          <path d="M14.5,12H12V7.5a.5.5,0,0,0-1,0V12.5a.5.5,0,0,0,.5.5h3a.5.5,0,0,0,0-1Z" />
                        </svg>
                        <span className="text-sm">Clock</span>
                      </div>
                      <motion.button
                        onClick={() => onToggleClock(!clockEnabled)}
                        className={`w-10 h-5 rounded-full transition-all duration-300 cursor-pointer ${
                          clockEnabled ? "bg-blue-500" : "bg-white/20"
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full shadow-sm mt-0.5"
                          animate={{ x: clockEnabled ? 24 : 2 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      </motion.button>
                    </div>

                    {/* Weather */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        weatherAvailable
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-50"
                      } ${
                        themeMode === "slate"
                          ? "bg-white/5 text-white"
                          : themeMode === "day"
                          ? "bg-white/10 text-white"
                          : "bg-white/5 text-white"
                      }`}
                      title={
                        !weatherAvailable
                          ? "Weather data unavailable for your location"
                          : ""
                      }
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-4 h-4 opacity-70"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z" />
                        </svg>
                        <span className="text-sm">Weather</span>
                        {!weatherAvailable && (
                          <span className="text-xs opacity-60">
                            (Unavailable)
                          </span>
                        )}
                      </div>
                      <motion.button
                        onClick={() =>
                          weatherAvailable && onToggleWeather(!weatherEnabled)
                        }
                        className={`w-10 h-5 rounded-full transition-all duration-300 ${
                          weatherAvailable
                            ? "cursor-pointer"
                            : "cursor-not-allowed"
                        } ${weatherEnabled ? "bg-blue-500" : "bg-white/20"}`}
                        whileTap={{ scale: weatherAvailable ? 0.95 : 1 }}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full shadow-sm mt-0.5"
                          animate={{ x: weatherEnabled ? 24 : 2 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      </motion.button>
                    </div>

                    {/* Divider */}
                    <div
                      className={`h-px ${
                        themeMode === "slate" || themeMode === "day"
                          ? "bg-gray-400/20"
                          : "bg-white/20"
                      }`}
                    />

                    {/* Auth */}
                    {user ? (
                      <>
                        <motion.button
                          onClick={handleSignOut}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                            themeMode === "slate"
                              ? "text-white hover:bg-white/10"
                              : themeMode === "day"
                              ? "text-white hover:bg-white/15"
                              : "text-white hover:bg-white/10"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          <span className="text-sm">Sign Out</span>
                        </motion.button>

                        {isAdmin && (
                          <Link to="/admin" onClick={() => setIsOpen(false)}>
                            <motion.div
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                                themeMode === "slate"
                                  ? "text-white hover:bg-white/10"
                                  : themeMode === "day"
                                  ? "text-white hover:bg-white/15"
                                  : "text-white hover:bg-white/10"
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="text-sm">Admin</span>
                            </motion.div>
                          </Link>
                        )}
                      </>
                    ) : (
                      <Link to="/auth" onClick={() => setIsOpen(false)}>
                        <motion.div
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                            themeMode === "slate"
                              ? "text-white hover:bg-white/10"
                              : themeMode === "day"
                              ? "text-white hover:bg-white/15"
                              : "text-white hover:bg-white/10"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                            />
                          </svg>
                          <span className="text-sm">Login</span>
                        </motion.div>
                      </Link>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SideTaskBar;
