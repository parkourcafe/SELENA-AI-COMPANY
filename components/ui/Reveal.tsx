"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Мягкое появление блока при скролле. Уважает prefers-reduced-motion:
 * в этом случае CSS-класс .reveal не анимируется (см. globals.css),
 * а контент виден сразу — включая среды без JS/IntersectionObserver.
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
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
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
