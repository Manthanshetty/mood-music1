import { useGetMoodStats, useGetMoodHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { History, Activity } from "lucide-react";

export default function MoodHistory() {
  const { data: stats, isLoading: loadingStats } = useGetMoodStats();
  const { data: history, isLoading: loadingHistory } = useGetMoodHistory();

  // Create color map for chart based on our mood colors defined in instructions
  const getColorForMood = (moodName: string) => {
    switch(moodName.toLowerCase()) {
      case 'happy': return 'hsl(var(--chart-1))'; // Yellow/Orange
      case 'sad': return 'hsl(var(--chart-2))'; // Blue
      case 'calm': return 'hsl(var(--chart-3))'; // Green
      case 'energetic': return 'hsl(var(--chart-4))'; // Pink
      case 'romantic': return 'hsl(var(--chart-5))'; // Purple/Red
      case 'angry': return 'hsl(350 84% 60%)'; // Red
      default: return 'hsl(var(--primary))';
    }
  };

  const chartData = stats?.map(stat => ({
    name: stat.moodName,
    count: stat.count,
    emoji: stat.emoji,
    fill: getColorForMood(stat.moodName)
  })) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Mood History</h1>
        <p className="text-muted-foreground">Track your emotional journey and listening habits over time.</p>
      </div>

      <Card className="glass-card bg-transparent border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Activity className="w-5 h-5 text-primary" />
            Mood Distribution
          </CardTitle>
          <CardDescription>Frequency of moods you've selected</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <Skeleton className="h-[300px] w-full" />
          ) : stats?.length ? (
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value, index) => {
                      // Custom tick to show emoji + name
                      return `${chartData[index]?.emoji} ${value}`;
                    }}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'white', borderRadius: '8px' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Not enough data to display chart.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card bg-transparent border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <History className="w-5 h-5 text-secondary" />
            Detailed History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : history?.length ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead>Mood</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.selectionId} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <span className="inline-flex items-center gap-2 text-white font-medium">
                        <span className="text-xl">{entry.emoji}</span>
                        {entry.moodName}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString(undefined, {
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground font-mono text-sm">
                      {entry.time}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No mood history recorded yet. Select a mood to get started!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
