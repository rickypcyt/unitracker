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
