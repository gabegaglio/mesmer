import { motion } from "framer-motion";
import MuteButton from "./MuteButton";
import ResetButton from "./ResetButton";
import { type ThemeMode } from "../../hooks/useTheme";

interface ToolbarProps {
  themeMode: ThemeMode;
  isMuted: boolean;
  onToggleMute: () => void;
  onReset: () => void;
}

export function Toolbar({
  themeMode,
  isMuted,
  onToggleMute,
  onReset,
}: ToolbarProps) {
  return (
    <motion.div
      className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <MuteButton
        themeMode={themeMode}
        isMuted={isMuted}
        onToggle={onToggleMute}
      />
      <ResetButton themeMode={themeMode} onClick={onReset} />
    </motion.div>
  );
}

export default Toolbar;
