import { useState, useRef, useEffect } from "react";
import { useSearchSongs, useGetPlaylists, useAddSongToPlaylist, getGetPlaylistsQueryKey, useGetMoods } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Play, Pause, Plus, Music2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface JioResult {
  name: string;
  artist: string;
  imageUrl: string;
  audioUrl: string;
}

function stripHtml(t: string) {
  return t.replace(/<[^>]*>/g, "");
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedMoodId, setSelectedMoodId] = useState<string | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // JioSaavn inline player state
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [jioLoading, setJioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [jioInfo, setJioInfo] = useState<JioResult | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: moods } = useGetMoods();

  const { data: songs, isLoading } = useSearchSongs(
    { q: debouncedQuery, moodId: selectedMoodId },
    { query: { enabled: debouncedQuery.length > 0 } }
  );

  const { data: playlists } = useGetPlaylists();
  const addSongMutation = useAddSongToPlaylist();

  const handleAddToPlaylist = (playlistId: string, songId: string) => {
    addSongMutation.mutate({ playlistId, data: { songId } }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Song added to playlist!" });
        queryClient.invalidateQueries({ queryKey: getGetPlaylistsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add song", variant: "destructive" });
      }
    });
  };

  // Fetch from JioSaavn and play
  const handlePlay = async (songId: string, songName: string, artist: string) => {
    // Toggle if same song
    if (activeSongId === songId) {
      const audio = audioRef.current;
      if (audio) {
        isPlaying ? audio.pause() : audio.play().catch(() => {});
      }
      return;
    }

    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onplay = null;
      audioRef.current.onpause = null;
    }

    setActiveSongId(songId);
    setIsPlaying(false);
    setJioInfo(null);
    setJioLoading(true);

    try {
      const q = `${songName} ${artist}`;
      const res = await fetch(
        `https://saavn.dev/api/search/songs?query=${encodeURIComponent(q)}&limit=3`
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const results = data.data?.results ?? [];
      const first = results.find((s: { downloadUrl?: unknown[] }) => s.downloadUrl?.length) ?? results[0];
      if (!first) throw new Error("No results");

      const dl = first.downloadUrl ?? [];
      const audioUrl: string =
        dl.find((u: { quality: string }) => u.quality === "160kbps")?.url ||
        dl.find((u: { quality: string }) => u.quality === "96kbps")?.url ||
        dl[dl.length - 1]?.url || "";

      if (!audioUrl) throw new Error("No audio URL");

      const imgs = first.image ?? [];
      const imageUrl: string =
        imgs.find((i: { quality: string }) => i.quality === "150x150")?.url ||
        imgs[0]?.url || "";

      const info: JioResult = {
        name: stripHtml(first.name ?? songName),
        artist: (first.artists?.primary ?? []).map((a: { name: string }) => a.name).join(", ") || artist,
        imageUrl,
        audioUrl,
      };

      setJioInfo(info);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => { setIsPlaying(false); setActiveSongId(null); };
      audio.onerror = () => {
        toast({ title: "Could not play this song", description: "Try another", variant: "destructive" });
        setActiveSongId(null);
        setIsPlaying(false);
      };
      await audio.play();
    } catch {
      toast({ title: "Could not play", description: "Check your connection and try again", variant: "destructive" });
      setActiveSongId(null);
    } finally {
      setJioLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Search Music</h1>
        <p className="text-muted-foreground">
          Find songs from your library and play instantly via JioSaavn.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, languages..."
            className="w-full h-14 pl-12 bg-white/5 border-white/10 text-lg rounded-2xl focus-visible:ring-primary focus-visible:border-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <button
            className={`px-4 py-2 rounded-full text-sm transition-colors border ${!selectedMoodId ? "bg-primary border-primary text-white" : "bg-transparent border-white/20 text-muted-foreground hover:bg-white/5 hover:text-white"}`}
            onClick={() => setSelectedMoodId(undefined)}
          >
            All Moods
          </button>
          {moods?.map((mood) => (
            <button
              key={mood.moodId}
              onClick={() => setSelectedMoodId(mood.moodId === selectedMoodId ? undefined : mood.moodId)}
              className={`px-4 py-2 rounded-full text-sm transition-colors border flex items-center gap-2 ${mood.moodId === selectedMoodId ? "bg-primary/20 border-primary text-primary" : "bg-transparent border-white/20 text-muted-foreground hover:bg-white/5 hover:text-white"}`}
            >
              <span>{mood.emoji}</span> {mood.moodName}
            </button>
          ))}
        </div>
      </div>

      {/* Mini now-playing banner when a song is active */}
      {activeSongId && jioInfo && (
        <div className="max-w-2xl mx-auto flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/30">
          {jioInfo.imageUrl ? (
            <img src={jioInfo.imageUrl} alt={jioInfo.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Music2 className="w-4 h-4 text-white/30" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{jioInfo.name}</p>
            <p className="text-xs text-muted-foreground truncate">{jioInfo.artist}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-primary hover:bg-primary/20 shrink-0"
            onClick={() => {
              if (audioRef.current) {
                isPlaying ? audioRef.current.pause() : audioRef.current.play().catch(() => {});
              }
            }}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </Button>
        </div>
      )}

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
            const active = activeSongId === song.songId;
            return (
              <Card key={song.songId} className={`glass-card bg-transparent border-white/10 hover:bg-white/5 transition-all overflow-hidden ${active ? "border-primary/40 bg-primary/5" : ""}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Button
                    size="icon"
                    disabled={jioLoading && active}
                    className={`shrink-0 h-12 w-12 rounded-full text-white ${active ? "bg-primary hover:bg-primary/90" : "bg-primary/80 hover:bg-primary"}`}
                    onClick={() => handlePlay(song.songId, song.songName ?? "", song.artist ?? "")}
                  >
                    {jioLoading && active ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : active && isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </Button>
                  <div className="min-w-0 flex-1">
                    <h4 className={`font-bold truncate text-base ${active ? "text-primary" : "text-white"}`}>
                      {song.songName}
                    </h4>
                    <p className="text-sm text-primary truncate">{song.artist}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-white/80">
                        {song.moodName}
                      </span>
                      <span className="text-xs text-muted-foreground">{song.duration}</span>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-white rounded-full">
                        <Plus className="w-5 h-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card border-border">
                      <DialogHeader>
                        <DialogTitle>Add "{song.songName}" to Playlist</DialogTitle>
                      </DialogHeader>
                      <div className="py-4 space-y-2 max-h-[300px] overflow-y-auto">
                        {playlists?.length ? playlists.map((p) => (
                          <button
                            key={p.playlistId}
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                            onClick={() => handleAddToPlaylist(p.playlistId, song.songId)}
                          >
                            <span className="font-medium text-white">{p.playlistName}</span>
                            <span className="text-xs text-muted-foreground">{p.songCount} songs</span>
                          </button>
                        )) : (
                          <p className="text-center text-muted-foreground py-4">
                            No playlists found. Create one first!
                          </p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
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
