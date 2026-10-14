import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SearchX, Sparkles } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Btn, CatTag, DemoBadge, Empty, FileIcon, PageHeader } from "@/components/app/kit";
import { useDemo } from "@/lib/demo-store";
import { meta } from "@/lib/meta";
import { CATEGORIES, demoSearch, formatBytes, formatDate, type FileKind } from "@/lib/mock-data";

import { api } from "@/lib/api";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({ q: typeof s["q"] === "string" ? s["q"] : undefined }),
  head: () => meta("Semantic Search", "Search your files in plain language with dense vector semantic search."),
  component: SearchPage,
});

const EXAMPLES = ["Find my college project reports", "Show documents about machine learning", "Quarterly revenue analysis", "Vacation photos from the beach"];

function SearchPage() {
  const { q: initial } = Route.useSearch();
  const navigate = useNavigate();
  const { files, log, liveMode } = useDemo();
  const [q, setQ] = useState(initial ?? "");
  const [state, setState] = useState<"empty" | "loading" | "done">("empty");
  const [results, setResults] = useState<{ file: any; score: number }[]>([]);
  const [kind, setKind] = useState<string>("all");
  const [cat, setCat] = useState<string>("all");
  const [days, setDays] = useState<string>("all");

  const run = async (query: string) => {
    if (!query.trim()) return;
    setState("loading");
    log("search", `Searched “${query}”`);

    if (liveMode) {
      try {
        const res = await api.search.query({ q: query, kind, category: cat, days });
        setResults(res.results.map((r) => ({ file: r.file, score: r.score })));
        setState("done");
        return;
      } catch (err) {
        console.error("Semantic search backend error:", err);
      }
    }

    // Fallback simulation
    window.setTimeout(() => { setResults(demoSearch(files, query)); setState("done"); }, 800);
  };

  useEffect(() => { if (initial) { setQ(initial); run(initial); } }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e: FormEvent) => { e.preventDefault(); navigate({ to: "/search", search: { q: q.trim() } }); if (q.trim() === initial) run(q); };
  const now = Date.now();
  const filtered = results.filter(({ file: f }) =>
    (kind === "all" || f.kind === (kind as FileKind)) && (cat === "all" || f.category === cat) && (days === "all" || now - new Date(f.date).getTime() < +days * 86400000));

  return (
    <div>
      <PageHeader eyebrow="Find by meaning" title="AI Semantic Search" desc="Natural language search powered by 384-dimensional dense sentence embeddings and cosine similarity across your library content." actions={<DemoBadge label={liveMode ? "Dense Vector Search" : "Demo ranking"} />} />
      <form onSubmit={submit} className="group relative">
        <motion.div className="absolute -inset-0.5 rounded-3xl bg-aurora opacity-30 blur-md transition-opacity group-focus-within:opacity-80" />
        <div className="relative flex items-center gap-3 rounded-3xl border border-border bg-popover p-2 pl-5">
          <Sparkles className="h-5 w-5 shrink-0 text-cyan" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Show documents about machine learning" aria-label="Semantic search query" className="h-12 flex-1 bg-transparent text-lg outline-none" />
          <Btn type="submit" size="lg"><Search className="h-5 w-5" /> <span className="hidden sm:inline">Search</span></Btn>
        </div>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((e) => <button key={e} onClick={() => { setQ(e); navigate({ to: "/search", search: { q: e } }); }} className="rounded-full border border-border bg-glass px-3 py-1.5 text-xs text-muted-foreground hover:border-violet/50 hover:text-foreground">{e}</button>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="File type" className="h-9 rounded-full border border-border bg-popover px-3">
          <option value="all">All types</option>{["document", "image", "video", "audio", "spreadsheet", "code", "archive"].map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" className="h-9 rounded-full border border-border bg-popover px-3">
          <option value="all">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={days} onChange={(e) => setDays(e.target.value)} aria-label="Date" className="h-9 rounded-full border border-border bg-popover px-3">
          <option value="all">Any date</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
        </select>
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {state === "empty" && <motion.div key="e" exit={{ opacity: 0 }}><Empty icon={Search} title="Ask in plain language" desc="Try one of the example queries above to see the demo search experience." /></motion.div>}
          {state === "loading" && (
            <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass relative h-56 overflow-hidden">
              <div className="absolute inset-0 grid-lines opacity-40" />
              <div className="absolute inset-x-0 h-20 animate-scan bg-gradient-to-b from-transparent via-violet/30 to-transparent" />
              <div className="relative grid h-full place-items-center text-center"><div><Sparkles className="mx-auto h-8 w-8 animate-pulse text-cyan" /><p className="mt-3 text-sm text-muted-foreground">Scanning sample index…</p></div></div>
            </motion.div>
          )}
          {state === "done" && (filtered.length === 0 ? (
            <motion.div key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Empty icon={SearchX} title="No matches" desc="No sample files match that query and filters. Try different words." /></motion.div>
          ) : (
            <motion.div key="r" className="grid gap-4 md:grid-cols-2">
              <p className="text-sm text-muted-foreground md:col-span-2">{filtered.length} demo result(s) — relevance scores are illustrative.</p>
              {filtered.map(({ file: f, score }, i) => (
                <motion.div key={f.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="glass glass-hover flex items-center gap-4 p-4">
                  <FileIcon kind={f.kind} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{f.name}.{f.ext}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(f.size)} · {formatDate(f.date)}</p>
                    <div className="mt-2"><CatTag c={f.category} /></div>
                  </div>
                  <div className="text-right"><p className="font-display text-2xl font-semibold text-gradient">{score}%</p><p className="text-[10px] uppercase text-muted-foreground">match</p></div>
                </motion.div>
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
