import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  Activity, BarChart3, Bell, Brain, ChevronLeft, Copy, FolderOpen, LayoutDashboard, Menu, Network, Search, Settings, Sparkles, UploadCloud, X,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { useDemo } from "@/lib/demo-store";
import { cn } from "@/lib/utils";
import { btn } from "./kit";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/files", label: "My Files", icon: FolderOpen },
  { to: "/upload", label: "Smart Upload", icon: UploadCloud },
  { to: "/search", label: "Semantic Search", icon: Search },
  { to: "/classify", label: "Classification", icon: Brain },
  { to: "/similar", label: "Similar Files", icon: Network },
  { to: "/duplicates", label: "Duplicates", icon: Copy },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/activity", label: "Recent Activity", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Smart Cloud Storage AI home">
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-aurora glow-violet">
        <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-sm font-semibold">Smart Cloud</span>
          <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">Storage AI</span>
        </span>
      )}
    </Link>
  );
}

const HUES = ["option-lavender", "option-peach", "option-mint", "option-rose", "option-lavender", "option-rose", "option-peach", "option-mint", "option-peach", "option-lavender"] as const;

function NavList({ collapsed, onNav }: { collapsed?: boolean; onNav?: () => void }) {
  const { pathname } = useLocation();
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV.map(({ to, label, icon: I }, i) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        const hue = HUES[i % HUES.length] ?? "option-lavender";
        return (
          <motion.div
            key={to}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i, type: "spring", stiffness: 320, damping: 26 }}
          >
            <Link
              to={to}
              onClick={onNav}
              title={collapsed ? label : undefined}
              className={cn(
                "option-link group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
                hue,
                active ? "text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              {active && (
                <motion.span layoutId="nav-active" className="option-active absolute inset-0 rounded-lg" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
              )}
              <motion.span
                className="option-icon relative grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                whileHover={{ scale: 1.2, rotate: -8 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <I className="h-4.5 w-4.5 shrink-0" />
              </motion.span>
              {!collapsed && (
                <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">{label}</span>
              )}
              {!collapsed && (
                <span className={cn("option-dot relative ml-auto h-1.5 w-1.5 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100", active && "opacity-100")} />
              )}
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [notif, setNotif] = useState(false);
  const [profile, setProfile] = useState(false);
  const [q, setQ] = useState("");
  const { settings, activity, liveMode, user, logout } = useDemo();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate({ to: "/search", search: { q: q.trim() } });
  };

  const initials = user?.name ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "VN";

  return (
    <MotionConfig reducedMotion={settings.motion === "reduced" ? "always" : "user"}>
      <div className="flex min-h-screen">
        {/* desktop sidebar */}
        <motion.aside
          animate={{ width: collapsed ? 84 : 248 }}
          className="sticky top-0 hidden h-screen shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar p-4 backdrop-blur-xl lg:flex"
        >
          <div className={cn("mb-8 flex items-center", collapsed ? "justify-center" : "justify-between")}>
            <Logo compact={collapsed} />
          </div>
          <NavList collapsed={collapsed} />
          <div className="mt-auto space-y-3">
            {!collapsed && (
              <div className={cn("rounded-xl border p-3 text-xs text-muted-foreground", liveMode ? "border-success/25 bg-success/5" : "border-warning/25 bg-warning/5")}>
                <p className={cn("font-mono uppercase tracking-wider flex items-center gap-1.5", liveMode ? "text-success" : "text-warning")}>
                  {liveMode && <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />}
                  {liveMode ? "Live Cloud Vault" : "Demo mode"}
                </p>
                <p className="mt-1">
                  {liveMode ? "Connected to FastAPI & MongoDB. Real storage, classification and semantic search active." : "Frontend-only preview. Local simulation mode."}
                </p>
              </div>
            )}
            <button onClick={() => setCollapsed((c) => !c)} className={cn(btn({ variant: "subtle", size: "sm" }), "w-full")} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
              {!collapsed && "Collapse"}
            </button>
          </div>
        </motion.aside>

        {/* mobile drawer */}
        <AnimatePresence>
          {mobile && (
            <>
              <motion.div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobile(false)} />
              <motion.aside
                role="dialog" aria-modal="true" aria-label="Navigation"
                className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-sidebar-border bg-popover p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden shadow-2xl"
                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <Logo />
                  <button className={btn({ variant: "subtle", size: "icon" })} onClick={() => setMobile(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
                </div>
                <NavList onNav={() => setMobile(false)} />
                <div className="mt-6 pt-4 border-t border-border">
                  <div className={cn("rounded-xl border p-3 text-xs text-muted-foreground", liveMode ? "border-success/25 bg-success/5" : "border-warning/25 bg-warning/5")}>
                    <p className={cn("font-mono uppercase tracking-wider flex items-center gap-1.5", liveMode ? "text-success" : "text-warning")}>
                      {liveMode && <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />}
                      {liveMode ? "Live Cloud Vault" : "Demo mode"}
                    </p>
                    <p className="mt-1">
                      {liveMode ? "Connected to FastAPI & MongoDB." : "Frontend preview mode."}
                    </p>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* top bar */}
          <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/70 px-3 py-2.5 backdrop-blur-xl sm:gap-3 sm:px-6 sm:py-3">
            <button className={cn(btn({ variant: "subtle", size: "icon" }), "lg:hidden shrink-0")} onClick={() => setMobile(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <div className="lg:hidden shrink-0"><Logo compact /></div>
            <span className="hidden font-display text-sm font-semibold xl:block">Smart Cloud Storage <span className="text-gradient">AI</span></span>
            <form onSubmit={submit} className="relative mx-1 sm:mx-auto flex-1 max-w-xs sm:max-w-md" role="search">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search files…"
                aria-label="Global search"
                className="h-9 sm:h-10 w-full rounded-full border border-input bg-glass pl-9 pr-3 text-xs sm:text-sm placeholder:text-muted-foreground focus:border-violet/60 focus:outline-none focus:ring-2 focus:ring-violet/30"
              />
            </form>
            {liveMode ? (
              <span className="hidden rounded-full border border-success/30 bg-success/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-success md:inline-flex items-center gap-1.5 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live
              </span>
            ) : (
              <span className="hidden rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-warning md:inline shrink-0">Demo</span>
            )}
            <div className="relative shrink-0">
              <button className={cn(btn({ variant: "ghost", size: "icon" }), "relative h-9 w-9 sm:h-10 sm:w-10")} onClick={() => { setNotif((v) => !v); setProfile(false); }} aria-label="Notifications" aria-expanded={notif}>
                <Bell className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                {settings.notifications && <span className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 h-2 w-2 rounded-full bg-cyan" />}
              </button>
              <AnimatePresence>
                {notif && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} className="glass absolute right-0 top-12 z-50 w-72 sm:w-80 bg-popover p-3">
                    <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notifications</p>
                    {!settings.notifications ? (
                      <p className="px-1 py-4 text-sm text-muted-foreground">Notifications are turned off in Settings.</p>
                    ) : activity.slice(0, 4).map((a) => (
                      <div key={a.id} className="rounded-lg px-2 py-2 text-sm hover:bg-accent">{a.text}</div>
                    ))}
                    <Link to="/activity" onClick={() => setNotif(false)} className="mt-1 block rounded-lg px-2 py-2 text-sm text-cyan hover:bg-accent">View all activity →</Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="relative shrink-0">
              <button onClick={() => { setProfile((v) => !v); setNotif(false); }} className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-aurora text-xs sm:text-sm font-bold text-primary-foreground" aria-label="Profile menu" aria-expanded={profile}>{initials}</button>
              <AnimatePresence>
                {profile && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} className="glass absolute right-0 top-12 z-50 w-56 bg-popover p-2">
                    <div className="px-2 py-2">
                      <p className="text-sm font-semibold">{user?.name || "Demo User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email || "demo@antigravity.ai"}</p>
                    </div>
                    <Link to="/settings" onClick={() => setProfile(false)} className="block rounded-lg px-2 py-2 text-sm hover:bg-accent">Settings</Link>
                    <Link to="/analytics" onClick={() => setProfile(false)} className="block rounded-lg px-2 py-2 text-sm hover:bg-accent">Storage usage</Link>
                    <button
                      type="button"
                      onClick={() => {
                        setProfile(false);
                        window.dispatchEvent(new Event("replay-intro"));
                      }}
                      className="w-full text-left block rounded-lg px-2 py-2 text-sm hover:bg-accent text-violet font-medium"
                    >
                      Replay intro animation
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link to="/upload" className={cn(btn({ size: "md" }), "hidden sm:inline-flex shrink-0")}><UploadCloud className="h-4 w-4" /> Upload Files</Link>
          </header>

          {/* main viewport */}
          <main className={cn("mx-auto w-full max-w-[1400px] flex-1 px-3.5 py-4 pb-28 sm:px-6 sm:py-6 lg:pb-8 lg:px-8", settings.density === "compact" && "py-3")}>
            <AnimatePresence mode="wait">
              <motion.div key={pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Mobile Bottom Navigation Dock (Native Phone Ratio Bar) */}
          <nav
            className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border/80 bg-background/90 px-2 py-1.5 backdrop-blur-xl lg:hidden shadow-[0_-8px_24px_-10px_rgba(0,0,0,0.15)] pb-[max(0.45rem,env(safe-area-inset-bottom))]"
            aria-label="Mobile Bottom Navigation"
          >
            {/* Dashboard */}
            <Link
              to="/"
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 text-[11px] min-w-[54px]",
                pathname === "/" ? "text-violet font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn("relative grid h-7 w-7 place-items-center rounded-lg transition-transform", pathname === "/" && "scale-110")}>
                <LayoutDashboard className="h-4.5 w-4.5" />
                {pathname === "/" && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-violet" />}
              </span>
              <span className="mt-0.5">Home</span>
            </Link>

            {/* My Files */}
            <Link
              to="/files"
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 text-[11px] min-w-[54px]",
                pathname.startsWith("/files") ? "text-violet font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn("relative grid h-7 w-7 place-items-center rounded-lg transition-transform", pathname.startsWith("/files") && "scale-110")}>
                <FolderOpen className="h-4.5 w-4.5" />
                {pathname.startsWith("/files") && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-violet" />}
              </span>
              <span className="mt-0.5">Files</span>
            </Link>

            {/* Prominent Upload Action Button */}
            <Link
              to="/upload"
              className="flex flex-col items-center justify-center -mt-5 group"
              aria-label="Smart Upload"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-aurora glow-violet text-primary-foreground shadow-lg transition-transform group-active:scale-95 group-hover:scale-105">
                <UploadCloud className="h-6 w-6" />
              </span>
              <span className="mt-1 text-[10px] font-semibold text-foreground">Upload</span>
            </Link>

            {/* Semantic Search */}
            <Link
              to="/search"
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 text-[11px] min-w-[54px]",
                pathname.startsWith("/search") ? "text-violet font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn("relative grid h-7 w-7 place-items-center rounded-lg transition-transform", pathname.startsWith("/search") && "scale-110")}>
                <Search className="h-4.5 w-4.5" />
                {pathname.startsWith("/search") && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-violet" />}
              </span>
              <span className="mt-0.5">Search</span>
            </Link>

            {/* More Menu */}
            <button
              type="button"
              onClick={() => setMobile(true)}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 text-[11px] text-muted-foreground hover:text-foreground min-w-[54px]"
              aria-label="All features menu"
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg">
                <Menu className="h-4.5 w-4.5" />
              </span>
              <span className="mt-0.5">More</span>
            </button>
          </nav>
        </div>
      </div>
    </MotionConfig>
  );
}
