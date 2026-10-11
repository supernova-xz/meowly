"use client";

import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const PwaRegister = dynamic(() => import("@/components/PwaRegister"), { ssr: false });
const DomainRedirectPopup = dynamic(() => import("@/components/DomainRedirectPopup"), { ssr: false });
const FlyingParticles = dynamic(() => import("@/components/FlyingParticles"), { ssr: false });
const ShortcutsHUD = dynamic(() => import("@/components/ShortcutsHUD"), { ssr: false });

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[role="button"][tabindex]:not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function ClientOnlyComponents() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userAgent = navigator.userAgent || "";
    const detectedTv = /Android TV|GoogleTV|Google TV|SMART-TV|HbbTV|AFT[A-Z0-9]*|BRAVIA/i.test(userAgent);
    let forcedTv = false;

    try {
      forcedTv = params.get("tv") === "1" || localStorage.getItem("meowly_tv_mode") === "1";
    } catch {
      forcedTv = params.get("tv") === "1";
    }

    if (!detectedTv && !forcedTv) return;

    document.documentElement.classList.add("tv-mode");
    try {
      localStorage.setItem("meowly_tv_mode", "1");
    } catch {
      // TV mode still works for this page if storage is disabled.
    }

    // TV remotes send arrow keys and Enter. Move focus by screen position so the
    // remote can navigate card grids and controls without a mouse.
    const handleRemoteKeys = (event: KeyboardEvent) => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;

      const target = event.target as HTMLElement | null;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      if (target?.closest("iframe")) return;

      const candidates = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none" &&
          el.getAttribute("aria-hidden") !== "true" && !el.closest("[inert]");
      });

      if (!candidates.length) return;

      const current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const currentRect = current?.getBoundingClientRect();
      const currentIsCandidate = current ? candidates.includes(current) : false;

      if (!currentIsCandidate || !currentRect) {
        const first = candidates.find((el) => {
          const r = el.getBoundingClientRect();
          return event.key === "ArrowDown" ? r.top >= 0 :
            event.key === "ArrowUp" ? r.bottom <= window.innerHeight :
            event.key === "ArrowRight" ? r.left >= 0 : r.right <= window.innerWidth;
        }) || candidates[0];
        event.preventDefault();
        first.focus({ preventScroll: false });
        first.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
        return;
      }

      const cx = currentRect.left + currentRect.width / 2;
      const cy = currentRect.top + currentRect.height / 2;
      const direction = event.key;
      let best: HTMLElement | null = null;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const candidate of candidates) {
        if (candidate === current) continue;
        const rect = candidate.getBoundingClientRect();
        const dx = rect.left + rect.width / 2 - cx;
        const dy = rect.top + rect.height / 2 - cy;
        const primary = direction === "ArrowRight" ? dx : direction === "ArrowLeft" ? -dx :
          direction === "ArrowDown" ? dy : -dy;
        if (primary <= 2) continue;
        const secondary = direction === "ArrowLeft" || direction === "ArrowRight" ? Math.abs(dy) : Math.abs(dx);
        const score = primary + secondary * 1.7 + secondary * secondary / Math.max(primary, 1) * 0.35;
        if (score < bestScore) {
          bestScore = score;
          best = candidate;
        }
      }

      if (best) {
        event.preventDefault();
        best.focus({ preventScroll: false });
        best.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      }
    };

    document.addEventListener("keydown", handleRemoteKeys, true);
    return () => {
      document.removeEventListener("keydown", handleRemoteKeys, true);
      document.documentElement.classList.remove("tv-mode");
    };
  }, []);

  return (
    <>
      <PwaRegister />
      <DomainRedirectPopup />
      <FlyingParticles />
      <ShortcutsHUD />
    </>
  );
}
