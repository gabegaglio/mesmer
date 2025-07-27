const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const sound = event.target.name;
  const volume = parseInt(event.target.value);
  setVolumes((prevVolumes) => ({
    ...prevVolumes,
    [sound]: volume,
  }));

  if (audioRef.current[sound]) {
    audioRef.current[sound].volume = volume / 100;
  }
};
