import { Link, useLocation } from "wouter";
import { Home, Smile, History, Search, ListMusic, Video, User, LogOut } from "lucide-react";
import { useUser, useClerk } from "@clerk/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Smile, label: "Mood Selection", href: "/mood" },
  { icon: History, label: "Mood History", href: "/mood/history" },
  { icon: Search, label: "Search Music", href: "/search" },
  { icon: ListMusic, label: "Playlists", href: "/playlist" },
  { icon: Video, label: "Video Editor", href: "/video" },
  { icon: User, label: "Profile", href: "/profile" },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleLogout = () => {
    signOut({ redirectUrl: import.meta.env.BASE_URL || "/" });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 text-primary" onClick={onClose}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18V5L21 3V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 21C7.65685 21 9 19.6569 9 18C9 16.3431 7.65685 15 6 15C4.34315 15 3 16.3431 3 18C3 19.6569 4.34315 21 6 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 19C19.6569 19 21 17.6569 21 16C21 14.3431 19.6569 13 18 13C16.3431 13 15 14.3431 15 16C15 17.6569 16.3431 19 18 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-bold text-xl tracking-tight text-foreground">Mood to Music</span>
        </Link>
      </div>

      <div className="px-4 py-6 border-b border-sidebar-border flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-primary bg-primary/20">
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback className="text-primary-foreground bg-primary">{getInitials(user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-sm truncate">{user?.fullName || user?.username || "User"}</span>
          <span className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/dashboard" && item.href !== "/mood");
          
          // Special case for /mood which shouldn't highlight for /mood/history
          const isReallyActive = item.href === "/mood" ? location === "/mood" : isActive;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isReallyActive 
                  ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isReallyActive ? "text-primary" : "text-muted-foreground"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}
