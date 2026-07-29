# UniTracker — Task-Centric Architecture Roadmap

## Vision

> El usuario nunca debería pensar "ahora voy al módulo de tareas" o "ahora voy al calendario". Debería sentir que está trabajando en un objetivo, y que el calendario, las notas, el temporizador, las estadísticas y la IA aparecen automáticamente cuando son relevantes.

## Current State

- 6 independent modules: Study, Tasks, Planning, Analytics, Journal, Notes
- Sidebar navigation between isolated pages
- No shared context between modules
- Actions are siloed (completing a task doesn't update calendar/stats/notes)

## Target Architecture

```
                 User
                  │
            Workspace
                  │
             Subject
                  │
              Task
        ╱      │      ╲
       ╱       │       ╱
Calendar     Notes    Sessions
      ╲       │       ╱
       ╲      │      ╱
          Statistics
                  │
                 AI
```

---

## Phase 1: Foundation — Task Detail View (Week 1-2)

**Goal:** Prove the concept that a task can aggregate everything.

### 1.1 Task Detail Panel
- [ ] Create `TaskDetailView` component (slide-over or full view)
- [ ] Show task title, deadline, assignment, priority
- [ ] Embed mini-timer (start pomodoro directly from task)
- [ ] Show notes linked to this task's assignment
- [ ] Show calendar events for this task
- [ ] Show session history for this task
- [ ] Show progress (subtasks completed / total)
- [ ] "Start Focus Session" button → starts timer with this task as context

### 1.2 Task-Session Link
- [ ] Add `task_id` field to session records
- [ ] When starting a session from a task, link them
- [ ] Show "last studied: Xh ago" on task cards
- [ ] Show total study time per task in detail view

### 1.3 Task-Notes Link
- [ ] Filter notes by assignment in TaskDetailView
- [ ] "Add note" button creates note pre-filled with assignment context
- [ ] Show recent notes for this assignment inline

**Deliverable:** Click any task → see everything about it in one place.

---

## Phase 2: Global Context (Week 3)

**Goal:** The active workspace/subject propagates everywhere automatically.

### 2.1 Context Store
- [ ] Create `ActiveContext` in app store: `{ workspaceId, assignment, taskId }`
- [ ] When user selects a task → set `taskId` in context
- [ ] When user navigates away → context persists
- [ ] Sidebar shows current context ("Studying: Physics Midterm")

### 2.2 Context-Aware Creation
- [ ] New note → pre-fill assignment from context
- [ ] New task → pre-fill workspace + assignment from context
- [ ] New calendar event → pre-fill assignment from context
- [ ] New pomodoro → pre-link to context task
- [ ] Quick-add from FloatingFooter → uses context

### 2.3 Context Indicator
- [ ] Show active context badge in FloatingFooter
- [ ] Show context badge in Sidebar
- [ ] Allow clearing context ("Stop studying this")

**Deliverable:** User never has to re-select what they're working on.

---

## Phase 3: Flow — Start Focus (Week 4)

**Goal:** One action triggers a complete study environment.

### 3.1 Focus Flow Entry
- [ ] "Start Focus" button on task detail and task cards
- [ ] On click: set context → start timer → open notes panel → enable noise
- [ ] Optional: enter "Focus Mode" (hide sidebar, minimize distractions)

### 3.2 Focus Session UI
- [ ] Split view: Timer on left, Notes on right
- [ ] Task title visible at top
- [ ] Subtask checklist visible
- [ ] Noise generator collapsed in corner
- [ ] "End Session" button always accessible

### 3.3 Post-Session Flow
- [ ] On session end: show summary (time, pomodoros, focus score)
- [ ] Suggest next actions: "Continue", "Review Notes", "Take Break", "Mark Complete"
- [ ] Update task progress automatically
- [ ] Update calendar (mark study block as done)
- [ ] Update stats in real-time

**Deliverable:** User clicks one button and everything is set up for studying.

---

## Phase 4: Domino Effect (Week 5-6)

**Goal:** Every action cascades across the system.

### 4.1 Complete Task Cascade
- [ ] Mark task complete → update calendar event status
- [ ] → update assignment progress
- [ ] → update workspace stats
- [ ] → update daily goal
- [ ] → update streak
- [ ] → cancel related notifications
- [ ] → trigger achievement check
- [ ] → update analytics dashboard
- [ ] → AI logs completion for recommendations

### 4.2 Create Task Cascade
- [ ] Create task with deadline → auto-create calendar event
- [ ] → suggest study blocks based on deadline + available time
- [ ] → set default reminder
- [ ] → link to assignment

### 4.3 Session End Cascade
- [ ] End session → update task study time
- [ ] → update daily/weekly stats
- [ ] → update streak
- [ ] → suggest next study block
- [ ] → update calendar (actual vs planned time)

**Deliverable:** One user action = 5-10 system updates. App feels alive.

---

## Phase 5: AI Integration (Week 7-8)

**Goal:** The app proactively helps, not just records.

### 5.1 Study Plan Generation
- [ ] User creates exam/deadline → AI asks "How much do you know?"
- [ ] AI generates study plan: N blocks distributed across available days
- [ ] Auto-create tasks, calendar events, reminders
- [ ] User reviews and accepts/edits

### 5.2 Smart Suggestions
- [ ] "You're behind on Physics — schedule 2h today?"
- [ ] "You study best at 4 PM — want to start now?"
- [ ] "You haven't reviewed Calculus notes in 5 days"
- [ ] Post-session: "Great focus! Next: Review Chapter 5 notes"

### 5.3 Weekly Review
- [ ] Sunday: auto-generate weekly summary
- [ ] Hours studied, tasks completed, streak, goals
- [ ] AI suggests reorganization for next week
- [ ] One-click accept

**Deliverable:** App feels like a study companion, not a tracker.

---

## Phase 6: Polish & Refinement (Week 9-10)

### 6.1 Progressive Disclosure
- [ ] Task cards show minimal info by default
- [ ] Hover reveals priority, estimate, labels
- [ ] Click opens full detail view
- [ ] No more than 7 fields visible at once

### 6.2 Natural Actions
- [ ] Select text in note → context menu: "Create Task", "Schedule", "Explain with AI"
- [ ] Drag task to calendar → creates event
- [ ] Drag note to task → links them
- [ ] Long-press task → quick actions menu

### 6.3 Navigation Disappears
- [ ] Remove explicit module navigation
- [ ] Home = "What should I do now?" (AI-driven)
- [ ] Everything reachable from task context
- [ ] Sidebar becomes optional / collapsible to icon-only

### 6.4 Mobile Optimization
- [ ] Focus mode fills screen
- [ ] Swipe gestures for task actions
- [ ] Bottom sheet for task detail
- [ ] Quick-add from anywhere

---

## Technical Considerations

### Data Model Changes
- `sessions` table: add `task_id`, `assignment` fields
- `notes` table: ensure `assignment` field is indexed
- New: `study_blocks` table (AI-generated study plan items)
- New: `context_log` table (track what user is working on over time)

### State Management
- `ActiveContext` slice in app store
- Event bus for domino effects (action → N reactions)
- Or: use observer pattern on task/session/note mutations

### Performance
- Task detail view loads data lazily (only when opened)
- Context propagation via React context, not prop drilling
- Domino effects should be async (don't block UI)

---

## Success Metrics

- [ ] User can start a full study session in ≤2 clicks
- [ ] Completing a task updates 5+ systems automatically
- [ ] User never re-selects workspace/assignment when creating new items
- [ ] AI suggestions have >30% acceptance rate
- [ ] Mobile flow: start focus in ≤3 taps
