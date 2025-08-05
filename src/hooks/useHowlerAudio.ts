import { useRef, useEffect } from "react";
import { Howl } from "howler";
import type { Sound } from "../types/sound";

export type SlotKey = "slot1" | "slot2" | "slot3" | "slot4" | "slot5" | "slot6";

export const SLOT_KEYS: SlotKey[] = [
  "slot1",
  "slot2",
  "slot3",
  "slot4",
  "slot5",
  "slot6",
];

interface UseHowlerAudioProps {
  selectedSounds: Record<SlotKey, Sound>;
  volumes: Record<SlotKey, number>;
  isMuted: boolean;
}

export function useHowlerAudio({
  selectedSounds,
  volumes,
  isMuted,
}: UseHowlerAudioProps) {
  const howlsRef = useRef<Record<string, Howl>>({});
  const currentSourcesRef = useRef<Record<string, string>>({});

  // Initialize and update Howl instances when selectedSounds change
  useEffect(() => {
    SLOT_KEYS.forEach((slotKey, index) => {
      // Add a small delay to stagger the audio loading
      setTimeout(() => {
        const sound = selectedSounds[slotKey];
        const currentVolume = volumes[slotKey] || 0;
        const existingHowl = howlsRef.current[slotKey];
        const existingSource = currentSourcesRef.current[slotKey];

        if (sound && sound.id !== "placeholder") {
          const audioFile = sound.audioFile;

          // Ensure audioFile is defined before proceeding
          if (!audioFile) {
            console.warn(
              `⚠️ No audio file for sound: ${sound.name || "unknown"}`
            );
            return;
          }

          // Debug logging
          console.log(`🎵 Processing sound for ${slotKey}:`, {
            soundName: sound.name,
            soundId: sound.id,
            audioFile: audioFile,
            isCustom: sound.isCustom,
          });

          // Only create new Howl if sound source changed
          if (!existingHowl || existingSource !== audioFile) {
            // Clean up existing Howl
            if (existingHowl) {
              existingHowl.unload();
              delete howlsRef.current[slotKey];
              delete currentSourcesRef.current[slotKey];
            }

            // Create new Howl instance
            console.log(
              `🎵 Creating new Howl instance for ${slotKey} with src: ${audioFile}`
            );

            // Test if we can create a basic HTML5 audio element first
            try {
              const testAudio = new Audio(audioFile);
              testAudio.addEventListener("canplaythrough", () => {
                console.log(`✅ HTML5 Audio can load: ${audioFile}`);
              });
              testAudio.addEventListener("error", (e) => {
                console.error(`❌ HTML5 Audio failed: ${audioFile}`, e);
              });
              testAudio.load();
            } catch (e) {
              console.error(
                `❌ Failed to create HTML5 Audio element for: ${audioFile}`,
                e
              );
            }

            const howl = new Howl({
              src: [audioFile], // audioFile is now guaranteed to be string
              loop: true,
              volume: isMuted ? 0 : currentVolume / 100,
              preload: true,
              format: ["mp3", "wav", "m4a"],
              html5: true, // Enable HTML5 audio as fallback for compatibility
              autoplay: false,
              onload: () => {
                console.log(`🎵 Howl loaded: ${slotKey} - ${audioFile}`);
              },
              onloaderror: (id: number, error: any) => {
                console.error(`❌ Howl load error for ${slotKey}:`, {
                  error,
                  src: audioFile,
                  soundName: sound.name,
                  soundId: sound.id,
                  isCustom: sound.isCustom,
                  errorDetails:
                    typeof error === "object" ? JSON.stringify(error) : error,
                });

                // Try to test if the URL is accessible
                fetch(audioFile, { method: "HEAD" })
                  .then((response) => {
                    console.log(`🔍 URL accessibility test for ${audioFile}:`, {
                      status: response.status,
                      contentType: response.headers.get("content-type"),
                      url: audioFile,
                    });
                  })
                  .catch((fetchError) => {
                    console.error(
                      `🔍 URL fetch test failed for ${audioFile}:`,
                      fetchError
                    );
                  });
              },
              onplayerror: (id: number, error: any) => {
                console.error(`❌ Howl play error for ${slotKey}:`, error);
                // Try to unlock audio on mobile
                howl.once("unlock", () => {
                  howl.play();
                });
              },
            });

            // Store the Howl instance and track the source
            howlsRef.current[slotKey] = howl;
            currentSourcesRef.current[slotKey] = audioFile;

            // If there was a volume level, start playing the new sound
            if (currentVolume > 0 && !isMuted) {
              howl.play();
            }
          } else if (existingHowl) {
            // Update existing Howl's volume and playback state
            const targetVolume = isMuted ? 0 : currentVolume / 100;
            if (existingHowl.volume() !== targetVolume) {
              existingHowl.volume(targetVolume);
            }

            // Start playing if volume > 0 and not already playing
            if (currentVolume > 0 && !isMuted && !existingHowl.playing()) {
              existingHowl.play();
            }
            // Stop if volume is 0
            else if (currentVolume === 0 && existingHowl.playing()) {
              existingHowl.stop();
            }
          }
        }
      }, index * 100); // 100ms delay between each audio initialization
    });
  }, [selectedSounds, volumes, isMuted]);

  // Cleanup function
  useEffect(() => {
    return () => {
      Object.values(howlsRef.current).forEach((howl) => {
        if (howl) {
          howl.unload();
        }
      });
      howlsRef.current = {};
      currentSourcesRef.current = {};
    };
  }, []);

  return {
    howlsRef,
    updateVolume: (slotKey: SlotKey, volume: number) => {
      const howl = howlsRef.current[slotKey];
      if (howl) {
        const targetVolume = isMuted ? 0 : volume / 100;
        howl.volume(targetVolume);

        if (volume > 0 && !isMuted && !howl.playing()) {
          howl.play();
        } else if (volume === 0 && howl.playing()) {
          howl.stop();
        }
      }
    },
    stopAll: () => {
      SLOT_KEYS.forEach((slotKey) => {
        const howl = howlsRef.current[slotKey];
        if (howl) {
          howl.volume(0);
          howl.stop();
        }
      });
    },
  };
}
