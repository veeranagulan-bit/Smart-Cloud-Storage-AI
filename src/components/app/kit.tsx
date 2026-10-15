import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { FileArchive, FileAudio, FileCode, FileImage, FileSpreadsheet, FileText, FileVideo, File as FileIc, FlaskConical } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Category, FileKind } from "@/lib/mock-data";

export const btn = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  {
    variants: {
      variant: {
        primary: "bg-aurora text-primary-foreground glow-violet hover:brightness-110 hover:-translate-y-0.5",
        ghost: "border border-border bg-glass text-foreground backdrop-blur hover:border-violet/50 hover:bg-accent",
        subtle: "text-muted-foreground hover:text-foreground hover:bg-accent",
        danger: "bg-destructive text-destructive-foreground hover:brightness-110",
      },
      size: { sm: "h-8 px-3 text-xs", md: "h-10 px-5", lg: "h-12 px-7 text-base", icon: "h-10 w-10" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export const Btn = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof btn>>(
  ({ className, variant, size, ...p }, ref) => <button ref={ref} className={cn(btn({ variant, size }), className)} {...p} />,
);
Btn.displayName = "Btn";

export function Glass({ className, children, delay = 0 }: { className?: string; children: ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("glass p-5", className)}
    >
      {children}
    </motion.section>
  );
}

export function DemoBadge({ label = "Demo data" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-warning">
      <FlaskConical className="h-3 w-3" aria-hidden /> {label}
    </span>
  );
}

export function PageHeader({ eyebrow, title, desc, actions }: { eyebrow: string; title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 sm:mb-6 flex flex-wrap items-end justify-between gap-3 sm:gap-4">
      <div>
        <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-cyan">{eyebrow}</p>
        <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-semibold">{title}</h1>
        {desc && <p className="mt-1.5 sm:mt-2 max-w-2xl text-xs sm:text-sm text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const KIND_ICON: Record<FileKind, typeof FileText> = {
  document: FileText, image: FileImage, video: FileVideo, audio: FileAudio, archive: FileArchive, code: FileCode, spreadsheet: FileSpreadsheet, other: FileIc,
};
const KIND_TONE: Record<FileKind, string> = {
  document: "text-violet bg-violet/12", image: "text-cyan bg-cyan/12", video: "text-chart-4 bg-chart-4/12", audio: "text-warning bg-warning/12",
  archive: "text-muted-foreground bg-muted", code: "text-success bg-success/12", spreadsheet: "text-success bg-success/12", other: "text-muted-foreground bg-muted",
};

export function FileIcon({ kind, className }: { kind: FileKind; className?: string }) {
  const I = KIND_ICON[kind];
  return (
    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", KIND_TONE[kind], className)}>
      <I className="h-5 w-5" aria-hidden />
    </span>
  );
}

export function CatTag({ c }: { c: Category }) {
  return <span className="rounded-full border border-violet/25 bg-violet/10 px-2 py-0.5 text-[11px] font-medium text-violet">{c}</span>;
}

export function Empty({ icon: I, title, desc, action }: { icon: typeof FileText; title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet/10 text-violet"><I className="h-6 w-6" /></span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-muted", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div className="h-full rounded-full bg-aurora" animate={{ width: `${value}%` }} transition={{ ease: "easeOut" }} />
    </div>
  );
}
