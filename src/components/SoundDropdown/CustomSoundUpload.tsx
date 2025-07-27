import { useState, useRef } from "react";
import type { CustomSound } from "../../contexts/SoundContext";
import type { ThemeMode } from "../../hooks/useTheme";
import { shouldInvertIcons } from "../../utils/themeUtils";

// Import all available SVG icons
import micSvg from "../../assets/svg/mic.svg";
import musicSvg from "../../assets/svg/music.svg";
import coffeeSvg from "../../assets/svg/coffee.svg";
import oceanSvg from "../../assets/svg/ocean.svg";
import rainSvg from "../../assets/svg/rain.svg";
import fireSvg from "../../assets/svg/fire.svg";
import cricketsSvg from "../../assets/svg/crickets.svg";
import windSvg from "../../assets/svg/wind.svg";
import chimesSvg from "../../assets/svg/chimes.svg";
import starSvg from "../../assets/svg/star.svg";

// Available icons for custom sounds
const AVAILABLE_ICONS = [
  { id: "mic", name: "Microphone", svg: micSvg },
  { id: "music", name: "Music", svg: musicSvg },
  { id: "coffee", name: "Coffee", svg: coffeeSvg },
  { id: "ocean", name: "Ocean", svg: oceanSvg },
  { id: "rain", name: "Rain", svg: rainSvg },
  { id: "fire", name: "Fire", svg: fireSvg },
  { id: "crickets", name: "Crickets", svg: cricketsSvg },
  { id: "wind", name: "Wind", svg: windSvg },
  { id: "chimes", name: "Chimes", svg: chimesSvg },
  { id: "star", name: "Star", svg: starSvg },
];

interface CustomSoundUploadProps {
  onAdd: (sound: CustomSound) => void;
  onCancel: () => void;
  themeMode: ThemeMode;
}

const ALLOWED_FILE_TYPES = [".mp3", ".wav", ".ogg", ".m4a"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function CustomSoundUpload({
  onAdd,
  onCancel,
  themeMode,
}: CustomSoundUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [soundName, setSoundName] = useState("");
  const [category, setCategory] = useState("Custom");
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]); // Default to microphone
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ["Nature", "Focus", "Urban", "Custom"];

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Validate file type
    const fileExtension = file.name
      .toLowerCase()
      .slice(file.name.lastIndexOf("."));
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      setError(
        `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`
      );
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
      return;
    }

    setSelectedFile(file);
    setSoundName(file.name.replace(/\.[^/.]+$/, "")); // Remove file extension

    // Create preview audio
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.src = url;
    setPreviewAudio(audio);
  }

  function handlePreview() {
    if (!previewAudio) return;

    if (isPlaying) {
      previewAudio.pause();
      setIsPlaying(false);
    } else {
      previewAudio.currentTime = 0;
      previewAudio.volume = 0.3;
      previewAudio.play();
      setIsPlaying(true);

      // Stop after 5 seconds
      setTimeout(() => {
        if (previewAudio) {
          previewAudio.pause();
          setIsPlaying(false);
        }
      }, 5000);

      previewAudio.addEventListener("ended", () => {
        setIsPlaying(false);
      });
    }
  }

  async function handleSubmit() {
    if (!selectedFile || !soundName.trim()) {
      setError("Please select a file and enter a name");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await selectedFile.arrayBuffer();

      const customSound: CustomSound = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: soundName.trim(),
        fileName: selectedFile.name,
        category: category,
        audioData: arrayBuffer,
        dateAdded: new Date(),
        fileSize: selectedFile.size,
        icon: selectedIcon.svg,
        isCustom: true,
      };

      onAdd(customSound);

      // Cleanup
      if (previewAudio) {
        previewAudio.pause();
        URL.revokeObjectURL(previewAudio.src);
      }
    } catch (err) {
      setError("Failed to process audio file");
      console.error("Error processing audio file:", err);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleCancel() {
    if (previewAudio) {
      previewAudio.pause();
      URL.revokeObjectURL(previewAudio.src);
    }
    onCancel();
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[2000] backdrop-blur-sm bg-black/20 animate-in fade-in duration-200 p-4">
      <div
        className={`rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-xl backdrop-blur-xl border animate-in slide-in-from-top-5 zoom-in-95 duration-300 flex flex-col ${
          themeMode === "slate"
            ? "bg-white/15 border-white/25 text-white"
            : themeMode === "day"
            ? "bg-white/20 border-white/30 text-white"
            : themeMode === "midnight"
            ? "bg-black/30 border-purple-500/30 text-white shadow-purple-900/50"
            : "bg-black/25 border-white/20 text-white"
        }`}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-6 pb-4 flex-shrink-0">
          <h3 className="m-0 text-lg font-semibold">Add Custom Sound</h3>
          <button
            className={`p-2 rounded-xl text-base transition-all duration-200 cursor-pointer backdrop-blur-sm border ${
              themeMode === "slate"
                ? "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                : themeMode === "day"
                ? "bg-white/15 border-white/25 text-white hover:bg-white/25 hover:text-white"
                : themeMode === "midnight"
                ? "bg-black/15 border-purple-500/20 text-purple-300 hover:bg-black/25 hover:text-white"
                : "bg-black/10 border-white/15 text-gray-300 hover:bg-black/20 hover:text-white"
            }`}
            onClick={handleCancel}
            disabled={isProcessing}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 backdrop-blur-sm ${
                themeMode === "slate"
                  ? "border-gray-400/50 hover:border-gray-500/70 hover:bg-white/10"
                  : themeMode === "day"
                  ? "border-gray-400/60 hover:border-gray-500/80 hover:bg-white/15"
                  : themeMode === "midnight"
                  ? "border-purple-400/50 hover:border-purple-300/70 hover:bg-purple-500/10"
                  : "border-gray-400/50 hover:border-gray-300/70 hover:bg-white/10"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_FILE_TYPES.join(",")}
                onChange={handleFileSelect}
                className="hidden"
                id="sound-file-input"
              />
              <label
                htmlFor="sound-file-input"
                className="cursor-pointer block"
              >
                <div className="mb-4 flex justify-center">
                  <img
                    src={selectedIcon.svg}
                    alt={selectedIcon.name}
                    className={`w-12 h-12 object-contain transition-all ${
                      shouldInvertIcons(themeMode) ? "brightness-0 invert" : ""
                    }`}
                  />
                </div>
                <div className="text-base">
                  <div>Choose an audio file</div>
                  <div className="text-sm mt-2 opacity-70">
                    {ALLOWED_FILE_TYPES.join(", ")} • Max{" "}
                    {MAX_FILE_SIZE / (1024 * 1024)}MB
                  </div>
                </div>
              </label>
            </div>
          ) : (
            <div className="text-center">
              <div
                className={`p-6 rounded-xl mb-6 backdrop-blur-sm border ${
                  themeMode === "slate"
                    ? "bg-white/10 border-white/20"
                    : themeMode === "day"
                    ? "bg-white/15 border-white/25"
                    : themeMode === "midnight"
                    ? "bg-black/15 border-purple-500/20"
                    : "bg-black/10 border-white/15"
                }`}
              >
                <div className="text-base font-medium mb-2">
                  {selectedFile.name}
                </div>
                <div className="text-sm opacity-70">
                  {formatFileSize(selectedFile.size)}
                </div>
              </div>

              <div className="flex gap-3 justify-center mb-6">
                <button
                  className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 backdrop-blur-sm border ${
                    isPlaying
                      ? "bg-red-500/80 border-red-400/50 text-white"
                      : themeMode === "slate"
                      ? "bg-blue-500/20 border-blue-400/30 text-white hover:bg-blue-500/30"
                      : themeMode === "day"
                      ? "bg-blue-500/25 border-blue-400/40 text-white hover:bg-blue-500/35"
                      : themeMode === "midnight"
                      ? "bg-purple-500/30 border-purple-400/40 text-white hover:bg-purple-500/40"
                      : "bg-blue-500/25 border-blue-400/30 text-white hover:bg-blue-500/35"
                  }`}
                  onClick={handlePreview}
                  disabled={!selectedFile}
                >
                  {isPlaying ? "⏸ Stop" : "▶ Preview"}
                </button>
                <button
                  className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 backdrop-blur-sm border ${
                    themeMode === "slate"
                      ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                      : themeMode === "day"
                      ? "bg-white/15 border-white/25 text-white hover:bg-white/25"
                      : themeMode === "midnight"
                      ? "bg-black/15 border-purple-500/20 text-purple-200 hover:bg-black/25"
                      : "bg-black/10 border-white/15 text-gray-300 hover:bg-black/20"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change File
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Sound Name
                  </label>
                  <input
                    type="text"
                    placeholder="Sound Name"
                    value={soundName}
                    onChange={(e) => setSoundName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm ${
                      themeMode === "slate"
                        ? "bg-white/15 border-white/25 text-white placeholder-white/60"
                        : themeMode === "day"
                        ? "bg-white/20 border-white/30 text-white placeholder-white/60"
                        : themeMode === "midnight"
                        ? "bg-black/15 border-purple-500/20 text-white"
                        : "bg-black/10 border-white/15 text-white"
                    }`}
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Icon</label>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {AVAILABLE_ICONS.map((icon) => (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => setSelectedIcon(icon)}
                        className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-center cursor-pointer backdrop-blur-sm ${
                          selectedIcon.id === icon.id
                            ? themeMode === "slate"
                              ? "bg-blue-500/25 border-blue-400/40 shadow-lg"
                              : themeMode === "day"
                              ? "bg-blue-500/30 border-blue-400/50 shadow-lg"
                              : themeMode === "midnight"
                              ? "bg-purple-500/35 border-purple-400/50 shadow-lg"
                              : "bg-blue-500/30 border-blue-400/40 shadow-lg"
                            : themeMode === "slate"
                            ? "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30"
                            : themeMode === "day"
                            ? "bg-white/15 border-white/25 hover:bg-white/25 hover:border-white/35"
                            : themeMode === "midnight"
                            ? "bg-black/15 border-purple-500/20 hover:bg-black/25 hover:border-purple-400/30"
                            : "bg-black/10 border-white/15 hover:bg-black/20 hover:border-white/25"
                        }`}
                        title={icon.name}
                      >
                        <img
                          src={icon.svg}
                          alt={icon.name}
                          className={`w-5 h-5 object-contain transition-all ${
                            selectedIcon.id === icon.id
                              ? "brightness-0 invert"
                              : shouldInvertIcons(themeMode)
                              ? "brightness-0 invert"
                              : ""
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm ${
                      themeMode === "slate"
                        ? "bg-white/15 border-white/25 text-white"
                        : themeMode === "day"
                        ? "bg-white/20 border-white/30 text-white"
                        : themeMode === "midnight"
                        ? "bg-black/15 border-purple-500/20 text-white"
                        : "bg-black/10 border-white/15 text-white"
                    }`}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div
                  className={`p-3 rounded-xl text-sm mb-4 backdrop-blur-sm border ${
                    themeMode === "slate"
                      ? "bg-red-100/20 border-red-300/30 text-red-700"
                      : themeMode === "day"
                      ? "bg-red-100/25 border-red-300/40 text-red-700"
                      : themeMode === "midnight"
                      ? "bg-red-500/15 border-red-400/25 text-red-300"
                      : "bg-red-500/20 border-red-400/30 text-red-300"
                  }`}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 backdrop-blur-sm border ${
                    themeMode === "slate"
                      ? "bg-white/10 border-white/20 text-gray-700 hover:bg-white/20"
                      : themeMode === "day"
                      ? "bg-white/15 border-white/25 text-gray-700 hover:bg-white/25"
                      : themeMode === "midnight"
                      ? "bg-black/15 border-purple-500/20 text-purple-200 hover:bg-black/25"
                      : "bg-black/10 border-white/15 text-gray-300 hover:bg-black/20"
                  }`}
                  onClick={handleCancel}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 backdrop-blur-sm border disabled:opacity-50 disabled:cursor-not-allowed ${
                    themeMode === "slate"
                      ? "bg-blue-500/25 border-blue-400/40 text-white hover:bg-blue-500/35"
                      : themeMode === "day"
                      ? "bg-blue-500/30 border-blue-400/50 text-white hover:bg-blue-500/40"
                      : themeMode === "midnight"
                      ? "bg-purple-500/35 border-purple-400/50 text-white hover:bg-purple-500/45"
                      : "bg-blue-500/30 border-blue-400/40 text-white hover:bg-blue-500/40"
                  }`}
                  onClick={handleSubmit}
                  disabled={isProcessing || !soundName.trim()}
                >
                  {isProcessing ? "Adding..." : "Add Sound"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomSoundUpload;
