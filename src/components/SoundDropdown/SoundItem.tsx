import { useState, useEffect, useRef } from "react";
import type { Sound } from "../../types/sound";
import { type ThemeMode } from "../../hooks/useTheme";
import trashIcon from "../../assets/svg/trash.svg";
import { shouldInvertIcons } from "../../utils/themeUtils";

interface SoundItemProps {
  sound: Sound;
  isSelected: boolean;
  onSelect: (sound: Sound) => void;
  onDelete?: (soundId: string) => void;
  themeMode?: ThemeMode;
  showDeleteButton?: boolean; // Only show delete for custom sounds in Custom category
}

function SoundItem({
  sound,
  isSelected,
  onSelect,
  onDelete,
  themeMode,
  showDeleteButton = false,
}: SoundItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(
    null
  );

  // MEMORY LEAK FIX: Track timeouts and blob URLs for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // MEMORY LEAK FIX: Comprehensive cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Stop and cleanup audio
      if (previewAudio) {
        previewAudio.pause();
        if (previewAudio.src && previewAudio.src.startsWith("blob:")) {
          URL.revokeObjectURL(previewAudio.src);
        }
      }

      // Cleanup tracked blob URL
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [previewAudio]);

  function handlePreview(e: React.MouseEvent) {
    e.stopPropagation();

    if (isPlaying && previewAudio) {
      previewAudio.pause();
      setIsPlaying(false);

      // Clear timeout if stopping manually
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Stop any existing preview and cleanup
    if (previewAudio) {
      previewAudio.pause();
      if (previewAudio.src && previewAudio.src.startsWith("blob:")) {
        URL.revokeObjectURL(previewAudio.src);
      }
    }

    // Clean up any existing tracked blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    let audio: HTMLAudioElement;

    // Handle different sound types
    if (sound.isCustom) {
      // For new custom sounds from Supabase, use audioFile URL
      if (sound.audioFile) {
        audio = new Audio(sound.audioFile);
      } else if (
        "audioData" in sound &&
        (sound as any).audioData instanceof ArrayBuffer
      ) {
        // For legacy custom sounds, create from ArrayBuffer
        const blob = new Blob([(sound as any).audioData], {
          type: "audio/mpeg",
        });
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url; // Track for cleanup
        audio = new Audio(url);
      } else {
        console.warn("Custom sound has no audio data or file URL");
        return;
      }
    } else {
      // For built-in sounds, use the file path
      audio = new Audio(sound.audioFile);
    }

    audio.volume = 0.3;
    audio.currentTime = 0;

    setPreviewAudio(audio);
    setIsPlaying(true);

    audio.play().catch((error) => {
      console.warn("Failed to play preview:", error);
      setIsPlaying(false);
    });

    // MEMORY LEAK FIX: Track timeout and ensure cleanup
    timeoutRef.current = setTimeout(() => {
      if (audio) {
        audio.pause();
        setIsPlaying(false);
        if (audio.src && audio.src.startsWith("blob:")) {
          URL.revokeObjectURL(audio.src);
        }
      }

      // Clean up tracked blob URL
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }

      timeoutRef.current = null;
    }, 3000);

    // MEMORY LEAK FIX: Enhanced cleanup when audio ends
    const handleAudioEnd = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setIsPlaying(false);

      if (audio.src && audio.src.startsWith("blob:")) {
        URL.revokeObjectURL(audio.src);
      }

      // Clean up tracked blob URL
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };

    audio.addEventListener("ended", handleAudioEnd);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (onDelete && sound.isCustom) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete "${sound.name}"?`
      );
      if (confirmDelete) {
        onDelete(sound.id);
      }
    }
  }

  function renderSoundIcon() {
    // Handle undefined or missing icon
    if (!sound.icon) {
      return <span className="text-lg">🎵</span>;
    }

    if (typeof sound.icon === "string" && sound.icon.startsWith("http")) {
      return (
        <img
          src={sound.icon}
          alt={sound.name}
          className={`w-5 h-5 object-contain transition-all ${
            shouldInvertIcons(themeMode || "slate") ? "brightness-0 invert" : ""
          }`}
        />
      );
    } else if (typeof sound.icon === "string" && sound.icon.length <= 2) {
      // Emoji icon
      return <span className="text-lg">{sound.icon}</span>;
    } else {
      // SVG import or path
      return (
        <img
          src={sound.icon}
          alt={sound.name}
          className={`w-5 h-5 object-contain transition-all ${
            shouldInvertIcons(themeMode || "slate") ? "brightness-0 invert" : ""
          }`}
        />
      );
    }
  }

  return (
    <div
      className={`flex items-center justify-between p-3 mb-2 rounded-xl transition-all duration-200 cursor-pointer backdrop-blur-sm border ${
        isSelected
          ? themeMode === "slate"
            ? "bg-blue-500/20 border-blue-400/30 text-white"
            : themeMode === "day"
            ? "bg-blue-500/25 border-blue-400/40 text-white"
            : themeMode === "midnight"
            ? "bg-purple-500/30 border-purple-400/40 text-white"
            : "bg-blue-500/25 border-blue-400/30 text-white"
          : themeMode === "slate"
          ? "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
          : themeMode === "day"
          ? "bg-white/15 border-white/25 text-white hover:bg-white/25 hover:border-white/35"
          : themeMode === "midnight"
          ? "bg-black/15 border-purple-500/20 text-white hover:bg-black/25 hover:border-purple-400/30"
          : "bg-black/10 border-white/15 text-white hover:bg-black/20 hover:border-white/25"
      }`}
      onClick={() => onSelect(sound)}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center justify-center w-8 h-8">
          {renderSoundIcon()}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{sound.name}</span>
          <span className="text-xs opacity-70">{sound.category}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Preview Button */}
        <button
          className={`p-1.5 rounded-lg transition-all duration-200 backdrop-blur-sm border cursor-pointer ${
            isPlaying
              ? "bg-red-500/80 border-red-400/50 text-white"
              : themeMode === "slate"
              ? "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              : themeMode === "day"
              ? "bg-white/15 border-white/25 text-white hover:bg-white/25 hover:text-white"
              : themeMode === "midnight"
              ? "bg-black/15 border-purple-500/20 text-gray-300 hover:bg-black/25 hover:text-white"
              : "bg-black/10 border-white/15 text-gray-400 hover:bg-black/20 hover:text-white"
          }`}
          onClick={handlePreview}
          aria-label={isPlaying ? "Stop preview" : "Preview sound"}
        >
          {isPlaying ? (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 4h2v12H6V4zm6 0h2v12h-2V4z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 5l5.196 2.804a.5.5 0 010 .892L8 12V5z" />
            </svg>
          )}
        </button>

        {/* Delete Button - Only show for custom sounds in Custom category */}
        {showDeleteButton && sound.isCustom && (
          <button
            className={`p-1.5 rounded-lg transition-all duration-200 backdrop-blur-sm border cursor-pointer ${
              themeMode === "slate"
                ? "bg-white/10 border-white/20 text-white hover:bg-red-100/50 hover:border-red-300/50 hover:text-red-700"
                : themeMode === "day"
                ? "bg-white/15 border-white/25 text-white hover:bg-red-100/60 hover:border-red-300/60 hover:text-red-700"
                : themeMode === "midnight"
                ? "bg-black/15 border-purple-500/20 text-gray-400 hover:bg-red-500/20 hover:border-red-400/30 hover:text-red-300"
                : "bg-black/10 border-white/15 text-gray-400 hover:bg-red-500/20 hover:border-red-400/30 hover:text-red-300"
            }`}
            onClick={handleDelete}
            aria-label="Delete sound"
          >
            <img
              src={trashIcon}
              alt="Delete"
              className={`w-3 h-3 ${
                shouldInvertIcons(themeMode || "slate")
                  ? "brightness-0 invert"
                  : ""
              }`}
            />
          </button>
        )}
      </div>
    </div>
  );
}

export default SoundItem;
