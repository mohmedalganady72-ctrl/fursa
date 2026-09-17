"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type RevealVariant = "up" | "fade" | "start" | "end" | "scale";

const hiddenVariants: Record<RevealVariant, string> = {
  up: "translate-y-14 opacity-0 blur-[3px]",
  fade: "opacity-0 blur-[3px]",
  start: "translate-x-14 opacity-0 blur-[3px] rtl:-translate-x-14",
  end: "-translate-x-14 opacity-0 blur-[3px] rtl:translate-x-14",
  scale: "scale-[0.93] opacity-0 blur-[3px]",
};

export function ScrollReveal({ children, className, delay = 0, variant = "up" }: { children: React.ReactNode; className?: string; delay?: number; variant?: RevealVariant }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => { const node = ref.current; if (!node) return; const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) { setVisible(true); observer.disconnect(); } }, { threshold: 0.12 }); observer.observe(node); return () => observer.disconnect(); }, []);
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={cn("transition-[opacity,transform,filter] duration-1000 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:blur-0", hiddenVariants[variant], visible && "translate-x-0 translate-y-0 scale-100 opacity-100 blur-0", className)}>{children}</div>;
}
