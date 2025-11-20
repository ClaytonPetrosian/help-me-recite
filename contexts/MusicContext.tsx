import createContextHook from "@nkzw/create-context-hook";
import { Audio } from "expo-av";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

const musicTracks = [
  {
    id: "baroque1",
    name: "巴洛克音乐 1",
    uri: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3",
  },
  {
    id: "baroque2",
    name: "巴洛克音乐 2",
    uri: "https://cdn.pixabay.com/audio/2022/03/10/audio_c91047a30e.mp3",
  },
  {
    id: "focus1",
    name: "专注音乐",
    uri: "https://cdn.pixabay.com/audio/2022/10/25/audio_4fa11ce455.mp3",
  },
];

export const [MusicProvider, useMusic] = createContextHook(() => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.3);

  useEffect(() => {
    setupAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const setupAudio = async () => {
    if (Platform.OS !== "web") {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.log("Error setting audio mode:", error);
      }
    }
  };

  const loadAndPlayTrack = async (index: number) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: musicTracks[index].uri },
        { shouldPlay: true, isLooping: true, volume }
      );

      setSound(newSound);
      setIsPlaying(true);
      setCurrentTrackIndex(index);
    } catch (error) {
      console.log("Error loading track:", error);
    }
  };

  const play = async () => {
    try {
      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        await loadAndPlayTrack(currentTrackIndex);
      }
    } catch (error) {
      console.log("Error playing:", error);
    }
  };

  const pause = async () => {
    try {
      if (sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.log("Error pausing:", error);
    }
  };

  const changeTrack = async (index: number) => {
    await loadAndPlayTrack(index);
  };

  const changeVolume = async (newVolume: number) => {
    setVolume(newVolume);
    if (sound) {
      try {
        await sound.setVolumeAsync(newVolume);
      } catch (error) {
        console.log("Error changing volume:", error);
      }
    }
  };

  return {
    isPlaying,
    currentTrack: musicTracks[currentTrackIndex],
    tracks: musicTracks,
    volume,
    play,
    pause,
    changeTrack,
    changeVolume,
  };
});
