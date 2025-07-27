import { motion } from "framer-motion";

export function SettingsLoader() {
  return (
    <div className="fixed inset-0 bg-slate-600 flex items-center justify-center z-50">
      <motion.div
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-white text-sm">Loading your settings...</p>
      </motion.div>
    </div>
  );
}
