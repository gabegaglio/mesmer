import { useState, useRef } from "react";
import type { CustomSound } from "../../contexts/SoundContext";
import type { ThemeMode } from "../../hooks/useTheme";
import {
  shouldInvertIcons,
  getModalGlassmorphicStyles,
  getGlassmorphicClasses,
  getInputGlassmorphicStyles,
  getSelectedGlassmorphicStyles,
  getErrorGlassmorphicStyles,
} from "../../utils/themeUtils";

// SVG icon paths from public directory
const micSvg = "/svg/mic.svg";
const musicSvg = "/svg/music.svg";
const coffeeSvg = "/svg/coffee.svg";
const oceanSvg = "/svg/ocean.svg";
const rainSvg = "/svg/rain.svg";
const fireSvg = "/svg/fire.svg";
const cricketsSvg = "/svg/crickets.svg";
const windSvg = "/svg/wind.svg";
const chimesSvg = "/svg/chimes.svg";
const starSvg = "/svg/star.svg";

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
        className={`rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-xl backdrop-blur-xl border animate-in slide-in-from-top-5 zoom-in-95 duration-300 flex flex-col ${getModalGlassmorphicStyles()}`}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-6 pb-4 flex-shrink-0">
          <h3 className="m-0 text-lg font-semibold">Add Custom Sound</h3>
          <button
            className={`p-2 rounded-xl text-base transition-all duration-200 cursor-pointer ${getGlassmorphicClasses()}`}
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
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 backdrop-blur-sm border-white/50 hover:border-white/70 hover:bg-white/10`}
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
                      shouldInvertIcons() ? "brightness-0 invert" : ""
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
                className={`p-6 rounded-xl mb-6 backdrop-blur-sm border ${getModalGlassmorphicStyles()}`}
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
                      : `${getGlassmorphicClasses()} hover:bg-blue-500/30`
                  }`}
                  onClick={handlePreview}
                  disabled={!selectedFile}
                >
                  {isPlaying ? "⏸ Stop" : "▶ Preview"}
                </button>
                <button
                  className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 backdrop-blur-sm border ${getGlassmorphicClasses()}`}
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
                    className={`w-full px-3 py-2 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm ${getInputGlassmorphicStyles()}`}
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
                            ? `${getSelectedGlassmorphicStyles()} shadow-lg`
                            : `${getGlassmorphicClasses()}`
                        }`}
                        title={icon.name}
                      >
                        <img
                          src={icon.svg}
                          alt={icon.name}
                          className={`w-5 h-5 object-contain transition-all ${
                            shouldInvertIcons() ? "brightness-0 invert" : ""
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
                    className={`w-full px-3 py-2 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm ${getInputGlassmorphicStyles()}`}
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
                  className={`p-3 rounded-xl text-sm mb-4 backdrop-blur-sm border ${getErrorGlassmorphicStyles()}`}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 backdrop-blur-sm border ${getGlassmorphicClasses()}`}
                  onClick={handleCancel}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 backdrop-blur-sm border disabled:opacity-50 disabled:cursor-not-allowed ${getGlassmorphicClasses()} hover:bg-blue-500/35`}
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
