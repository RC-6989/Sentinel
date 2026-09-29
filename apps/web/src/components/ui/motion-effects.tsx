"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_SELECTOR = "[data-reveal]";

export function MotionEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const staggeredChildren = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal-stagger]"),
    ).flatMap((container) => Array.from(container.children) as HTMLElement[]);
    const elements = Array.from(new Set([
      ...document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR),
      ...staggeredChildren,
    ]));

    if (!elements.length) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    elements.forEach((element) => {
      const parentStagger = element.parentElement?.hasAttribute("data-reveal-stagger");
      const siblingIndex = parentStagger && element.parentElement
        ? Array.from(element.parentElement.children).indexOf(element)
        : 0;
      const delay = Number(element.dataset.revealDelay ?? (parentStagger ? siblingIndex * 55 : 0));
      element.style.setProperty("--reveal-delay", `${Math.max(0, delay)}ms`);
      element.classList.add("reveal-item");
    });

    if (reducedMotion) {
      elements.forEach((element) => element.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    const revealVisibleElements = () => elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.92 && rect.bottom >= 0) {
        element.classList.add("is-revealed");
        observer.unobserve(element);
      } else {
        observer.observe(element);
      }
    });

    revealVisibleElements();
    const navigationCheck = window.setTimeout(revealVisibleElements, 350);
    window.addEventListener("hashchange", revealVisibleElements);

    return () => {
      window.clearTimeout(navigationCheck);
      window.removeEventListener("hashchange", revealVisibleElements);
      observer.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      document.documentElement.style.setProperty("--scroll-progress", String(progress));
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const cleanups: Array<() => void> = [];

    if (!reducedMotion && finePointer) {
      document.querySelectorAll<HTMLElement>(".button-magnetic").forEach((element) => {
        const onMove = (event: PointerEvent) => {
          const rect = element.getBoundingClientRect();
          element.style.setProperty("--magnetic-x", `${(event.clientX - rect.left - rect.width / 2) * 0.09}px`);
          element.style.setProperty("--magnetic-y", `${(event.clientY - rect.top - rect.height / 2) * 0.12}px`);
        };
        const onLeave = () => {
          element.style.setProperty("--magnetic-x", "0px");
          element.style.setProperty("--magnetic-y", "0px");
        };
        element.addEventListener("pointermove", onMove);
        element.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          element.removeEventListener("pointermove", onMove);
          element.removeEventListener("pointerleave", onLeave);
        });
      });

      document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((element) => {
        const onMove = (event: PointerEvent) => {
          const rect = element.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          element.style.setProperty("--tilt-x", `${y * -2.2}deg`);
          element.style.setProperty("--tilt-y", `${x * 2.2}deg`);
        };
        const onLeave = () => {
          element.style.setProperty("--tilt-x", "0deg");
          element.style.setProperty("--tilt-y", "0deg");
        };
        element.addEventListener("pointermove", onMove);
        element.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          element.removeEventListener("pointermove", onMove);
          element.removeEventListener("pointerleave", onLeave);
        });
      });
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [pathname]);

  return <div className="scroll-progress" aria-hidden="true" />;
}
