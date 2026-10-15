import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useMemo, type PointerEvent } from "react";
import human from "@/assets/hand-human.png";
import robot from "@/assets/hand-robot.png";

/** Human & robot hands reaching toward an AI aura — layered parallax animation. */
export function HeroHands({ className = "" }: { className?: string }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const lx = useTransform(sx, (v) => v * -18);
  const rx = useTransform(sx, (v) => v * 18);
  const ly = useTransform(sy, (v) => v * -10);
  const ry = useTransform(sy, (v) => v * 10);
  const auraX = useTransform(sx, (v) => v * 8);

  const particles = useMemo(
    () => Array.from({ length: 34 }, (_, i) => ({
      id: i,
      x: Math.round((50 + Math.cos(i * 2.4) * (12 + (i % 7) * 5)) * 100) / 100,
      y: Math.round((50 + Math.sin(i * 2.4) * (10 + (i % 5) * 6)) * 100) / 100,
      s: 2 + (i % 3),
      d: 3 + (i % 5),
      cyan: i % 2 === 0,
    })),
    [],
  );

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <div
      className={`relative overflow-hidden select-none touch-none ${className}`}
      onPointerMove={onMove}
      onPointerLeave={() => { mx.set(0); my.set(0); }}
      aria-hidden
    >
      {/* aura */}
      <motion.div style={{ x: auraX }} className="pointer-events-none absolute left-1/2 top-1/2 h-[min(72%,22rem)] aspect-square -translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-0 rounded-full bg-aurora opacity-25 blur-3xl" />
        <div className="absolute inset-[12%] animate-spin-slow rounded-full border-2 border-violet/40 [border-top-color:var(--cyan)] blur-[1px]" />
        <div className="absolute inset-[30%] rounded-full bg-cyan/20 blur-2xl" />
        <div className="absolute inset-[44%] animate-pulse-ring rounded-full border border-cyan/70" />
        <motion.div
          className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan glow-cyan"
          animate={{ scale: [1, 1.8, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
      </motion.div>

      {/* particles */}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className={`pointer-events-none absolute rounded-full ${p.cyan ? "bg-cyan" : "bg-violet"}`}
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s }}
          animate={{ y: [0, -14, 0], opacity: [0.15, 0.9, 0.15] }}
          transition={{ duration: p.d, repeat: Infinity, delay: p.id * 0.13 }}
        />
      ))}

      {/* energy line between fingertips */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="beam" x1="0" x2="1">
            <stop offset="0" stopColor="var(--violet)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--cyan)" stopOpacity="1" />
            <stop offset="1" stopColor="var(--violet)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M40 47 Q50 43 60 47"
          stroke="url(#beam)" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke"
          style={{ strokeWidth: 2 }}
          animate={{ pathLength: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>

      {/* human hand — enters from left */}
      <motion.div style={{ x: lx, y: ly }} className="pointer-events-none absolute left-0 top-1/2 w-[62%] sm:w-[58%] -translate-y-[58%]">
        <motion.img
          src={human} width={1280} height={768} alt=""
          initial={{ x: "-40%", opacity: 0 }}
          animate={{ x: ["-6%", "-2%", "-6%"], y: [0, -8, 0], rotate: [0, -1.2, 0], opacity: 1 }}
          transition={{ x: { duration: 7, repeat: Infinity, ease: "easeInOut" }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 8, repeat: Infinity }, opacity: { duration: 1.2 } }}
          className="w-full select-none drop-shadow-[0_0_30px_color-mix(in_oklab,var(--violet)_50%,transparent)]"
          draggable={false}
        />
      </motion.div>

      {/* robot hand — enters from right */}
      <motion.div style={{ x: rx, y: ry }} className="pointer-events-none absolute right-0 top-1/2 w-[62%] sm:w-[58%] -translate-y-[50%]">
        <motion.img
          src={robot} width={1280} height={768} alt=""
          initial={{ x: "40%", opacity: 0 }}
          animate={{ x: ["6%", "2%", "6%"], y: [0, 8, 0], rotate: [0, 1.2, 0], opacity: 1 }}
          transition={{ x: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.4 }, y: { duration: 6.5, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 8, repeat: Infinity }, opacity: { duration: 1.2, delay: 0.2 } }}
          className="w-full select-none drop-shadow-[0_0_30px_color-mix(in_oklab,var(--cyan)_45%,transparent)]"
          draggable={false}
        />
      </motion.div>
    </div>
  );
}
