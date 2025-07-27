import { useState, useEffect } from "react";

type SoundKey = "ocean" | "rain" | "chimes" | "fire" | "crickets" | "wind";

interface Sound {
  key: SoundKey;
  name: string;
  file: string;
  volume: number;
  image: string;
}

// Global singleton to ensure only one audio initialization ever happens
class AudioInitializer {
  private static instance: AudioInitializer;
  private initialized = false;
  private initializing = false;

  static getInstance(): AudioInitializer {
    if (!AudioInitializer.instance) {
      AudioInitializer.instance = new AudioInitializer();
    }
    return AudioInitializer.instance;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  isInitializing(): boolean {
    return this.initializing;
  }

  async initialize(
    _sounds: Sound[],
    _audioRef: React.RefObject<Record<string, HTMLAudioElement>>,
    event: Event
  ): Promise<boolean> {
    // Prevent multiple initializations
    if (this.initialized || this.initializing) {
      return this.initialized;
    }

    // Ensure this is a trusted user event
    if (!event.isTrusted) {
      console.warn("🎵 Audio initialization requires trusted user event");
      return false;
    }

    this.initializing = true;
    console.log("🎵 Direct user interaction detected - audio context unlocked");

    // Just mark as initialized - individual audio playback is handled by volume changes
    this.initialized = true;
    this.initializing = false;
    console.log(`🎵 Audio initialization completed - ready for playback!`);
    return true;
  }
}

export function useAudio(
  sounds: Sound[],
  audioRef: React.RefObject<Record<string, HTMLAudioElement>>,
  volumes: Record<SoundKey, number>,
  isMuted: boolean,
  setVolumes: React.Dispatch<React.SetStateAction<Record<SoundKey, number>>>
) {
  const [audioInitialized, setAudioInitialized] = useState(false);
  const audioInitializer = AudioInitializer.getInstance();

  // Initialize audio on first direct user interaction during slider movement
  const initializeAudioOnInteraction = async (event: Event) => {
    // Check global singleton state
    if (audioInitializer.isInitialized() || audioInitializer.isInitializing()) {
      return;
    }

    const success = await audioInitializer.initialize(sounds, audioRef, event);
    if (success) {
      setAudioInitialized(true);
    }
  };

  // Creates and prepares audio objects - now properly updates when sounds change
  useEffect(() => {
    for (const sound of sounds) {
      // Only create if it doesn't already exist OR if the file has changed
      const existingAudio = audioRef.current![sound.key];

      // Better comparison: check if audio doesn't exist or if we have a new sound file
      const needsUpdate =
        !existingAudio ||
        (sound.file &&
          !existingAudio.src.includes(sound.file.split("/").pop() || ""));

      if (needsUpdate) {
        // Clean up existing audio if it exists
        if (existingAudio) {
          existingAudio.pause();
          if (existingAudio.src && existingAudio.src.startsWith("blob:")) {
            URL.revokeObjectURL(existingAudio.src);
          }
        }

        // Only create audio if we have a valid file path
        if (sound.file) {
          const audioFile = new Audio(sound.file);
          audioFile.preload = "auto";
          audioFile.loop = true;
          audioFile.volume = 0;

          audioRef.current![sound.key] = audioFile;
          console.log(
            `Audio ${sound.key} created/updated with file: ${sound.file}`
          );
          console.log(`Audio ${sound.key} actual src: ${audioFile.src}`);
        }
      } else if (existingAudio && sound.file) {
        console.log(
          `Audio ${sound.key} already exists with correct file: ${existingAudio.src}`
        );
      }
    }
  }, [sounds]); // Now depends on sounds array so it updates when sounds change

  // Handle slider interaction - both mouse and touch events
  const handleSliderInteraction = (
    event: React.MouseEvent | React.TouchEvent
  ) => {
    // Convert React event to native event for initializeAudioOnInteraction
    const nativeEvent = event.nativeEvent;
    initializeAudioOnInteraction(nativeEvent);
  };

  // Volume change handler that also triggers initialization on first interaction
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Initialize audio if not already done (fallback)
    if (!audioInitializer.isInitialized()) {
      initializeAudioOnInteraction(event.nativeEvent);
    }

    const sound = event.target.name as SoundKey;
    const volume = parseFloat(event.target.value);

    // Update state immediately
    setVolumes((prev) => ({
      ...prev,
      [sound]: volume,
    }));

    // Control volume and playback
    const audio = audioRef.current![sound];
    if (audio) {
      const targetVolume = isMuted ? 0 : volume / 100;
      audio.volume = targetVolume;

      // Start playing if volume > 0 and audio is not playing
      if (targetVolume > 0 && audio.paused) {
        audio.play().catch((error) => {
          console.warn(`🎵 Failed to start ${sound}:`, error);
        });
      }
      // Pause if volume is 0
      else if (targetVolume === 0 && !audio.paused) {
        audio.pause();
      }

      console.log(
        `🎵 Set ${sound} volume to ${volume}% (playing: ${!audio.paused})`
      );
    }
  };

  // Update all audio volumes when mute state changes
  useEffect(() => {
    for (const sound of sounds) {
      const audio = audioRef.current![sound.key];
      if (audio) {
        const targetVolume = isMuted ? 0 : volumes[sound.key] / 100;
        audio.volume = targetVolume;

        // Start playing if volume > 0 and audio is not playing
        if (targetVolume > 0 && audio.paused) {
          audio.play().catch((error) => {
            console.warn(`🎵 Failed to start ${sound.key}:`, error);
          });
        }
        // Pause if volume is 0
        else if (targetVolume === 0 && !audio.paused) {
          audio.pause();
        }
      }
    }
  }, [isMuted, volumes, sounds]);

  // Sync local state with global state
  useEffect(() => {
    setAudioInitialized(audioInitializer.isInitialized());
  }, [audioInitializer]);

  const initializeAudio = async () => {
    // This function is now mostly unused - keeping for compatibility
    setAudioInitialized(true);
  };

  return {
    audioInitialized,
    initializeAudio,
    handleVolumeChange,
    handleSliderInteraction,
  };
}
