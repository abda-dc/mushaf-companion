export type ReaderRuntimeMode = "server" | "pages";

export interface ReaderRuntimeConfig {
  mode: ReaderRuntimeMode;
  basePath: string;
}
const DEFAULT_CONFIG: ReaderRuntimeConfig = Object.freeze({ mode: "server", basePath: "/" });
let configuredRuntime: ReaderRuntimeConfig = DEFAULT_CONFIG;

export function normalizeBasePath(value: string): string {
  const trimmed = String(value || "/").trim();
  if (!trimmed || trimmed === "/") return "/";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}/`;
}

export function configureReaderRuntime(config: ReaderRuntimeConfig): ReaderRuntimeConfig {
  configuredRuntime = Object.freeze({ mode: config.mode, basePath: normalizeBasePath(config.basePath) });
  return configuredRuntime;
}

export function getReaderRuntimeConfig(): ReaderRuntimeConfig {
  return configuredRuntime;
}

export function appPath(path = "", config = getReaderRuntimeConfig()): string {
  const cleanPath = String(path).replace(/^\/+/, "");
  return `${normalizeBasePath(config.basePath)}${cleanPath}`;
}
