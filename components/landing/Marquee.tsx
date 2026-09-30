import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Marquee({
  children,
  pauseOnHover = false,
  direction = "left",
  speed = 18,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  pauseOnHover?: boolean;
  direction?: "left" | "right";
  speed?: number;
}) {
  return (
    <div className={cn("z-10 w-full overflow-hidden", className)} {...props}>
      <div className="relative flex overflow-hidden py-3">
        <div
          className={cn(
            "flex w-max animate-marquee",
            pauseOnHover && "hover:[animation-play-state:paused]",
            direction === "right" && "animate-marquee-reverse"
          )}
          style={{ "--duration": `${speed}s` } as CSSProperties}
        >
          <div className="flex shrink-0">{children}</div>
          <div className="flex shrink-0" aria-hidden>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
