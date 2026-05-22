import { ReactNode, useState } from "react";
import { Menu, Play, Pause, SkipBack, SkipForward, Heart, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "./Sidebar";
import {
  AudioProvider,
  useAudioCtx,
  stripHtml,
  fmtTime,
  getSongImg,
  getArtistName,
} from "@/contexts/AudioContext";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AudioProvider>
      <LayoutShell>{children}</LayoutShell>
    </AudioProvider>
  );
}

function LayoutShell({ children }: { children: ReactNode }) {
  const audio = useAudioCtx();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const progress =
    audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0;
  const maxTime = audio.duration || (audio.currentSong?.duration ?? 0);
  const song = audio.currentSong;

  return (
    <div className="flex min-h-screen bg-background text-foreground dark">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-[60] w-64 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2 text-primary font-bold">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 18V5L21 3V16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 21C7.65685 21 9 19.6569 9 18C9 16.3431 7.65685 15 6 15C4.34315 15 3 16.3431 3 18C3 19.6569 4.34315 21 6 21Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18 19C19.6569 19 21 17.6569 21 16C21 14.3431 19.6569 13 18 13C16.3431 13 15 14.3431 15 16C15 17.6569 16.3431 19 18 19Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Mood to Music
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        <div
          className={`flex-1 overflow-y-auto p-4 md:p-8 ${song ? "pb-28" : ""}`}
        >
          <div className="max-w-7xl mx-auto h-full">{children}</div>
        </div>
      </main>

      {song && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 z-50 bg-zinc-950/97 backdrop-blur-xl border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-2.5 max-w-screen-xl mx-auto">
            <div className="shrink-0">
              {getSongImg(song) ? (
                <img
                  src={getSongImg(song)}
                  alt={stripHtml(song.name)}
                  className="w-11 h-11 rounded-md object-cover shadow-lg ring-1 ring-white/10"
                />
              ) : (
                <div className="w-11 h-11 rounded-md bg-white/10 flex items-center justify-center">
                  <Music2 className="w-4 h-4 text-white/30" />
                </div>
              )}
            </div>

            <div className="hidden sm:flex flex-col min-w-0 w-36 shrink-0">
              <p className="font-medium text-white text-xs truncate leading-snug">
                {stripHtml(song.name)}
              </p>
              <p className="text-[11px] text-muted-foreground truncate leading-snug">
                {getArtistName(song)}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-full shrink-0 hidden sm:flex transition-colors ${
                audio.likedIds.has(song.id)
                  ? "text-pink-500 hover:text-pink-400"
                  : "text-white/40 hover:text-white/70"
              }`}
              onClick={() => audio.toggleLike(song)}
            >
              <Heart
                className={`w-4 h-4 ${audio.likedIds.has(song.id) ? "fill-current" : ""}`}
              />
            </Button>

            <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                  onClick={audio.skipPrev}
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </Button>
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_14px_rgba(108,99,255,0.45)]"
                  onClick={audio.togglePlay}
                >
                  {audio.isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                  onClick={audio.skipNext}
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </Button>
              </div>

              <div className="flex items-center gap-2 w-full">
                <span className="text-[11px] text-muted-foreground tabular-nums w-8 text-right shrink-0">
                  {fmtTime(audio.currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={maxTime || 1}
                  step={0.5}
                  value={audio.currentTime}
                  onChange={(e) => audio.seek(Number(e.target.value))}
                  onMouseDown={() => audio.setSeekingRef(true)}
                  onMouseUp={() => audio.setSeekingRef(false)}
                  onTouchStart={() => audio.setSeekingRef(true)}
                  onTouchEnd={() => audio.setSeekingRef(false)}
                  className="flex-1 h-1 rounded-full cursor-pointer appearance-none"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) ${progress.toFixed(1)}%, rgba(255,255,255,0.12) ${progress.toFixed(1)}%)`,
                    accentColor: "hsl(var(--primary))",
                  }}
                />
                <span className="text-[11px] text-muted-foreground tabular-nums w-8 shrink-0">
                  {fmtTime(maxTime)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
