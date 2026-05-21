import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetPlaylist, useRemoveSongFromPlaylist, getGetPlaylistQueryKey, usePlaySong } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Play, Pause, ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PlaylistDetail() {
  const { playlistId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: playlist, isLoading } = useGetPlaylist(playlistId as string, {
    query: { enabled: !!playlistId }
  });

  const removeSong = useRemoveSongFromPlaylist();
  const playSong = usePlaySong();

  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const handlePlay = (songId: string, youtubeId?: string | null) => {
    playSong.mutate({ songId });
    if (youtubeId) {
      setPlayingVideoId(youtubeId);
    } else {
      toast({ title: "Notice", description: "No video available for this song." });
    }
  };

  const handleRemove = (songId: string) => {
    if (!playlistId) return;
    removeSong.mutate({ playlistId, data: { songId } }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Song removed from playlist" });
        queryClient.invalidateQueries({ queryKey: getGetPlaylistQueryKey(playlistId) });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to remove song", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        <Link href="/playlist" className="text-muted-foreground hover:text-white flex items-center gap-2 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to Playlists
        </Link>
        
        {isLoading ? (
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-32" />
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{playlist?.playlistName}</h1>
            <p className="text-muted-foreground">
              Created {playlist?.createdDate ? new Date(playlist.createdDate).toLocaleDateString() : ''} • {playlist?.songs?.length || 0} songs
            </p>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border-white/10 bg-transparent">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : playlist?.songs?.length ? (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="w-[60px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Mood</TableHead>
                <TableHead className="hidden md:table-cell">Duration</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playlist.songs.map((song) => (
                <TableRow key={song.songId} className="border-white/10 hover:bg-white/5 group">
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-full bg-white/5 hover:bg-primary hover:text-white text-muted-foreground opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => handlePlay(song.songId, song.youtubeId)}
                    >
                      <Play className="w-4 h-4 ml-0.5 fill-current" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-white">{song.songName}</div>
                    <div className="text-sm text-muted-foreground">{song.artist}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/80">
                      {song.moodName}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {song.duration}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => handleRemove(song.songId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <h3 className="text-lg font-medium text-white mb-2">This playlist is empty</h3>
            <p>Go to Search or Mood Selection to find songs to add.</p>
            <Button asChild className="mt-6" variant="outline">
              <Link href="/search">Find Music</Link>
            </Button>
          </div>
        )}
      </div>

      {playingVideoId && (
        <Dialog open={!!playingVideoId} onOpenChange={(open) => !open && setPlayingVideoId(null)}>
          <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-black border-white/10">
             <div className="aspect-video w-full">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
             </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
