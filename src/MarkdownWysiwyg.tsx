import { EditorContent, useEditor } from "@tiptap/react";
import React, { useCallback, useState } from "react";

import StarterKit from "@tiptap/starter-kit";

// Quitamos import de tiptap-markdown

interface MarkdownWysiwygProps {
  initialTitle?: string;
  initialBody?: string;
  onChange?: (data: { title: string; body: string }) => void;
  className?: string;
}

const MarkdownWysiwyg: React.FC<MarkdownWysiwygProps> = ({
  initialTitle = "",
  initialBody = "",
  onChange,
  className = "",
}) => {
  const [title, setTitle] = useState(initialTitle);
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialBody,
    onUpdate: ({ editor }) => {
      onChange?.({ title, body: editor.getHTML() });
    },
  });

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
      onChange?.({ title: e.target.value, body: editor?.getHTML() || "" });
    },
    [editor, onChange]
  );

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <input
        className="w-full px-3 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] text-lg font-semibold transition-colors"
        type="text"
        placeholder="Note Title"
        value={title}
        onChange={handleTitleChange}
      />
      <div className="border-2 border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] focus-within:border-[var(--accent-primary)] transition-colors">
        <EditorContent editor={editor} className="min-h-[120px] px-3 py-2 text-[var(--text-primary)] focus:outline-none" />
      </div>
    </div>
  );
};

export default MarkdownWysiwyg;
