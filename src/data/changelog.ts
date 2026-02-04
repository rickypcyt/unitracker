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
    version: "1.1.7",
    date: "February 5, 2026",
    time: "12:15 AM",
    type: "minor",
    changes: {
      improved: [
        "Migrated pinned columns system from localStorage to Supabase database",
        "Added Row Level Security (RLS) policies for pinned columns data protection",
        "Enhanced data persistence and synchronization across devices for column preferences"
      ],
      added: [
        "New pinned_columns table in Supabase for robust column preference storage",
        "Dedicated usePinnedColumns hook for managing column pinning with Supabase integration"
      ],
      fixed: [
        "Column pinning preferences now persist properly across browser sessions and devices"
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
        "First use of the Uni Tracker changelog system"
      ],
      improved: [
        "Here you will see the upcoming changes and improvements we will be implementing in the application"
      ],
      fixed: [],
      removed: []
    }
  }
];
