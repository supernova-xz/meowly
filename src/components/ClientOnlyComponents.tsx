"use client";

import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const PwaRegister = dynamic(() => import("@/components/PwaRegister"), { ssr: false });
const DomainRedirectPopup = dynamic(() => import("@/components/DomainRedirectPopup"), { ssr: false });
const FlyingParticles = dynamic(() => import("@/components/FlyingParticles"), { ssr: false });
const ShortcutsHUD = dynamic(() => import("@/components/ShortcutsHUD"), { ssr: false });

export default function ClientOnlyComponents() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userAgent = navigator.userAgent || "";
    const detectedTv = /Android TV|GoogleTV|Google TV|SMART-TV|HbbTV|AFT[A-Z0-9]*|BRAVIA/i.test(userAgent);
    const forcedTv = params.get("tv") === "1" || localStorage.getItem("meowly_tv_mode") === "1";

    if (detectedTv || forcedTv) {
      document.documentElement.classList.add("tv-mode");
      localStorage.setItem("meowly_tv_mode", "1");
    }

    // Optional remote-friendly toggle for devices whose WebView hides the TV model:
    // open the site with ?tv=1 once; the preference is saved on that device.
    return () => {
      // Keep the class across client-side route changes; this component is mounted globally.
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
