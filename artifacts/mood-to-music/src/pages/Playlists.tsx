import { useState } from "react";
import { Link } from "wouter";
import {
  useGetPlaylists,
  useCreatePlaylist,
  useDeletePlaylist,
  getGetPlaylistsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ListMusic, Plus, Trash2, Heart, Play, Music2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useAudioCtx,
  likedSongToJio,
  getSongImg,
} from "@/contexts/AudioContext";

export default function Playlists() {
  const { data: playlists, isLoading } = useGetPlaylists();
  const createPlaylist = useCreatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const audio = useAudioCtx();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [likedExpanded, setLikedExpanded] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist.mutate(
      { data: { playlistName: newPlaylistName } },
      {
        onSuccess: () => {
          toast({ title: "Playlist created!" });
          setIsCreateOpen(false);
          setNewPlaylistName("");
          queryClient.invalidateQueries({ queryKey: getGetPlaylistsQueryKey() });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create playlist",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deletePlaylist.mutate(
      { playlistId: id },
      {
        onSuccess: () => {
          toast({ title: "Playlist deleted" });
          queryClient.invalidateQueries({ queryKey: getGetPlaylistsQueryKey() });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete playlist",
            variant: "destructive",
          });
        },
      },
    );
  };

  const playLikedSongs = (startIndex: number) => {
    const jioSongs = audio.likedSongs.map(likedSongToJio);
    if (jioSongs.length) audio.loadAndPlay(jioSongs, startIndex);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Your Playlists
          </h1>
          <p className="text-muted-foreground">Manage your custom collections.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-5 h-5 mr-2" />
              Create Playlist
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create New Playlist</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <Input
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="bg-white/5 border-white/10"
                autoFocus
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!newPlaylistName.trim() || createPlaylist.isPending}
                >
                  {createPlaylist.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liked Songs special card */}
      <div>
        <div
          className="glass-card border border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10 transition-colors rounded-xl cursor-pointer p-6"
          onClick={() => setLikedExpanded((v) => !v)}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-pink-500/20 text-pink-500 flex items-center justify-center shrink-0">
              <Heart className="w-8 h-8 fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-white">Liked Songs</h3>
              <p className="text-muted-foreground text-sm">
                {audio.likedSongs.length} song
                {audio.likedSongs.length !== 1 ? "s" : ""} · Saved to your
                account
              </p>
            </div>
            {audio.likedSongs.length > 0 && (
              <Button
                size="icon"
                className="h-11 w-11 rounded-full bg-pink-500 hover:bg-pink-400 text-white shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  playLikedSongs(0);
                }}
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </Button>
            )}
          </div>
        </div>

        {likedExpanded && audio.likedSongs.length > 0 && (
          <div className="mt-2 border border-white/10 rounded-xl overflow-hidden">
            {audio.likedSongs.map((liked, i) => {
              const isActive =
                audio.currentSong?.id === liked.jioSongId;
              return (
                <div
                  key={liked.jioSongId}
                  onClick={() => playLikedSongs(i)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-white/5 last:border-0 ${
                    isActive
                      ? "bg-pink-500/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  {liked.imageUrl ? (
                    <img
                      src={liked.imageUrl}
                      alt={liked.songName}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Music2 className="w-4 h-4 text-white/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium text-sm truncate ${isActive ? "text-pink-400" : "text-white"}`}
                    >
                      {liked.songName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {liked.artist}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      audio.toggleLike(likedSongToJio(liked));
                    }}
                    className="shrink-0 p-1.5 rounded-full text-pink-500 hover:text-pink-400 transition-colors"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {likedExpanded && audio.likedSongs.length === 0 && (
          <div className="mt-2 border border-white/10 rounded-xl p-8 text-center text-muted-foreground text-sm">
            No liked songs yet. Tap the ♥ on any song to save it here.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))
        ) : playlists?.length ? (
          playlists.map((playlist) => (
            <Link key={playlist.playlistId} href={`/playlist/${playlist.playlistId}`}>
              <Card className="glass-card bg-transparent hover:bg-white/5 transition-colors cursor-pointer group h-full flex flex-col relative">
                <CardContent className="p-6 flex-1 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ListMusic className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">
                      {playlist.playlistName}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {playlist.songCount} songs
                    </p>
                  </div>

                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "
                            {playlist.playlistName}"? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={(e) => e.stopPropagation()}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => handleDelete(playlist.playlistId, e)}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-muted-foreground bg-white/5 rounded-2xl border border-white/5">
            <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-medium text-white mb-2">
              No playlists yet
            </h3>
            <p>Create your first playlist to organize your favorites.</p>
          </div>
        )}
      </div>
    </div>
  );
}
