import { EditorContent, useEditor } from "@tiptap/react";
import React, { useCallback, useEffect, useState } from "react";

import StarterKit from "@tiptap/starter-kit";

interface MarkdownWysiwygProps {
  initialTitle?: string;
  initialBody?: string;
  onChange?: (data: { title: string; body: string }) => void;
  showTitleInput?: boolean;
  className?: string;
  placeholder?: string;
}

const MarkdownWysiwyg: React.FC<MarkdownWysiwygProps> = ({
  initialTitle = "",
  initialBody = "",
  onChange,
  showTitleInput = true,
  className = "",
  placeholder = "Enter task description...",
}) => {
  const [title, setTitle] = useState(initialTitle);
  const editor = useEditor({
    extensions: [StarterKit],
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
          className="w-full px-3 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] text-lg font-semibold transition-colors "
          type="text"
          placeholder="Note Title"
          value={title}
          onChange={handleTitleChange}
        />
      )}
      
      {/* Editor Content - With proper borders and styling */}
      <div className="flex-1 flex flex-col">
        <div className="relative flex-1">
          <div 
            className={`absolute inset-0 px-3 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] min-h-[120px] sm:min-h-[150px] pointer-events-none ${
              editor?.getText().trim() === '' ? '' : 'opacity-0'
            }`}
          >
            <div className="text-[var(--text-secondary)] opacity-70">
              {placeholder}
            </div>
          </div>
          <div className="px-3 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] min-h-[120px] sm:min-h-[150px]">
            <EditorContent
              editor={editor}
              className="text-[var(--text-primary)] focus:outline-none h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownWysiwyg;
