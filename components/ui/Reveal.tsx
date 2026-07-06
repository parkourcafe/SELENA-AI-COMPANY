"use client";

import { useEffect, useRef } from "react";

/**
 * Мягкое появление блока при скролле. Уважает prefers-reduced-motion:
 * скрытое состояние .reveal действует только при включённом JS
 * (см. globals.css), поэтому без JS контент виден сразу.
 */
export default function Reveal({
  className = "",
  delay = 0,
  as: Tag = "div",
  children,
}: {
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "span";
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add("is-visible");
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`reveal ${className}`}
      style={
        delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined
      }
    >
      {children}
    </Tag>
  );
}
