import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Briefcase, FileText, GraduationCap, Image, LineChart, Shapes, Sparkles } from "lucide-react";
import { useState } from "react";
import { Btn, CatTag, DemoBadge, FileIcon, Glass, PageHeader, Progress } from "@/components/app/kit";
import { useDemo } from "@/lib/demo-store";
import { meta } from "@/lib/meta";
import { CATEGORIES, demoScore, guessCategory, type Category, type DemoFile } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

import { api } from "@/lib/api";

export const Route = createFileRoute("/classify")({
  head: () => meta("AI Classification", "AI scanner automatically classifies files into categories using Scikit-Learn."),
  component: ClassifyPage,
});

const CAT_ICON: Record<Category, typeof FileText> = { Documents: FileText, Images: Image, Educational: GraduationCap, Business: Briefcase, Reports: LineChart, Others: Shapes };

function ClassifyPage() {
  const { files, log, liveMode, reload } = useDemo();
  const [sel, setSel] = useState<DemoFile | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ cat: Category; conf: number } | null>(null);
  const [done, setDone] = useState<Record<string, Category>>({});
  const queue = files.slice(0, 10);

  const run = async (f: DemoFile) => {
    setSel(f); setResult(null); setProgress(0);

    if (liveMode) {
      let p = 0;
      const t = window.setInterval(() => {
        p += 15;
        setProgress(Math.min(p, 90));
      }, 100);

      try {
        const res = await api.files.classify(f.id);
        clearInterval(t);
        setProgress(100);
        setResult({ cat: res.category, conf: res.confidence });
        setDone((d) => ({ ...d, [f.id]: res.category }));
        await reload();
        return;
      } catch (err) {
        clearInterval(t);
        console.error("Classification error:", err);
      }
    }

    let p = 0;
    const t = window.setInterval(() => {
      p += 6 + Math.random() * 8; setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(t);
        const cat = guessCategory(f.name, f.kind);
        setResult({ cat, conf: demoScore(f.id + "c", 78, 97) });
        setDone((d) => ({ ...d, [f.id]: cat }));
        log("classify", `Classification: ${f.name} → ${cat}`);
      }
    }, 120);
  };

  return (
    <div>
      <PageHeader eyebrow="Auto-organize" title="AI File Classification" desc="Automated machine learning classification into Educational, Financial, Business, Reports, Documents, and Media categories with calibrated confidence." actions={<DemoBadge label={liveMode ? "Scikit-Learn Classifier" : "Demo mode"} />} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {CATEGORIES.map((c, i) => {
          const I = CAT_ICON[c];
          const active = result?.cat === c;
          return (
            <motion.div key={c} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, scale: active ? 1.06 : 1 }} transition={{ delay: i * 0.05 }} className={cn("glass p-4 text-center", active && "border-cyan glow-cyan")}>
              <I className={cn("mx-auto h-6 w-6", active ? "text-cyan" : "text-violet")} />
              <p className="mt-2 text-sm font-medium">{c}</p>
              <p className="text-xs text-muted-foreground">{files.filter((f) => f.category === c).length} files</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Glass>
          <h2 className="mb-3 font-semibold">Waiting for classification</h2>
          <ul className="space-y-2">
            {queue.map((f) => (
              <li key={f.id}>
                <button onClick={() => run(f)} className={cn("flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors hover:border-violet/50", sel?.id === f.id ? "border-violet/60 bg-violet/10" : "border-border")}>
                  <FileIcon kind={f.kind} className="h-8 w-8" />
                  <span className="flex-1 truncate text-sm">{f.name}.{f.ext}</span>
                  {done[f.id] ? <CatTag c={done[f.id]!} /> : <span className="text-xs text-muted-foreground">Pending</span>}
                </button>
              </li>
            ))}
          </ul>
        </Glass>

        <Glass className="relative min-h-80 overflow-hidden">
          <div className="absolute inset-0 grid-lines opacity-30" />
          {!sel ? (
            <div className="relative grid h-full min-h-72 place-items-center text-center"><div><Brain className="mx-auto h-10 w-10 text-violet" /><p className="mt-3 text-sm text-muted-foreground">Select a file to start the scanner.</p></div></div>
          ) : (
            <div className="relative">
              <div className="relative mx-auto mt-4 grid h-44 w-36 place-items-center overflow-hidden rounded-2xl border border-violet/40 bg-accent/40">
                <FileIcon kind={sel.kind} className="h-16 w-16" />
                {!result && <div className="absolute inset-x-0 h-10 animate-scan bg-gradient-to-b from-transparent via-cyan/50 to-transparent" />}
              </div>
              <p className="mt-4 text-center font-medium">{sel.name}.{sel.ext}</p>
              <Progress value={progress} className="mx-auto mt-4 max-w-sm" />
              <AnimatePresence>
                {result && (
                  <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="mt-6 text-center">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Predicted category (demo)</p>
                    <p className="mt-1 flex items-center justify-center gap-2 font-display text-3xl font-semibold text-gradient"><Sparkles className="h-6 w-6 text-cyan" />{result.cat}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Illustrative confidence: {result.conf}%</p>
                    <Btn className="mt-4" variant="ghost" size="sm" onClick={() => run(sel)}>Run again</Btn>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </Glass>
      </div>

      <Glass className="mt-6 overflow-x-auto">
        <h2 className="mb-3 font-semibold">Classified files</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-2">Filename</th><th className="p-2">Type</th><th className="p-2">Predicted category</th></tr></thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.id} className="border-t border-border"><td className="p-2">{f.name}</td><td className="p-2 text-muted-foreground">.{f.ext}</td><td className="p-2"><CatTag c={done[f.id] ?? f.category} /></td></tr>
            ))}
          </tbody>
        </table>
      </Glass>
    </div>
  );
}
