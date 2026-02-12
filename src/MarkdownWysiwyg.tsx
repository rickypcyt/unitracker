import { EditorContent, useEditor } from "@tiptap/react";
import React, { useCallback, useEffect, useImperativeHandle, useState } from "react";

import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";

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
          minHeight: "min-h-[120px] sm:min-h-[150px]",
          border: "border-2 border-[var(--border-primary)] rounded-lg",
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

  const editor = useEditor({
    extensions: config.extensions,
    content: initialBody,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.({ title, body: html });
    },
  });

  // Update editor content when initialBody changes
  useEffect(() => {
    if (editor && initialBody !== editor.getHTML()) {
      editor.commands.setContent(initialBody);
    }
  }, [editor, initialBody]);

  // Expose getCurrentContent method to parent
  useImperativeHandle(ref, () => ({
    getCurrentContent: () => editor?.getHTML() || "",
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
      {showTitleInput && (
        <input
          className="w-full px-4 py-3 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none text-xl sm:text-2xl font-bold border-b-2 border-transparent focus:border-[var(--accent-primary)] transition-colors"
          type="text"
          placeholder="Note Title"
          value={title}
          onChange={handleTitleChange}
        />
      )}

      {/* Editor Content - With proper borders and styling */}
      <div className="flex-1 flex flex-col">
        <div className="relative flex-1">
          <div className={`relative p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus-within:outline-none ${config.minHeight} ${config.border || ''} cursor-text ${!showPlaceholder ? '[&_.ProseMirror_p.is-empty]:hidden [&_.ProseMirror_p.is-editor-empty]:hidden' : ''}`}>
            <EditorContent
              editor={editor}
              className="text-[var(--text-primary)] focus:outline-none h-full cursor-text"
            />
            {!editor?.getText()?.trim() && variant === 'tasks' && (
              <div
                className="absolute top-4 left-4 cursor-text select-none pointer-events-none"
                onClick={() => editor?.commands.focus()}
              >
                <span className="text-[var(--text-secondary)] text-base opacity-60">
                  Add task description here...
                </span>
              </div>
            )}
            {!editor?.getText()?.trim() && variant === 'notes' && showPlaceholder && (
              <div
                className="absolute inset-0 flex items-center justify-center cursor-text select-none"
                onClick={() => editor?.commands.focus()}
              >
                <span className="text-[var(--text-secondary)] text-sm opacity-60 hover:opacity-80 transition-opacity">
                  Click here to start writing...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MarkdownWysiwyg.displayName = 'MarkdownWysiwyg';

export default MarkdownWysiwyg;
