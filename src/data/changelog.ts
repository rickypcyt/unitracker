// -------------------------
// Changelog data
// -------------------------

export interface ChangelogEntry {
  version: string;
  date: string;
  time: string;
  type: 'major' | 'minor' | 'patch';
  changes: {
    added?: string[];
    improved?: string[];
    fixed?: string[];
    removed?: string[];
    soon?: string[];
  };
}

export const changelogData: ChangelogEntry[] = [
  {
    version: "2.0.1",
    date: "September 3, 2026",
    time: "7:30 AM",
    type: "patch",
    changes: {
      added: [
        "Consolidated Statistics card with a week/month/year period selector on the right"
      ],
      improved: [
        "Session page now vertically centers the timers and Noise Generator as one group",
        "Tasks empty state now takes less vertical space",
        "Sidebar is now fixed and independent of main content height"
      ],
      fixed: []
    }
  },
  {
    version: "2.0.0",
    date: "July 30, 2026",
    time: "12:00 AM",
    type: "major",
    changes: {
      added: [
        "Unified Timer view combining Study Timer, Pomodoro, and Countdown into a single cohesive interface with tabbed switching",
        "Zod validation schemas centralized across the app for robust input validation",
        "Rate limiting added to API endpoints for improved security and abuse prevention",
        "Comprehensive testing setup with Vitest unit tests and Playwright E2E tests",
        "Inter font family integrated app-wide for a cleaner, more professional typography",
        "Viewport-fit support and safe-area insets for better mobile and notched-device rendering",
        "View mode toggle for switching between different page layouts dynamically",
        "Collapsible navbar that can be toggled to maximize workspace area",
        "Settings converted from a standalone page to an in-app modal with tabbed sections",
        "Landing pages with full marketing site: homepage, pricing, comparison, and blog",
        "SEO improvements including enhanced meta tags, Open Graph, and sitemap",
        "Session pause history tracking with detailed pause entries (start time, end time, duration)",
        "Circular progress ring animations for Study Timer and Countdown with paused-state spin animation",
        "Seconds display in Study Timer (MM:SS under 1 hour, HH:MM over 1 hour)",
        "Arrow key navigation (Up/Down/Left/Right) between timer input fields",
        "Modal-aware keyboard handling that disables arrow navigation when a dialog is open"
      ],
      improved: [
        "Radical UI overhaul across every page with a more cohesive design system",
        "Timer components heavily refactored: StudyTimer, Pomodoro, and Countdown now share consistent state management and sync logic",
        "Session page rebuilt with UnifiedTimer, improved timer controls, and cleaner layout",
        "Calendar Day/Week/Month views refined with better time handling and layout fixes",
        "Fixed-height app layout with increased border widths for a more structured appearance",
        "Horizontal overflow issues resolved across multiple pages",
        "Timer pause states improved with accurate 'last paused N minutes ago' display that survives page refresh",
        "Countdown timer circle cleaned up: removed redundant 'Countdown' label text from inside the ring",
        "Study Timer display now shows seconds when under 1 hour for real-time feedback",
        "README completely rewritten with improved documentation and SEO",
        "Fetches and data handling improved across session and task services",
        "Noise generator sounds fixed and improved for better audio quality",
        "Overall code quality improvements with centralized schemas and reduced duplication"
      ],
      fixed: [
        "Study Timer showing 00 with no visible changes — now displays seconds in real-time",
        "Countdown timer displaying 'Countdown' text label inside the circle — removed",
        "Timer pause state not surviving page refresh — now properly restored from localStorage",
        "DayView calendar rendering and time handling bugs resolved",
        "Horizontal overflow on multiple pages fixed",
        "Noise generator sound quality issues fixed",
        "Various UI inconsistencies across pages resolved with the design system overhaul"
      ],
      removed: [
        "Standalone settings page — replaced by in-app settings modal",
        "Redundant 'Countdown' text label inside countdown circle",
        "Old timer display format that only showed hours and minutes without seconds"
      ],
      soon: [
        "Mobile app release with Capacitor integration",
        "Advanced analytics and study insights dashboard",
        "Enhanced workspace collaboration features"
      ]
    }
  },
  {
    version: "1.4.0",
    date: "June 30, 2026",
    time: "9:30 PM",
    type: "major",
    changes: {
      added: [
        "Major UI overhaul across nearly every page in the app for a more cohesive and modern look",
        "Floating Island footer redesigned with workspace selector, task badge, active session timer, theme toggle, and quick add task button",
        "Habits page completely redesigned with Today and History views, streak tracking (current and best), month completion rate, and heatmap/calendar/week sub-views",
        "Notes welcome view redesigned with search functionality and notes grouped by assignment",
        "Settings modal rebuilt with tabbed interface: Appearance, Account, Data, What's New, and About",
        "Changelog viewer integrated directly into Settings under the What's New tab",
        "Workspace modal now includes search filtering for workspaces",
        "Calendar sidebar is now resizable with drag-to-resize and can be toggled between left and right positions",
        "New useResizable hook for reusable drag-to-resize functionality",
        "New TaskPageSettingsModal for task page configuration",
        "Quick add task button in the floating footer that navigates to tasks and triggers the task form"
      ],
      improved: [
        "App-wide UI refresh: Tasks, Calendar, Notes, Habits, Stats, Session, and modals all received visual updates",
        "Pomodoro timer heavily refactored with stale closure prevention via refs and proper interval cleanup on midnight reset",
        "Task item time display now uses compact format (e.g. 8–9 AM instead of 08:00 AM - 09:00 AM)",
        "Task item date parsing no longer converts timezones, fixing incorrect Today/Tomorrow labels",
        "On-hold task status now uses a slow pulse animation for better visual distinction",
        "Calendar Day, Week, and Month views improved with better layout and time handling",
        "Navbar simplified by removing redundant elements now in the floating footer",
        "Notes side panel and mobile selector improved with better layout and navigation",
        "Various modals updated for consistent styling (BaseModal, session modals, task modals)",
        "Stats pages updated with cleaner chart panels and insights layout",
        "Theme toggle is now instant with no transition delay"
      ],
      fixed: [
        "Duplicate separator line removed from floating footer when session timer is active",
        "Pomodoro midnight reset interval now properly cleaned up to prevent memory leaks",
        "TaskItem date label bugs fixed with timezone-safe date extraction"
      ],
      removed: [
        "Old editable title and date picker removed from Notes welcome view",
        "Redundant navbar settings button content removed (now in Settings modal tabs)"
      ]
    }
  },
  {
    version: "1.3.5",
    date: "June 26, 2026",
    time: "12:15 AM",
    type: "patch",
    changes: {
      added: [
        "Noise Generator header now shows the number of active sounds"
      ],
      improved: [
        "Start Session modal redesigned with chip-style timer options and cleaner action buttons",
        "Timer play/pause buttons now use a subtle gray border instead of themed colors",
        "Reset icons in Pomodoro, Study Timer, and Countdown are now gray for a cleaner look",
        "Assignment cards simplified to use a single accent color and a clearer progress label",
        "Noise Generator header layout improved with the title on the left and grouped controls on the right"
      ],
      fixed: [
        "Study Time Today card now correctly sums completed sessions from the database instead of only reading the active timer",
        "Completed Tasks section TypeScript errors resolved"
      ],
      removed: [
        "Task selection section removed from the Start Session modal"
      ]
    }
  },
  {
    version: "1.3.4",
    date: "March 17, 2026",
    time: "9:03 PM",
    type: "patch",
    changes: {
      improved: [
        "Brown noise: Removed hiss for cleaner sound",
        "Ocean waves: Completely redesigned for realistic ocean sound",
        "Rain sound: Added crisp high frequencies for better rain texture"
      ],
      fixed: [
        "Brown noise hiss issues",
        "Ocean waves artificial sound quality",
        "Rain sound muffled filtering"
      ]
    }
  },
  {
    version: "1.3.3",
    date: "March 10, 2026",
    time: "6:08 PM",
    type: "minor",
    changes: {
      added: [
        "Dynamic island widget with workspace selector, GitHub link, and Discord access",
        "Workspace selector moved from navbar to floating footer for better accessibility",
        "Modern glassmorphism design with backdrop blur and centered positioning"
      ],
      improved: [
        "Better workspace management with dedicated floating controls",
        "Enhanced user experience with always-accessible workspace switching"
      ]
    }
  },
  {
    version: "1.3.2",
    date: "March 10, 2026",
    time: "5:40 PM",
    type: "patch",
    changes: {
      added: [
        "Navbar now includes a quick access button to join the community Discord server"
      ],
      fixed: [
        "Friend management now handles pending requests and reciprocal friendships correctly",
        "Workspace sharing flow is fully functional, allowing friends to access shared workspaces"
      ],
      improved: [
        "Workspace modal updates active selection when a shared workspace is unshared"
      ]
    }
  },
  {
    version: "1.3.1",
    date: "February 16, 2026",
    time: "7:05 PM",
    type: "minor",
    changes: {
      added: [
        "ICS export functionality for Google Calendar and Apple Calendar",
        "Support for weekly recurring tasks with RRULE generation",
        "All-day event export for tasks without specific times",
        "Difficulty-based reminder system (hard=1h, medium=1d, easy=1w)",
        "Enhanced drag and drop with 30-minute precision in WeekView",
        "Visual drop zone highlighting during task dragging",
        "Comprehensive debugging for drag and drop operations"
      ],
      improved: [
        "Fixed ICS timezone format to use proper UTC Z notation",
        "Enhanced task time handling with start_at/end_at/deadline priority",
        "Better calendar event compatibility across platforms",
        "Improved visual feedback for calendar interactions"
      ],
      fixed: [
        "Fixed double Z timezone issue in ICS export",
        "Corrected all-day event DTEND to follow ICS standard (next day)",
        "Resolved drag and drop detection issues in WeekView"
      ]
    }
  },
  {
    version: "1.3.0",
    date: "February 13, 2026",
    time: "6:40 PM",
    type: "major",
    changes: {
      added: [
        "Refactored TaskForm with separated AI functionality for better modularity",
        "New dropdown menu section for task items allowing date modification without entering task form",
        "Workspace selector in task page for mobile devices",
        "Workspace switching in calendar view for multiple calendar support per workspace",
        "Integrated DayFlow calendar view (partial implementation)",
        "Notes view for managing personal notes and documentation",
        "Task types system (Info, Weekly Reminder, and more coming soon)"
      ],
      improved: [
        "Updated database models to support new task management features",
        "Enhanced start and end time controls with better UX",
        "Fixed calendar display in mobile view for better responsiveness",
        "Enter key behavior in TaskForm - submits when in title/subject inputs, creates line breaks in description",
        "Better workspace management across different views and components",
        "Updated TaskForm layout to allow dynamic description field growth"
      ],
      fixed: [
        "Fixed Enter key bug in TaskForm that was causing modal to close unexpectedly",
        "Calendar mobile view layout issues resolved",
        "Task form validation and submission flow improved"
      ],
      soon: [
        "Full DayFlow calendar view implementation",
        "Additional task types and categories",
        "Advanced workspace sharing features",
        "Time block scheduling integration"
      ]
    }
  },
  {
    version: "1.2.0",
    date: "February 5, 2026",
    time: "11:30 PM",
    type: "major",
    changes: {
      added: [
        "Recurring tasks with weekly scheduling options",
        "Task time slots with start/end time selection",
        "New task view modal for detailed task information",
        "Support for recurring events in calendar views",
        "Time-based task blocks in day and week views",
        "Task recurrence settings in task form"
      ],
      improved: [
        "Enhanced task form with time picker controls",
        "Better task display in calendar with duration visualization",
        "Task item layout and information hierarchy",
        "Database schema to support recurring tasks"
      ],
      fixed: [
        "Fixed task time handling and timezone consistency",
        "Improved form validation for time inputs",
        "Fixed task display in calendar day view"
      ]
    }
  },
  {
    version: "1.1.7",
    date: "February 5, 2026",
    time: "12:35 AM",
    type: "minor",
    changes: {
      improved: [
        "Migrated pinned columns system from localStorage to Supabase database",
        "Added Row Level Security (RLS) policies for pinned columns data protection",
        "Enhanced data persistence and synchronization across devices for column preferences",
        "Made navbar fully reorganizable with drag and drop functionality",
        "Added visual feedback with hover effects for navbar items using pseudo-elements"
      ],
      added: [
        "New pinned_columns table in Supabase for robust column preference storage",
        "Dedicated usePinnedColumns hook for managing column pinning with Supabase integration",
        "Drag and drop system for navbar page reordering with localStorage persistence",
        "Custom cursor states (grab/grabbing) for better drag interaction feedback"
      ],
      fixed: [
        "Column pinning preferences now persist properly across browser sessions and devices",
        "Navbar layout no longer shifts when hover effects are applied"
      ],
      removed: [
        "Redundant tooltips from navbar items to reduce visual clutter"
      ]
    }
  },
  {
    version: "1.1.6",
    date: "January 19, 2026",
    time: "6:30 PM",
    type: "minor",
    changes: {
      added: [
        "Focus widget page - Full-screen focus mode for distraction-free studying with timer, session status, and sound controls",
        "Next month preview component in Habits page for better habit planning",
        "Play all button in noise generator for ambient sound combinations",
        "Manual changelog notifications system with badges instead of automatic popups"
      ],
      improved: [
        "SEO optimization with meta tags, Open Graph, and structured data",
        "Minimalist README documentation with essential setup and feature overview",
        "Calendar component fixes and performance optimizations",
        "Removed Session Today component for cleaner UI"
      ],
      fixed: [
        "Calendar rendering issues and layout problems",
        "Session component redundancy and navigation conflicts"
      ]
    }
  },
  {
    version: "1.1.5",
    date: "January 11, 2026",
    time: "12:00 PM",
    type: "minor",
    changes: {
      added: [
        "New Habits page inspired by bullet journal methodology for habit tracking",
        "Day names display (Mon, Tue, Wed, etc.) in calendar cells",
        "Tooltip system on day hover showing task details, similar to calendar functionality"
      ],
      improved: [
        "Enhanced calendar layout with day names and task indicators",
        "Optimized tooltip positioning in calendar page for better visibility",
        "Improved task navigation with clickable dropdown items"
      ]
    }
  },
  {
    version: "1.1.4",
    date: "January 10, 2026",
    time: "5:08 AM",
    type: "minor",
    changes: {
      improved: [
        "Added new Week and Day views to the calendar for better time management",
        "Implemented time block functionality to assign tasks to specific hours",
        "Improved task page layout to display 4 columns on large screens (previously 3)",
        "Enhanced calendar navigation and time indicators for better usability"
      ]
    }
  },
  {
    version: "1.1.3",
    date: "December 29, 2025",
    time: "12:00 PM",
    type: "minor",
    changes: {
      improved: [
        "Enhanced Notes page UI with modern design and improved navigation",
        "Upgraded WYSIWYG editor with context-specific variants for Notes and Tasks",
        "Improved side panel functionality with scrollable content and quick actions",
        "Enhanced footer with navigation and save/delete actions",
        "Better responsive design for mobile devices",
        "Optimized note saving system with improved auto-save and keyboard shortcuts"
      ],
      added: [
        "Contextual placeholders for different editor variants",
        "Quick assignment creation buttons in side panel",
        "Visual indicators for editable areas in editors",
        "Improved note metadata display with responsive layout"
      ],
      fixed: [
        "Fixed note saving issues with Ctrl+S keyboard shortcut",
        "Resolved auto-save conflicts and synchronization problems",
        "Fixed side panel height issues with footer positioning"
      ]
    }
  },
  {
    version: "1.1.2",
    date: "December 21, 2025",
    time: "5:17 PM",
    type: "patch",
    changes: {
      fixed: [
        "Fixed Pomodoro timer synchronization issues"
      ],
      improved: [
        "New workspace switching mode with sideways scroll",
        "Share workspace with friends feature is now fully functional",
        "Task status system for better task organization"
      ],
      soon: [
        "Timeblocks page - Assign time blocks to tasks",
        "Leaderboard system - Compete with friends"
      ]
    }
  },
  {
    version: "1.1.1",
    date: "December 21, 2025",
    time: "5:00 PM",
    type: "patch",
    changes: {
      added: [
        "Hello world!",
        "First use of the UniTracker changelog system"
      ],
      improved: [
        "Here you will see the upcoming changes and improvements we will be implementing in the application"
      ],
      fixed: [],
      removed: []
    }
  }
];
