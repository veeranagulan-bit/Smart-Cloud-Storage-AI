import { createFileRoute, Link } from "@tanstack/react-router";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Brain, Copy, Database, FolderOpen, HardDrive, Search, Sparkles, UploadCloud } from "lucide-react";
import { useEffect } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { HeroHands } from "@/components/app/HeroHands";
import { btn, CatTag, DemoBadge, FileIcon, Glass, Progress } from "@/components/app/kit";
import { useDemo } from "@/lib/demo-store";
import { meta } from "@/lib/meta";
import { CATEGORIES, CHART_COLORS, formatBytes, formatDate, STORAGE_QUOTA } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => meta("Dashboard", "Your files, intelligently connected — AI-organized cloud storage demo dashboard."),
  component: Dashboard,
});


function Counter({ value, format }: { value: number; format?: (n: number) => string }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => (format ? format(v) : Math.round(v).toLocaleString()));
  useEffect(() => {
    const c = animate(mv, value, { duration: 1.4, ease: "easeOut" });
    return () => c.stop();
  }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

function Dashboard() {
  const { files, activity, liveMode } = useDemo();
  const used = files.reduce((s, f) => s + f.size, 0);
  const hashes = new Map<string, number>();
  files.forEach((f) => f.hash && hashes.set(f.hash, (hashes.get(f.hash) ?? 0) + 1));
  const dupes = [...hashes.values()].reduce((s, n) => s + (n > 1 ? n - 1 : 0), 0);
  const dist = CATEGORIES.map((c) => ({ name: c, value: files.filter((f) => f.category === c).length })).filter((d) => d.value);
  const recent = [...files].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  const metrics = [
    { label: "Total Files", icon: FolderOpen, node: <Counter value={files.length} />, pct: null },
    { label: "Storage Used", icon: HardDrive, node: <Counter value={used} format={formatBytes} />, pct: (used / STORAGE_QUOTA) * 100 },
    { label: "Available", icon: Database, node: <Counter value={STORAGE_QUOTA - used} format={formatBytes} />, pct: 100 - (used / STORAGE_QUOTA) * 100 },
    { label: "Duplicates Detected", icon: Copy, node: <Counter value={dupes} />, pct: null },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="glass relative overflow-hidden p-4 sm:p-6 md:p-10">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
        <div className="relative grid items-center gap-6 sm:gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <DemoBadge label={liveMode ? "Live Cloud Vault" : "Demo mode"} />
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mt-3 sm:mt-4 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
              Your Files. <span className="text-gradient">Intelligently Connected.</span>
            </motion.h1>
            <p className="mt-2.5 sm:mt-4 max-w-lg text-xs sm:text-sm md:text-base text-muted-foreground">
              Smart Cloud Storage AI organizes, classifies and links your files by meaning — so the right document finds you.
            </p>
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <Link to="/upload" className={cn(btn({ size: "lg" }), "w-full sm:w-auto justify-center text-xs sm:text-sm")}><UploadCloud className="h-4 w-4 sm:h-5 sm:w-5" /> Upload Files</Link>
              <Link to="/search" className={cn(btn({ variant: "ghost", size: "lg" }), "w-full sm:w-auto justify-center text-xs sm:text-sm")}><Search className="h-4 w-4 sm:h-5 sm:w-5" /> Explore Smart Search</Link>
            </div>
          </div>
          <HeroHands className="min-h-[220px] sm:min-h-[300px] md:min-h-[420px]" />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <Glass key={m.label} delay={0.1 + i * 0.07} className={cn("glass-hover metric-option p-3 sm:p-5", ["option-lavender", "option-rose", "option-mint", "option-peach"][i])}>
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{m.label}</p>
              <span className="option-icon grid h-7 w-7 sm:h-9 sm:w-9 place-items-center rounded-lg shrink-0"><m.icon className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" /></span>
            </div>
            <p className="mt-2 sm:mt-3 font-display text-lg sm:text-3xl font-semibold truncate">{m.node}</p>
            {m.pct !== null ? <Progress value={m.pct} className="mt-3 sm:mt-4" /> : <p className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-muted-foreground truncate">Sample library</p>}
          </Glass>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Glass className="lg:col-span-2" delay={0.3}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent files</h2>
            <Link to="/files" className="text-sm text-cyan hover:underline">View all</Link>
          </div>
          <ul className="divide-y divide-border">
            {recent.map((f) => (
              <li key={f.id} className="flex items-center gap-3 py-3">
                <FileIcon kind={f.kind} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}.{f.ext}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(f.size)} · {formatDate(f.date)}</p>
                </div>
                <CatTag c={f.category} />
              </li>
            ))}
          </ul>
        </Glass>
        <Glass delay={0.35}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Storage distribution</h2>
            <DemoBadge />
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={dist} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                  {dist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]!} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="grid grid-cols-2 gap-2 text-xs">
            {dist.map((d, i) => (
              <li key={d.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length]! }} />{d.name} ({d.value})</li>
            ))}
          </ul>
        </Glass>
      </div>

      <Glass delay={0.4}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold"><Brain className="h-5 w-5 text-violet" /> AI activity</h2>
          <DemoBadge label="Simulated" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {activity.slice(0, 6).map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.06 }} className={cn("activity-option flex items-start gap-3 rounded-lg border border-border p-3", ["option-lavender", "option-peach", "option-mint"][i % 3])}>
              <span className="option-icon grid h-7 w-7 shrink-0 place-items-center rounded-lg"><Sparkles className="h-4 w-4" /></span>
              <div>
                <p className="text-sm">{a.text}</p>
                <p className="text-xs text-muted-foreground">{formatDate(a.date)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Glass>
    </div>
  );
}
