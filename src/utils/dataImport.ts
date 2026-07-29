import type { Task } from '@/types/taskStorage';

// -------------------------
// Types
// -------------------------

export interface ImportedTask {
  title: string;
  description?: string | undefined;
  due_date?: string | null | undefined;
  priority?: number | undefined;
  tags?: string[] | undefined;
  completed?: boolean | undefined;
  assignment?: string | undefined;
  difficulty?: string | undefined;
}

export type ImportSource = 'csv' | 'notion' | 'todoist' | 'google-calendar';

export interface ImportResult {
  tasks: ImportedTask[];
  source: ImportSource;
  count: number;
}

// -------------------------
// CSV Parser
// -------------------------

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\r') {
        // skip
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter(row => row.some(cell => cell.trim() !== ''));
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/\s+/g, '_').replace(/-/g, '_');
}

// -------------------------
// Generic CSV Import
// -------------------------

export function importFromCSV(csvText: string): ImportResult {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    return { tasks: [], source: 'csv', count: 0 };
  }

  const headers = rows[0]?.map(normalizeHeader) ?? [];
  const dataRows = rows.slice(1);

  const tasks: ImportedTask[] = [];

  for (const row of dataRows) {
    const get = (names: string[]): string => {
      for (const name of names) {
        const idx = headers.indexOf(name);
        if (idx >= 0 && row[idx]) return row[idx].trim();
      }
      return '';
    };

    const title = get(['title', 'name', 'task', 'subject', 'content']);
    if (!title) continue;

    const tagsStr = get(['tags', 'labels', 'categories']);
    const dueDate = get(['due_date', 'deadline', 'due', 'date', 'end_date']);
    const priorityStr = get(['priority', 'urgency']);
    const completedStr = get(['completed', 'status', 'done', 'checked']);
    const isCompleted = ['yes', 'true', '1', 'done', 'completed', 'x', 'checked'].includes(
      completedStr.toLowerCase()
    );

    const task: ImportedTask = {
      title,
      due_date: dueDate || null,
      completed: isCompleted,
    };

    const desc = get(['description', 'notes', 'details', 'content']);
    if (desc) task.description = desc;

    const assignment = get(['assignment', 'project', 'workspace', 'section']);
    if (assignment) task.assignment = assignment;

    const difficulty = get(['difficulty', 'priority_level']);
    if (difficulty) task.difficulty = difficulty;

    if (priorityStr) {
      const p = parseInt(priorityStr);
      if (!isNaN(p)) task.priority = p;
    }

    if (tagsStr) {
      const tags = tagsStr.split(';').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) task.tags = tags;
    }

    tasks.push(task);
  }

  return { tasks, source: 'csv', count: tasks.length };
}

// -------------------------
// Notion JSON Import
// -------------------------

interface NotionProperty {
  type: string;
  title?: { plain_text: string }[];
  rich_text?: { plain_text: string }[];
  select?: { name: string } | null;
  multi_select?: { name: string }[];
  date?: { start: string } | null;
  checkbox?: boolean;
  number?: number;
  status?: { name: string } | null;
}

interface NotionPage {
  properties: Record<string, NotionProperty>;
}

interface NotionExport {
  results: NotionPage[];
}

export function importFromNotion(jsonText: string): ImportResult {
  const data: NotionExport = JSON.parse(jsonText);
  if (!data.results || !Array.isArray(data.results)) {
    return { tasks: [], source: 'notion', count: 0 };
  }

  const tasks: ImportedTask[] = [];

  for (const page of data.results) {
    const props = page.properties;
    if (!props) continue;

    let title = '';
    for (const key of Object.keys(props)) {
      const prop = props[key];
      if (prop?.type === 'title' && prop.title) {
        title = prop.title.map(t => t.plain_text).join('');
        break;
      }
    }

    if (!title) continue;

    const getProp = (name: string): string => {
      const prop = props[name];
      if (!prop) return '';
      if (prop.rich_text) return prop.rich_text.map(t => t.plain_text).join('');
      if (prop.select) return prop.select?.name ?? '';
      if (prop.status) return prop.status?.name ?? '';
      return '';
    };

    const getDate = (name: string): string => {
      const prop = props[name];
      return prop?.date?.start ?? '';
    };

    const getCheckbox = (name: string): boolean => {
      const prop = props[name];
      return prop?.checkbox ?? false;
    };

    const getMultiSelect = (name: string): string[] => {
      const prop = props[name];
      return prop?.multi_select?.map(s => s.name) ?? [];
    };

    const dueDate = getDate('Due Date') || getDate('Deadline') || getDate('Date');
    const tags = getMultiSelect('Tags') || getMultiSelect('Labels');
    const assignment = getProp('Assignment') || getProp('Project') || getProp('Subject');
    const difficulty = getProp('Difficulty') || getProp('Priority');
    const completed = getCheckbox('Done') || getCheckbox('Completed') ||
      getProp('Status')?.toLowerCase() === 'done';

    const task: ImportedTask = {
      title,
      due_date: dueDate || null,
      completed,
    };

    const desc = getProp('Description') || getProp('Notes');
    if (desc) task.description = desc;
    if (assignment) task.assignment = assignment;
    if (difficulty) task.difficulty = difficulty;
    if (tags.length > 0) task.tags = tags;

    tasks.push(task);
  }

  return { tasks, source: 'notion', count: tasks.length };
}

// -------------------------
// Todoist CSV Import
// -------------------------

export function importFromTodoist(csvText: string): ImportResult {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    return { tasks: [], source: 'todoist', count: 0 };
  }

  const headers = rows[0]?.map(normalizeHeader) ?? [];
  const dataRows = rows.slice(1);

  const tasks: ImportedTask[] = [];

  for (const row of dataRows) {
    const get = (names: string[]): string => {
      for (const name of names) {
        const idx = headers.indexOf(name);
        if (idx >= 0 && row[idx]) return row[idx].trim();
      }
      return '';
    };

    const type = get(['type']);
    if (type.toLowerCase() === 'section' || type.toLowerCase() === 'note') continue;

    const content = get(['content', 'task', 'title', 'name']);
    if (!content) continue;

    const task: ImportedTask = {
      title: content,
      due_date: get(['date', 'due_date', 'deadline']) || null,
      completed: false,
    };

    const desc = get(['description', 'notes']);
    if (desc) task.description = desc;

    const priorityStr = get(['priority']);
    if (priorityStr) {
      const p = parseInt(priorityStr);
      if (!isNaN(p)) task.priority = p;
    }

    const labelsStr = get(['labels']);
    if (labelsStr) {
      const tags = labelsStr.split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) task.tags = tags;
    }

    tasks.push(task);
  }

  return { tasks, source: 'todoist', count: tasks.length };
}

// -------------------------
// Google Calendar ICS Import
// -------------------------

export function importFromGoogleCalendar(icsText: string): ImportResult {
  const lines = icsText.split(/\r?\n/);
  const tasks: ImportedTask[] = [];

  let inEvent = false;
  let title = '';
  let description = '';
  let startDate = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      title = '';
      description = '';
      startDate = '';
    } else if (trimmed === 'END:VEVENT') {
      if (inEvent && title) {
        const task: ImportedTask = {
          title,
          due_date: startDate || null,
          completed: false,
        };
        if (description) task.description = description;
        tasks.push(task);
      }
      inEvent = false;
    } else if (inEvent) {
      if (trimmed.startsWith('SUMMARY:')) {
        title = trimmed.slice(8).replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');
      } else if (trimmed.startsWith('DESCRIPTION:')) {
        description = trimmed.slice(12).replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');
      } else if (trimmed.startsWith('DTSTART')) {
        const match = trimmed.match(/DTSTART(?:;[^:]*)?:(.+)$/);
        if (match && match[1]) {
          const dateStr = match[1];
          if (dateStr.includes('T')) {
            const iso = dateStr
              .replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/, '$1-$2-$3T$4:$5:$6Z');
            startDate = iso;
          } else if (dateStr.length === 8) {
            startDate = dateStr.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
          }
        }
      }
    }
  }

  return { tasks, source: 'google-calendar', count: tasks.length };
}

// -------------------------
// File reader helper
// -------------------------

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// -------------------------
// Convert ImportedTask to Task format for store insertion
// -------------------------

export function importedTaskToTask(
  imported: ImportedTask,
  userId: string,
  workspaceId?: string
): Omit<Task, 'id'> {
  const task: Omit<Task, 'id'> = {
    title: imported.title,
    completed: imported.completed ?? false,
    completed_at: imported.completed ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
    user_id: userId,
    recurrence_type: 'none',
  };

  if (workspaceId) task.workspace_id = workspaceId;

  if (imported.description) task.description = imported.description;
  if (imported.due_date) {
    task.due_date = imported.due_date;
    task.deadline = imported.due_date;
  }
  if (imported.priority !== undefined) task.priority = imported.priority;
  if (imported.tags) task.tags = imported.tags;
  if (imported.assignment) task.assignment = imported.assignment;
  if (imported.difficulty) task.difficulty = imported.difficulty;

  return task;
}
