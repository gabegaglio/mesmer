import { motion } from "framer-motion";
import { type ThemeMode } from "../../hooks/useTheme";

interface ResetButtonProps {
  themeMode: ThemeMode;
  onClick: () => void;
}

function ResetButton({ themeMode, onClick }: ResetButtonProps) {
  const getButtonStyles = () => {
    switch (themeMode) {
      case "slate":
        return "bg-white/15 border-white/25 text-gray-800 hover:bg-white/25";
      case "day":
        return "bg-white/20 border-white/30 text-white hover:bg-white/30";
      case "night":
      case "midnight":
        return "bg-black/20 border-white/10 text-white hover:bg-black/30";
    }
  };

  return (
    <motion.button
      onClick={onClick}
      className={`w-12 h-12 rounded-2xl backdrop-blur-sm border transition-all duration-150 flex items-center justify-center cursor-pointer ${getButtonStyles()}`}
      whileHover={{ scale: 1.05, opacity: 0.9 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
      title="Reset all volumes"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: 0.05 }}
      >
        <motion.svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          whileTap={{ rotate: 180 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </motion.svg>
      </motion.div>
    </motion.button>
  );
}

export default ResetButton;
