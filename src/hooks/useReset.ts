type SoundKey = "ocean" | "rain" | "chimes" | "fire" | "crickets" | "wind";

export function useReset(
  audioRef: React.RefObject<Record<string, HTMLAudioElement>>,
  setVolumes: React.Dispatch<React.SetStateAction<Record<SoundKey, number>>>
) {
  const handleReset = () => {

    // Get current volumes
    setVolumes((currentVolumes) => {
      const soundKeys: SoundKey[] = [
        "ocean",
        "rain",
        "chimes",
        "fire",
        "crickets",
        "wind",
      ];
      const animationDuration = 800; // 800ms total animation
      const steps = 40; // Number of animation steps
      const stepDuration = animationDuration / steps;

      // Calculate step decrements for each sound
      const stepDecrements: Record<SoundKey, number> = {} as Record<
        SoundKey,
        number
      >;
      for (const soundKey of soundKeys) {
        stepDecrements[soundKey] = currentVolumes[soundKey] / steps;
      }

      // Animate each step
      let currentStep = 0;
      const animationInterval = setInterval(() => {
        currentStep++;

        setVolumes((prevVolumes) => {
          const newVolumes = { ...prevVolumes };

          for (const soundKey of soundKeys) {
            // Calculate new volume for this step
            const newVolume = Math.max(
              0,
              prevVolumes[soundKey] - stepDecrements[soundKey]
            );
            newVolumes[soundKey] = newVolume;

            // Update audio volume if audio element exists
            if (audioRef.current && audioRef.current[soundKey]) {
              audioRef.current[soundKey].volume = newVolume / 100;
            }
          }

          return newVolumes;
        });

        // Stop animation when complete
        if (currentStep >= steps) {
          clearInterval(animationInterval);

          // Ensure all volumes are exactly 0 at the end
          setVolumes({
            ocean: 0,
            rain: 0,
            chimes: 0,
            fire: 0,
            crickets: 0,
            wind: 0,
          });

          // Ensure all audio volumes are exactly 0
          if (audioRef.current) {
            for (const soundKey of soundKeys) {
              if (audioRef.current[soundKey]) {
                audioRef.current[soundKey].volume = 0;
              }
            }
          }

          console.log("🔄 Smooth reset animation completed!");
        }
      }, stepDuration);

      // Return current volumes initially (animation will update them)
      return currentVolumes;
    });
  };

  return { handleReset };
}
