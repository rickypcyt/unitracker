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
        className="border border-[var(--accent-primary)] bg-black text-[var(--text-primary)] rounded px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
        type="text"
        placeholder="Título de la nota"
        value={title}
        onChange={handleTitleChange}
      />
      <div className="border border-[var(--accent-primary)] rounded bg-black">
        <EditorContent editor={editor} className="min-h-[120px] px-3 py-2 text-[var(--text-primary)] focus:outline-none" />
      </div>
    </div>
  );
};

export default MarkdownWysiwyg;
