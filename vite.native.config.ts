import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const nativeHtml = {
  name: "mushaf-native-html",
  enforce: "pre" as const,
  transformIndexHtml(html: string) {
    return html
      .replace(/\s*<meta name="(?:mobile-web-app-capable|apple-mobile-web-app-capable|apple-mobile-web-app-status-bar-style|apple-mobile-web-app-title)"[^>]*>/g, "")
      .replace(/\s*<link rel="manifest"[^>]*>/g, "")
      .replaceAll("/mushaf-companion/", "./");
  },
};

export default defineConfig({
  root: resolve(process.cwd(), "pages-static"),
  base: "./",
  publicDir: resolve(process.cwd(), "public"),
  resolve: {
    alias: [
      {
        find: "./content/runtime-transport",
        replacement: resolve(process.cwd(), "app/content/pages-runtime-transport.ts"),
      },
    ],
  },
  plugins: [nativeHtml, react()],
  define: {
    __MUSHAF_RUNTIME_MODE__: JSON.stringify("native"),
    __MUSHAF_RUNTIME_BASE_PATH__: JSON.stringify("/"),
  },
  build: {
    outDir: resolve(process.cwd(), "native-runtime"),
    emptyOutDir: true,
    sourcemap: false,
  },
});
