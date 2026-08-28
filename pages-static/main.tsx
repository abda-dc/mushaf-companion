import { createRoot } from "react-dom/client";
import Home from "../app/page";
import { PwaRegister } from "../app/pwa-register";
import { configureReaderRuntime } from "../app/runtime-config";
import "../app/globals.css";

declare const __MUSHAF_RUNTIME_MODE__: "pages" | "native";
declare const __MUSHAF_RUNTIME_BASE_PATH__: string;

const runtimeMode = __MUSHAF_RUNTIME_MODE__;
configureReaderRuntime({ mode: runtimeMode, basePath: __MUSHAF_RUNTIME_BASE_PATH__ });

const root = document.getElementById("root");
if (!root) throw new Error("Mushaf Companion could not find its application root.");

createRoot(root).render(
  <>
    <Home />
    {runtimeMode === "pages" && <PwaRegister />}
  </>,
);
