import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, Brain, Copy, Database, DownloadCloud, Pencil, Search, Trash2, UploadCloud } from "lucide-react";
import { useState } from "react";
import { Empty, PageHeader } from "@/components/app/kit";
import { useDemo } from "@/lib/demo-store";
import { meta } from "@/lib/meta";
import type { ActivityItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/activity")({
  head: () => meta("Recent Activity", "Timeline of uploads, searches, classifications and clean-ups in the demo."),
  component: ActivityPage,
});

const ICON: Record<string, typeof Activity> = {
  upload: UploadCloud,
  classify: Brain,
  search: Search,
  duplicate: Copy,
  rename: Pencil,
  remove: Trash2,
  delete: Trash2,
  download: DownloadCloud,
  index: Database,
};

const TYPES = ["all", "upload", "classify", "search", "duplicate", "rename", "remove", "download", "index"] as const;

function ActivityPage() {
  const { activity } = useDemo();
  const [t, setT] = useState<string>("all");
  const list = activity.filter((a) => t === "all" || a.type === t);

  return (
    <div>
      <PageHeader eyebrow="Timeline" title="Recent Activity" desc="Everything you've done in this demo session, plus a few sample events." />
      <div className="mb-6 flex flex-wrap gap-2">
        {TYPES.map((x) => (
          <button
            key={x}
            onClick={() => setT(x)}
            aria-pressed={t === x}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs capitalize transition-colors",
              t === x ? "border-violet bg-violet/20 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {x}
          </button>
        ))}
      </div>
      {!list.length ? (
        <Empty icon={Activity} title="No activity" desc="Nothing of this type yet." />
      ) : (
        <ol className="glass space-y-1 p-3">
          {list.map((a, i) => {
            const I = ICON[a.type] || Activity;
            const formattedDate = (() => {
              try {
                return new Date(a.date).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                });
              } catch {
                return a.date;
              }
            })();

            return (
              <motion.li
                key={`${a.id || "act"}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.5) }}
                className="flex items-center gap-4 rounded-xl p-3 hover:bg-accent/40"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet/12 text-violet">
                  <I className="h-5 w-5" />
                </span>
                <p className="flex-1 text-sm">{a.text}</p>
                <time className="text-xs text-muted-foreground">{formattedDate}</time>
              </motion.li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
