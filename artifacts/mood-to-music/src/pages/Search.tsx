import { useState, useEffect } from "react";
import {
  useSearchSongs,
  useGetPlaylists,
  useAddSongToPlaylist,
  getGetPlaylistsQueryKey,
  useGetMoods,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Play, Pause, Plus, Heart, Music2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useAudioCtx,
  type JioSong,
  stripHtml,
  getArtistName,
  getAudioUrl,
  getSongImg,
} from "@/contexts/AudioContext";

const LANG_LABELS = [
  { key: "all", label: "All Languages" },
  { key: "hindi", label: "Hindi" },
  { key: "kannada", label: "Kannada" },
  { key: "tamil", label: "Tamil" },
  { key: "telugu", label: "Telugu" },
  { key: "english", label: "English" },
];

export default function Search() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedMoodId, setSelectedMoodId] = useState<string | undefined>();
  const [langFilter, setLangFilter] = useState("all");
  const [currentDbSongId, setCurrentDbSongId] = useState<string | null>(null);
  const [currentJioId, setCurrentJioId] = useState<string | null>(null);
  const [jioLoading, setJioLoading] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const audio = useAudioCtx();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: moods } = useGetMoods();

  const { data: songsRaw, isLoading } = useSearchSongs(
    { q: debouncedQuery, moodId: selectedMoodId },
    { query: { enabled: debouncedQuery.length > 0 } },
  );

  const songs = songsRaw?.filter(
    (s) =>
      langFilter === "all" ||
      s.language?.toLowerCase() === langFilter ||
      s.language?.toLowerCase().includes(langFilter),
  );

  const { data: playlists } = useGetPlaylists();
  const addSongMutation = useAddSongToPlaylist();

  const handleAddToPlaylist = (playlistId: string, songId: string) => {
    addSongMutation.mutate(
      { playlistId, data: { songId } },
      {
        onSuccess: () => {
          toast({ title: "Added to playlist!" });
          queryClient.invalidateQueries({ queryKey: getGetPlaylistsQueryKey() });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to add song",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handlePlay = async (
    songId: string,
    songName: string,
    artist: string,
  ) => {
    if (
      currentDbSongId === songId &&
      currentJioId &&
      audio.currentSong?.id === currentJioId
    ) {
      audio.togglePlay();
      return;
    }

    setCurrentDbSongId(songId);
    setJioLoading(true);

    try {
      const q = `${songName} ${artist}`;
      const res = await fetch(
        `https://saavn.dev/api/search/songs?query=${encodeURIComponent(q)}&limit=3`,
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const results: JioSong[] = (data.data?.results ?? []).filter(
        (s: JioSong) => Array.isArray(s.downloadUrl) && s.downloadUrl.length > 0,
      );
      if (!results.length) throw new Error("No results");

      const jioSong = results[0];
      setCurrentJioId(jioSong.id);
      audio.loadAndPlay([jioSong], 0);
    } catch {
      toast({
        title: "Could not play",
        description: "Check your connection and try again",
        variant: "destructive",
      });
      setCurrentDbSongId(null);
    } finally {
      setJioLoading(false);
    }
  };

  const isActive = (songId: string) =>
    currentDbSongId === songId &&
    currentJioId !== null &&
    audio.currentSong?.id === currentJioId;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Search Music
        </h1>
        <p className="text-muted-foreground">
          Find songs from your library and stream instantly via JioSaavn.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists..."
            className="w-full h-14 pl-12 bg-white/5 border-white/10 text-lg rounded-2xl focus-visible:ring-primary focus-visible:border-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <button
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              !selectedMoodId
                ? "bg-primary border-primary text-white"
                : "bg-transparent border-white/20 text-muted-foreground hover:bg-white/5 hover:text-white"
            }`}
            onClick={() => setSelectedMoodId(undefined)}
          >
            All Moods
          </button>
          {moods?.map((mood) => (
            <button
              key={mood.moodId}
              onClick={() =>
                setSelectedMoodId(
                  mood.moodId === selectedMoodId ? undefined : mood.moodId,
                )
              }
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border flex items-center gap-1.5 ${
                mood.moodId === selectedMoodId
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-transparent border-white/20 text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{mood.emoji}</span> {mood.moodName}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {LANG_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setLangFilter(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                langFilter === key
                  ? "bg-secondary/20 border-secondary text-secondary"
                  : "bg-transparent border-white/20 text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {debouncedQuery.length === 0 ? (
          <div className="col-span-full text-center py-20 text-muted-foreground text-lg">
            Type to start searching...
          </div>
        ) : isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : songs?.length ? (
          songs.map((song) => {
            const active = isActive(song.songId);
            const isLiked = (() => {
              if (!active || !currentJioId) return false;
              return audio.likedIds.has(currentJioId);
            })();

            return (
              <Card
                key={song.songId}
                className={`glass-card bg-transparent border-white/10 hover:bg-white/5 transition-all overflow-hidden ${
                  active ? "border-primary/40 bg-primary/5" : ""
                }`}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Button
                    size="icon"
                    disabled={jioLoading && currentDbSongId === song.songId}
                    className={`shrink-0 h-11 w-11 rounded-full text-white ${
                      active ? "bg-primary hover:bg-primary/90" : "bg-primary/80 hover:bg-primary"
                    }`}
                    onClick={() =>
                      handlePlay(song.songId, song.songName ?? "", song.artist ?? "")
                    }
                  >
                    {jioLoading && currentDbSongId === song.songId ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : active && audio.isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </Button>

                  <div className="min-w-0 flex-1">
                    <h4
                      className={`font-bold truncate text-sm ${active ? "text-primary" : "text-white"}`}
                    >
                      {song.songName}
                    </h4>
                    <p className="text-xs text-primary truncate">{song.artist}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-white/80">
                        {song.moodName}
                      </span>
                      {song.language && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-white/60">
                          {song.language}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {active && currentJioId && audio.currentSong && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-full transition-colors ${
                          isLiked
                            ? "text-pink-500 hover:text-pink-400"
                            : "text-white/40 hover:text-white/70"
                        }`}
                        onClick={() => {
                          if (audio.currentSong)
                            audio.toggleLike(audio.currentSong);
                        }}
                      >
                        <Heart
                          className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                        />
                      </Button>
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md bg-card border-border">
                        <DialogHeader>
                          <DialogTitle>
                            Add "{song.songName}" to Playlist
                          </DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-2 max-h-[300px] overflow-y-auto">
                          {playlists?.length ? (
                            playlists.map((p) => (
                              <button
                                key={p.playlistId}
                                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                                onClick={() =>
                                  handleAddToPlaylist(p.playlistId, song.songId)
                                }
                              >
                                <span className="font-medium text-white">
                                  {p.playlistName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {p.songCount} songs
                                </span>
                              </button>
                            ))
                          ) : (
                            <p className="text-center text-muted-foreground py-4">
                              No playlists found. Create one first!
                            </p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 text-muted-foreground text-lg">
            No results found for &ldquo;{debouncedQuery}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
