import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth, useUser } from "@clerk/react";

export interface JioSong {
  id: string;
  name: string;
  duration: number;
  artists: { primary: Array<{ name: string }> };
  image: Array<{ quality: string; url: string }>;
  downloadUrl: Array<{ quality: string; url: string }>;
}

export interface LikedSong {
  jioSongId: string;
  songName: string;
  artist: string;
  imageUrl: string | null;
  audioUrl: string | null;
}

export function stripHtml(t: string): string {
  return t.replace(/<[^>]*>/g, "");
}

export function fmtTime(s: number): string {
  if (!s || isNaN(s) || !isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function getAudioUrl(song: JioSong): string {
  const dl = song.downloadUrl ?? [];
  return (
    dl.find((u) => u.quality === "320kbps")?.url ||
    dl.find((u) => u.quality === "160kbps")?.url ||
    dl.find((u) => u.quality === "96kbps")?.url ||
    dl[dl.length - 1]?.url ||
    ""
  );
}

export function getSongImg(
  song: JioSong,
  size: "500x500" | "150x150" = "150x150",
): string {
  const imgs = song.image ?? [];
  return (
    imgs.find((i) => i.quality === size)?.url ||
    imgs[imgs.length - 1]?.url ||
    ""
  );
}

export function getArtistName(song: JioSong): string {
  return (song.artists?.primary ?? []).map((a) => a.name).join(", ");
}

export function likedSongToJio(liked: LikedSong): JioSong {
  return {
    id: liked.jioSongId,
    name: liked.songName,
    duration: 0,
    artists: { primary: [{ name: liked.artist }] },
    image: liked.imageUrl
      ? [{ quality: "150x150", url: liked.imageUrl }]
      : [],
    downloadUrl: liked.audioUrl
      ? [{ quality: "160kbps", url: liked.audioUrl }]
      : [],
  };
}

interface AudioContextValue {
  songs: JioSong[];
  currentIndex: number;
  currentSong: JioSong | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentMoodId: string | null;
  likedIds: Set<string>;
  likedSongs: LikedSong[];
  loadAndPlay: (songs: JioSong[], index: number, moodId?: string) => void;
  togglePlay: () => void;
  skipNext: () => void;
  skipPrev: () => void;
  seek: (time: number) => void;
  toggleLike: (song: JioSong) => void;
  setSeekingRef: (val: boolean) => void;
}

const AudioCtx = createContext<AudioContextValue | null>(null);

export function useAudioCtx(): AudioContextValue {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudioCtx must be used inside AudioProvider");
  return ctx;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();

  const [songs, setSongs] = useState<JioSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentMoodId, setCurrentMoodId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSeekingRef = useRef(false);
  const songsRef = useRef<JioSong[]>([]);
  const currentIndexRef = useRef(-1);
  const moodIdRef = useRef<string | null>(null);
  const playRecordedRef = useRef(false);
  const prevSongIdRef = useRef<string | null>(null);

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    moodIdRef.current = currentMoodId;
  }, [currentMoodId]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTime = () => {
      if (!isSeekingRef.current) setCurrentTime(audio.currentTime);
    };
    const onDur = () => setDuration(audio.duration);
    const onEnded = () => {
      const list = songsRef.current;
      if (list.length) setCurrentIndex((p) => (p + 1) % list.length);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      const list = songsRef.current;
      if (list.length > 1) {
        setCurrentIndex((p) => (p + 1) % list.length);
      }
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDur);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/jio/liked", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data: LikedSong[] = await res.json();
          setLikedSongs(data);
          setLikedIds(new Set(data.map((s) => s.jioSongId)));
        }
      } catch {}
    })();
  }, [isSignedIn, getToken]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || currentIndex < 0) return;
    const song = songs[currentIndex];
    if (!song) return;
    if (prevSongIdRef.current === song.id) return;
    prevSongIdRef.current = song.id;

    const url = getAudioUrl(song);
    if (!url) return;

    audio.src = url;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    playRecordedRef.current = false;

    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [currentIndex, songs]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(async () => {
      if (playRecordedRef.current) return;
      const audio = audioRef.current;
      const song = songsRef.current[currentIndexRef.current];
      if (!audio || !song || audio.currentTime < 30) return;
      playRecordedRef.current = true;
      try {
        const token = await getToken();
        await fetch("/api/jio/play", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            jioSongId: song.id,
            songName: stripHtml(song.name),
            artist: getArtistName(song),
            imageUrl: getSongImg(song, "150x150"),
            moodId: moodIdRef.current,
          }),
        });
      } catch {}
    }, 2000);
    return () => clearInterval(timer);
  }, [isPlaying, getToken]);

  const loadAndPlay = useCallback(
    (newSongs: JioSong[], index: number, moodId?: string) => {
      prevSongIdRef.current = null;
      setSongs(newSongs);
      setCurrentMoodId(moodId ?? null);
      setCurrentIndex(index);
    },
    [],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [isPlaying]);

  const skipNext = useCallback(() => {
    const list = songsRef.current;
    if (!list.length) return;
    prevSongIdRef.current = null;
    setCurrentIndex((p) => (p + 1) % list.length);
  }, []);

  const skipPrev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const list = songsRef.current;
    if (!list.length) return;
    prevSongIdRef.current = null;
    setCurrentIndex((p) => (p - 1 + list.length) % list.length);
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const toggleLike = useCallback(
    async (song: JioSong) => {
      const jioSongId = song.id;
      const isLiked = likedIds.has(jioSongId);

      if (isLiked) {
        setLikedIds((prev) => {
          const s = new Set(prev);
          s.delete(jioSongId);
          return s;
        });
        setLikedSongs((prev) => prev.filter((s) => s.jioSongId !== jioSongId));
      } else {
        const newLiked: LikedSong = {
          jioSongId,
          songName: stripHtml(song.name),
          artist: getArtistName(song),
          imageUrl: getSongImg(song, "150x150"),
          audioUrl: getAudioUrl(song),
        };
        setLikedIds((prev) => new Set([...prev, jioSongId]));
        setLikedSongs((prev) => [...prev, newLiked]);
      }

      try {
        const token = await getToken();
        const authHeader: Record<string, string> = token
          ? { Authorization: `Bearer ${token}` }
          : {};
        if (isLiked) {
          await fetch(`/api/jio/liked/${jioSongId}`, {
            method: "DELETE",
            headers: authHeader,
          });
        } else {
          await fetch("/api/jio/liked", {
            method: "POST",
            headers: { ...authHeader, "Content-Type": "application/json" },
            body: JSON.stringify({
              jioSongId,
              songName: stripHtml(song.name),
              artist: getArtistName(song),
              imageUrl: getSongImg(song, "150x150"),
              audioUrl: getAudioUrl(song),
            }),
          });
        }
      } catch {}
    },
    [likedIds, getToken],
  );

  const setSeekingRef = useCallback((val: boolean) => {
    isSeekingRef.current = val;
  }, []);

  const currentSong = currentIndex >= 0 ? (songs[currentIndex] ?? null) : null;

  return (
    <AudioCtx.Provider
      value={{
        songs,
        currentIndex,
        currentSong,
        isPlaying,
        currentTime,
        duration,
        currentMoodId,
        likedIds,
        likedSongs,
        loadAndPlay,
        togglePlay,
        skipNext,
        skipPrev,
        seek,
        toggleLike,
        setSeekingRef,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
}
