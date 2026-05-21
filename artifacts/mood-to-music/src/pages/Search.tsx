import { useState, useEffect } from "react";
import { useSearchSongs, usePlaySong, useGetPlaylists, useAddSongToPlaylist, getGetPlaylistsQueryKey, useGetMoods } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Play, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function Search() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedMoodId, setSelectedMoodId] = useState<string | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  const playSongMutation = usePlaySong();

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

  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [playingSong, setPlayingSong] = useState<{ spotifyId?: string | null; language?: string | null; youtubeId?: string | null; songName?: string } | null>(null);

  const isSpotifyLang = (lang?: string | null) => lang === "Hindi" || lang === "Kannada";

  const handlePlay = (songId: string, song: { youtubeId?: string | null; spotifyId?: string | null; language?: string | null; songName?: string }) => {
    playSongMutation.mutate({ songId });
    if (isSpotifyLang(song.language) && song.spotifyId) {
      setPlayingSong(song);
      setPlayingVideoId("spotify");
    } else if (song.youtubeId) {
      setPlayingSong(song);
      setPlayingVideoId(song.youtubeId);
    } else {
      toast({ title: "Notice", description: "No audio available for this song." });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Search Music</h1>
        <p className="text-muted-foreground">Find specific songs and add them to your playlists.</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for songs, artists..." 
            className="w-full h-14 pl-12 bg-white/5 border-white/10 text-lg rounded-2xl focus-visible:ring-primary focus-visible:border-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <button 
            className={`px-4 py-2 rounded-full text-sm transition-colors border ${!selectedMoodId ? 'bg-primary border-primary text-white' : 'bg-transparent border-white/20 text-muted-foreground hover:bg-white/5 hover:text-white'}`}
            onClick={() => setSelectedMoodId(undefined)}
          >
            All Moods
          </button>
          {moods?.map(mood => (
            <button
              key={mood.moodId}
              onClick={() => setSelectedMoodId(mood.moodId === selectedMoodId ? undefined : mood.moodId)}
              className={`px-4 py-2 rounded-full text-sm transition-colors border flex items-center gap-2 ${mood.moodId === selectedMoodId ? 'bg-primary/20 border-primary text-primary' : 'bg-transparent border-white/20 text-muted-foreground hover:bg-white/5 hover:text-white'}`}
            >
              <span>{mood.emoji}</span> {mood.moodName}
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
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        ) : songs?.length ? (
          songs.map((song) => (
            <Card key={song.songId} className="glass-card bg-transparent border-white/10 hover:bg-white/5 transition-colors overflow-hidden">
              <CardContent className="p-4 flex items-center gap-4">
                <Button 
                  size="icon" 
                  className="shrink-0 h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-white"
                  onClick={() => handlePlay(song.songId, song)}
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </Button>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-white truncate text-base">{song.songName}</h4>
                  <p className="text-sm text-primary truncate">{song.artist}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-white/80">{song.moodName}</span>
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
                        <p className="text-center text-muted-foreground py-4">No playlists found. Create one first!</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-muted-foreground text-lg">
            No results found for "{debouncedQuery}"
          </div>
        )}
      </div>

      {playingVideoId && playingSong && (
        <Dialog open={!!playingVideoId} onOpenChange={(open) => { if (!open) { setPlayingVideoId(null); setPlayingSong(null); } }}>
          <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-zinc-950 border-white/10">
            {isSpotifyLang(playingSong.language) && playingSong.spotifyId ? (
              <div className="p-6 space-y-3">
                <p className="text-white font-semibold text-lg px-1">{playingSong.songName}</p>
                <iframe
                  key={playingSong.spotifyId}
                  src={`https://open.spotify.com/embed/track/${playingSong.spotifyId}?utm_source=generator&theme=0`}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={{ borderRadius: "12px" }}
                />
              </div>
            ) : (
              <div className="aspect-video w-full">
                <iframe
                  key={playingVideoId}
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${playingVideoId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3`}
                  title={playingSong.songName}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
