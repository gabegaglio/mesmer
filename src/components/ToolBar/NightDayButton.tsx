import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type ThemeMode } from "../../hooks/useTheme";
import { getButtonStyleClasses } from "../../utils/themeUtils";

interface NightDayButtonProps {
  themeMode: ThemeMode;
  onToggle: () => void;
}

function NightDayButton({ themeMode, onToggle }: NightDayButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onToggle();
      setTimeout(() => setIsAnimating(false), 300);
    }, 150);
  };

  const getThemeIcon = (mode: ThemeMode) => {
    switch (mode) {
      case "slate":
        return (
          <motion.svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ rotate: 0, scale: 1 }}
            animate={{
              rotate: isAnimating ? 180 : 0,
              scale: isAnimating ? 1.1 : 1,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          </motion.svg>
        );
      case "day":
        return (
          <motion.svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ rotate: 0, scale: 1 }}
            animate={{
              rotate: isAnimating ? 180 : 0,
              scale: isAnimating ? 1.1 : 1,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </motion.svg>
        );
      case "night":
        return (
          <motion.svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ rotate: 0, scale: 1 }}
            animate={{
              rotate: isAnimating ? -180 : 0,
              scale: isAnimating ? 1.1 : 1,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9" />
            <path d="M20 3v4" />
            <path d="M22 5h-4" />
          </motion.svg>
        );
      case "midnight":
        return (
          <motion.svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ rotate: 0, scale: 1 }}
            animate={{
              rotate: isAnimating ? 360 : 0,
              scale: isAnimating ? 1.1 : 1,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <path d="M12 8a2.83 2.83 0 0 0 4 4 4 4 0 1 1-4-4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.9 4.9 1.4 1.4" />
            <path d="m17.7 17.7 1.4 1.4" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.3 17.7-1.4 1.4" />
            <path d="m19.1 4.9-1.4 1.4" />
          </motion.svg>
        );
    }
  };

  return (
    <motion.button
      onClick={handleToggle}
      className={`p-2 rounded-lg cursor-pointer shadow-lg overflow-hidden ${getButtonStyleClasses(
        themeMode
      )}`}
      title={`Switch to ${
        themeMode === "slate"
          ? "Day"
          : themeMode === "day"
          ? "Night"
          : themeMode === "night"
          ? "Midnight"
          : "Slate"
      } mode`}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={themeMode}
          className="relative w-6 h-6"
          initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {getThemeIcon(themeMode)}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}

export default NightDayButton;
