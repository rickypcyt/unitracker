import { CheckCircle2, CheckSquare, Circle, Eraser, StickyNote, Trash2 } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/auth/useAuth";
import { useTranslation } from "react-i18next";
import { supabase } from "@/utils/supabaseClient";

const STORAGE_KEY = "unitracker.scratchpad";

const loadNote = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
};

const PENDING_KEY = "unitracker.scratchpad.pending";

const isPending = () => {
  try {
    return localStorage.getItem(PENDING_KEY) === "1";
  } catch {
    return false;
  }
};

const setPending = (on: boolean) => {
  try {
    if (on) localStorage.setItem(PENDING_KEY, "1");
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
};

const saveLocal = (value: string) => {
  try {
    setPending(true);
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // storage full or unavailable — keep in-memory only
  }
};

const CHECKBOX_RE = /^\[( |x)\]\s?(.*)$/;
const TIME_SUFFIX_RE = /^(.*?)\s*·\s*(\d{1,2}:\d{2})$/;

const parseLine = (line: string) => {
  const match = line.match(CHECKBOX_RE);
  if (!match) return { type: "text" as const, text: line };
  const checked = match[1] === "x";
  const body = match[2] ?? "";
  const timeMatch = body.match(TIME_SUFFIX_RE);
  return {
    type: "checkbox" as const,
    checked,
    text: checked && timeMatch ? timeMatch[1] ?? body : body,
    doneAt: checked && timeMatch ? timeMatch[2] : null,
  };
};

type SyncStatus = "saved" | "saving" | "error";

const SAVE_DEBOUNCE_MS = 600;
const RETRY_BASE_MS = 3000;
const RETRY_MAX_MS = 60000;

const ScratchPad = memo(() => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [text, setText] = useState(loadNote);
  const [status, setStatus] = useState<SyncStatus>("saved");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const userIdRef = useRef<string | null>(null);
  const latestRef = useRef(text);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const inFlightRef = useRef(false);
  const loadedRef = useRef(false); // never push to the cloud before reconciling with it
  const lastSyncedRef = useRef<string | null>(null);

  userIdRef.current = user?.id ?? null;

  // Serialized push: one request at a time, always sends the newest text, retries with backoff.
  const pushRemote = async () => {
    const userId = userIdRef.current;
    if (!userId || !loadedRef.current || inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      while (userIdRef.current === userId) {
        const value = latestRef.current;
        if (value === lastSyncedRef.current) {
          setPending(false);
          setStatus("saved");
          retryCountRef.current = 0;
          return;
        }
        setStatus("saving");
        const { data, error } = await supabase
          .from("profiles")
          .update({ scratchpad: value })
          .eq("id", userId)
          .select("id");
        // RLS / missing row makes update succeed with 0 rows: that is a failure, not a save
        if (error || !data || data.length === 0) {
          setStatus("error");
          const delay = Math.min(RETRY_BASE_MS * 2 ** retryCountRef.current, RETRY_MAX_MS);
          retryCountRef.current += 1;
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
          retryTimerRef.current = setTimeout(() => void pushRemote(), delay);
          return;
        }
        lastSyncedRef.current = value;
        // loop: if more was typed while this request was in flight, send that too
      }
    } finally {
      inFlightRef.current = false;
    }
  };

  // Last-chance save when the page hides/closes: fetch with keepalive survives unload
  const flushBeacon = async () => {
    const userId = userIdRef.current;
    const value = latestRef.current;
    if (!userId || !loadedRef.current || value === lastSyncedRef.current) return;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const env = import.meta.env as Record<string, string>;
      void fetch(`${env['VITE_SUPABASE_URL']}/rest/v1/profiles?id=eq.${userId}`, {
        method: "PATCH",
        keepalive: true,
        headers: {
          apikey: env['VITE_SUPABASE_ANON_KEY'] ?? "",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ scratchpad: value }),
      });
    } catch {
      // local copy + pending flag still protect the data
    }
  };

  const scheduleSave = () => {
    if (!userIdRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setStatus("saving");
    saveTimerRef.current = setTimeout(() => void pushRemote(), SAVE_DEBOUNCE_MS);
  };

  // Reconcile with the cloud: pending local edits win, otherwise the cloud copy wins
  const pullRemote = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("scratchpad")
      .eq("id", userId)
      .single();
    if (userIdRef.current !== userId) return;
    if (error) {
      setStatus("error");
      retryTimerRef.current = setTimeout(() => void pullRemote(userId), RETRY_BASE_MS);
      return;
    }
    const remote = (data?.scratchpad as string | null) ?? "";
    lastSyncedRef.current = remote;
    const local = loadNote();
    if (isPending() || (!remote && local)) {
      // Local edits never reached the cloud (refresh/crash/offline) or first-time migration
      latestRef.current = local;
      loadedRef.current = true;
      void pushRemote();
    } else {
      loadedRef.current = true;
      if (remote !== latestRef.current) {
        latestRef.current = remote;
        setText(remote);
        saveLocal(remote);
        setPending(false);
      }
      setStatus("saved");
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    loadedRef.current = false;
    lastSyncedRef.current = null;
    void pullRemote(userId);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        void flushBeacon();
      } else if (!isPending() && !inFlightRef.current) {
        // Pick up edits from other devices, never clobbering unsynced local ones
        void pullRemote(userId);
      }
    };
    const onPageHide = () => void flushBeacon();
    const onOnline = () => void pushRemote();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("online", onOnline);
      // Unmount (route change): send what's pending now instead of dropping the debounce
      void flushBeacon();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      loadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleChange = (value: string) => {
    setText(value);
    latestRef.current = value;
    saveLocal(value);
    scheduleSave();
  };

  const lines = text === "" ? [] : text.split("\n");
  const parsedLines = lines.map(parseLine);
  const totalTodos = parsedLines.filter(p => p.type === "checkbox").length;
  const doneTodos = parsedLines.filter(p => p.type === "checkbox" && p.checked).length;

  // Text mode: toggle the checkbox marker on every line touched by the selection
  const toggleCheckboxInSelection = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = text.slice(0, start);
    const firstLine = before.split("\n").length - 1;
    const lastLine = firstLine + text.slice(start, end).split("\n").length - 1;
    const all = text.split("\n");
    const targets = all.slice(firstLine, lastLine + 1).map(parseLine);
    const allAreBoxes = targets.every(p => p.type === "checkbox");
    for (let i = firstLine; i <= lastLine; i++) {
      const p = parseLine(all[i] ?? "");
      all[i] = allAreBoxes ? (p.type === "checkbox" ? p.text : all[i] ?? "") : (p.type === "checkbox" ? all[i] ?? "" : `[ ] ${all[i] ?? ""}`);
    }
    handleChange(all.join("\n"));
    requestAnimationFrame(() => el.focus());
  };

  const MARKER_RE = /^\[( |x)\]\s?/;

  // Which rendered checkbox (if any) sits under the pointer? The mirror layer holds the real elements.
  const checkboxAt = (clientX: number, clientY: number): number | null => {
    const mirror = mirrorRef.current;
    if (!mirror) return null;
    const icons = mirror.querySelectorAll<HTMLElement>("[data-checkbox]");
    for (const icon of Array.from(icons)) {
      const r = icon.getBoundingClientRect();
      if (clientX >= r.left - 4 && clientX <= r.right + 4 && clientY >= r.top - 2 && clientY <= r.bottom + 2) {
        return Number(icon.dataset['checkbox']);
      }
    }
    return null;
  };

  const toggleLine = (index: number) => {
    const el = textareaRef.current;
    const selStart = el?.selectionStart ?? 0;
    const selEnd = el?.selectionEnd ?? 0;
    const all = text.split("\n");
    const p = parseLine(all[index] ?? "");
    if (p.type !== "checkbox") return;
    all[index] = p.checked
      ? `[ ] ${p.text}`
      : `[x] ${p.text} · ${new Date().toTimeString().slice(0, 5)}`;
    handleChange(all.join("\n"));
    requestAnimationFrame(() => {
      if (!el) return;
      el.setSelectionRange(selStart, selEnd);
    });
  };

  // Same hit-test, for the trash icon shown on checked lines
  const trashAt = (clientX: number, clientY: number): number | null => {
    const mirror = mirrorRef.current;
    if (!mirror) return null;
    const icons = mirror.querySelectorAll<HTMLElement>("[data-trash]");
    for (const icon of Array.from(icons)) {
      const r = icon.getBoundingClientRect();
      if (clientX >= r.left - 4 && clientX <= r.right + 4 && clientY >= r.top - 2 && clientY <= r.bottom + 2) {
        return Number(icon.dataset['trash']);
      }
    }
    return null;
  };

  const deleteLine = (index: number) => {
    const all = text.split("\n");
    all.splice(index, 1);
    handleChange(all.join("\n"));
  };

  const handleSurfaceMouseDown = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const trash = trashAt(e.clientX, e.clientY);
    if (trash !== null) {
      e.preventDefault();
      deleteLine(trash);
      return;
    }
    const index = checkboxAt(e.clientX, e.clientY);
    if (index === null) return;
    e.preventDefault();
    toggleLine(index);
  };

  const handleSurfaceMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const overIcon = checkboxAt(e.clientX, e.clientY) !== null || trashAt(e.clientX, e.clientY) !== null;
    e.currentTarget.style.cursor = overIcon ? "pointer" : "text";
  };

  // Enter on a checkbox line continues the list; Enter on an empty one exits it
  const handleSurfaceKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey) return;
    const el = e.currentTarget;
    if (el.selectionStart !== el.selectionEnd) return;
    const caret = el.selectionStart;
    const lineStart = text.lastIndexOf("\n", caret - 1) + 1;
    const nextBreak = text.indexOf("\n", caret);
    const lineEnd = nextBreak === -1 ? text.length : nextBreak;
    const line = text.slice(lineStart, lineEnd);
    const p = parseLine(line);
    if (p.type !== "checkbox") return;
    e.preventDefault();
    if (p.text === "") {
      // Empty checkbox: strip the marker and leave the list
      handleChange(text.slice(0, lineStart) + text.slice(lineEnd));
      requestAnimationFrame(() => el.setSelectionRange(lineStart, lineStart));
      return;
    }
    const insert = "\n[ ] ";
    handleChange(text.slice(0, caret) + insert + text.slice(caret));
    const pos = caret + insert.length;
    requestAnimationFrame(() => el.setSelectionRange(pos, pos));
  };

  const surfaceFont: React.CSSProperties = {
    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: "14px",
    lineHeight: "24px",
    // Textareas don't inherit the page's letter-spacing, the mirror div does: pin both to the same value
    // (and turn ligatures off) so the typed text and the drawn text never drift apart.
    letterSpacing: "normal",
    fontVariantLigatures: "none",
    fontKerning: "none",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    padding: "12px",
  };

  return (
    <div className="w-full h-full min-h-[260px] max-h-[460px] rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10">
            <StickyNote size={18} className="text-[var(--accent-primary)]" />
          </div>
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] leading-tight">
            {t('session.scratchpad.title')}
          </h3>
          {totalTodos > 0 && (
            <span className="rounded-full bg-[var(--accent-primary)]/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--accent-primary)]">
              {doneTodos}/{totalTodos}
            </span>
          )}
          <button
            onClick={toggleCheckboxInSelection}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)]"
            title={t('session.scratchpad.insertCheckbox')}
            aria-label={t('session.scratchpad.insertCheckbox')}
          >
            <CheckSquare size={15} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {user?.id && (
            <span
              className={`text-xs ${status === "error" ? "text-red-500" : "text-[var(--text-secondary)]"}`}
              role="status"
            >
              {status === "saving" ? "Saving…" : status === "error" ? "Not synced – retrying" : "Saved"}
            </span>
          )}
          {text && (
            <button
              onClick={() => handleChange("")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)]"
              title={t('session.scratchpad.clearNote')}
              aria-label={t('session.scratchpad.clearNote')}
            >
              <Eraser size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Body — one selectable surface: a transparent textarea over a mirror layer that draws the checkboxes */}
      <div className="relative flex-1 min-h-[140px] overflow-hidden rounded-xl bg-[var(--bg-secondary)]/50">
        <div
          ref={mirrorRef}
          aria-hidden="true"
          className="scratchpad-mono pointer-events-none absolute inset-0 overflow-hidden text-[var(--text-primary)]"
          style={surfaceFont}
        >
          {lines.map((line, i) => {
            const p = parsedLines[i];
            const marker = line.match(MARKER_RE);
            if (!p || p.type !== "checkbox" || !marker) {
              return <div key={i}>{line === "" ? <br /> : line}</div>;
            }
            const rest = line.slice(marker[0].length);
            return (
              <div key={i} className={`relative ${p.checked ? "pr-7" : ""}`}>
                {p.checked && (
                  <span
                    data-trash={i}
                    className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center text-[var(--text-secondary)]"
                  >
                    <Trash2 size={14} />
                  </span>
                )}
                {/* The raw marker stays in the layout (transparent) so widths match the textarea exactly; the icon is drawn over it */}
                <span data-checkbox={i} className="relative inline-block">
                  <span className="text-transparent">{marker[0]}</span>
                  <span className="absolute top-1/2 flex -translate-y-1/2" style={{ left: "calc((3ch - 16px) / 2)" }}>
                    {p.checked ? (
                      <CheckCircle2 size={16} strokeWidth={2.2} className="text-[var(--accent-primary)]" />
                    ) : (
                      <Circle size={16} strokeWidth={2.2} className="text-[var(--text-secondary)]" />
                    )}
                  </span>
                </span>
                <span className={p.checked ? "text-[var(--text-secondary)] line-through" : ""}>{rest}</span>
              </div>
            );
          })}
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onScroll={(e) => {
            if (mirrorRef.current) mirrorRef.current.scrollTop = e.currentTarget.scrollTop;
          }}
          onMouseDown={handleSurfaceMouseDown}
          onMouseMove={handleSurfaceMouseMove}
          onKeyDown={handleSurfaceKeyDown}
          spellCheck={false}
          placeholder={t('session.scratchpad.textPlaceholder', { defaultValue: 'Write everything you need to do. Start a line with [ ] to make it a checkbox.' })}
          aria-label={t('session.scratchpad.title')}
          className="scratchpad-mono hide-scrollbar absolute inset-0 h-full w-full resize-none overflow-y-auto border-0 bg-transparent text-transparent caret-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]/50 selection:bg-[var(--accent-primary)]/30 focus:outline-none"
          style={surfaceFont}
        />
      </div>
    </div>
  );
});

ScratchPad.displayName = "ScratchPad";

export default ScratchPad;
