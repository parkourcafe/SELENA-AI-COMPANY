"use client";

import { useEffect, useRef } from "react";

export function CursorAura() {
  const auraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const aura = auraRef.current;
    if (!aura) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    if (reduceMotion.matches || coarsePointer.matches) return;

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let auraX = pointerX;
    let auraY = pointerY;
    let raf = 0;

    const move = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      aura.style.opacity = "1";
    };

    const tick = () => {
      auraX += (pointerX - auraX) * 0.08;
      auraY += (pointerY - auraY) * 0.08;
      aura.style.transform = `translate3d(${auraX}px, ${auraY}px, 0)`;
      raf = window.requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", move, { passive: true });
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", move);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={auraRef} className="cursor-aura" aria-hidden="true" />;
}
