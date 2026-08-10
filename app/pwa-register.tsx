"use client";

import { useEffect } from "react";
import { appPath } from "./runtime-config";

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
    navigator.serviceWorker.register(appPath("sw.js"), { scope: appPath(), updateViaCache: "none" }).catch((error) => {
      console.warn("Mushaf Companion service worker registration failed", error);
    });

    return () => navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
  }, []);

  return null;
}
