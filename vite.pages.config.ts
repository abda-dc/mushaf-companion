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
  define: {
    __MUSHAF_RUNTIME_MODE__: JSON.stringify("pages"),
    __MUSHAF_RUNTIME_BASE_PATH__: JSON.stringify("/mushaf-companion/"),
  },
  build: {
    outDir: resolve(process.cwd(), "_site"),
    emptyOutDir: true,
    sourcemap: false,
  },
});
