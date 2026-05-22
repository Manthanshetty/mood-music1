import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Heart, TrendingUp, Music2 } from "lucide-react";
import {
  useAudioCtx,
  type JioSong,
  stripHtml,
  fmtTime,
  getSongImg,
  getArtistName,
} from "@/contexts/AudioContext";

const TRENDING_QUERIES: Record<string, string> = {
  all: "trending popular hindi bollywood songs 2024",
  hindi: "trending popular hindi songs 2024",
  kannada: "trending kannada songs 2024",
  tamil: "trending tamil songs 2024",
  telugu: "trending telugu songs 2024",
  english: "trending english pop songs 2024",
};

const LANG_LABELS = [
  { key: "all", label: "All" },
  { key: "hindi", label: "Hindi" },
  { key: "kannada", label: "Kannada" },
  { key: "tamil", label: "Tamil" },
  { key: "telugu", label: "Telugu" },
  { key: "english", label: "English" },
];

export default function Trending() {
  const audio = useAudioCtx();
  const [songs, setSongs] = useState<JioSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [langFilter, setLangFilter] = useState("all");

  const fetchTrending = useCallback(async (lang: string) => {
    setLoading(true);
    setError("");
    setSongs([]);
    try {
      const q = TRENDING_QUERIES[lang] ?? TRENDING_QUERIES.all;
      const res = await fetch(
        `https://saavn.dev/api/search/songs?query=${encodeURIComponent(q)}&limit=20`,
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const results: JioSong[] = (data.data?.results ?? []).filter(
        (s: JioSong) => Array.isArray(s.downloadUrl) && s.downloadUrl.length > 0,
      );
      if (results.length === 0) {
        setError("No trending songs found. Try a different language.");
      } else {
        setSongs(results);
      }
    } catch {
      setError("Could not load trending songs. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending(langFilter);
  }, [langFilter, fetchTrending]);

  const handleSongClick = (i: number) => {
    const song = songs[i];
    if (!song) return;
    if (audio.currentSong?.id === song.id) {
      audio.togglePlay();
    } else {
      audio.loadAndPlay(songs, i);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-in fade-in duration-500">
      <div className="mb-3 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-secondary" />
          Trending Now
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Top songs right now — streamed live via JioSaavn.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 shrink-0">
        {LANG_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setLangFilter(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              langFilter === key
                ? "bg-secondary border-secondary text-white"
                : "bg-transparent border-white/20 text-muted-foreground hover:bg-white/5 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-xs text-muted-foreground hover:text-white h-7 px-3"
          onClick={() => fetchTrending(langFilter)}
          disabled={loading}
        >
          {loading ? (
            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Refresh"
          )}
        </Button>
      </div>

      <Card className="flex-1 min-h-0 bg-transparent border-white/10 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-0.5">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-[60px] w-full rounded-xl mb-1" />
              ))
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
                <TrendingUp className="w-14 h-14 opacity-20" />
                <p className="text-center text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 hover:bg-white/10"
                  onClick={() => fetchTrending(langFilter)}
                >
                  Try again
                </Button>
              </div>
            ) : (
              songs.map((song, i) => {
                const isActive = audio.currentSong?.id === song.id;
                const isPlaying = isActive && audio.isPlaying;
                const isLiked = audio.likedIds.has(song.id);
                const img = getSongImg(song, "150x150");
                const name = stripHtml(song.name);
                const artist = getArtistName(song);

                return (
                  <div
                    key={song.id}
                    onClick={() => handleSongClick(i)}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border ${
                      isActive
                        ? "bg-secondary/10 border-secondary/30"
                        : "border-transparent hover:bg-white/5 hover:border-white/10"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold tabular-nums w-5 text-center shrink-0 ${
                        isActive ? "text-secondary" : "text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>

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
                      {isActive ? (
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

                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate text-sm leading-snug ${
                          isActive ? "text-secondary" : "text-white"
                        }`}
                      >
                        {name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate leading-snug">
                        {artist}
                      </p>
                    </div>

                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums hidden sm:block">
                      {fmtTime(song.duration)}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        audio.toggleLike(song);
                      }}
                      className={`shrink-0 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${
                        isLiked
                          ? "opacity-100 text-pink-500 hover:text-pink-400"
                          : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                      />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
