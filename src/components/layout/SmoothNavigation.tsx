"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function animateScroll(targetY: number, duration = 850) {
  const startY = window.scrollY;
  const distance = targetY - startY;
  const startedAt = performance.now();

  function easeInOutCubic(progress: number) {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  function frame(now: number) {
    const progress = Math.min((now - startedAt) / duration, 1);
    window.scrollTo(0, startY + distance * easeInOutCubic(progress));
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (!id) return;
  const element = document.getElementById(id);
  if (!element) return;

  const headerOffset = 96;
  const targetY = element.getBoundingClientRect().top + window.scrollY - headerOffset;
  animateScroll(Math.max(0, targetY));
}

export function SmoothNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || !url.hash || url.pathname !== window.location.pathname) return;

      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;

      event.preventDefault();
      history.pushState(null, "", url.hash);
      scrollToHash(url.hash);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (!window.location.hash) return;
    const timer = window.setTimeout(() => scrollToHash(window.location.hash), 120);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
