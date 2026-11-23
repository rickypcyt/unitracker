// Data for the SEO landing pages. Shared by the React page component and the
// build-time prerender plugin (vite.config.js), so keep it dependency-free.
export interface SeoPage {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: { heading: string; body: string }[];
  faq: { q: string; a: string }[];
}

export const SITE = 'https://unitracker.me';

export const SEO_PAGES: SeoPage[] = [
  {
    slug: 'pomodoro-timer',
    title: 'Free Online Pomodoro Timer for Studying | UniTracker',
    description:
      'A free online Pomodoro timer with task tracking and study statistics. Works offline, no ads, no signup needed to start. Customize focus and break lengths.',
    h1: 'Free Online Pomodoro Timer',
    intro:
      'Focus in 25-minute sprints, rest in short breaks, and see exactly how much you studied. UniTracker is a free Pomodoro timer that also tracks your tasks and builds study statistics automatically.',
    sections: [
      {
        heading: 'What is the Pomodoro Technique?',
        body: 'The Pomodoro Technique splits work into focused intervals, traditionally 25 minutes, separated by 5-minute breaks. After four rounds you take a longer break. It reduces procrastination and makes long study sessions easier to start.',
      },
      {
        heading: 'Why use UniTracker as your Pomodoro timer?',
        body: 'Every session is linked to a task and a subject, so you can see how many hours you spent on each. Customize focus and break durations, keep the timer in a floating widget while you work, and use it offline as an installable app.',
      },
      {
        heading: 'Track progress, not just time',
        body: 'Daily and weekly analytics show your focus time, streaks and most-studied subjects, so you can tell whether your routine is actually working.',
      },
    ],
    faq: [
      { q: 'Is the Pomodoro timer free?', a: 'Yes. The timer, tasks and analytics are free to use.' },
      { q: 'Can I change the 25-minute length?', a: 'Yes, focus and break durations are fully customizable.' },
      { q: 'Does it work offline?', a: 'Yes, UniTracker can be installed as an app and works without internet.' },
    ],
  },
  {
    slug: 'study-tracker',
    title: 'Free Study Tracker App: Log Hours, Tasks & Progress | UniTracker',
    description:
      'Track study hours, subjects and assignments in one free app. Pomodoro sessions, calendar, notes and analytics for students. Open source and works offline.',
    h1: 'Study Tracker for Students',
    intro:
      'See where your study time really goes. UniTracker logs every session by subject, connects it to your assignments and turns it into clear charts, so you can study smarter instead of longer.',
    sections: [
      {
        heading: 'Log study sessions automatically',
        body: 'Start a timer and your session is saved with its subject and task. No spreadsheets, no manual entry.',
      },
      {
        heading: 'Assignments, calendar and notes in one place',
        body: 'Plan deadlines on the calendar, break assignments into tasks, and keep your notes next to your sessions.',
      },
      {
        heading: 'Analytics that motivate',
        body: 'Weekly totals, streaks and per-subject breakdowns make progress visible, which is the easiest way to stay consistent before exams.',
      },
    ],
    faq: [
      { q: 'Is UniTracker a good study tracker for university?', a: 'It was built for students: subjects, assignments, exam planning and session analytics are core features.' },
      { q: 'Do I need an account?', a: 'You can start without one. Sign in with Google to sync across devices.' },
    ],
  },
  {
    slug: 'habit-tracker',
    title: 'Free Habit Tracker for Students | UniTracker',
    description:
      'Build study habits with a simple, free habit tracker. Daily check-ins, streaks and statistics, combined with a Pomodoro timer and task manager.',
    h1: 'Habit Tracker for Students',
    intro:
      'Good grades come from consistent habits. Track daily routines such as reading, revision or exercise, keep your streak alive and see your consistency over time.',
    sections: [
      {
        heading: 'Simple daily check-ins',
        body: 'Mark habits done in one tap. Streaks and completion rates show how consistent you have been.',
      },
      {
        heading: 'Habits connected to your study data',
        body: 'Unlike a standalone habit app, your habits live next to your tasks, Pomodoro sessions and calendar, so you can see how routines affect your study time.',
      },
    ],
    faq: [
      { q: 'Is the habit tracker free?', a: 'Yes, habits are free to use.' },
      { q: 'Can I use it on my phone?', a: 'Yes, install it as an app on Android and iOS from your browser.' },
    ],
  },
  {
    slug: 'notion-alternative-for-students',
    title: 'Notion Alternative for Students: Free Study Planner | UniTracker',
    description:
      'Looking for a simpler Notion alternative for studying? UniTracker is a free, open source study planner with tasks, calendar, notes, Pomodoro timer and analytics.',
    h1: 'A Simpler Notion Alternative for Students',
    intro:
      'Notion is powerful but needs setup. UniTracker gives students a ready-made workflow: tasks, calendar, notes, habits and a focus timer that already work together.',
    sections: [
      {
        heading: 'Ready to use in seconds',
        body: 'No templates to build or databases to configure. Open the app and start planning your week.',
      },
      {
        heading: 'Built-in focus timer and analytics',
        body: 'Notion does not track how long you actually study. UniTracker does, and shows it in charts by subject.',
      },
      {
        heading: 'Fast, offline and open source',
        body: 'It loads instantly, works offline as an installable app, and the code is open source on GitHub.',
      },
    ],
    faq: [
      { q: 'Can UniTracker replace Notion for studying?', a: 'For planning, notes, habits and time tracking, yes. For wikis and complex databases, Notion is still more flexible.' },
      { q: 'Is it free?', a: 'Yes, the core app is free.' },
    ],
  },
  {
    slug: 'jee-study-planner',
    title: 'Free JEE Study Planner & Timer: Track Hours and Chapters | UniTracker',
    description:
      'Free study planner for JEE Main and Advanced aspirants. Pomodoro timer, daily targets by subject (Physics, Chemistry, Maths), calendar and study-hour analytics. Works offline.',
    h1: 'Free JEE Study Planner & Study Timer',
    intro:
      'JEE preparation is a marathon of Physics, Chemistry and Maths. UniTracker helps you plan daily targets, log every study hour by subject and see whether you are on track for your exam date.',
    sections: [
      {
        heading: 'Track hours by subject',
        body: 'Create Physics, Chemistry and Maths as subjects, run Pomodoro sessions against each one and see weekly totals, so you notice immediately which subject is being neglected.',
      },
      {
        heading: 'Plan chapters and mock tests',
        body: 'Add chapters, revision rounds and mock tests as tasks with deadlines, and view them on a calendar leading up to JEE Main and Advanced.',
      },
      {
        heading: 'Built for long study days',
        body: 'Customizable focus and break lengths, offline support for poor connections, and a lightweight app that runs on any phone or laptop.',
      },
    ],
    faq: [
      { q: 'Is this study planner free for JEE students?', a: 'Yes, the core planner, timer and analytics are free.' },
      { q: 'How many hours should a JEE aspirant study?', a: 'It varies, but consistent daily hours matter more than occasional marathons. Tracking your real hours is the first step to improving them.' },
    ],
  },
  {
    slug: 'neet-study-planner',
    title: 'Free NEET Study Planner & Timer for Biology, Physics, Chemistry | UniTracker',
    description:
      'Free NEET study planner with a Pomodoro timer, subject-wise hour tracking, revision tasks and exam calendar. Works offline, no ads.',
    h1: 'Free NEET Study Planner & Timer',
    intro:
      'NEET has a huge syllabus. Break it into chapters, schedule revision cycles and measure the hours you put into Biology, Physics and Chemistry with one simple, free app.',
    sections: [
      {
        heading: 'Biology-heavy? Track it separately',
        body: 'Give Botany, Zoology, Physics and Chemistry their own subjects and see how your hours are split week by week.',
      },
      {
        heading: 'Revision cycles',
        body: 'Schedule repeat revision tasks and mock tests on the calendar so important chapters are never forgotten.',
      },
      {
        heading: 'Stay consistent',
        body: 'Streaks and habit tracking help you build a daily routine, which matters more than any single long session.',
      },
    ],
    faq: [
      { q: 'Is the NEET study planner free?', a: 'Yes, it is free to use.' },
      { q: 'Does it work without internet?', a: 'Yes, install it as an app and it works offline.' },
    ],
  },
  {
    slug: 'upsc-study-tracker',
    title: 'Free UPSC Study Tracker: Log Hours, Syllabus & Revision | UniTracker',
    description:
      'Free UPSC preparation tracker. Log study hours by paper, plan syllabus coverage and revisions, and see weekly analytics with a built-in Pomodoro timer.',
    h1: 'Free UPSC Study Tracker',
    intro:
      'UPSC preparation takes a year or more of steady work. Track hours by paper, plan syllabus coverage and keep revision on schedule, with analytics that show your real consistency.',
    sections: [
      {
        heading: 'Hours by paper and topic',
        body: 'Create subjects for GS papers, optional and current affairs, and log every session so you know where time actually goes.',
      },
      {
        heading: 'Syllabus and revision planning',
        body: 'Turn the syllabus into tasks with deadlines and schedule revision rounds ahead of Prelims and Mains.',
      },
      {
        heading: 'Notes next to your sessions',
        body: 'Keep short notes and answer-writing reminders in the same place as your timer and tasks.',
      },
    ],
    faq: [
      { q: 'Is it free for UPSC aspirants?', a: 'Yes, the core features are free.' },
      { q: 'Can I use it on mobile?', a: 'Yes, install it as an app from your browser.' },
    ],
  },
  {
    slug: 'uk-university-study-planner',
    title: 'Free Revision & Assignment Planner for UK University Students | UniTracker',
    description:
      'A free revision planner and assignment tracker for UK university students. Track modules, coursework deadlines and dissertation work, with a Pomodoro timer and revision stats.',
    h1: 'Free Study Planner for UK University Students',
    intro:
      'Juggling modules, coursework deadlines and exam season? UniTracker is a free revision planner that tracks your assignments, logs your study hours by module and shows how your revision is really going.',
    sections: [
      {
        heading: 'Track every module and deadline',
        body: 'Create a subject for each module, add coursework and dissertation milestones as tasks with deadlines, and see everything due this week on one calendar.',
      },
      {
        heading: 'Plan your revision for exam season',
        body: 'Schedule revision sessions ahead of your January and summer exams. A built-in Pomodoro timer logs each session to the right module, so you can see which subjects need more time.',
      },
      {
        heading: 'Free, with no ads',
        body: 'No subscription and no ads. Start straight away without an account, or sign in with Google to sync between your laptop and phone.',
      },
    ],
    faq: [
      { q: 'Is UniTracker free for UK students?', a: 'Yes. All core features are free, with no ads or subscription.' },
      { q: 'Can I track coursework and dissertation deadlines?', a: 'Yes. Add each piece of coursework as a task with a deadline and break a dissertation into smaller milestones.' },
      { q: 'Does it work on my phone?', a: 'Yes. Install it as an app from your browser and it works offline.' },
    ],
  },
];
