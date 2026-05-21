import { useGetMoods, useSelectMood, useGetMoodHistory, getGetMoodHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Mood() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: moods, isLoading: loadingMoods } = useGetMoods();
  const { data: history, isLoading: loadingHistory } = useGetMoodHistory();
  const selectMood = useSelectMood();

  const handleMoodSelect = (moodId: string) => {
    selectMood.mutate({ data: { moodId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMoodHistoryQueryKey() });
        setLocation(`/player/${moodId}`);
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Mood Selection</h1>
        <p className="text-muted-foreground">Tell us how you're feeling to get curated music recommendations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingMoods ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)
        ) : (
          moods?.map((mood) => (
            <button
              key={mood.moodId}
              onClick={() => handleMoodSelect(mood.moodId)}
              className="text-left relative overflow-hidden group rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] border border-white/10 active:scale-[0.98] min-h-[180px] flex flex-col"
              style={{ background: mood.gradient || "var(--card)" }}
            >
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-300" />
              
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="text-5xl mb-4 transform group-hover:scale-110 group-hover:-rotate-6 transition-transform origin-bottom-left">
                  {mood.emoji}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{mood.moodName}</h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  {mood.description}
                </p>
              </div>

              {/* Glow effect */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/20 blur-3xl rounded-full group-hover:bg-white/30 transition-colors" />
            </button>
          ))
        )}
      </div>

      <Alert className="bg-primary/10 border-primary/20 text-primary">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Pro Tip</AlertTitle>
        <AlertDescription>
          After picking your mood, you can filter songs by genre, tempo, and language on the player page.
        </AlertDescription>
      </Alert>

      <Card className="glass-card bg-transparent">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Moods
          </CardTitle>
          <CardDescription>Your emotional journey over time</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : history?.length ? (
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead>Mood</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.slice(0, 5).map((entry) => (
                    <TableRow key={entry.selectionId} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium text-white">
                        <span className="inline-flex items-center gap-2">
                          <span>{entry.emoji}</span> {entry.moodName}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              You haven't logged any moods yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
