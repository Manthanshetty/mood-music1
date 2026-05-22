import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { useGetMoods } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Pause, SkipBack, SkipForward, Search, Music2 } from "lucide-react";

interface JioSong {
  id: string;
  name: string;
  duration: number;
  artists: { primary: Array<{ name: string }> };
  image: Array<{ quality: string; url: string }>;
  downloadUrl: Array<{ quality: string; url: string }>;
}

const MOOD_QUERIES: Record<string, string> = {
  M001: "happy upbeat hindi punjabi songs",
  M002: "sad emotional hindi songs arijit singh",
  M003: "chill lofi relaxing hindi songs",
  M004: "energetic dance party bollywood songs",
  M005: "romantic bollywood love songs",
  M006: "focus instrumental piano calm music",
};

function stripHtml(t: string) {
  return t.replace(/<[^>]*>/g, "");
}

function fmt(s: number) {
  if (!s || isNaN(s) || !isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function getAudioUrl(song: JioSong): string {
  const dl = song.downloadUrl ?? [];
  return (
    dl.find((u) => u.quality === "320kbps")?.url ||
    dl.find((u) => u.quality === "160kbps")?.url ||
    dl.find((u) => u.quality === "96kbps")?.url ||
    dl[dl.length - 1]?.url ||
    ""
  );
}

function getImg(song: JioSong, size: "500x500" | "150x150" = "500x500"): string {
  const imgs = song.image ?? [];
  return (
    imgs.find((i) => i.quality === size)?.url ||
    imgs.find((i) => i.quality === "150x150")?.url ||
    imgs[imgs.length - 1]?.url ||
    ""
  );
}

function getArtist(song: JioSong): string {
  return (song.artists?.primary ?? []).map((a) => a.name).join(", ");
}

export default function Player() {
  const { moodId } = useParams();
  const { data: moods } = useGetMoods();
  const currentMood = moods?.find((m) => m.moodId === moodId);

  const [songs, setSongs] = useState<JioSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const isSeekingRef = useRef(false);
  const songsRef = useRef<JioSong[]>([]);
  useEffect(() => { songsRef.current = songs; }, [songs]);

  const currentSong = currentIndex >= 0 ? songs[currentIndex] : null;

  const fetchSongs = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setSongs([]);
    try {
      const res = await fetch(
        `https://saavn.dev/api/search/songs?query=${encodeURIComponent(q)}&limit=20`
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const results: JioSong[] = (data.data?.results ?? []).filter(
        (s: JioSong) => Array.isArray(s.downloadUrl) && s.downloadUrl.length > 0
      );
      if (results.length === 0) {
        setError("No songs found for this mood, try another");
      } else {
        setSongs(results);
      }
    } catch {
      setError("Could not load songs, check your connection");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mood change
  useEffect(() => {
    if (!moodId) return;
    const q = MOOD_QUERIES[moodId] ?? "popular hindi songs";
    setSearchInput(q);
    setCurrentIndex(-1);
    setIsPlaying(false);
    fetchSongs(q);
  }, [moodId, fetchSongs]);

  // Wire up audio events once
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
      // Skip to next song on unplayable URL
      const list = songsRef.current;
      if (list.length) setCurrentIndex((p) => (p + 1) % list.length);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDur);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // Load & play when song index changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || currentIndex < 0) return;
    const song = songs[currentIndex];
    if (!song) return;
    const url = getAudioUrl(song);
    if (!url) return;
    audio.src = url;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [currentIndex, songs]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    isPlaying ? audio.pause() : audio.play().catch(() => {});
  };

  const handleSongClick = (i: number) => {
    if (i === currentIndex) { togglePlay(); return; }
    setCurrentIndex(i);
  };

  const skipNext = () => {
    if (!songs.length) return;
    setCurrentIndex((p) => (p + 1) % songs.length);
  };

  const skipPrev = () => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
    if (!songs.length) return;
    setCurrentIndex((p) => (p - 1 + songs.length) % songs.length);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const t = Number(e.target.value);
    setCurrentTime(t);
    if (audio) audio.currentTime = t;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setCurrentIndex(-1);
      fetchSongs(searchInput.trim());
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] pb-28 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-4 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <span className="text-4xl">{currentMood?.emoji}</span>
          {currentMood?.moodName} Mix
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Streaming via JioSaavn — full songs, no restrictions.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search Hindi, Kannada, Tamil, English songs..."
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-primary"
          />
        </div>
        <Button type="submit" disabled={loading} className="shrink-0 bg-primary hover:bg-primary/90">
          Search
        </Button>
      </form>

      {/* Song list */}
      <Card className="flex-1 min-h-0 bg-transparent border-white/10 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-0.5">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-[60px] w-full rounded-xl mb-1" />
              ))
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
                <Music2 className="w-14 h-14 opacity-20" />
                <p className="text-center text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 hover:bg-white/10"
                  onClick={() => fetchSongs(searchInput)}
                >
                  Try again
                </Button>
              </div>
            ) : songs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                Select a mood to start listening.
              </div>
            ) : (
              songs.map((song, i) => {
                const active = i === currentIndex;
                const img = getImg(song, "150x150");
                const name = stripHtml(song.name);
                const artist = getArtist(song);
                return (
                  <div
                    key={song.id}
                    onClick={() => handleSongClick(i)}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border ${
                      active
                        ? "bg-primary/15 border-primary/30 shadow-[inset_0_0_12px_rgba(108,99,255,0.08)]"
                        : "border-transparent hover:bg-white/5 hover:border-white/10"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative shrink-0 w-11 h-11">
                      {img ? (
                        <img
                          src={img}
                          alt={name}
                          className="w-11 h-11 rounded-lg object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center">
                          <Music2 className="w-4 h-4 text-white/30" />
                        </div>
                      )}
                      {/* Active overlay */}
                      {active ? (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                          {isPlaying ? (
                            <div className="music-wave playing scale-75">
                              <div className="bar" />
                              <div className="bar" />
                              <div className="bar" />
                              <div className="bar" />
                              <div className="bar" />
                            </div>
                          ) : (
                            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate text-sm leading-snug ${active ? "text-primary" : "text-white"}`}>
                        {name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate leading-snug">{artist}</p>
                    </div>

                    {/* Duration */}
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                      {fmt(song.duration)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" />

      {/* Fixed bottom player bar */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 z-50 bg-zinc-950/96 backdrop-blur-xl border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-2.5 max-w-screen-xl mx-auto">
            {/* Album art */}
            <div className="shrink-0">
              {getImg(currentSong) ? (
                <img
                  src={getImg(currentSong)}
                  alt={stripHtml(currentSong.name)}
                  className="w-10 h-10 rounded-md object-cover shadow-lg ring-1 ring-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center">
                  <Music2 className="w-4 h-4 text-white/30" />
                </div>
              )}
            </div>

            {/* Song info */}
            <div className="hidden sm:flex flex-col min-w-0 w-40 shrink-0">
              <p className="font-medium text-white text-xs truncate">{stripHtml(currentSong.name)}</p>
              <p className="text-xs text-muted-foreground truncate">{getArtist(currentSong)}</p>
            </div>

            {/* Centre: controls + seek */}
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              {/* Playback controls */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                  onClick={skipPrev}
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </Button>
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_14px_rgba(108,99,255,0.5)]"
                  onClick={togglePlay}
                >
                  {isPlaying
                    ? <Pause className="w-4 h-4 fill-current" />
                    : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                  onClick={skipNext}
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </Button>
              </div>

              {/* Seek bar */}
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs text-muted-foreground tabular-nums w-8 text-right shrink-0">
                  {fmt(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || currentSong.duration || 0}
                  step={0.5}
                  value={currentTime}
                  onChange={handleSeek}
                  onMouseDown={() => { isSeekingRef.current = true; }}
                  onMouseUp={() => { isSeekingRef.current = false; }}
                  onTouchStart={() => { isSeekingRef.current = true; }}
                  onTouchEnd={() => { isSeekingRef.current = false; }}
                  className="flex-1 h-1 rounded-full accent-primary cursor-pointer appearance-none"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) ${progress.toFixed(1)}%, rgba(255,255,255,0.12) ${progress.toFixed(1)}%)`
                  }}
                />
                <span className="text-xs text-muted-foreground tabular-nums w-8 shrink-0">
                  {fmt(duration || currentSong.duration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
