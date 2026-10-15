import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [visible, setVisible] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth springs for trailing aura ring (relatable to UI's fluid spring motions)
  const springX = useSpring(mouseX, { stiffness: 420, damping: 28 });
  const springY = useSpring(mouseY, { stiffness: 420, damping: 28 });

  useEffect(() => {
    // Only enable on devices with fine pointer (mouse or trackpad)
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }
    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visible) setVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const isClickable = Boolean(
          target.closest(
            "button, a, input, select, textarea, [role='button'], .glass-hover, .option-link, .activity-option, label, [data-clickable]"
          )
        );
        setHovered(isClickable);
      }
    };

    const onMouseDown = () => setClicked(true);
    const onMouseUp = () => setClicked(false);
    const onMouseLeave = () => setVisible(false);
    const onMouseEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, [mouseX, mouseY, visible]);

  if (!enabled || !visible) return null;

  return (
    <div className="hidden lg:block pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none">
      {/* Outer fluid aura ring with aurora gradient border and subtle glow */}
      <motion.div
        className="fixed top-0 left-0 rounded-full"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: hovered ? 46 : 26,
          height: hovered ? 46 : 26,
          scale: clicked ? 0.82 : 1,
          backgroundColor: hovered
            ? "color-mix(in oklab, var(--violet) 18%, transparent)"
            : "color-mix(in oklab, var(--cyan) 8%, transparent)",
          borderColor: hovered
            ? "color-mix(in oklab, var(--violet) 80%, transparent)"
            : "color-mix(in oklab, var(--cyan) 45%, transparent)",
          boxShadow: hovered
            ? "0 0 22px 2px color-mix(in oklab, var(--violet) 45%, transparent), 0 0 10px 0 color-mix(in oklab, var(--cyan) 35%, transparent)"
            : "0 0 12px -2px color-mix(in oklab, var(--cyan) 30%, transparent)",
        }}
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 26,
        }}
        initial={false}
      >
        <div className="h-full w-full rounded-full border border-current opacity-90" />
      </motion.div>

      {/* Inner precision core dot with Aurora gradient */}
      <motion.div
        className="fixed top-0 left-0 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet via-cyan to-success shadow-xs"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: hovered ? 1.6 : clicked ? 0.6 : 1,
          opacity: hovered ? 0.95 : 1,
        }}
        transition={{ duration: 0.12 }}
      />
    </div>
  );
}
