import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetDashboard, useGetMoods, useSelectMood, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { Play, ListMusic, Video, Activity, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading: loadingDashboard } = useGetDashboard();
  const { data: moods, isLoading: loadingMoods } = useGetMoods();
  
  const selectMood = useSelectMood();

  const [greeting, setGreeting] = useState("Good Day");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const handleMoodSelect = (moodId: string) => {
    selectMood.mutate({ data: { moodId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        setLocation(`/player/${moodId}`);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to select mood", variant: "destructive" });
      }
    });
  };

  const formatDuration = (time: string) => {
    return new Date(`1970-01-01T${time}Z`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {greeting}, <span className="text-primary">{user?.firstName || user?.username || "User"}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Ready to discover your perfect soundtrack?</p>
        </div>
      </div>

      {/* Mood Quick Pick */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-secondary" />
          How are you feeling?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {loadingMoods ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : (
            moods?.slice(0, 6).map((mood) => (
              <button
                key={mood.moodId}
                onClick={() => handleMoodSelect(mood.moodId)}
                className="relative overflow-hidden group rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 border border-white/10"
                style={{ background: mood.gradient || "var(--card)" }}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                <span className="text-2xl relative z-10">{mood.emoji}</span>
                <span className="font-medium text-sm text-white relative z-10">{mood.moodName}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card bg-transparent">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Play className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Songs Played</p>
              {loadingDashboard ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold text-white">{dashboard?.totalSongsPlayed || 0}</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card bg-transparent">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
              <ListMusic className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Playlists</p>
              {loadingDashboard ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold text-white">{dashboard?.playlistsCreated || 0}</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card bg-transparent">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Videos</p>
              {loadingDashboard ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold text-white">{dashboard?.videosUploaded || 0}</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card bg-transparent">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Moods Logged</p>
              {loadingDashboard ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold text-white">{dashboard?.moodsSelected || 0}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent History */}
        <Card className="lg:col-span-2 glass-card bg-transparent">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recently Played
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDashboard ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : dashboard?.recentHistory?.length ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead>Song</TableHead>
                    <TableHead>Mood</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.recentHistory.slice(0, 5).map((entry) => (
                    <TableRow key={entry.historyId} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="font-medium text-white">{entry.songName}</div>
                        <div className="text-xs text-muted-foreground">{entry.artist}</div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
                          {entry.emoji} {entry.moodName}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {formatDuration(entry.time)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent history. Pick a mood to start listening!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Playlists */}
        <Card className="glass-card bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Playlists</CardTitle>
            <Link href="/playlist" className="text-sm text-primary hover:text-primary/80">View All</Link>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingDashboard ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </div>
            ) : dashboard?.recentPlaylists?.length ? (
              <div className="space-y-4">
                {dashboard.recentPlaylists.slice(0, 4).map((playlist) => (
                  <Link key={playlist.playlistId} href={`/playlist/${playlist.playlistId}`}>
                    <div className="group flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        <ListMusic className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{playlist.playlistName}</p>
                        <p className="text-xs text-muted-foreground">{playlist.songCount} songs</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No playlists created yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
