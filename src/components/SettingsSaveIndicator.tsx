import React from "react";
import { useUserSettings } from "../hooks/useUserSettings";

export default function SettingsSaveIndicator() {
  const { hasPendingUpdates, isDebouncing, loading } = useUserSettings();

  // Don't show anything if settings are loading or there's nothing to save
  if (loading || (!hasPendingUpdates && !isDebouncing)) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm flex items-center gap-2">
        {isDebouncing ? (
          <>
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span>Saving...</span>
          </>
        ) : hasPendingUpdates ? (
          <>
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Changes pending</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
