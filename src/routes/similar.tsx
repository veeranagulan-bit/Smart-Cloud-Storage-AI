import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { CatTag, DemoBadge, FileIcon, Glass, PageHeader } from "@/components/app/kit";
import { useDemo } from "@/lib/demo-store";
import { meta } from "@/lib/meta";
import { demoScore, formatBytes, type DemoFile } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export const Route = createFileRoute("/similar")({
  head: () => meta("Similar Files", "Explore related files through an animated relationship graph."),
  component: SimilarPage,
});

function SimilarPage() {
  const { files, liveMode } = useDemo();
  const [id, setId] = useState(files[0]?.id);
  const src = files.find((f) => f.id === id) ?? files[0];
  const [liveRelated, setLiveRelated] = useState<{ f: DemoFile; reason: string; score: number }[]>([]);

  useEffect(() => {
    if (src && liveMode) {
      api.similar.get(src.id).then((res) => {
        if (res && res.similar) {
          setLiveRelated(res.similar.map((r) => ({ f: r.file || r.f, reason: r.reason, score: r.score })));
        }
      }).catch((err) => console.error("Similar files API error:", err));
    }
  }, [src, liveMode]);

  const fallbackRelated = useMemo(() => {
    if (!src) return [];
    return files.filter((f) => f.id !== src.id).map((f) => {
      const shared = f.tags.filter((t) => src.tags.includes(t));
      const sameCat = f.category === src.category;
      const base = shared.length * 18 + (sameCat ? 30 : 0) + (f.kind === src.kind ? 10 : 0);
      const reason = shared.length ? `Related topic: ${shared[0]}` : sameCat ? "Same category" : f.kind === src.kind ? "Same file type" : "";
      return { f, reason, score: Math.min(97, base + demoScore(src.id + f.id, 5, 25)) };
    }).filter((r) => r.reason).sort((a, b) => b.score - a.score).slice(0, 6);
  }, [files, src]);

  const related = liveMode && liveRelated.length > 0 ? liveRelated : fallbackRelated;

  if (!src) return <p className="text-muted-foreground">No files in the library.</p>;

  return (
    <div>
      <PageHeader eyebrow="Discover" title="Similar Files" desc="Semantic affinity graph based on sentence embedding vector cosine distance and shared domain taxonomy." actions={<DemoBadge label={liveMode ? "Vector Cosine Graph" : "Illustrative scores"} />} />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Glass className="max-h-[560px] overflow-y-auto">
          <h2 className="mb-3 text-sm font-semibold">Choose a file</h2>
          <ul className="space-y-1">
            {files.map((f) => (
              <li key={f.id}><button onClick={() => setId(f.id)} className={cn("flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-accent", f.id === src.id && "bg-violet/15 text-cyan")}><FileIcon kind={f.kind} className="h-7 w-7" /><span className="truncate">{f.name}</span></button></li>
            ))}
          </ul>
        </Glass>
        <div className="space-y-6">
          <Glass className="relative aspect-[16/10] overflow-hidden p-0">
            <div className="absolute inset-0 grid-lines opacity-30" />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 62.5" preserveAspectRatio="none" aria-hidden>
              {related.map((r, i) => {
                const a = (i / related.length) * Math.PI * 2 - Math.PI / 2;
                return <motion.line key={src.id + r.f.id} x1="50" y1="31.25" x2={50 + Math.cos(a) * 36} y2={31.25 + Math.sin(a) * 22} stroke="var(--cyan)" strokeOpacity={r.score / 140} strokeWidth="0.3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: i * 0.08 }} />;
              })}
            </svg>
            <motion.div key={src.id} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <span className="animate-pulse-ring rounded-2xl"><FileIcon kind={src.kind} className="h-14 w-14 glow-violet" /></span>
              <p className="mt-2 max-w-36 truncate text-xs font-semibold">{src.name}</p>
            </motion.div>
            {related.map((r, i) => {
              const a = (i / related.length) * Math.PI * 2 - Math.PI / 2;
              return (
                <motion.button key={src.id + r.f.id} onClick={() => setId(r.f.id)} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.08 }}
                  style={{ left: `${50 + Math.cos(a) * 36}%`, top: `${50 + Math.sin(a) * 35}%` }} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" aria-label={`Select ${r.f.name}`}>
                  <FileIcon kind={r.f.kind} className="h-10 w-10 border border-border" />
                  <span className="mt-1 rounded-full bg-popover px-1.5 font-mono text-[10px] text-cyan">{r.score}%</span>
                </motion.button>
              );
            })}
          </Glass>
          <div className="grid gap-3 md:grid-cols-2">
            {related.map((r, i) => (
              <motion.div key={src.id + r.f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass flex items-center gap-3 p-3">
                <FileIcon kind={r.f.kind} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.f.name}.{r.f.ext}</p><p className="text-xs text-muted-foreground">{formatBytes(r.f.size)} · {r.reason}</p><div className="mt-1"><CatTag c={r.f.category} /></div></div>
                <p className="font-display text-xl font-semibold text-gradient">{r.score}%</p>
              </motion.div>
            ))}
            {!related.length && <p className="text-sm text-muted-foreground">No related sample files found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
