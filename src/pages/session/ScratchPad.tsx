import { CheckCircle2, CheckSquare, Circle, Eraser, StickyNote } from "lucide-react";
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

const saveLocal = (value: string) => {
  try {
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

const ScratchPad = memo(() => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [text, setText] = useState(loadNote);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteDisabledRef = useRef(false);

  const remoteSave = async (userId: string, value: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ scratchpad: value })
      .eq("id", userId);
    // Column missing or request failed — stay local-only from here on
    if (error) remoteDisabledRef.current = true;
  };

  // Pull the user's saved note on login; migrate the local one if the cloud copy is empty
  useEffect(() => {
    if (!user?.id || remoteDisabledRef.current) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("scratchpad")
        .eq("id", user.id)
        .single();
      if (cancelled) return;
      if (error) {
        remoteDisabledRef.current = true;
        return;
      }
      const remote = (data?.scratchpad as string | null) ?? "";
      if (remote) {
        if (remote !== loadNote()) {
          setText(remote);
          saveLocal(remote);
        }
      } else {
        const local = loadNote();
        if (local) await remoteSave(user.id, local);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleChange = (value: string) => {
    setText(value);
    saveLocal(value);
    if (user?.id && !remoteDisabledRef.current) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void remoteSave(user.id, value);
      }, 800);
    }
  };

  const lines = text === "" ? [] : text.split("\n");
  const parsedLines = lines.map(parseLine);
  const totalTodos = parsedLines.filter(p => p.type === "checkbox").length;
  const doneTodos = parsedLines.filter(p => p.type === "checkbox" && p.checked).length;
  const progress = totalTodos > 0 ? Math.round((doneTodos / totalTodos) * 100) : 0;

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
        return Number(icon.dataset.checkbox);
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

  const handleSurfaceMouseDown = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const index = checkboxAt(e.clientX, e.clientY);
    if (index === null) return;
    e.preventDefault();
    toggleLine(index);
  };

  const handleSurfaceMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.cursor = checkboxAt(e.clientX, e.clientY) !== null ? "pointer" : "text";
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
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-3">
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
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCheckboxInSelection}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)]"
            title={t('session.scratchpad.insertCheckbox')}
            aria-label={t('session.scratchpad.insertCheckbox')}
          >
            <CheckSquare size={15} />
          </button>
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

      {/* Progress */}
      {totalTodos > 0 && (
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]" aria-hidden="true">
          <div
            className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

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
              <div key={i}>
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
