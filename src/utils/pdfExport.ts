import type { Task } from '@/types/taskStorage';
import type { Lap } from '@/types/lap';
import type { StatsExportData } from './csvExport';

// -------------------------
// PDF export via print window
// -------------------------

function getTimestamp(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function openPrintWindow(title: string, bodyHTML: string): void {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; padding: 32px; }
  h1 { font-size: 24px; margin-bottom: 4px; color: #0A84FF; }
  h2 { font-size: 18px; margin: 24px 0 12px; color: #333; border-bottom: 2px solid #0A84FF; padding-bottom: 4px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
  th { background: #f0f4ff; padding: 8px 10px; text-align: left; font-weight: 600; color: #0A84FF; border-bottom: 2px solid #0A84FF; }
  td { padding: 8px 10px; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) td { background: #fafafa; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
  .badge-done { background: #d4edda; color: #155724; }
  .badge-pending { background: #fff3cd; color: #856404; }
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
  .stat-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; text-align: center; }
  .stat-value { font-size: 28px; font-weight: 700; color: #0A84FF; }
  .stat-label { font-size: 11px; color: #666; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #999; }
  @media print { body { padding: 16px; } .no-print { display: none; } }
</style>
</head>
<body>
  <h1>UniTracker</h1>
  <p class="meta">${title} — Generated on ${new Date().toLocaleString()}</p>
  ${bodyHTML}
  <div class="footer">UniTracker — ${getTimestamp()}</div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

// -------------------------
// Tasks PDF
// -------------------------

export function exportTasksPDF(tasks: Task[]): void {
  const rows = tasks.map(t => `
    <tr>
      <td>${escapeHtml(t.title)}</td>
      <td>${escapeHtml(t.assignment ?? '—')}</td>
      <td>${escapeHtml(t.difficulty ?? '—')}</td>
      <td><span class="badge ${t.completed ? 'badge-done' : 'badge-pending'}">${t.completed ? 'Done' : 'Pending'}</span></td>
      <td>${t.due_date ?? t.deadline ?? '—'}</td>
      <td>${(t.tags ?? []).join(', ') || '—'}</td>
    </tr>`).join('');

  const bodyHTML = `
    <h2>Tasks (${tasks.length})</h2>
    <table>
      <thead><tr><th>Title</th><th>Assignment</th><th>Difficulty</th><th>Status</th><th>Due Date</th><th>Tags</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  openPrintWindow('Tasks Export', bodyHTML);
}

// -------------------------
// Sessions PDF
// -------------------------

export function exportSessionsPDF(laps: Lap[]): void {
  const rows = laps.map(l => `
    <tr>
      <td>${escapeHtml(l.name)}</td>
      <td>${l.duration}</td>
      <td>${l.tasks_completed}</td>
      <td>${l.pomodoros_completed ?? 0}</td>
      <td>${l.focus_score ?? '—'}</td>
      <td>${escapeHtml(l.subject_name ?? l.session_assignment ?? '—')}</td>
      <td>${l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}</td>
    </tr>`).join('');

  const bodyHTML = `
    <h2>Study Sessions (${laps.length})</h2>
    <table>
      <thead><tr><th>Session Name</th><th>Duration</th><th>Tasks</th><th>Pomodoros</th><th>Focus</th><th>Subject</th><th>Date</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  openPrintWindow('Sessions Export', bodyHTML);
}

// -------------------------
// Stats PDF
// -------------------------

export function exportStatsPDF(data: StatsExportData): void {
  const formatMin = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;

  const statCards = [
    { label: 'Total Study', value: formatMin(data.totalStudyMinutes) },
    { label: 'Today', value: formatMin(data.todayMinutes) },
    { label: 'This Week', value: formatMin(data.weekMinutes) },
    { label: 'This Month', value: formatMin(data.monthMinutes) },
    { label: 'Tasks Done', value: data.totalTasksCompleted },
    { label: 'Pomodoros', value: data.totalPomodoros },
    { label: 'Longest Streak', value: `${data.longestStreak} days` },
    { label: 'Avg/Day', value: formatMin(data.avgPerDay) },
  ].map(s => `
    <div class="stat-card">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`).join('');

  const bodyHTML = `
    <h2>Statistics Summary</h2>
    <div class="stat-grid">${statCards}</div>
    <h2>Detailed Breakdown</h2>
    <table>
      <thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Total Study Time</td><td>${formatMin(data.totalStudyMinutes)}</td></tr>
        <tr><td>Today Study Time</td><td>${formatMin(data.todayMinutes)}</td></tr>
        <tr><td>Week Study Time</td><td>${formatMin(data.weekMinutes)}</td></tr>
        <tr><td>Month Study Time</td><td>${formatMin(data.monthMinutes)}</td></tr>
        <tr><td>Year Study Time</td><td>${formatMin(data.yearMinutes)}</td></tr>
        <tr><td>Total Tasks Completed</td><td>${data.totalTasksCompleted}</td></tr>
        <tr><td>Tasks Done Today</td><td>${data.doneToday}</td></tr>
        <tr><td>Tasks Done This Week</td><td>${data.doneWeek}</td></tr>
        <tr><td>Tasks Done This Month</td><td>${data.doneMonth}</td></tr>
        <tr><td>Tasks Done This Year</td><td>${data.doneYear}</td></tr>
        <tr><td>Total Pomodoros</td><td>${data.totalPomodoros}</td></tr>
        <tr><td>Pomodoro Minutes</td><td>${formatMin(data.pomodoroMinutes)}</td></tr>
        <tr><td>Longest Streak</td><td>${data.longestStreak} days</td></tr>
        <tr><td>Average Per Day</td><td>${formatMin(data.avgPerDay)}</td></tr>
      </tbody>
    </table>`;

  openPrintWindow('Stats Export', bodyHTML);
}

// -------------------------
// Helpers
// -------------------------

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
