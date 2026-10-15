import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4";

function Logo() {
  return (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="none" aria-hidden>
      <path
        className="fill-muted-foreground"
        d="M 160 88 L 194 34 L 216 0 L 256 0 L 256 40 L 221.5 93.5 L 200 128 L 256 128 L 256 256 L 96 256 L 96 168 L 64.246 220 L 40 256 L 0 256 L 0 216 L 34 162 L 56 128 L 0 128 L 0 0 L 160 0 Z"
      />
    </svg>
  );
}

/** Opening hero with robot hand animation shown on load and refresh, before entering the dashboard. */
export function Intro() {
  // Always present robot hand animation on initial load and refresh
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // Listen for custom trigger to replay intro anytime
    const handleReplay = () => setOpen(true);
    window.addEventListener("replay-intro", handleReplay);
    return () => window.removeEventListener("replay-intro", handleReplay);
  }, []);

  const enter = () => {
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden bg-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={VIDEO}
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="relative z-10 flex min-h-screen flex-col justify-between">
            <nav className="flex items-center justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 22 }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pill shadow-xs sm:h-11 sm:w-11"
              >
                <Logo />
              </motion.div>
            </nav>

            <div className="flex items-end px-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-12 sm:pb-16 md:px-20 lg:px-28 lg:pb-20">
              <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                <button
                  onClick={enter}
                  className="group mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:opacity-80"
                >
                  <span className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
                  Smart Cloud Storage AI
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </button>
                <h1 className="mb-2.5 text-2xl font-semibold leading-[1.2] tracking-tight text-foreground sm:text-3xl md:text-4xl">
                  Your files, intelligently connected — by human and AI.
                </h1>
                <p className="mb-4 text-xs sm:text-sm text-muted-foreground">
                  Organize, search and discover your documents by meaning.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    onClick={enter}
                    className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-primary bg-primary/10 px-6 py-3 text-sm font-medium text-primary backdrop-blur-md transition-all duration-200 hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
                  >
                    Enter dashboard
                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
