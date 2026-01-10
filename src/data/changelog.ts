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
