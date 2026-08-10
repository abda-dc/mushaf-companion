"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AudioPackManifest, AudioPackType } from "./audio-manifest.mjs";
import {
  AUDIO_DOWNLOAD_CONCURRENCY,
  audioPackProgress,
  createAudioPackState,
  deleteAudioPack,
  formatAudioBytes,
  getOfflineAudioStats,
  isTransientAudioFailure,
  listAudioPacks,
  listStoredAudioFiles,
  normalizeAudioPackState,
  putVerifiedAudioFile,
  saveAudioPack,
  updateAudioPackFile,
  verifyStoredAudioFile,
  type OfflineAudioPack,
} from "./offline-audio.mjs";
import type { QuranChapterInfo } from "./quran-data";
import { getReaderTransport } from "./content/runtime-transport";

interface OfflineAudioPanelProps {
  chapters: QuranChapterInfo[];
  initialChapter: number;
  wifiOnly: boolean;
  onWifiOnlyChange: (value: boolean) => void;
  onClose: () => void;
  onNotice: (message: string) => void;
  onLibraryChanged: () => void;
  onPlayPack: (pack: OfflineAudioPack) => void;
}

interface BrowserConnection {
  type?: string;
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (name: string, listener: () => void) => void;
  removeEventListener?: (name: string, listener: () => void) => void;
}

interface StorageView {
  usedBytes: number;
  quotaBytes: number;
  persisted: boolean;
  packCount: number;
  completePacks: number;
}

function connectionSnapshot() {
  const connection = (navigator as Navigator & { connection?: BrowserConnection }).connection;
  if (!navigator.onLine) return { label: "Offline", kind: "offline", connection };
  if (connection?.type === "wifi" || connection?.type === "ethernet") return { label: connection.type === "wifi" ? "Wi-Fi" : "Ethernet", kind: "unmetered", connection };
  if (connection?.type === "cellular") return { label: `Cellular${connection.effectiveType ? ` · ${connection.effectiveType}` : ""}`, kind: "cellular", connection };
  if (connection?.saveData) return { label: "Data saver", kind: "cellular", connection };
  return { label: navigator.onLine ? "Connection unknown" : "Offline", kind: navigator.onLine ? "unknown" : "offline", connection };
}

function manifestFromPack(pack: OfflineAudioPack): AudioPackManifest {
  return {
    schemaVersion: 1,
    revision: pack.manifestRevision,
    reciter: {
      id: "alafasy",
      name: pack.reciterName,
      scope: "ayah",
      source: "Quran Foundation recitation files",
      sourceUrl: "https://verses.quran.foundation/Alafasy/mp3/",
      license: "Upstream audio terms apply.",
    },
    pack: {
      id: pack.id,
      type: pack.type,
      number: pack.number,
      label: pack.label,
      verseCount: pack.totalFiles,
      estimatedBytes: pack.estimatedBytes,
    },
    files: pack.files.map(({ key, verseKey, reciterId, url, urlRevision }) => ({ key, verseKey, reciterId, url, urlRevision })),
  };
}

function replacePack(items: OfflineAudioPack[], pack: OfflineAudioPack) {
  return [pack, ...items.filter((item) => item.id !== pack.id)].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function OfflineAudioPanel({ chapters, initialChapter, wifiOnly, onWifiOnlyChange, onClose, onNotice, onLibraryChanged, onPlayPack }: OfflineAudioPanelProps) {
  const contentTransport = getReaderTransport();
  const [packType, setPackType] = useState<AudioPackType>("surah");
  const [packNumber, setPackNumber] = useState(initialChapter);
  const [manifest, setManifest] = useState<AudioPackManifest | null>(null);
  const [manifestLoading, setManifestLoading] = useState(true);
  const [packs, setPacks] = useState<OfflineAudioPack[]>([]);
  const [storage, setStorage] = useState<StorageView>({ usedBytes: 0, quotaBytes: 0, persisted: false, packCount: 0, completePacks: 0 });
  const [network, setNetwork] = useState(() => connectionSnapshot());
  const controllersRef = useRef(new Map<string, AbortController>());

  const selectedChapter = chapters.find((chapter) => chapter.id === packNumber);
  const currentPack = manifest ? packs.find((pack) => pack.id === manifest.pack.id) : undefined;
  const storagePercent = storage.quotaBytes ? Math.min(100, (storage.usedBytes / storage.quotaBytes) * 100) : 0;

  const refreshLibrary = async () => {
    try {
      const [nextPacks, stats, estimate, persisted] = await Promise.all([
        listAudioPacks(),
        getOfflineAudioStats(),
        navigator.storage?.estimate?.() ?? Promise.resolve({ usage: 0, quota: 0 }),
        navigator.storage?.persisted?.() ?? Promise.resolve(false),
      ]);
      setPacks(nextPacks);
      setStorage({
        usedBytes: stats.usedBytes,
        quotaBytes: estimate.quota ?? 0,
        persisted,
        packCount: stats.packCount,
        completePacks: stats.completePacks,
      });
    } catch {
      onNotice("Offline audio storage is not available in this browser.");
    }
  };

  useEffect(() => {
    // Browser storage is an external system hydrated after the panel mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshLibrary();
    const updateNetwork = () => setNetwork(connectionSnapshot());
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    network.connection?.addEventListener?.("change", updateNetwork);
    const controllers = controllersRef.current;
    return () => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
      network.connection?.removeEventListener?.("change", updateNetwork);
      controllers.forEach((controller) => controller.abort());
    };
  // The connection object is captured once; browser online/offline events keep the snapshot current.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // A new selection invalidates the previous manifest immediately.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setManifestLoading(true);
    const label = packType === "surah" && selectedChapter ? `Sūrah ${selectedChapter.name}` : `Juz ${packNumber}`;
    contentTransport.loadAudioManifest(packType, packNumber, "alafasy", controller.signal)
      .then((nextManifest) => setManifest({ ...nextManifest, pack: { ...nextManifest.pack, label } }))
      .catch((error) => { if (error instanceof DOMException && error.name === "AbortError") return; setManifest(null); })
      .finally(() => { if (!controller.signal.aborted) setManifestLoading(false); });
    return () => controller.abort();
  }, [packType, packNumber, selectedChapter, contentTransport]);

  const packTotals = useMemo(() => ({
    complete: packs.filter((pack) => pack.status === "complete").length,
    partial: packs.filter((pack) => pack.status !== "complete").length,
  }), [packs]);

  async function assertDownloadAllowed(estimatedBytes: number) {
    if (!navigator.onLine) throw new Error("Reconnect before starting or resuming a download.");
    const snapshot = connectionSnapshot();
    if (wifiOnly && snapshot.kind === "cellular") throw new Error("Wi-Fi-only downloads are on. Connect to Wi-Fi or turn the safeguard off.");
    if (!wifiOnly && snapshot.kind === "cellular" && !window.confirm("This audio pack may use significant cellular data. Continue?")) throw new Error("Download cancelled.");
    const estimate = await navigator.storage?.estimate?.();
    const available = (estimate?.quota ?? 0) - (estimate?.usage ?? 0);
    if (estimate?.quota && available < estimatedBytes * 1.1) throw new Error(`This pack needs about ${formatAudioBytes(estimatedBytes)}; the browser reports ${formatAudioBytes(available)} free.`);
    await (navigator.storage?.persist?.() ?? Promise.resolve(false)).catch(() => false);
  }

  async function fetchAndStore(file: OfflineAudioPack["files"][number], signal: AbortSignal) {
    let attempt = 0;
    while (attempt < 3) {
      attempt += 1;
      try {
        const response = await fetch(file.url, { signal, cache: "no-store" });
        if (!response.ok) {
          const error = new Error(`Audio provider returned ${response.status}.`) as Error & { transient?: boolean };
          error.transient = isTransientAudioFailure(response.status);
          throw error;
        }
        const buffer = await response.arrayBuffer();
        return await putVerifiedAudioFile(file, buffer, response.headers.get("content-type") ?? "audio/mpeg");
      } catch (error) {
        if (signal.aborted) throw error;
        const transient = !(error instanceof Error && "transient" in error) || Boolean((error as Error & { transient?: boolean }).transient);
        if (!transient || attempt >= 3) throw error;
        await new Promise((resolve) => window.setTimeout(resolve, attempt * 450));
      }
    }
    throw new Error("Audio download failed.");
  }

  async function runDownload(nextManifest: AudioPackManifest) {
    const storedFiles = await listStoredAudioFiles();
    let working = normalizeAudioPackState({ ...createAudioPackState(nextManifest, storedFiles), status: "downloading", error: "", updatedAt: new Date().toISOString() });
    const remainingEstimate = working.totalFiles ? nextManifest.pack.estimatedBytes * ((working.totalFiles - working.completedFiles) / working.totalFiles) : nextManifest.pack.estimatedBytes;
    try {
      await assertDownloadAllowed(remainingEstimate);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "The audio download could not start.");
      return;
    }

    const existingController = controllersRef.current.get(nextManifest.pack.id);
    existingController?.abort();
    const controller = new AbortController();
    controllersRef.current.set(nextManifest.pack.id, controller);

    setPacks((items) => replacePack(items, working));
    await saveAudioPack(working);

    const queue = working.files.filter((file) => file.status !== "complete");
    let cursor = 0;
    let persistChain = Promise.resolve();
    const publish = (nextPack: OfflineAudioPack) => {
      // Download workers share one serialized snapshot before it enters React state.
      working = nextPack;
      setPacks((items) => replacePack(items, working));
      persistChain = persistChain.then(() => saveAudioPack(working)).then(() => undefined);
    };

    const worker = async () => {
      while (cursor < queue.length && !controller.signal.aborted) {
        const file = queue[cursor];
        cursor += 1;
        publish(updateAudioPackFile(working, file.key, { status: "downloading", error: "" }));
        try {
          const stored = await fetchAndStore(file, controller.signal);
          publish(updateAudioPackFile(working, file.key, { status: "complete", size: stored.size, checksum: stored.checksum, error: "" }));
        } catch (error) {
          if (controller.signal.aborted) break;
          publish(updateAudioPackFile(working, file.key, { status: "failed", error: error instanceof Error ? error.message : "Download failed" }));
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(AUDIO_DOWNLOAD_CONCURRENCY, Math.max(1, queue.length)) }, () => worker()));
    await persistChain;
    const complete = working.files.every((file) => file.status === "complete");
    const failed = working.files.some((file) => file.status === "failed");
    // Finalize the shared worker snapshot only after both workers have settled.
    working = normalizeAudioPackState({
      ...working,
      status: complete ? "complete" : controller.signal.aborted ? "paused" : failed ? "failed" : "paused",
      error: failed && !complete ? "One or more files need another attempt." : "",
      updatedAt: new Date().toISOString(),
    });
    await saveAudioPack(working);
    controllersRef.current.delete(working.id);
    setPacks((items) => replacePack(items, working));
    await refreshLibrary();
    onLibraryChanged();
    onNotice(complete ? `${working.label} is verified and ready offline.` : controller.signal.aborted ? `${working.label} paused. Completed files were kept.` : `${working.label} needs attention. Retry will keep completed files.`);
  }

  function pausePack(pack: OfflineAudioPack) {
    controllersRef.current.get(pack.id)?.abort();
    setPacks((items) => replacePack(items, normalizeAudioPackState({ ...pack, status: "paused", updatedAt: new Date().toISOString() })));
  }

  async function repairPack(pack: OfflineAudioPack) {
    onNotice(`Checking ${pack.label}…`);
    let repaired = pack;
    for (const file of pack.files) {
      if (file.status !== "complete") continue;
      if (!await verifyStoredAudioFile(file.key)) repaired = updateAudioPackFile(repaired, file.key, { status: "pending", size: 0, checksum: "", error: "Integrity check failed" });
    }
    await saveAudioPack(repaired);
    if (repaired.files.every((file) => file.status === "complete")) {
      onNotice(`${pack.label} passed every checksum.`);
      return;
    }
    await runDownload(manifestFromPack(repaired));
  }

  async function removePack(pack: OfflineAudioPack) {
    if (!window.confirm(`Delete ${pack.label} and reclaim its unshared audio files?`)) return;
    controllersRef.current.get(pack.id)?.abort();
    const reclaimed = await deleteAudioPack(pack.id);
    await refreshLibrary();
    onLibraryChanged();
    onNotice(`${pack.label} deleted · ${formatAudioBytes(reclaimed)} reclaimed.`);
  }

  return (
    <section className="panel-shell downloads-panel" role="dialog" aria-modal="true" aria-labelledby="downloads-title">
      <header><div><span className="panel-kicker">PHASE 2 · OFFLINE RECITATION</span><h2 id="downloads-title">Audio library</h2></div><button type="button" className="panel-close" onClick={onClose} aria-label="Close audio library">×</button></header>
      <div className="downloads-content">
        <section className="storage-overview" aria-label="Offline audio storage">
          <div><span>ON THIS DEVICE</span><strong>{formatAudioBytes(storage.usedBytes)}</strong><small>{storage.packCount} packs · {storage.completePacks} ready offline</small></div>
          <div className="storage-meter"><span style={{ width: `${storagePercent}%` }} /></div>
          <div className="storage-facts"><span>{storage.quotaBytes ? `${formatAudioBytes(storage.quotaBytes)} browser allowance` : "Browser-managed allowance"}</span><span>{storage.persisted ? "Protected storage granted" : "Browser may reclaim under storage pressure"}</span></div>
        </section>

        <section className="download-builder" aria-labelledby="new-pack-title">
          <div className="download-builder-copy"><span>NEW PACK</span><h3 id="new-pack-title">Take a recitation with you</h3><p>Mishary Rashid Alafasy · verified ayah-by-ayah files. Downloads continue only while this screen remains open.</p></div>
          <div className="download-fields">
            <label>PACK<select value={packType} onChange={(event) => { const next = event.target.value as AudioPackType; setPackType(next); setPackNumber(next === "surah" ? initialChapter : 30); }}><option value="surah">Sūrah</option><option value="juz">Juz</option></select></label>
            <label>{packType === "surah" ? "SŪRAH" : "JUZ"}<select value={packNumber} onChange={(event) => setPackNumber(Number(event.target.value))}>{packType === "surah" ? chapters.map((chapter) => <option value={chapter.id} key={chapter.id}>{chapter.id}. {chapter.name}</option>) : Array.from({ length: 30 }, (_, index) => <option value={index + 1} key={index + 1}>Juz {index + 1}</option>)}</select></label>
          </div>
          <div className="download-estimate">
            {manifestLoading ? <span>Preparing verified file list…</span> : manifest ? <><span><strong>{manifest.pack.verseCount}</strong> files</span><span><strong>≈ {formatAudioBytes(manifest.pack.estimatedBytes)}</strong> estimated</span></> : <span>Manifest temporarily unavailable.</span>}
          </div>
          <button type="button" className="download-primary" disabled={!manifest || manifestLoading || currentPack?.status === "downloading"} onClick={() => { if (currentPack?.status === "complete") void repairPack(currentPack); else if (manifest) void runDownload(manifest); }}>{currentPack ? currentPack.status === "complete" ? "Verify saved pack" : "Resume this pack" : "Download for offline"}<span>{currentPack?.status === "complete" ? "✓" : "↓"}</span></button>
        </section>

        <section className="download-safeguards" aria-label="Download safeguards">
          <label><span><strong>Wi-Fi only</strong><small>Blocks downloads when the browser reports cellular service.</small></span><input className="switch" type="checkbox" checked={wifiOnly} onChange={(event) => onWifiOnlyChange(event.target.checked)} /></label>
          <div><span className={`network-dot ${network.kind}`} /><span><strong>{network.label}</strong><small>{network.kind === "unknown" ? "The browser did not expose the connection type." : "Connection status"}</small></span></div>
        </section>

        <section className="downloaded-packs" aria-labelledby="saved-packs-title">
          <header><div><span>SAVED LIBRARY</span><h3 id="saved-packs-title">Your offline packs</h3></div><small>{packTotals.complete} complete · {packTotals.partial} partial</small></header>
          <div className="pack-list">
            {packs.map((pack) => {
              const progress = audioPackProgress(pack);
              return <article className={`pack-row status-${pack.status}`} key={pack.id}><div className="pack-main"><span className="pack-type">{pack.type === "surah" ? "SŪRAH" : "JUZ"} {pack.number}</span><strong>{pack.label}</strong><small>{pack.reciterName} · {pack.completedFiles}/{pack.totalFiles} files · {formatAudioBytes(pack.totalBytes)}</small><div className="pack-progress" role="progressbar" aria-label={`${pack.label} download progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div></div><span className="pack-status">{pack.status}</span><div className="pack-actions">{pack.status === "downloading" ? <button type="button" onClick={() => pausePack(pack)}>Pause</button> : pack.status === "complete" ? <><button type="button" className="pack-play" onClick={() => onPlayPack(pack)}>Play offline</button><button type="button" onClick={() => void repairPack(pack)}>Verify</button></> : <button type="button" onClick={() => void runDownload(manifestFromPack(pack))}>Resume</button>}<button type="button" className="pack-delete" onClick={() => void removePack(pack)}>Delete</button></div>{pack.error && <p>{pack.error}</p>}</article>;
            })}
            {!packs.length && <p className="empty-state">No offline packs yet. Start with the sūrah you are reading now.</p>}
          </div>
        </section>

        <footer className="offline-source-note"><span>INTEGRITY</span><p>Every downloaded file is hashed with SHA-256, read back from this browser, and verified before its pack can be marked complete. Partial downloads never appear as ready.</p></footer>
      </div>
    </section>
  );
}
