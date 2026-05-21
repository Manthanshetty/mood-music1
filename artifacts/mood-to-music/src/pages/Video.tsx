import { useState, useRef } from "react";
import { useGetVideos, useDeleteVideo, getGetVideosQueryKey, useGetMoods, useGetSongs } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Video as VideoIcon, Upload, Film, Music2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@clerk/react";

export default function Video() {
  const { getToken } = useAuth();
  const { data: videos, isLoading: loadingVideos } = useGetVideos();
  const { data: moods } = useGetMoods();

  const deleteVideo = useDeleteVideo();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [moodId, setMoodId] = useState("");
  const [songId, setSongId] = useState("");
  const [editType, setEditType] = useState("montage");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: availableSongs, isLoading: loadingSongs } = useGetSongs(
    { moodId },
    { query: { enabled: !!moodId } },
  );

  const handleMoodChange = (val: string) => {
    setMoodId(val);
    setSongId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !songId) {
      toast({ title: "Missing fields", description: "Title and song are required.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("title", title);
      formData.append("songId", songId);
      formData.append("editType", editType);
      if (file) formData.append("video_file", file);

      const res = await fetch("/api/videos", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());

      toast({ title: "Success", description: "Video project created!" });
      setTitle("");
      setMoodId("");
      setSongId("");
      setEditType("montage");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: getGetVideosQueryKey() });
    } catch {
      toast({ title: "Error", description: "Failed to create video project.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteVideo.mutate({ videoId: id }, {
      onSuccess: () => {
        toast({ title: "Deleted", description: "Video project removed." });
        queryClient.invalidateQueries({ queryKey: getGetVideosQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete video.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Video Editor</h1>
        <p className="text-muted-foreground">Pair your videos with mood-matched soundtracks.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        {/* Upload Form */}
        <Card className="md:col-span-1 glass-card bg-transparent border-white/10 h-fit">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              New Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-white">Project Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. Summer Memories"
                  className="bg-white/5 border-white/10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white">Upload MP4 <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <div
                  className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {file ? (
                    <div className="flex items-center gap-2 justify-center">
                      <Film className="w-4 h-4 text-primary" />
                      <span className="text-sm text-white truncate max-w-[140px]">{file.name}</span>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      <Upload className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      Click to select MP4
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,.mp4"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white">Mood</Label>
                <Select value={moodId} onValueChange={handleMoodChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select mood..." />
                  </SelectTrigger>
                  <SelectContent>
                    {moods?.map((m) => (
                      <SelectItem key={m.moodId} value={m.moodId}>
                        {m.emoji} {m.moodName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white">Soundtrack</Label>
                <Select
                  value={songId}
                  onValueChange={setSongId}
                  disabled={!moodId || loadingSongs}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue
                      placeholder={
                        !moodId ? "Select mood first" : loadingSongs ? "Loading..." : "Select song..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSongs?.map((s) => (
                      <SelectItem key={s.songId} value={s.songId}>
                        {s.songName} — {s.artist} [{s.language}]
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white">Edit Style</Label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="montage">Montage</SelectItem>
                    <SelectItem value="cinematic">Cinematic</SelectItem>
                    <SelectItem value="raw">Raw / Vlog</SelectItem>
                    <SelectItem value="music-video">Music Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full mt-2" disabled={uploading}>
                {uploading ? "Saving..." : "Create Project"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Video Cards */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <VideoIcon className="w-5 h-5 text-secondary" /> Your Videos
          </h2>

          {loadingVideos ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))
          ) : videos?.length ? (
            videos.map((video) => (
              <Card key={video.videoId} className="glass-card bg-transparent border-white/10 overflow-hidden">
                <CardContent className="p-0">
                  {video.filePath ? (
                    <div className="w-full aspect-video bg-black">
                      <video
                        controls
                        className="w-full h-full object-contain"
                        style={{ background: "#000" }}
                      >
                        <source src={`/api/uploads/${video.filePath.replace("uploads/", "")}`} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-black/40 flex items-center justify-center border-b border-white/10">
                      <div className="text-center text-muted-foreground">
                        <Film className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No video file attached</p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-white truncate">{video.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {video.uploadDate} · <span className="capitalize">{video.editType}</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-primary text-sm">
                        <Music2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{video.songName} — {video.artist}</span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Video</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{video.title}"? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(video.videoId)}
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
            ))
          ) : (
            <div className="text-center py-16 text-muted-foreground border border-white/10 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <VideoIcon className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">No videos yet</h3>
              <p>Create your first project using the form on the left.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
