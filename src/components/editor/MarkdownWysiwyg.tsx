import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { Bold, Code, Code2, Heading1, Heading2, Heading3, Italic, List, ListChecks, ListOrdered, Minus, Quote, Redo2, Strikethrough, Underline as UnderlineIcon, Undo2 } from "lucide-react";
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { MarkdownPaste, detectContentType } from "./markdownPaste";

interface MarkdownWysiwygProps {
  initialTitle?: string;
  initialBody?: string;
  onChange?: (data: { title: string; body: string }) => void;
  showTitleInput?: boolean;
  className?: string;
  placeholder?: string;
  variant?: 'notes' | 'tasks' | 'default';
  ref?: React.Ref<{ getCurrentContent: () => string }>;
  showPlaceholder?: boolean;
}

const MarkdownWysiwyg = React.forwardRef<{ getCurrentContent: () => string }, MarkdownWysiwygProps>(({
  initialTitle = "",
  initialBody = "",
  onChange,
  showTitleInput = true,
  className = "",
  placeholder = "Enter task description...",
  variant = 'default',
  showPlaceholder = true,
}, ref) => {
  const [title, setTitle] = useState(initialTitle);

  // Configure editor based on variant
  const getEditorConfig = () => {
    switch (variant) {
      case 'notes':
        return {
          placeholder: showPlaceholder ? (placeholder || "Start writing your note...") : "",
          minHeight: "min-h-[200px] sm:min-h-[250px]",
          border: "",
          extensions: showPlaceholder ?
            [StarterKit, Placeholder.configure({ placeholder: placeholder || "Start writing your note..." })] :
            [StarterKit]
        };
      case 'tasks':
        return {
          placeholder: placeholder || "Describe your task in detail (supports markdown formatting)",
          minHeight: "min-h-[80px] sm:min-h-[100px]",
          border: "border-2 border-(--border-primary) rounded-lg focus-within:ring-2 focus-within:ring-(--accent-primary)/30 focus-within:border-(--accent-primary) transition-all",
          extensions: [StarterKit, Placeholder.configure({ placeholder: placeholder || "Describe your task in detail (supports markdown formatting)" })]
        };
      default:
        return {
          placeholder: placeholder || "Enter task description...",
          minHeight: "min-h-[120px] sm:min-h-[150px]",
          border: "",
          extensions: [StarterKit, Placeholder.configure({ placeholder: placeholder || "Enter task description..." })]
        };
    }
  };

  const config = getEditorConfig();
  // Last HTML this editor reported through onChange. When the parent echoes it back as
  // `initialBody` (e.g. after an autosave) we must NOT reset the document, or the caret jumps to the end.
  const lastEmittedRef = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [
      MarkdownPaste,
      StarterKit,
      Markdown.configure({ markedOptions: { gfm: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      ...config.extensions.filter((ext) => ext !== StarterKit),
    ],
    content: initialBody,
    contentType: detectContentType(initialBody),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmittedRef.current = html;
      onChange?.({ title, body: html });
    },
  });

  // Reactive toolbar state (active marks/nodes, history, word count)
  const ui = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      // The editor can already be destroyed (StrictMode remounts, hot reload, switching notes)
      if (!e || e.isDestroyed) return null;
      const text = e.getText().trim();
      return {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        code: e.isActive("code"),
        h1: e.isActive("heading", { level: 1 }),
        h2: e.isActive("heading", { level: 2 }),
        h3: e.isActive("heading", { level: 3 }),
        bullet: e.isActive("bulletList"),
        ordered: e.isActive("orderedList"),
        task: e.isActive("taskList"),
        quote: e.isActive("blockquote"),
        codeBlock: e.isActive("codeBlock"),
        focused: e.isFocused,
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
        words: text ? text.split(/\s+/).length : 0,
        chars: text.length,
      };
    },
  });

  const renderToolbar = () => {
    if (!editor || !ui) return null;
    const chain = () => editor.chain().focus();
    const Btn = ({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) => (
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={active ?? false}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-30 ${
          active ? "bg-(--accent-primary)/15 text-(--accent-primary)" : "text-(--text-secondary)"
        }`}
      >
        {children}
      </button>
    );
    const Sep = () => <span className="mx-1 h-5 w-px shrink-0 bg-(--border-primary)" aria-hidden="true" />;
    return (
      <div
        role="toolbar"
        aria-label="Formatting"
        className={`sticky top-0 z-20 mb-2 flex items-center gap-0.5 overflow-x-auto rounded-lg border border-(--border-primary) bg-(--bg-secondary)/95 px-1.5 py-1 backdrop-blur-md hide-scrollbar transition-opacity duration-200 ${ui.focused ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <Btn label="Undo (Ctrl+Z)" disabled={!ui.canUndo} onClick={() => chain().undo().run()}><Undo2 size={16} /></Btn>
        <Btn label="Redo (Ctrl+Y)" disabled={!ui.canRedo} onClick={() => chain().redo().run()}><Redo2 size={16} /></Btn>
        <Sep />
        <Btn label="Heading 1" active={ui.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()}><Heading1 size={17} /></Btn>
        <Btn label="Heading 2" active={ui.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}><Heading2 size={17} /></Btn>
        <Btn label="Heading 3" active={ui.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}><Heading3 size={17} /></Btn>
        <Sep />
        <Btn label="Bold (Ctrl+B)" active={ui.bold} onClick={() => chain().toggleBold().run()}><Bold size={16} /></Btn>
        <Btn label="Italic (Ctrl+I)" active={ui.italic} onClick={() => chain().toggleItalic().run()}><Italic size={16} /></Btn>
        <Btn label="Underline (Ctrl+U)" active={ui.underline} onClick={() => chain().toggleUnderline().run()}><UnderlineIcon size={16} /></Btn>
        <Btn label="Strikethrough" active={ui.strike} onClick={() => chain().toggleStrike().run()}><Strikethrough size={16} /></Btn>
        <Btn label="Inline code" active={ui.code} onClick={() => chain().toggleCode().run()}><Code size={16} /></Btn>
        <Sep />
        <Btn label="Bullet list" active={ui.bullet} onClick={() => chain().toggleBulletList().run()}><List size={17} /></Btn>
        <Btn label="Numbered list" active={ui.ordered} onClick={() => chain().toggleOrderedList().run()}><ListOrdered size={17} /></Btn>
        <Btn label="Task list" active={ui.task} onClick={() => chain().toggleTaskList().run()}><ListChecks size={17} /></Btn>
        <Sep />
        <Btn label="Quote" active={ui.quote} onClick={() => chain().toggleBlockquote().run()}><Quote size={16} /></Btn>
        <Btn label="Code block" active={ui.codeBlock} onClick={() => chain().toggleCodeBlock().run()}><Code2 size={16} /></Btn>
        <Btn label="Divider" onClick={() => chain().setHorizontalRule().run()}><Minus size={16} /></Btn>
      </div>
    );
  };

  // Update editor content when initialBody changes
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    // Our own change coming back from the parent: nothing to sync
    if (initialBody === lastEmittedRef.current) return;
    let currentHtml: string;
    try {
      currentHtml = editor.getHTML();
    } catch {
      return; // editor torn down between render and effect
    }
    if (initialBody !== currentHtml) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(initialBody, { emitUpdate: false, contentType: detectContentType(initialBody) });
      // Keep the caret where it was (clamped) instead of falling to the end
      const max = editor.state.doc.content.size;
      try {
        editor.commands.setTextSelection({ from: Math.min(from, max), to: Math.min(to, max) });
      } catch { /* selection outside the new document */ }
    }
  }, [editor, initialBody]);

  // Expose getCurrentContent method to parent
  useImperativeHandle(ref, () => ({
    getCurrentContent: () => (editor && !editor.isDestroyed ? editor.getHTML() : ""),
  }), [editor]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
      onChange?.({ title: e.target.value, body: editor?.getHTML() || "" });
    },
    [editor, onChange]
  );


  return (
    <div className={`flex flex-col h-full ${className}`}>
      {variant === 'notes' && renderToolbar()}
      {showTitleInput && (
        <input
          className="w-full px-4 py-3 bg-(--bg-primary) text-(--text-primary) placeholder-(--text-secondary) focus:outline-none text-xl sm:text-2xl font-bold border-b-2 border-transparent focus:border-(--accent-primary) transition-colors"
          type="text"
          placeholder="Note Title"
          value={title}
          onChange={handleTitleChange}
        />
      )}

      {/* Editor Content - With proper borders and styling */}
      <div className="flex-1 flex flex-col">
        <div className="relative flex-1">
          <div className={`relative ${variant === 'notes' ? 'py-2' : 'p-4'} bg-(--bg-primary) text-(--text-primary) focus:outline-none focus-within:outline-none ${config.minHeight} ${config.border || ''} cursor-text ${!showPlaceholder ? '[&_.ProseMirror_p.is-empty]:hidden [&_.ProseMirror_p.is-editor-empty]:hidden' : ''}`}>
            <EditorContent
              editor={editor}
              className="text-(--text-primary) focus:outline-none h-full cursor-text"
            />
            {!editor?.getText()?.trim() && variant === 'tasks' && (
              <div
                className="absolute top-4 left-4 cursor-text select-none pointer-events-none"
                onClick={() => editor?.commands.focus()}
              >
                <span className="text-(--text-secondary) text-base opacity-60">
                  Add task description here...
                </span>
              </div>
            )}
          </div>
        </div>
        {variant === 'notes' && ui && (
          <div className="fixed bottom-3 right-4 z-10 flex items-center gap-3 rounded-md bg-(--bg-secondary)/80 px-2 py-1 text-[11px] tabular-nums text-(--text-secondary) backdrop-blur">
            <span>{ui.words} {ui.words === 1 ? "word" : "words"}</span>
            <span>{ui.chars} chars</span>
          </div>
        )}
      </div>
    </div>
  );
});

MarkdownWysiwyg.displayName = 'MarkdownWysiwyg';

export default MarkdownWysiwyg;
