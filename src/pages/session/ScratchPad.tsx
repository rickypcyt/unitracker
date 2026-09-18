import { CheckCircle2, CheckSquare, Circle, Eraser, StickyNote } from "lucide-react";
import { memo, useRef, useState } from "react";

const STORAGE_KEY = "unitracker.scratchpad";

const loadNote = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
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
    text: checked && timeMatch ? timeMatch[1] : body,
    doneAt: checked && timeMatch ? timeMatch[2] : null,
  };
};

const ScratchPad = memo(() => {
  const [text, setText] = useState(loadNote);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastFocusedIndexRef = useRef(0);

  const handleChange = (value: string) => {
    setText(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // storage full or unavailable — keep in-memory only
    }
  };

  const lines = text === "" ? [] : text.split("\n");
  const lineCount = lines.length;

  const updateLine = (index: number, newLine: string) => {
    const next = [...lines];
    next[index] = newLine;
    handleChange(next.join("\n"));
  };

  const insertCheckbox = () => {
    // Insert on the currently focused line (or the last focused one,
    // since clicking the button moves focus away from the inputs)
    const active = document.activeElement;
    let index = inputRefs.current.findIndex(el => el === active);
    if (index === -1) index = lastFocusedIndexRef.current;
    if (index < 0 || index >= Math.max(lines.length, 1)) index = Math.max(0, lines.length - 1);

    const next = [...lines];
    const parsed = parseLine(next[index] ?? "");
    next[index] = parsed.type === "checkbox" ? parsed.text : `[ ] ${next[index] ?? ""}`;
    handleChange(next.join("\n"));
    requestAnimationFrame(() => {
      const el = inputRefs.current[index];
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    });
  };

  const toggleCheckbox = (index: number, parsed: ReturnType<typeof parseLine>) => {
    if (parsed.type !== "checkbox") return;
    if (parsed.checked) {
      updateLine(index, `[ ] ${parsed.text}`);
    } else {
      const time = new Date().toTimeString().slice(0, 5);
      updateLine(index, `[x] ${parsed.text} · ${time}`);
    }
  };

  const handleLineKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, parsed: ReturnType<typeof parseLine>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = [...lines];
      next.splice(index + 1, 0, "");
      handleChange(next.join("\n"));
      requestAnimationFrame(() => inputRefs.current[index + 1]?.focus());
    } else if (e.key === "Backspace" && parsed.text === "" && lines.length > 1) {
      e.preventDefault();
      const next = [...lines];
      next.splice(index, 1);
      handleChange(next.join("\n"));
      requestAnimationFrame(() => inputRefs.current[Math.max(0, index - 1)]?.focus());
    }
  };

  return (
    <div className="w-full h-full min-h-[220px] rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4 flex flex-col">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center pb-3">
        <div className="flex items-center gap-2 justify-self-start">
          <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10">
            <StickyNote size={18} className="text-[var(--accent-primary)]" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] leading-tight">
            Scratchpad
          </h3>
        </div>
        <button
          onClick={insertCheckbox}
          className="justify-self-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--accent-primary)]/10 transition-colors"
          title="Insert checkbox"
          aria-label="Insert checkbox"
        >
          <CheckSquare size={15} />
          Insert checkbox
        </button>
        <div className="flex items-center gap-2 justify-self-end">
          {lineCount > 0 && (
            <span className="text-xs text-[var(--text-secondary)] tabular-nums">
              {lineCount} line{lineCount !== 1 ? "s" : ""}
            </span>
          )}
          {text && (
            <button
              onClick={() => handleChange("")}
              className="p-2 rounded-full text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Clear note"
              aria-label="Clear note"
            >
              <Eraser size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 w-full min-h-[140px] rounded-xl bg-[var(--bg-secondary)]/50 p-3 pr-1.5 overflow-y-auto custom-scrollbar">
        {lines.length === 0 ? (
          <input
            ref={(el) => { inputRefs.current[0] = el; }}
            value=""
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => { lastFocusedIndexRef.current = 0; }}
            placeholder="What's on your mind? Dump it here…"
            spellCheck={false}
            className="scratchpad-textarea w-full bg-transparent text-base leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none"
          />
        ) : (
          lines.map((line, i) => {
            const parsed = parseLine(line);
            if (parsed.type === "checkbox") {
              return (
                <div key={i} className="flex items-center gap-2.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => toggleCheckbox(i, parsed)}
                    className="flex-shrink-0 cursor-pointer flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus:outline-none"
                    aria-label={parsed.checked ? "Mark as not done" : "Mark as done"}
                  >
                    {parsed.checked ? (
                      <CheckCircle2 size={19} strokeWidth={2.2} className="text-[var(--accent-primary)]" />
                    ) : (
                      <Circle size={19} strokeWidth={2.2} className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors" />
                    )}
                  </button>
                  <input
                    ref={(el) => { inputRefs.current[i] = el; }}
                    value={parsed.text}
                    onChange={(e) =>
                      updateLine(
                        i,
                        parsed.checked
                          ? `[x] ${e.target.value} · ${parsed.doneAt ?? new Date().toTimeString().slice(0, 5)}`
                          : `[ ] ${e.target.value}`
                      )
                    }
                    onKeyDown={(e) => handleLineKeyDown(e, i, parsed)}
                    onFocus={() => { lastFocusedIndexRef.current = i; }}
                    spellCheck={false}
                    placeholder="Task…"
                    className={`scratchpad-textarea flex-1 min-w-0 bg-transparent text-base leading-relaxed focus:outline-none placeholder:text-[var(--text-secondary)]/50 ${
                      parsed.checked
                        ? "text-[var(--text-secondary)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  />
                  {parsed.doneAt && (
                    <span className="text-xs text-[var(--text-secondary)] tabular-nums flex-shrink-0">
                      {parsed.doneAt}
                    </span>
                  )}
                </div>
              );
            }
            return (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                value={line}
                onChange={(e) => updateLine(i, e.target.value)}
                onKeyDown={(e) => handleLineKeyDown(e, i, parsed)}
                onFocus={() => { lastFocusedIndexRef.current = i; }}
                spellCheck={false}
                placeholder={i === 0 ? "What's on your mind? Dump it here…" : ""}
                className="scratchpad-textarea w-full bg-transparent text-base leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none py-0.5"
              />
            );
          })
        )}
      </div>
    </div>
  );
});

ScratchPad.displayName = "ScratchPad";

export default ScratchPad;
