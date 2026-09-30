"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PhoneScrollHero({
  titleComponent,
  children,
  overlap = 20,
  tilt = 22,
  className,
}: {
  titleComponent: ReactNode;
  children?: ReactNode;
  overlap?: number;
  tilt?: number;
  className?: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      setStill(true);
      return;
    }
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, -rect.top / travel)));
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const rotateX = still ? 0 : tilt * (1 - progress);
  const scale = still ? 1 : 0.94 + 0.06 * progress;
  const titleY = still ? 0 : -24 * progress;
  const phoneY = still ? "0%" : `-${overlap * progress}%`;

  return (
    <section
      ref={sectionRef}
      aria-label="Hero"
      className={cn(
        "relative flex h-auto w-full items-start justify-center overflow-hidden px-2 pb-8 pt-2 md:px-8 md:pb-8",
        className
      )}
    >
      <div className="w-full" style={{ perspective: "1200px" }}>
        <div
          style={{ transform: `translateY(${titleY}px)` }}
          className="relative z-0 mx-auto max-w-5xl px-4 text-center"
        >
          {titleComponent}
        </div>
        <div
          style={{
            transform: `translateY(${phoneY}) rotateX(${rotateX}deg) scale(${scale})`,
            transformOrigin: "center top",
          }}
          className="relative z-10 -mt-2 md:-mt-6"
        >
          <PhoneFrame>{children}</PhoneFrame>
        </div>
      </div>
    </section>
  );
}

function PhoneFrame({ children }: { children?: ReactNode }) {
  return (
    <div className="relative mx-auto w-[13rem] sm:w-[15rem] md:w-[17rem]">
      <span
        aria-hidden
        className="absolute -left-[2px] top-[16%] h-7 w-[3px] rounded-l-sm bg-neutral-400/40"
      />
      <span
        aria-hidden
        className="absolute -left-[2px] top-[24%] h-11 w-[3px] rounded-l-sm bg-neutral-400/40"
      />
      <span
        aria-hidden
        className="absolute -right-[2px] top-[22%] h-14 w-[3px] rounded-r-sm bg-neutral-400/40"
      />
      <div className="aspect-[9/19.5] rounded-[2.5rem] border border-neutral-300 bg-neutral-200 p-[0.35rem] shadow-[0_10px_20px_rgba(0,0,0,0.18),0_40px_60px_-20px_rgba(0,0,0,0.35)]">
        <div className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-brand-paper ring-1 ring-inset ring-neutral-200">
          <div
            aria-hidden
            className="absolute left-1/2 top-2 z-10 h-[1.1rem] w-[4.25rem] -translate-x-1/2 rounded-full bg-black"
          />
          {children}
        </div>
      </div>
    </div>
  );
}
