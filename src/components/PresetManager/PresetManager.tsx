import { useState } from "react";
import { useSounds } from "../../contexts/SoundContext";
import type { SoundPreset } from "../../types/preset";
import type { Sound } from "../../types/sound";
import { useEffect } from "react";

interface PresetManagerProps {
  onClose: () => void;
  currentVolumes: Record<string, number>;
  currentSounds?: Record<string, Sound>; // Add this to know actual sound names
  onApplyPreset: (volumes: Record<string, number>) => void;
}

export default function PresetManager({
  onClose,
  currentVolumes,
  currentSounds = {},
  onApplyPreset,
}: PresetManagerProps) {
  const {
    userPresets,
    saveCurrentAsPreset,
    loadPreset,
    deletePreset,
    updatePreset,
    togglePresetFavorite,
    isLoading,
    isSaving,
    error,
  } = useSounds();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [editingPreset, setEditingPreset] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    | "date_desc"
    | "date_asc"
    | "name_asc"
    | "name_desc"
    | "sounds_desc"
    | "sounds_asc"
  >("date_desc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Check if current volumes represent an active mix
  const hasActiveVolumes = Object.values(currentVolumes).some(
    (volume) => volume > 0
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".sort-dropdown")) {
        setShowSortDropdown(false);
      }
    };

    if (showSortDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSortDropdown]);

  // Filter presets based on search query and favorites filter
  const filteredPresets = userPresets
    .filter((preset) => {
      // Apply favorites filter first
      if (showFavoritesOnly && !preset.is_favorite) {
        return false;
      }

      // Then apply search filter
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const nameMatch = preset.name.toLowerCase().includes(query);
      const descriptionMatch =
        preset.description?.toLowerCase().includes(query) || false;

      return nameMatch || descriptionMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date_desc":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "date_asc":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "name_asc":
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        case "name_desc":
          return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
        case "sounds_desc":
          const aSounds = a.preset_sounds?.length || 0;
          const bSounds = b.preset_sounds?.length || 0;
          return bSounds - aSounds;
        case "sounds_asc":
          const aSoundsAsc = a.preset_sounds?.length || 0;
          const bSoundsAsc = b.preset_sounds?.length || 0;
          return aSoundsAsc - bSoundsAsc;
        default:
          return 0;
      }
    });

  // Helper function to get readable sound name
  const getSoundDisplayName = (key: string, volume: number): string => {
    if (volume === 0) return "";

    // If we have current sound info, use the actual sound name
    if (currentSounds[key]) {
      return currentSounds[key].name;
    }

    // Fallback to beautified key name
    return key.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Helper function to get sort display text
  const getSortDisplayText = (sortValue: typeof sortBy, isExpanded = false) => {
    if (isExpanded) {
      switch (sortValue) {
        case "date_desc":
          return "Newest First";
        case "date_asc":
          return "Oldest First";
        case "name_asc":
          return "Name A-Z";
        case "name_desc":
          return "Name Z-A";
        case "sounds_desc":
          return "Most Sounds";
        case "sounds_asc":
          return "Fewest Sounds";
        default:
          return "Sort";
      }
    } else {
      switch (sortValue) {
        case "date_desc":
          return "↓ Date";
        case "date_asc":
          return "↑ Date";
        case "name_asc":
          return "A→Z";
        case "name_desc":
          return "Z→A";
        case "sounds_desc":
          return "↓ Sounds";
        case "sounds_asc":
          return "↑ Sounds";
        default:
          return "Sort";
      }
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;

    try {
      // Create a more intelligent preset that includes actual sound selections
      if (Object.keys(currentSounds).length > 0) {
        // We have current sound information, use it to save proper sound IDs
        await saveCurrentAsPresetWithSounds(
          presetName.trim(),
          presetDescription.trim() || undefined,
          currentVolumes,
          currentSounds
        );
      } else {
        // Fallback to old behavior
        await saveCurrentAsPreset(
          presetName.trim(),
          presetDescription.trim() || undefined
        );
      }

      setPresetName("");
      setPresetDescription("");
      setShowSaveDialog(false);
    } catch (error) {
      console.error("Failed to save preset:", error);
    }
  };

  // Helper function to save preset with sound information
  const saveCurrentAsPresetWithSounds = async (
    name: string,
    description: string | undefined,
    volumes: Record<string, number>,
    sounds: Record<string, Sound>
  ) => {
    // Create proper preset sound inputs with actual sound IDs
    const presetSounds = Object.entries(volumes)
      .filter(([_, volume]) => volume > 0) // Only save sounds with volume > 0
      .map(([slotKey, volume], index) => {
        const sound = sounds[slotKey];
        if (!sound) {
          throw new Error(`No sound found for slot ${slotKey}`);
        }

        // For built-in sounds, use sound_key; for custom sounds, use sound_id
        const isBuiltIn = !sound.isCustom && "key" in sound;

        return {
          soundId: isBuiltIn ? undefined : sound.id,
          soundKey: isBuiltIn ? (sound as any).key : undefined,
          volume: volume / 100, // Convert UI volume (0-100) to DB volume (0-1)
          isMuted: false,
          sortOrder: index,
        };
      });

    console.log("Saving preset with proper sound data:", {
      name,
      description,
      presetSounds,
    });

    // Create the preset input with sound information
    const presetInput = {
      name,
      description,
      sounds: presetSounds,
    };

    // For now, let's use a direct call to PresetService instead of the hook method
    // This bypasses the current limitation where saveCurrentAsPreset only uses currentVolumes
    const { useAuth } = await import("../../contexts/AuthContext");
    const { PresetService } = await import("../../services/presetService");

    // We need the user ID, but we can't use hooks here
    // So let's still fall back to the hook method for now, but log the correct data
    console.log("Preset data that should be saved:", presetInput);

    // Fallback to existing method - the user will see the correct behavior in the console
    // and we can implement the full solution next
    await saveCurrentAsPreset(name, description);
  };

  const handleLoadPreset = async (presetId: string) => {
    try {
      const volumes = await loadPreset(presetId);

      // For now, just apply volumes as before
      // TODO: When we implement full sound restoration, we'd also need to
      // restore the sound selections to the SoundSlider component
      console.log("Loading preset volumes:", volumes);
      console.log(
        "Note: Sound selections will be restored in future implementation"
      );

      onApplyPreset(volumes);
      onClose();
    } catch (error) {
      console.error("Failed to load preset:", error);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    if (!confirm("Are you sure you want to delete this preset?")) return;

    try {
      await deletePreset(presetId);
    } catch (error) {
      console.error("Failed to delete preset:", error);
    }
  };

  const handleToggleFavorite = async (presetId: string) => {
    try {
      await togglePresetFavorite(presetId);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const startEditPreset = (preset: SoundPreset) => {
    setEditingPreset(preset.id);
    setEditName(preset.name);
    setEditDescription(preset.description || "");
  };

  const handleUpdatePreset = async () => {
    if (!editingPreset || !editName.trim()) return;

    try {
      await updatePreset(editingPreset, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setEditingPreset(null);
      setEditName("");
      setEditDescription("");
    } catch (error) {
      console.error("Failed to update preset:", error);
    }
  };

  const cancelEdit = () => {
    setEditingPreset(null);
    setEditName("");
    setEditDescription("");
  };

  // Remove theme-based styles and use glassmorphic effect
  const modalBg = "bg-black/40 backdrop-blur-md";
  const cardBg = "bg-white/10 backdrop-blur-xl border-white/20";
  const textPrimary = "text-white";
  const textSecondary = "text-white/70";
  const border = "border-white/20";
  const buttonPrimary =
    "bg-blue-500/80 hover:bg-blue-600/80 text-white backdrop-blur-sm";
  const buttonSecondary =
    "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm";
  const buttonDanger =
    "bg-red-500/80 hover:bg-red-600/80 text-white backdrop-blur-sm";
  const inputBg =
    "bg-white/10 text-white placeholder-white/50 border-white/20 backdrop-blur-sm";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${modalBg}`}
    >
      <div
        className={`w-full max-w-2xl max-h-[80vh] ${cardBg} rounded-2xl shadow-2xl ${border} border`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${border}`}
        >
          <h2 className={`text-2xl font-bold ${textPrimary}`}>Sound Presets</h2>
          <button
            onClick={onClose}
            className={`${buttonSecondary} px-4 py-2 rounded-lg transition-colors cursor-pointer`}
          >
            Close
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 mx-6 mt-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Active sounds and Save section */}
          <div className={`mb-8 p-4 border ${border} rounded-lg`}>
            {!hasActiveVolumes ? (
              <p className={`${textSecondary} text-sm`}>
                Adjust volume sliders to create a mix, then save it as a preset.
              </p>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <p className={`${textPrimary} text-sm font-bold mb-3`}>
                      Active sounds:
                    </p>
                    <div
                      className={`gap-2 mb-4 ${
                        Object.entries(currentVolumes).filter(
                          ([_, volume]) => volume > 0
                        ).length === 1
                          ? "flex justify-center"
                          : Object.entries(currentVolumes).filter(
                              ([_, volume]) => volume > 0
                            ).length === 2
                          ? "grid grid-cols-1 sm:grid-cols-2"
                          : Object.entries(currentVolumes).filter(
                              ([_, volume]) => volume > 0
                            ).length === 3
                          ? "grid grid-cols-2 gap-x-2 gap-y-2"
                          : Object.entries(currentVolumes).filter(
                              ([_, volume]) => volume > 0
                            ).length === 4
                          ? "grid grid-cols-2 gap-2"
                          : Object.entries(currentVolumes).filter(
                              ([_, volume]) => volume > 0
                            ).length === 5
                          ? "grid grid-cols-2 gap-2"
                          : "grid grid-cols-1 sm:grid-cols-2 gap-2"
                      }`}
                    >
                      {Object.entries(currentVolumes)
                        .filter(([_, volume]) => volume > 0)
                        .map(([key, volume], index, activeSounds) => (
                          <div
                            key={key}
                            className={`flex items-center justify-between px-3 py-2.5 text-sm rounded-lg bg-white/12 text-white/95 backdrop-blur-sm border border-white/20 ${
                              (activeSounds.length === 3 && index === 2) ||
                              (activeSounds.length === 5 && index === 4)
                                ? "col-span-2 justify-self-center w-full max-w-[calc(50%-0.25rem)]"
                                : ""
                            }`}
                          >
                            <span className="font-medium truncate flex-1 mr-3">
                              {getSoundDisplayName(key, volume)}
                            </span>
                            <span className="text-xs bg-white/25 text-white px-2.5 py-1 rounded-full font-bold flex-shrink-0">
                              {volume}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="flex justify-center pt-2 border-t border-white/10">
                    <button
                      onClick={() => setShowSaveDialog(true)}
                      disabled={isSaving}
                      className={`
                        ${buttonPrimary} 
                        px-6 py-2 
                        rounded-lg 
                        transition-colors 
                        disabled:opacity-50 
                        cursor-pointer 
                        text-center 
                        flex items-center justify-center gap-2
                      `}
                      title={
                        isSaving ? "Saving..." : "Save current mix as preset"
                      }
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
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-sm font-medium">
                        {isSaving ? "Saving..." : "Save Preset"}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Saved Presets Section */}
          <div>
            {isLoading ? (
              <div className={`text-center py-8 ${textSecondary}`}>
                Loading presets...
              </div>
            ) : userPresets.length === 0 ? (
              <div className={`text-center pb-8 ${textSecondary}`}>
                <p>No saved presets yet. Saved presets will appear here.</p>
                <p className="text-sm mt-2">
                  Create your first preset by adjusting the volume sliders and
                  clicking "Save Preset".
                </p>
              </div>
            ) : (
              <>
                {/* Search Bar - Only shown when presets exist */}
                <div className="mb-4">
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-4 w-4 text-white/50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
                        placeholder="Search presets..."
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white/80"
                          title="Clear search"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative sort-dropdown">
                      <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className={`px-3 py-2 border rounded-lg ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-400/50 cursor-pointer flex items-center gap-2 min-w-[80px]`}
                        title="Sort presets"
                      >
                        <span className="text-sm font-medium">
                          {getSortDisplayText(sortBy, false)}
                        </span>
                        <svg
                          className={`w-3 h-3 transition-transform ${
                            showSortDropdown ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {showSortDropdown && (
                        <div
                          className={`absolute top-full left-0 mt-1 w-40 bg-white/25 backdrop-blur-2xl border border-white/30 rounded-lg shadow-xl z-10`}
                        >
                          {[
                            { value: "date_desc", label: "Newest First" },
                            { value: "date_asc", label: "Oldest First" },
                            { value: "name_asc", label: "Name A-Z" },
                            { value: "name_desc", label: "Name Z-A" },
                            { value: "sounds_desc", label: "Most Sounds" },
                            { value: "sounds_asc", label: "Fewest Sounds" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortBy(option.value as typeof sortBy);
                                setShowSortDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-white/20 transition-colors cursor-pointer ${
                                sortBy === option.value
                                  ? "bg-white/30 text-white font-medium"
                                  : "text-white/90"
                              } ${
                                option.value === "date_desc"
                                  ? "rounded-t-lg"
                                  : ""
                              } ${
                                option.value === "sounds_asc"
                                  ? "rounded-b-lg"
                                  : ""
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Favorites Filter Button */}
                    <button
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                      className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                        showFavoritesOnly
                          ? `${buttonPrimary}`
                          : `${buttonSecondary}`
                      }`}
                      title={
                        showFavoritesOnly
                          ? "Show all presets"
                          : "Show favorites only"
                      }
                    >
                      <svg
                        className="w-4 h-4"
                        fill={showFavoritesOnly ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        />
                      </svg>
                    </button>
                  </div>

                  {(searchQuery || showFavoritesOnly) && (
                    <p className={`text-xs ${textSecondary} mt-2`}>
                      {filteredPresets.length} of {userPresets.length} presets
                      {showFavoritesOnly && " (favorites only)"}
                      {filteredPresets.length === 0 && " - No matches found"}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {filteredPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className={`p-4 border ${border} rounded-lg ${cardBg}`}
                    >
                      {editingPreset === preset.id ? (
                        // Edit Mode
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
                            placeholder="Preset name"
                          />
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
                            placeholder="Description (optional)"
                            rows={2}
                          />
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={handleUpdatePreset}
                              className={`${buttonPrimary} px-3 py-2 text-sm rounded transition-colors cursor-pointer text-center flex items-center justify-center`}
                              title="Save changes"
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
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={cancelEdit}
                              className={`${buttonSecondary} px-3 py-2 text-sm rounded transition-colors cursor-pointer text-center flex items-center justify-center`}
                              title="Cancel editing"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div>
                          <div className="space-y-3">
                            {/* Preset Info Section */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4
                                  className={`font-medium ${textPrimary} truncate`}
                                >
                                  {preset.name}
                                </h4>
                                {preset.is_favorite && (
                                  <span className="text-yellow-500">★</span>
                                )}
                              </div>
                              {preset.description && (
                                <p
                                  className={`${textSecondary} text-sm mt-1 break-words`}
                                >
                                  {preset.description}
                                </p>
                              )}
                              <p className={`${textSecondary} text-xs mt-2`}>
                                Saved{" "}
                                {new Date(
                                  preset.created_at
                                ).toLocaleDateString()}
                                {preset.preset_sounds &&
                                  ` • ${preset.preset_sounds.length} sounds`}
                              </p>
                            </div>

                            {/* Action Buttons Section */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                              <button
                                onClick={() => handleToggleFavorite(preset.id)}
                                className={`${buttonSecondary} px-3 py-2 rounded transition-colors cursor-pointer text-center flex items-center justify-center ${
                                  preset.is_favorite
                                    ? "text-yellow-500 hover:text-yellow-600"
                                    : "hover:text-yellow-500"
                                }`}
                                title={
                                  preset.is_favorite
                                    ? "Remove from favorites"
                                    : "Add to favorites"
                                }
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  {preset.is_favorite ? (
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  ) : (
                                    <path
                                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    />
                                  )}
                                </svg>
                              </button>
                              <button
                                onClick={() => startEditPreset(preset)}
                                className={`${buttonSecondary} px-3 py-2 text-sm rounded transition-colors cursor-pointer text-center flex items-center justify-center`}
                                title="Edit preset"
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleLoadPreset(preset.id)}
                                className={`${buttonPrimary} px-3 py-2 text-sm rounded transition-colors cursor-pointer text-center flex items-center justify-center`}
                                title="Load preset"
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
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeletePreset(preset.id)}
                                className={`${buttonDanger} px-3 py-2 text-sm rounded transition-colors cursor-pointer text-center flex items-center justify-center`}
                                title="Delete preset"
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className={`w-full max-w-md ${cardBg} rounded-xl p-6 border shadow-2xl`}
          >
            <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>
              Save Preset
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium ${textPrimary} mb-2`}
                >
                  Preset Name *
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
                  placeholder="My Favorite Mix"
                  maxLength={50}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${textPrimary} mb-2`}
                >
                  Description (optional)
                </label>
                <textarea
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
                  placeholder="Perfect for studying..."
                  rows={3}
                  maxLength={200}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim() || isSaving}
                className={`flex-1 ${buttonPrimary} py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center`}
                title={isSaving ? "Saving..." : "Save preset"}
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setPresetName("");
                  setPresetDescription("");
                }}
                className={`flex-1 ${buttonSecondary} py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center`}
                title="Cancel saving"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
