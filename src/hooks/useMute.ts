import { useState } from "react";

export function useMute(
  audioRef: React.RefObject<Record<string, HTMLAudioElement>>,
  volumes: Record<string, number>
) {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    console.log("Mute button clicked! Current muted state:", isMuted);
    console.log("AudioRef contents:", audioRef.current);
    console.log("Volumes:", volumes);

    setIsMuted((prevMuted) => {
      const newMutedState = !prevMuted;
      console.log("New muted state will be:", newMutedState);

      // Audio logic goes INSIDE this callback:
      for (const soundKey in volumes) {
        if (audioRef.current && audioRef.current[soundKey]) {
          const effectiveVolume = newMutedState ? 0 : volumes[soundKey] / 100;
          console.log(`Setting ${soundKey} volume to:`, effectiveVolume);
          audioRef.current[soundKey].volume = effectiveVolume;
        } else {
          console.log(`Audio element for ${soundKey} not found`);
        }
      }

      return newMutedState;
    });
  };

  return { isMuted, toggleMute };
}
