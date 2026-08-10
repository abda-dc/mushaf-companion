import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve(process.cwd(), "pages-static"),
  base: "/mushaf-companion/",
  publicDir: resolve(process.cwd(), "public"),
  resolve: {
    alias: [
      {
        find: "./content/runtime-transport",
        replacement: resolve(process.cwd(), "app/content/pages-runtime-transport.ts"),
      },
    ],
  },
  plugins: [react()],
  build: {
    outDir: resolve(process.cwd(), "_site"),
    emptyOutDir: true,
    sourcemap: false,
  },
});
