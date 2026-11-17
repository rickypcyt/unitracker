import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

export const looksLikeMarkdown = (text: string): boolean => {
  return (
    /(^|\n)\s{0,3}#{1,6}\s/.test(text) || // headings
    /(^|\n)\s*[-*+]\s+\[[ xX]\]/.test(text) || // task list items
    /(^|\n)\s*[-*+]\s+\S/.test(text) || // bullet lists
    /(^|\n)\s*\d+\.\s+\S/.test(text) || // ordered lists
    /(^|\n)\s*>\s?/.test(text) || // blockquotes
    /```/.test(text) || // code fences
    /(^|\n)\s*(-{3,}|\*{3,}|_{3,})\s*($|\n)/.test(text) || // horizontal rules
    /\*\*[^*\n]+\*\*/.test(text) || // bold
    /(^|\n)\s*\|[^\n]*\|\s*(\n\s*\|?[\s:|-]+\|?)/.test(text) // tables
  );
};

export const detectContentType = (content: string): 'html' | 'markdown' => {
  if (!content) return 'html';
  return /<\/?[a-z][\s\S]*>/i.test(content) ? 'html' : 'markdown';
};

export const plainTextToDoc = (text: string) => {
  const paragraphs = text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return {
    type: 'doc',
    content: paragraphs.map((paragraph) => ({
      type: 'paragraph',
      content: paragraph.split('\n').flatMap((line, index) => {
        const nodes: Array<Record<string, unknown>> = [];
        if (index > 0) nodes.push({ type: 'hardBreak' });
        if (line.length > 0) nodes.push({ type: 'text', text: line });
        return nodes;
      }),
    })),
  };
};

const INLINE_TYPES = new Set(['text', 'hardBreak']);

// @tiptap/markdown emits listItems with bare inline content for nested
// lists inside task items; wrap inline runs in paragraphs to satisfy the schema.
export const sanitizeMarkdownJson = (node: unknown): unknown => {
  if (Array.isArray(node)) return node.map(sanitizeMarkdownJson);
  if (!node || typeof node !== 'object') return node;

  const record = node as { type?: string; content?: unknown };
  const content = record.content !== undefined ? sanitizeMarkdownJson(record.content) : record.content;

  if (record.type === 'listItem' && Array.isArray(content)) {
    const wrapped: unknown[] = [];
    let inlineRun: unknown[] = [];
    const flush = () => {
      if (inlineRun.length > 0) {
        wrapped.push({ type: 'paragraph', content: inlineRun });
        inlineRun = [];
      }
    };
    for (const child of content as Array<{ type?: string }>) {
      if (child && typeof child === 'object' && INLINE_TYPES.has(child.type ?? '')) {
        inlineRun.push(child);
      } else {
        flush();
        wrapped.push(child);
      }
    }
    flush();
    return { ...record, content: wrapped.length > 0 ? wrapped : [{ type: 'paragraph' }] };
  }

  return { ...record, content };
};

export const MarkdownPaste = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    const { editor } = this;
    return [
      new Plugin({
        props: {
          handlePaste: (_view, event) => {
            const text = event.clipboardData?.getData('text/plain');
            if (!text) return false;

            if (looksLikeMarkdown(text)) {
              const json = editor.markdown?.parse(text);
              const content = (json as { content?: unknown } | undefined)?.content ?? json;
              if (content) {
                editor.commands.insertContent(sanitizeMarkdownJson(content) as never);
                return true;
              }
              return false;
            }

            if (text.includes('\n')) {
              editor.commands.insertContent(plainTextToDoc(text) as never);
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});
