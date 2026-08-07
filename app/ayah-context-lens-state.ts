import type { TranslationPackMetadata, TranslationPackProgress } from "./translation-packs.mjs";

export type ContextLensTab = "translation" | "tafsir";
export type ContextTranslationId = "english-saheeh" | "amharic-zain";
export type ContextPackStatus = "checking" | "not-installed" | "installed" | "working" | "failed" | "reclaimed";
export type ContextPackAction = "install" | "verify" | "repair" | "delete";

export interface ContextTranslationRecord {
  verseKey: string;
  translation: string;
  footnotes: string;
}

export interface ContextLensState {
  activeTab: ContextLensTab;
  activeTranslation: ContextTranslationId;
  packStatus: ContextPackStatus;
  pack: TranslationPackMetadata | null;
  amharicRecord: ContextTranslationRecord | null;
  progress: TranslationPackProgress | null;
  operation: ContextPackAction | null;
  retryAction: "install" | "repair" | "delete" | null;
  error: string;
  selectionBlocked: boolean;
  deleteArmed: boolean;
}

export type ContextLensEvent =
  | { type: "SELECT_TAB"; tab: ContextLensTab }
  | { type: "SELECT_TRANSLATION"; translation: ContextTranslationId }
  | { type: "PACK_CHECKING" }
  | { type: "PACK_ABSENT" }
  | { type: "PACK_READY"; pack: TranslationPackMetadata; record: ContextTranslationRecord; selectAmharic?: boolean }
  | { type: "PACK_RECLAIMED" }
  | { type: "PACK_OPERATION"; operation: ContextPackAction }
  | { type: "PACK_PROGRESS"; progress: TranslationPackProgress }
  | { type: "PACK_FAILURE"; action: "install" | "repair" | "delete"; error: string }
  | { type: "PACK_DELETED" }
  | { type: "ARM_DELETE" }
  | { type: "CANCEL_DELETE" };

export function createContextLensState(): ContextLensState {
  return {
    activeTab: "translation",
    activeTranslation: "english-saheeh",
    packStatus: "checking",
    pack: null,
    amharicRecord: null,
    progress: null,
    operation: null,
    retryAction: null,
    error: "",
    selectionBlocked: false,
    deleteArmed: false,
  };
}

export function contextLensReducer(state: ContextLensState, event: ContextLensEvent): ContextLensState {
  switch (event.type) {
    case "SELECT_TAB":
      return { ...state, activeTab: event.tab };
    case "SELECT_TRANSLATION":
      if (event.translation === "amharic-zain" && (state.packStatus !== "installed" || !state.amharicRecord)) {
        return { ...state, activeTranslation: "english-saheeh", selectionBlocked: true };
      }
      return { ...state, activeTranslation: event.translation, selectionBlocked: false };
    case "PACK_CHECKING":
      return { ...state, packStatus: "checking", amharicRecord: null, progress: null, operation: null, error: "", selectionBlocked: false, activeTranslation: "english-saheeh" };
    case "PACK_ABSENT":
      return { ...state, packStatus: "not-installed", pack: null, amharicRecord: null, progress: null, operation: null, activeTranslation: "english-saheeh", error: "", deleteArmed: false };
    case "PACK_READY":
      return {
        ...state,
        packStatus: "installed",
        pack: event.pack,
        amharicRecord: event.record,
        progress: null,
        operation: null,
        retryAction: null,
        error: "",
        selectionBlocked: false,
        deleteArmed: false,
        activeTranslation: event.selectAmharic ? "amharic-zain" : state.activeTranslation,
      };
    case "PACK_RECLAIMED":
      return { ...state, packStatus: "reclaimed", pack: null, amharicRecord: null, progress: null, operation: null, retryAction: "repair", activeTranslation: "english-saheeh", error: "", deleteArmed: false };
    case "PACK_OPERATION":
      return { ...state, packStatus: "working", operation: event.operation, progress: null, error: "", selectionBlocked: false, deleteArmed: false };
    case "PACK_PROGRESS":
      return { ...state, packStatus: "working", progress: event.progress };
    case "PACK_FAILURE":
      return { ...state, packStatus: "failed", operation: null, progress: null, retryAction: event.action, error: event.error, activeTranslation: "english-saheeh", deleteArmed: false };
    case "PACK_DELETED":
      return { ...createContextLensState(), packStatus: "not-installed", activeTab: state.activeTab };
    case "ARM_DELETE":
      return { ...state, deleteArmed: true };
    case "CANCEL_DELETE":
      return { ...state, deleteArmed: false };
    default:
      return state;
  }
}
