import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import { MarkdownPaste } from './markdownPaste';

const createEditor = () =>
  new Editor({
    element: document.createElement('div'),
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
    ],
    content: '',
  });

const fakePasteEvent = (text: string) => ({
  clipboardData: { getData: (t: string) => (t === 'text/plain' ? text : '') },
});

const SAMPLE = `# 2025 Anime Watchlist

## 1. Currently Watching

- [ ] **Hunter x Hunter (2011)**
  - 148 episodes
  - 1 season

## 3. Planned Watchlist

### Psychological

- [ ] **Made in Abyss**
  - 13 episodes + 2 main movies

---

## 5. Watchlist Statistics

| Category | Total |
|---|---:|
| Currently Watching | 2 anime |
| Total | 16 anime |

*Note: Watch times are approximate.*`;

describe('markdown paste', () => {
  it('parses headings, task lists, hr, tables', () => {
    const editor = createEditor();
    const json = editor.markdown!.parse(SAMPLE);
    const types = JSON.stringify(json);
    expect(types).toContain('heading');
    expect(types).toContain('taskList');
    expect(types).toContain('taskItem');
    expect(types).toContain('table');
    expect(types).toContain('horizontalRule');
    editor.destroy();
  });

  it('handlePaste inserts parsed markdown at cursor', () => {
    const editor = createEditor();
    (editor.view as any).pasteText(SAMPLE, fakePasteEvent(SAMPLE));
    const html = editor.getHTML();
    expect(html).toContain('<h1');
    expect(html).toContain('data-type="taskList"');
    expect(html).toContain('<table');
    expect(html).toContain('<h3');
    editor.destroy();
  });

  it('plain text paste preserves blank lines and single newlines', () => {
    const editor = createEditor();
    const text = 'Intro line one\nline two\n\nSecond paragraph\n\n\nThird paragraph';
    (editor.view as any).pasteText(text, fakePasteEvent(text));
    const json = editor.getJSON();
    const paragraphs = json.content!.filter((n: any) => n.type === 'paragraph');
    expect(paragraphs.length).toBe(3);
    const first = JSON.stringify(paragraphs[0]);
    expect(first).toContain('hardBreak');
    editor.destroy();
  });
});
