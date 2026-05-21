import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { useGetSongs, usePlaySong, useGetMoods, getGetHistoryQueryKey, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, SkipBack, SkipForward, Plus, Music2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useGetPlaylists, useAddSongToPlaylist, getGetPlaylistsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Player() {
  const { moodId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [genre, setGenre] = useState<string>("all");
  const [tempo, setTempo] = useState<string>("all");
  const [language, setLanguage] = useState<string>("all");
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const { data: moods } = useGetMoods();
  const currentMood = moods?.find(m => m.moodId === moodId);
  
  const { data: songs, isLoading: loadingSongs } = useGetSongs(
    { moodId, genre: genre !== "all" ? genre : undefined, tempo: tempo !== "all" ? tempo : undefined, language: language !== "all" ? language : undefined },
    { query: { enabled: !!moodId } }
  );

  const playSongMutation = usePlaySong();
  
  const { data: playlists } = useGetPlaylists();
  const addSongMutation = useAddSongToPlaylist();

  const playingSong = songs?.find(s => s.songId === playingSongId);

  useEffect(() => {
    // If we have songs but none is playing, don't automatically play, wait for user interaction
  }, [songs]);

  const handlePlay = (songId: string) => {
    if (playingSongId === songId) {
      setIsPlaying(!isPlaying);
      return;
    }
    setEmbedError(false);
    setPlayingSongId(songId);
    setIsPlaying(true);
    
    playSongMutation.mutate({ songId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetHistoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      }
    });
  };

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

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span className="text-4xl">{currentMood?.emoji}</span> 
            {currentMood?.moodName} Mix
          </h1>
          <p className="text-muted-foreground mt-1">Curated specifically for your current mood.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left Side: Player */}
        <div className="lg:w-2/5 flex flex-col gap-4">
          <Card className="glass-card flex-1 bg-transparent border-white/10 overflow-hidden flex flex-col">
            {playingSong ? (
              <>
                {/* Spotify embed for Hindi/Kannada, YouTube for English/Instrumental */}
                {(playingSong.language === "Hindi" || playingSong.language === "Kannada") && playingSong.spotifyId ? (
                  <div className="p-4 bg-zinc-950">
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
                  <div className="w-full aspect-video bg-black relative">
                    {playingSong.youtubeId && !embedError ? (
                      <>
                        <iframe
                          key={playingSong.youtubeId}
                          ref={iframeRef}
                          className="w-full h-full absolute inset-0"
                          src={`https://www.youtube-nocookie.com/embed/${playingSong.youtubeId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3`}
                          title={playingSong.songName}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                        <a
                          href={`https://www.youtube.com/watch?v=${playingSong.youtubeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-2 right-2 flex items-center gap-1 text-xs bg-black/70 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors z-10"
                        >
                          <ExternalLink className="w-3 h-3" /> YouTube
                        </a>
                      </>
                    ) : playingSong.youtubeId ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4 text-center">
                        <Music2 className="w-12 h-12 text-primary opacity-60" />
                        <p className="text-white font-medium">{playingSong.songName}</p>
                        <p className="text-sm text-muted-foreground">This video is region-restricted or has embedding disabled.</p>
                        <a
                          href={`https://www.youtube.com/watch?v=${playingSong.youtubeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" /> Open on YouTube
                        </a>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No video available
                      </div>
                    )}
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white line-clamp-1">{playingSong.songName}</h2>
                    <p className="text-lg text-primary">{playingSong.artist}</p>
                  </div>
                  
                  {/* Music Wave Visualizer */}
                  <div className="py-8 flex justify-center">
                    <div className={`music-wave ${isPlaying ? 'playing' : ''}`}>
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6">
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white/10">
                      <SkipBack className="w-6 h-6 text-white" />
                    </Button>
                    <Button 
                      size="icon" 
                      className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(108,99,255,0.4)]"
                      onClick={() => handlePlay(playingSong.songId)}
                    >
                      {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white/10">
                      <SkipForward className="w-6 h-6 text-white" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Music2 className="w-10 h-10 opacity-50" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No track playing</h3>
                <p>Select a song from the list to start the music.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: List and Filters */}
        <div className="lg:w-3/5 flex flex-col min-h-0">
          <div className="flex flex-wrap gap-3 mb-4 shrink-0">
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                <SelectItem value="Bollywood">Bollywood</SelectItem>
                <SelectItem value="Sandalwood">Sandalwood</SelectItem>
                <SelectItem value="Pop">Pop</SelectItem>
                <SelectItem value="Rock">Rock</SelectItem>
                <SelectItem value="Hip Hop">Hip Hop</SelectItem>
                <SelectItem value="Classical">Classical</SelectItem>
                <SelectItem value="Ambient">Ambient</SelectItem>
                <SelectItem value="Folk">Folk</SelectItem>
                <SelectItem value="R&B/Soul">R&amp;B / Soul</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tempo} onValueChange={setTempo}>
              <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Tempo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tempos</SelectItem>
                <SelectItem value="Slow">Slow</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Fast">Fast</SelectItem>
              </SelectContent>
            </Select>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Hindi">Hindi</SelectItem>
                <SelectItem value="Kannada">Kannada</SelectItem>
                <SelectItem value="Instrumental">Instrumental</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="glass-card flex-1 bg-transparent border-white/10 overflow-hidden flex flex-col min-h-0">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {loadingSongs ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))
                ) : songs?.length ? (
                  songs.map((song) => {
                    const isRowPlaying = playingSongId === song.songId;
                    return (
                      <div 
                        key={song.songId}
                        className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isRowPlaying 
                            ? 'bg-primary/20 border-primary/50 shadow-[inset_0_0_20px_rgba(108,99,255,0.1)]' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`shrink-0 rounded-full h-10 w-10 ${isRowPlaying ? 'text-primary' : 'text-white hover:text-primary'}`}
                            onClick={() => handlePlay(song.songId)}
                          >
                            {isRowPlaying && isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                          </Button>
                          <div className="min-w-0">
                            <h4 className={`font-medium truncate ${isRowPlaying ? 'text-primary' : 'text-white'}`}>
                              {song.songName}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 pl-4">
                          <span className="text-xs text-muted-foreground hidden sm:block">{song.duration}</span>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white rounded-full">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-card border-border">
                              <DialogHeader>
                                <DialogTitle>Add to Playlist</DialogTitle>
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
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No songs found matching your filters.
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
