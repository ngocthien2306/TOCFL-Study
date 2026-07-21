/**
 * HighlightsContext
 *
 * Local-first highlight storage (mirrors the dual-write pattern of useProgress):
 *  1. add/remove update localStorage + state IMMEDIATELY (UI never waits on BE)
 *  2. BE sync happens fire-and-forget; failures are silent
 *  3. Items that failed to reach BE keep a negative "temp" id and are retried
 *     on the next login (mergeFromServer)
 *
 * This means a flaky/dead BE never causes lost highlights.
 */
import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { highlightsApi, type HighlightRecord } from '../api/client';

// ─── localStorage key ─────────────────────────────────────────────────────────
const LS_KEY = 'tocfl_highlights';

function loadLocal(): HighlightRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as HighlightRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(list: HighlightRecord[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch { /* storage full — ignore */ }
}

// Module-scoped counter ensures temp ids never collide within a session
let tempIdCounter = -1;
function nextTempId(): number { return tempIdCounter--; }

/** Strip nulls → undefined for the BE create payload. */
function toCreatePayload(h: HighlightRecord) {
  return {
    page_key:   h.page_key,
    text:       h.text,
    ctx_before: h.ctx_before ?? undefined,
    ctx_after:  h.ctx_after  ?? undefined,
    color:      h.color,
    pinyin:     h.pinyin     ?? undefined,
    meaning:    h.meaning    ?? undefined,
    note:       h.note       ?? undefined,
  };
}

// ─── Context types ────────────────────────────────────────────────────────────
export interface NewHighlight {
  page_key:   string;
  text:       string;
  ctx_before?: string;
  ctx_after?:  string;
  color?:      string;
  pinyin?:     string;
  meaning?:    string;
  note?:       string;
}

interface HighlightsContextValue {
  highlights:     HighlightRecord[];
  /** Thêm highlight mới — luôn lưu localStorage trước, BE sync chạy nền */
  add:            (h: NewHighlight) => Promise<HighlightRecord>;
  /** Xoá highlight theo id — luôn xoá local trước, BE delete chạy nền */
  remove:         (id: number) => Promise<void>;
  /** Lấy highlights theo page_key */
  getForPage:     (page_key: string) => HighlightRecord[];
  isLoading:      boolean;
}

const HighlightsContext = createContext<HighlightsContextValue>({
  highlights: [],
  add:        async () => ({} as HighlightRecord),
  remove:     async () => {},
  getForPage: () => [],
  isLoading:  false,
});

// ─── Provider ─────────────────────────────────────────────────────────────────
interface Props {
  token?: string | null;
  children: React.ReactNode;
}

export const HighlightsProvider: React.FC<Props> = ({ token, children }) => {
  const [highlights, setHighlights] = useState<HighlightRecord[]>(loadLocal);
  const [isLoading,  setIsLoading]  = useState(false);
  const lastToken = useRef<string | null>(null);
  // Live ref of highlights so async callbacks can read latest state without re-running effects
  const highlightsRef = useRef<HighlightRecord[]>(highlights);
  useEffect(() => { highlightsRef.current = highlights; }, [highlights]);

  // ── Sync from BE on login (and flush any local-only temp items) ────────────
  useEffect(() => {
    if (!token || token === lastToken.current) return;
    lastToken.current = token;

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const beList = await highlightsApi.list(token);
        if (cancelled) return;

        // Items added while offline / while BE was down — those have a temp negative id
        const localOnly = highlightsRef.current.filter(h => h.id < 0);

        const synced: HighlightRecord[] = [];
        const stillFailed: HighlightRecord[] = [];
        for (const local of localOnly) {
          try {
            const server = await highlightsApi.create(token, toCreatePayload(local));
            synced.push(server);
          } catch {
            stillFailed.push(local);
          }
        }
        if (cancelled) return;

        // Merge: BE truth + items just synced + items still pending
        const merged = [...beList, ...synced, ...stillFailed];
        setHighlights(merged);
        saveLocal(merged);
      } catch {
        // BE unreachable — keep local copy untouched
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token]);

  // ── add: local-first, BE fire-and-forget ──────────────────────────────────
  const add = useCallback(async (h: NewHighlight): Promise<HighlightRecord> => {
    const tempRecord: HighlightRecord = {
      id:         nextTempId(),
      page_key:   h.page_key,
      text:       h.text,
      ctx_before: h.ctx_before ?? null,
      ctx_after:  h.ctx_after  ?? null,
      color:      h.color      ?? '#fde68a',
      pinyin:     h.pinyin     ?? null,
      meaning:    h.meaning    ?? null,
      note:       h.note       ?? null,
      created_at: new Date().toISOString(),
    };
    // 1. Persist to local + state IMMEDIATELY
    setHighlights(prev => {
      const next = [...prev, tempRecord];
      saveLocal(next);
      return next;
    });

    // 2. Fire-and-forget BE sync; on success, swap temp id → server id
    if (token) {
      void highlightsApi.create(token, toCreatePayload(tempRecord))
        .then(server => {
          setHighlights(prev => {
            const next = prev.map(item => item.id === tempRecord.id ? server : item);
            saveLocal(next);
            return next;
          });
        })
        .catch(() => {
          // BE down — keep temp id; will be retried on next login sync
        });
    }
    return tempRecord;
  }, [token]);

  // ── remove: local-first, BE fire-and-forget ───────────────────────────────
  const remove = useCallback(async (id: number): Promise<void> => {
    setHighlights(prev => {
      const next = prev.filter(h => h.id !== id);
      saveLocal(next);
      return next;
    });
    // Only call BE for items that actually exist on the server (positive id)
    if (token && id > 0) {
      void highlightsApi.delete(token, id).catch(() => {
        // BE down — local removal stands; nothing to retry (server still has it,
        // but next login sync will re-add it. Acceptable trade-off vs. complex queue.)
      });
    }
  }, [token]);

  // ── getForPage ────────────────────────────────────────────────────────────
  const getForPage = useCallback(
    (page_key: string) => highlights.filter(h => h.page_key === page_key),
    [highlights],
  );

  return (
    <HighlightsContext.Provider value={{ highlights, add, remove, getForPage, isLoading }}>
      {children}
    </HighlightsContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useHighlights(): HighlightsContextValue {
  return useContext(HighlightsContext);
}
