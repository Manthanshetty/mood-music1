import { useState, useEffect } from "react";
import { useGetVideos, useCreateVideo, useDeleteVideo, getGetVideosQueryKey, useGetMoods, useGetSongs } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Video as VideoIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  moodId: z.string().optional(),
  songId: z.string().min(1, "Song selection is required"),
  editType: z.string().min(1, "Edit type is required"),
});

export default function Video() {
  const { data: videos, isLoading: loadingVideos } = useGetVideos();
  const { data: moods } = useGetMoods();
  
  const createVideo = useCreateVideo();
  const deleteVideo = useDeleteVideo();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      moodId: "",
      songId: "",
      editType: "montage",
    },
  });

  const selectedMoodId = form.watch("moodId");

  const { data: availableSongs, isLoading: loadingSongs } = useGetSongs(
    { moodId: selectedMoodId },
    { query: { enabled: !!selectedMoodId } }
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createVideo.mutate({ data: { 
      title: values.title,
      songId: values.songId,
      moodId: values.moodId || undefined,
      editType: values.editType
    } }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Video created successfully" });
        form.reset({ title: "", moodId: "", songId: "", editType: "montage" });
        queryClient.invalidateQueries({ queryKey: getGetVideosQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create video", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: string) => {
    deleteVideo.mutate({ videoId: id }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Video deleted" });
        queryClient.invalidateQueries({ queryKey: getGetVideosQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete video", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Video Editor</h1>
        <p className="text-muted-foreground">Pair visual experiences with mood-matched soundtracks.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 glass-card bg-transparent border-white/10 h-fit">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              New Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Project Title</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g. Summer Memories" className="bg-white/5 border-white/10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="moodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Target Mood</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select mood..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {moods?.map(m => (
                            <SelectItem key={m.moodId} value={m.moodId}>
                              {m.emoji} {m.moodName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="songId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Soundtrack</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedMoodId || loadingSongs}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder={!selectedMoodId ? "Select mood first" : loadingSongs ? "Loading..." : "Select song..."} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSongs?.map(s => (
                            <SelectItem key={s.songId} value={s.songId}>
                              {s.songName} - {s.artist}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="editType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Edit Style</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select style..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="montage">Montage</SelectItem>
                          <SelectItem value="cinematic">Cinematic</SelectItem>
                          <SelectItem value="raw">Raw / Vlog</SelectItem>
                          <SelectItem value="music-video">Music Video</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full mt-4" disabled={createVideo.isPending}>
                  {createVideo.isPending ? "Creating..." : "Create Project"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 glass-card bg-transparent border-white/10">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <VideoIcon className="w-5 h-5 text-secondary" />
              Your Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVideos ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : videos?.length ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead>Title</TableHead>
                    <TableHead>Soundtrack</TableHead>
                    <TableHead>Style</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.map((video) => (
                    <TableRow key={video.videoId} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium text-white">{video.title}</TableCell>
                      <TableCell>
                        <div className="text-sm text-white/90">{video.songName}</div>
                        <div className="text-xs text-muted-foreground">{video.artist}</div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-xs px-2 py-1 bg-white/10 rounded-md">
                          {video.editType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
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
                              <AlertDialogAction onClick={() => handleDelete(video.videoId)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <VideoIcon className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No videos yet</h3>
                <p>Create your first project using the form.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
