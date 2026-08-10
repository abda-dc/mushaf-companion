import { createRoot } from "react-dom/client";
import Home from "../app/page";
import { PwaRegister } from "../app/pwa-register";
import { configureReaderRuntime } from "../app/runtime-config";
import "../app/globals.css";

configureReaderRuntime({ mode: "pages", basePath: "/mushaf-companion/" });

const root = document.getElementById("root");
if (!root) throw new Error("Mushaf Companion could not find its application root.");

createRoot(root).render(
  <>
    <Home />
    <PwaRegister />
  </>,
);
