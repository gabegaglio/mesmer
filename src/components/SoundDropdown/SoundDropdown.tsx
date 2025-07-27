import { useState, useRef, useEffect } from "react";
import SoundItem from "./SoundItem";
import CustomSoundUpload from "./CustomSoundUpload";
import { type ThemeMode } from "../../hooks/useTheme";
import { useSounds } from "../../contexts/SoundContext";
import type { Sound } from "../../types/sound";
import { shouldInvertIcons } from "../../utils/themeUtils";

interface SoundDropdownProps {
  currentSound: Sound;
  onSoundChange: (sound: Sound) => void;
  themeMode: ThemeMode;
  className?: string;
}

function SoundDropdown({
  currentSound,
  onSoundChange,
  themeMode,
  className,
}: SoundDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use global sound context instead of local state
  const { getSoundsByCategory, deleteCustomSound } = useSounds();

  // Get grouped sounds from the global context
  const allSoundsByCategory = getSoundsByCategory();

  // Filter sounds based on search query
  const getFilteredSounds = () => {
    if (!searchQuery.trim()) return allSoundsByCategory;

    const filtered: Record<string, Sound[]> = {};
    Object.entries(allSoundsByCategory).forEach(([category, sounds]) => {
      const matchingSounds = sounds.filter((sound) =>
        sound.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingSounds.length > 0) {
        filtered[category] = matchingSounds;
      }
    });
    return filtered;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery(""); // Clear search when closing from outside click
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  function handleSoundSelect(sound: Sound) {
    onSoundChange(sound);
    setIsOpen(false);
    setSearchQuery(""); // Clear search when selecting
  }

  function handleUploadComplete() {
    setShowUploadModal(false);
    // No need to handle the upload result here - the CustomSoundUpload component
    // handles the upload directly through the useSounds context
  }

  function handleDeleteCustomSound(soundId: string) {
    deleteCustomSound(soundId);
  }

  function handleModalClose() {
    setIsOpen(false);
    setShowUploadModal(false);
    setSearchQuery(""); // Clear search when closing
  }

  function renderSoundIcon() {
    // Handle different icon types
    if (!currentSound.icon) {
      return <span className="text-lg md:text-xl">🎵</span>;
    }

    if (
      typeof currentSound.icon === "string" &&
      currentSound.icon.startsWith("http")
    ) {
      return (
        <img
          src={currentSound.icon}
          alt={currentSound.name}
          className={`w-5 h-5 md:w-6 md:h-6 object-contain transition-all ${
            shouldInvertIcons(themeMode) ? "brightness-0 invert" : ""
          }`}
        />
      );
    } else if (
      typeof currentSound.icon === "string" &&
      currentSound.icon.length <= 2
    ) {
      // Emoji icon
      return <span className="text-lg md:text-xl">{currentSound.icon}</span>;
    } else {
      // SVG import or path
      return (
        <img
          src={currentSound.icon}
          alt={currentSound.name}
          className={`w-5 h-5 md:w-6 md:h-6 object-contain transition-all ${
            shouldInvertIcons(themeMode) ? "brightness-0 invert" : ""
          }`}
        />
      );
    }
  }

  const isDarkTheme = themeMode === "night" || themeMode === "midnight";
  const isSlateTheme = themeMode === "slate";

  return (
    <div className={`relative ${className || ""}`} ref={dropdownRef}>
      {/* Sound Selection Button - SVG Icon as clickable button */}
      <button
        className={`bg-none border-none cursor-pointer p-2 mt-10 rounded-lg transition-all duration-200 ease-in-out flex items-center justify-center ${
          themeMode === "midnight"
            ? "hover:bg-purple-700 hover:bg-opacity-50"
            : isDarkTheme
            ? "hover:bg-gray-700 hover:bg-opacity-50"
            : isSlateTheme
            ? "hover:bg-gray-100 hover:bg-opacity-60"
            : "hover:bg-gray-200 hover:bg-opacity-80"
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Current sound: ${currentSound.name}. Click to change sound`}
        title={`Current: ${currentSound.name}`}
      >
        {renderSoundIcon()}
      </button>

      {/* Modal Overlay and Popup */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[1000] backdrop-blur-sm bg-black/20"
            onClick={handleModalClose}
          />

          {/* Modal Content */}
          <div
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl z-[1001] max-w-md w-[90vw] max-h-[80vh] overflow-y-auto p-6 backdrop-blur-xl border shadow-xl animate-in fade-in slide-in-from-top-4 duration-200 ${
              themeMode === "slate"
                ? "bg-white/15 border-white/25 text-white"
                : themeMode === "day"
                ? "bg-white/20 border-white/30 text-white"
                : themeMode === "midnight"
                ? "bg-black/30 border-purple-500/30 text-white shadow-purple-900/50"
                : "bg-black/25 border-white/20 text-white"
            }`}
          >
            {/* Close Button */}
            <button
              className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                themeMode === "slate"
                  ? "text-white hover:bg-white/20 hover:text-white"
                  : themeMode === "day"
                  ? "text-white hover:bg-white/25 hover:text-white"
                  : "text-white-300 hover:bg-white/10 hover:text-white"
              }`}
              onClick={handleModalClose}
              aria-label="Close"
            >
              ×
            </button>

            {/* Header */}
            <div className="mb-4">
              <h2
                className={`text-lg font-semibold mb-2 ${
                  themeMode === "slate"
                    ? "text-white"
                    : themeMode === "day"
                    ? "text-white"
                    : "text-white"
                }`}
              >
                Choose Sound
              </h2>

              {/* Search */}
              <input
                type="text"
                placeholder="Search sounds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  themeMode === "slate"
                    ? "bg-white/20 border-white/30 text-white placeholder-white/60"
                    : themeMode === "day"
                    ? "bg-white/25 border-white/40 text-white placeholder-white/60"
                    : themeMode === "midnight"
                    ? "bg-black/20 border-purple-500/30 text-white placeholder-gray-300"
                    : "bg-black/15 border-white/20 text-white placeholder-gray-300"
                }`}
              />
            </div>

            {/* Content */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.keys(getFilteredSounds()).length === 0 ? (
                <div
                  className={`text-center py-8 ${
                    themeMode === "slate" || themeMode === "day"
                      ? "text-white/70"
                      : "text-gray-400"
                  }`}
                >
                  No sounds found matching "{searchQuery}"
                </div>
              ) : (
                Object.entries(getFilteredSounds()).map(
                  ([category, sounds]) => {
                    // Skip showing current selection in its category when not searching
                    const filteredSounds = searchQuery
                      ? sounds
                      : sounds.filter((sound) => sound.id !== currentSound.id);

                    if (filteredSounds.length === 0) return null;

                    return (
                      <div key={category}>
                        <div
                          className={`text-sm font-semibold mb-3 uppercase tracking-wider ${
                            themeMode === "slate"
                              ? "text-white"
                              : themeMode === "day"
                              ? "text-white"
                              : themeMode === "midnight"
                              ? "text-purple-300"
                              : "text-gray-400"
                          }`}
                        >
                          {category}
                        </div>
                        <div className="space-y-1">
                          {filteredSounds.map((sound) => (
                            <SoundItem
                              key={sound.id}
                              sound={sound}
                              isSelected={currentSound.id === sound.id}
                              onSelect={handleSoundSelect}
                              onDelete={handleDeleteCustomSound}
                              showDeleteButton={category === "Custom"}
                              themeMode={themeMode}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }
                )
              )}

              {/* Add Custom Sound Button - only show when not searching */}
              {!searchQuery && (
                <div className="pt-2">
                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl border border-dashed text-sm transition-all duration-200 flex items-center gap-3 cursor-pointer ${
                      themeMode === "slate"
                        ? "border-gray-400/50 text-white hover:border-gray-500/70 hover:bg-white/15"
                        : themeMode === "day"
                        ? "border-gray-400/60 text-white hover:border-gray-500/80 hover:bg-white/20"
                        : themeMode === "midnight"
                        ? "border-purple-400/50 text-purple-200 hover:border-purple-300/70 hover:bg-purple-500/10"
                        : "border-gray-400/50 text-gray-300 hover:border-gray-300/70 hover:bg-white/10"
                    }`}
                    onClick={() => setShowUploadModal(true)}
                  >
                    <span className="text-lg">+</span>
                    Add Custom Sound
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Custom Sound Upload Modal */}
      {showUploadModal && (
        <CustomSoundUpload
          onAdd={handleUploadComplete}
          onCancel={handleModalClose}
          themeMode={themeMode}
        />
      )}
    </div>
  );
}

export default SoundDropdown;
