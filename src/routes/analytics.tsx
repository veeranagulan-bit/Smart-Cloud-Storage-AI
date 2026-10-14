import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DemoBadge, Glass, PageHeader, Progress } from "@/components/app/kit";
import { useDemo } from "@/lib/demo-store";
import { meta } from "@/lib/meta";
import { CATEGORIES, formatBytes, formatDate, STORAGE_QUOTA, UPLOAD_HISTORY, CHART_COLORS } from "@/lib/mock-data";

export const Route = createFileRoute("/analytics")({
  head: () => meta("Storage Analytics", "Charts of storage usage, categories, file types and upload activity for the demo library."),
  component: AnalyticsPage,
});

const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 } };

function AnalyticsPage() {
  const { files, activity, liveMode } = useDemo();
  const used = files.reduce((s, f) => s + f.size, 0);
  const cats = CATEGORIES.map((c) => ({ name: c, value: files.filter((f) => f.category === c).length })).filter((d) => d.value);
  const kinds = Object.entries(files.reduce<Record<string, number>>((m, f) => ({ ...m, [f.kind]: (m[f.kind] ?? 0) + 1 }), {})).map(([name, count]) => ({ name, count }));
  const hashes = new Map<string, number>();
  files.forEach((f) => f.hash && hashes.set(f.hash, (hashes.get(f.hash) ?? 0) + 1));
  const dupes = [...hashes.values()].reduce((s, n) => s + (n > 1 ? n - 1 : 0), 0);

  return (
    <div>
      <PageHeader eyebrow="Insights" title="Storage Analytics" desc={liveMode ? "Live aggregated metrics calculated from MongoDB collections." : "Totals come from your library."} actions={<DemoBadge label={liveMode ? "Live Analytics" : "Demo data"} />} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Total files", files.length.toString()], ["Storage used", formatBytes(used)], ["Remaining", formatBytes(STORAGE_QUOTA - used)], ["Duplicate files", dupes.toString()]].map(([l, v], i) => (
          <Glass key={l} delay={i * 0.06}><p className="text-sm text-muted-foreground">{l}</p><p className="mt-2 font-display text-3xl font-semibold">{v}</p>{l === "Storage used" && <Progress value={(used / STORAGE_QUOTA) * 100} className="mt-3" />}</Glass>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Glass delay={0.2}>
          <h2 className="mb-3 font-semibold">Upload activity <span className="text-xs font-normal text-muted-foreground">(sample)</span></h2>
          <div className="h-64"><ResponsiveContainer><AreaChart data={UPLOAD_HISTORY}>
            <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--violet)" stopOpacity={0.6} /><stop offset="100%" stopColor="var(--violet)" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} /><YAxis stroke="var(--muted-foreground)" fontSize={12} /><Tooltip {...tip} />
            <Area type="monotone" dataKey="uploads" stroke="var(--violet)" fill="url(#ga)" strokeWidth={2} animationDuration={1200} />
            <Area type="monotone" dataKey="gb" name="GB" stroke="var(--cyan)" fill="transparent" strokeWidth={2} />
            <Legend />
          </AreaChart></ResponsiveContainer></div>
        </Glass>
        <Glass delay={0.25}>
          <h2 className="mb-3 font-semibold">Category distribution</h2>
          <div className="h-64"><ResponsiveContainer><PieChart>
            <Pie data={cats} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3} stroke="none">{cats.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]!} />)}</Pie>
            <Tooltip {...tip} /><Legend />
          </PieChart></ResponsiveContainer></div>
        </Glass>
        <Glass delay={0.3}>
          <h2 className="mb-3 font-semibold">File types</h2>
          <div className="h-64"><ResponsiveContainer><BarChart data={kinds}>
            <CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} /><YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} /><Tooltip {...tip} cursor={{ fill: "var(--accent)" }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>{kinds.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]!} />)}</Bar>
          </BarChart></ResponsiveContainer></div>
        </Glass>
        <Glass delay={0.35}>
          <h2 className="mb-3 font-semibold">Recent activity</h2>
          <ol className="relative space-y-4 border-l border-violet/30 pl-5">
            {activity.slice(0, 7).map((a) => (
              <li key={a.id} className="relative"><span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-cyan" /><p className="text-sm">{a.text}</p><p className="text-xs text-muted-foreground">{formatDate(a.date)}</p></li>
            ))}
          </ol>
        </Glass>
      </div>
    </div>
  );
}
