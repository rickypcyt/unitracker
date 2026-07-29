# UniTracker

**6 apps in 1 — replace your entire study stack.**

UniTracker is a free, open-source, all-in-one study app that combines a Pomodoro timer, task manager, calendar, analytics, notes, and habit tracker into a single, cohesive experience. No more jumping between tabs or paying for multiple subscriptions.

> In active development since **December 2024**.

---

## Features

### Timers
- **Pomodoro Timer** — Customizable work/break intervals with sound alerts and notifications.
- **Study Timer** — Track total study time across sessions.
- **Countdown Timer** — Set a target time and count down with alarm support.
- **Timer Sync** — Link timers together so starting one starts the others.

### Task Management
- **Kanban Board** — Drag-and-drop tasks organized by assignment with pinning, sorting, and difficulty levels.
- **AI Task Creation** — Generate tasks automatically using AI.
- **Assignments** — Group tasks by subject/assignment with progress tracking.
- **Tags & Deadlines** — Flexible labeling and due date support.

### Calendar
- **Unified View** — Tasks and study sessions displayed together in a monthly, weekly, or daily calendar.
- **Google Calendar Export** — Export your schedule in one click.

### Analytics
- **Study Stats** — Visualize study time, pomodoros completed, and session frequency.
- **Streaks** — Track daily study consistency and build momentum.
- **Productivity Trends** — Charts powered by Recharts and Chart.js.

### Notes & Habits
- **Markdown Notes** — Rich text editor with live preview (powered by TipTap).
- **Habit Tracker** — Build study habits with daily tracking and streak visualization.

### Noise Generator
- **Ambient Sounds** — Brown noise, rain, ocean waves, and more with individual volume control.
- **Sound Presets** — Save and load your favorite sound combinations.
- **Audio Synthesis** — All sounds generated in-browser using Tone.js — no audio files needed.

### Other
- **Dark Mode** — Full theme support with CSS custom properties.
- **Offline Support** — Install as a PWA and use without a connection. Data syncs when you're back online.
- **Data Export** — Export your data as CSV, PDF, or JSON.
- **Cross-Platform** — Web, Android (via Capacitor), and installable PWA.

---

## Tech Stack

| Category | Technology |
| --- | --- |
| **Framework** | React 18 with TypeScript |
| **Build Tool** | Vite (with SWC for fast compilation) |
| **Styling** | Tailwind CSS 3.4 with CSS custom properties for theming |
| **State Management** | Zustand |
| **Routing** | React Router DOM v7 |
| **Backend & Auth** | Supabase (PostgreSQL, Auth, Realtime) |
| **Animations** | Framer Motion |
| **Charts** | Recharts & Chart.js |
| **Rich Text** | TipTap |
| **Audio** | Tone.js (Web Audio API) |
| **Drag & Drop** | dnd-kit |
| **Email** | Resend + React Email |
| **PWA** | vite-plugin-pwa |
| **Mobile** | Capacitor (Android) |
| **Testing** | Vitest (unit) + Playwright (E2E) |
| **Linting** | ESLint 9 + Husky + lint-staged |
| **Icons** | Lucide React |
| **Deployment** | Vercel |

---

## Architecture

UniTracker is built as a single-page application with lazy-loaded routes for optimal performance:

- **`src/pages/`** — Page-level components (Session, Tasks, Calendar, Stats, Habits, Notes, Landing).
- **`src/components/`** — Shared UI components (TimerSettings, OnboardingGuide, tooltips, etc.).
- **`src/store/`** — Zustand store managing global state (tasks, workspaces, UI state, sync settings).
- **`src/hooks/`** — Custom hooks for auth, task board logic, and friend management.
- **`src/modals/`** — Reusable modal components built on a shared `BaseModal` pattern.
- **`src/utils/`** — Supabase client, noise context, and utility functions.
- **`src/navbar/`** — Navigation system with context-based routing.
- **`api/`** — Serverless API routes (OpenRouter for AI, email sending via Resend).

The app uses a **CSS custom property theming system** defined in `src/index.css` that supports light/dark modes through `--bg-primary`, `--bg-secondary`, `--text-primary`, `--accent-primary`, and more — ensuring consistent styling across all components.

State is managed globally through **Zustand** with selective subscription hooks (e.g., `useTasks`, `useWorkspace`, `useUi`) to minimize re-renders. Data persistence is handled through **Supabase** for authenticated users, with localStorage fallback for offline/demo mode.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (or [Bun](https://bun.sh))
- A Supabase project for auth and data (or run in demo mode without one)

### Installation

```bash
# Clone the repository
git clone https://github.com/rickypcyt/unitracker.git
cd unitracker

# Install dependencies
bun install
# or: npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# Start the dev server
bun run dev
# or: npm run dev
```

### Available Scripts

| Script | Description |
| --- | --- |
| `dev` | Start Vite dev server |
| `dev:fast` | Fast dev mode (skips type checking) |
| `build` | Production build |
| `build:analyze` | Build with bundle visualizer |
| `type-check` | Run TypeScript compiler in check mode |
| `lint` | Run ESLint |
| `lint:fix` | Run ESLint with auto-fix |
| `test` | Run unit tests (Vitest) |
| `test:watch` | Run tests in watch mode |
| `test:e2e` | Run Playwright E2E tests |
| `android:build` | Build Android APK via Capacitor |

---

## Project Structure

```
unitracker/
├── src/
│   ├── pages/           # Page components
│   │   ├── session/     # Timer dashboard (Pomodoro, Study, Countdown, Noise)
│   │   ├── tasks/       # Kanban board & task management
│   │   ├── calendar/    # Calendar views (month, week, day)
│   │   ├── stats/       # Analytics & charts
│   │   ├── habits/      # Habit tracker
│   │   ├── notes/       # Markdown notes
│   │   └── landing/     # Marketing pages (home, pricing, compare, blog)
│   ├── components/      # Shared components
│   ├── store/           # Zustand global store
│   ├── hooks/           # Custom React hooks
│   ├── modals/          # Modal components
│   ├── utils/           # Utilities (Supabase, noise, etc.)
│   ├── navbar/          # Navigation system
│   └── constants/       # App constants & config
├── api/                 # Serverless functions (AI, email)
├── e2e/                 # Playwright E2E tests
├── public/              # Static assets (icons, sounds, robots.txt)
└── ...config files
```

---

## Roadmap

UniTracker has been in continuous development since December 2024. Upcoming priorities include:

- iOS support via Capacitor
- Collaborative study sessions with friends
- Advanced analytics with custom date ranges
- Note templates and linking
- Calendar integrations beyond Google

---

## Contributing

Contributions are welcome! This is an open-source project — feel free to open issues, submit PRs, or suggest features.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (Husky will run lint-staged on commit)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---


## Support & Feedback

- **Discord community:** [https://discord.gg/8sRswbPQQm](https://discord.gg/8sRswbPQQm)
- **GitHub Issues:** [https://github.com/rickypcyt/unitracker/issues](https://github.com/rickypcyt/unitracker/issues)

---

## License

This project is open source. See the repository for details.

---

Made with ❤️ for modern students. Free, open source, and always will be.
