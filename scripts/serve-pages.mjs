import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

export function createPagesServer({ directory = resolve(process.cwd(), "_site"), basePath = "/mushaf-companion/" } = {}) {
  const root = resolve(directory);
  return createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://localhost");
    if (!url.pathname.startsWith(basePath)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    const relative = decodeURIComponent(url.pathname.slice(basePath.length));
    let file = resolve(root, relative || "index.html");
    if (file !== root && !file.startsWith(`${root}${sep}`)) {
      response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Invalid path");
      return;
    }
    let status = 200;
    try {
      const metadata = await stat(file);
      if (metadata.isDirectory()) file = resolve(file, "index.html");
    } catch {
      file = resolve(root, "404.html");
      status = 404;
    }
    response.writeHead(status, {
      "Cache-Control": "no-store",
      "Content-Type": CONTENT_TYPES[extname(file)] || "application/octet-stream",
      "Service-Worker-Allowed": basePath,
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(file).pipe(response);
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const server = createPagesServer();
  const port = Number(process.argv[2]) || 4173;
  server.listen(port, "127.0.0.1", () => {
    console.log(`Standalone Pages reader: http://127.0.0.1:${port}/mushaf-companion/`);
  });
}
