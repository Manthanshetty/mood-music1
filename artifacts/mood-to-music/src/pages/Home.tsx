import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Play, Music, Sparkles, Video } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground dark overflow-hidden relative">
      {/* Abstract Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-secondary/20 blur-[120px]" />
        
        {/* Floating notes */}
        <div className="absolute top-1/4 left-1/4 animate-float" style={{ animationDelay: '0s' }}>
          <Music className="w-8 h-8 text-primary/30" />
        </div>
        <div className="absolute top-1/3 right-1/4 animate-float" style={{ animationDelay: '1s' }}>
          <Music className="w-12 h-12 text-secondary/30" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 animate-float" style={{ animationDelay: '2s' }}>
          <Music className="w-6 h-6 text-primary/40" />
        </div>
      </div>

      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18V5L21 3V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 21C7.65685 21 9 19.6569 9 18C9 16.3431 7.65685 15 6 15C4.34315 15 3 16.3431 3 18C3 19.6569 4.34315 21 6 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 19C19.6569 19 21 17.6569 21 16C21 14.3431 19.6569 13 18 13C16.3431 13 15 14.3431 15 16C15 17.6569 16.3431 19 18 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Mood to Music
          </div>
          <div className="flex gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 pt-20 pb-32">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                Let Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Mood</span><br />
                Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">Music</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                An immersive music platform that reads your emotional state and delivers the perfect soundtrack. Like stepping into a high-end club curated just for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/sign-up">
                  <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full">
                    Start Listening Now
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full border-primary text-primary hover:bg-primary/10">
                    I Already Have an Account
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:w-1/2 flex justify-center relative">
              {/* Vinyl Record */}
              <div className="w-64 h-64 md:w-96 md:h-96 rounded-full border-8 border-card bg-black animate-vinyl shadow-[0_0_50px_rgba(108,99,255,0.3)] flex items-center justify-center relative overflow-hidden">
                {/* Grooves */}
                <div className="absolute inset-2 border-[1px] border-white/5 rounded-full" />
                <div className="absolute inset-4 border-[1px] border-white/10 rounded-full" />
                <div className="absolute inset-6 border-[1px] border-white/5 rounded-full" />
                <div className="absolute inset-10 border-[1px] border-white/10 rounded-full" />
                <div className="absolute inset-14 border-[1px] border-white/5 rounded-full" />
                <div className="absolute inset-20 border-[1px] border-white/10 rounded-full" />
                
                {/* Center Label */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center relative z-10">
                  <div className="w-4 h-4 bg-background rounded-full" />
                </div>
                
                {/* Reflection highlight */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent w-full h-full rounded-full mix-blend-overlay" />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-32">
            <h2 className="text-3xl font-bold text-center mb-16">The Ultimate Personal Soundtrack</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-card p-8 rounded-2xl flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Mood Detection</h3>
                <p className="text-muted-foreground">Select how you're feeling and our algorithm instantly curates a unique playlist designed to match or elevate your current state.</p>
              </div>
              
              <div className="glass-card p-8 rounded-2xl flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mb-6">
                  <Play className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Smart Recommendations</h3>
                <p className="text-muted-foreground">Discover new tracks alongside popular hits. Filter by genre, language, and tempo to dial in exactly what you want to hear.</p>
              </div>
              
              <div className="glass-card p-8 rounded-2xl flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-6">
                  <Video className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Video + Music Editor</h3>
                <p className="text-muted-foreground">Create your own visual experiences. Upload videos, pair them with the perfect mood-matched soundtrack, and manage your creations.</p>
              </div>
            </div>
          </div>
          
          {/* How it works */}
          <div className="mt-32 bg-card/50 rounded-3xl p-10 md:p-16 border border-border">
            <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: "01", title: "Create Account", desc: "Sign up in seconds to start building your profile." },
                { step: "02", title: "Pick a Mood", desc: "Tell us how you're feeling right now." },
                { step: "03", title: "Listen", desc: "Enjoy a curated YouTube mix tailored to you." },
                { step: "04", title: "Save Favorites", desc: "Build playlists and track your mood history." }
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="text-6xl font-black text-primary/10 mb-4">{item.step}</div>
                  <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
