# UniTracker Engineering & Product Standards

> The user never thinks "now I go to the tasks module". They feel they're working on a goal, and everything else appears when relevant.

## Core Principles

### 1. Single Source of Truth
Each piece of data exists exactly once. Everything else references it.
```
Task
├── Calendar Event (references task_id)
├── Notes (references assignment)
├── Study Sessions (references task_id)
├── Analytics (derived from sessions + tasks)
└── AI Planning (references task_id)
```

### 2. Everything is Connected
No independent modules. A session knows its task, workspace, subject, and notes. Completing a session cascades updates to calendar, stats, streak, progress, and AI — without user intervention.

### 3. Never Ask Twice
If a task belongs to Physics, creating a note, starting a pomodoro, or making a calendar event auto-fills Physics. Context propagates everywhere.

### 4. Zero Friction
Any important action takes ≤2 clicks. Create task: `+` → type title → `Enter`. No giant forms for simple operations.

### 5. Everything is Reversible
Delete → trash/undo. Never permanent deletion without recovery.

### 6. Autosave Everything
No save buttons. No apply buttons. Everything persists on change. Always.

### 7. Never Lose Data
Browser closes → timers, notes, drafts, forms survive. Persist to localStorage immediately, sync to Supabase async.

### 8. Offline First
App feels instant even without internet. Local-first, sync later.

### 9. Optimistic UI
Mark task complete → UI updates instantly. Don't wait for Supabase. Rollback on error.

### 10. <150ms Response
If slower → skeleton/loading/optimistic. Never block the user.

### 11. Everything is Searchable
Ctrl+K searches tasks, notes, workspaces, sessions, habits, commands. Everything.

### 12. Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `N` | New note |
| `T` | New task |
| `P` | New pomodoro |
| `/` | Search |
| `Ctrl+K` | Command palette |
| `Ctrl+Shift+P` | Planner |

### 13. No Duplicate Components
One `TaskDialog` with `mode: create | edit | duplicate`. Not `TaskModal`, `TaskModal2`, `QuickTaskModal`.

### 14. Single Responsibility Components
No 3500-line files. Split into focused sub-components.
```
CalendarGrid | CalendarSidebar | CalendarToolbar | CalendarFilters | CalendarEvents
```

### 15. Defined States
Every async operation has: `idle | loading | success | error | offline | empty`. Never boolean flags.

### 16. Feature Definition Required
Every feature must answer:
- What is it?
- What can it do?
- Who modifies it?
- What depends on it?
- What events does it generate?
- What analytics does it update?

---

## Code Rules (Non-negotiable)

| Rule | Limit |
|------|-------|
| Max component size | 300 lines |
| Max hook size | 250 lines |
| Max function size | 40 lines (without clear reason) |
| DB structure knowledge | Only in data access layer |
| Type safety | TypeScript strict + Zod validation |
| Action return type | Typed result (`success`, `error`, `validation_error`), never `null`/`undefined` |
| Tests + telemetry | Required for every new feature |
| Measurable impact | Every change must answer: "How do we know this improves UX?" |

---

## Feature Standards

### Calendar (Google Calendar level)
- Drag & drop, resize, recurring, colors
- Views: month, week, day, agenda, timeline
- Overlapping events, timezone, reminders
- Keyboard navigation, quick create
- Study Blocks: move block → all linked tasks move too

### Notes (Obsidian + Notion level)
- Wiki-links: `[[Physics]]`
- Link to tasks, exams, sessions, workspaces
- Images, tables, equations, Mermaid, code snippets
- Backlinks
- Autosave, offline, instant search

### Task Management (Linear level)
- Fields: title, description, priority, status, estimate, actual time, deadline, workspace, subject, tags, dependencies, recurring, attachments
- Linked: notes, calendar event, study sessions, progress, subtasks, activity log
- Complete task → cascades to analytics, calendar, daily goal, workspace, notifications

### Time Tracking (Beyond competitors)
- Session records: started, ended, paused, interruptions, avg focus, pomodoros, task, workspace, subject, device, mood, energy, notes, tags, music, productivity rating

### Analytics (Answers questions, not just charts)
- When do I study best?
- Which subject am I neglecting?
- How many hours to be ready for exam?
- When do I procrastinate?
- Best days? Worst days?
- Estimate vs actual time?
- Which habits improve productivity?

### AI (Permanent copilot)
- "Organize my week based on exams"
- "Replan everything, I can't study tomorrow"
- "I have 10 free hours before Friday — distribute my tasks"
- "What should I study today to maximize exam readiness?"
- "Summarize what I achieved this week"

---

## Architecture Vision

Not "best Pomodoro" + "best calendar" + "best task manager".
Build the **best operating system for students** where all pieces share a single data model and work together.

The user interacts with one intelligent system that knows their goals, available time, subjects, habits, and progress — and helps them decide what to do at each moment.

That integration is far harder to replicate than independent tools, and is where UniTracker differentiates.
