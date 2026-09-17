"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ScrollMotionProps = {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  axis?: "x" | "y";
};

export function ScrollMotion({ children, className, speed = 24, axis = "y" }: ScrollMotionProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 767px)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const range = viewportCenter + rect.height / 2;
      const progress = Math.max(-1, Math.min(1, (viewportCenter - elementCenter) / range));
      const offset = progress * speed;
      node.style.setProperty("--scroll-motion-x", axis === "x" ? `${offset}px` : "0px");
      node.style.setProperty("--scroll-motion-y", axis === "y" ? `${offset}px` : "0px");
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [axis, speed]);

  return <div ref={ref} className={cn("scroll-motion", className)}>{children}</div>;
}
