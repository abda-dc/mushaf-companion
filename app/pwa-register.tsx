"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloading = false;
    const handleControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.warn("Mushaf Companion service worker registration failed", error);
    });

    return () => navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
  }, []);

  return null;
}
