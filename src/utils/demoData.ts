// Demo data for unauthenticated users — built via i18n so it follows the active language

import i18n from '@/i18n';
import { getLocalDateString } from '@/utils/dateUtils';

// Utilidades para fechas relativas
const today = new Date();
const format = (d: Date) => getLocalDateString(d);
const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
const todayStr = format(today);
const yesterdayStr = format(addDays(today, -1));
const tomorrowStr = format(addDays(today, 1));

const t = (key: string) => i18n.t(`demo.${key}`);
const suffix = () => ` ${t('suffix')}`;

export const getDemoWorkspaces = () => [
  { id: 'demo-ws-1', name: `${t('workspaces.university')}${suffix()}` },
  { id: 'demo-ws-2', name: `${t('workspaces.work')}${suffix()}` },
];

export const getDemoAssignments = () => [
  { id: 'demo-assignment-a', name: `${t('assignments.advMath')}${suffix()}`, workspace_id: 'demo-ws-1' },
  { id: 'demo-assignment-b', name: `${t('assignments.webProject')}${suffix()}`, workspace_id: 'demo-ws-2' },
  { id: 'demo-assignment-c', name: `${t('assignments.physics')}${suffix()}`, workspace_id: 'demo-ws-1' },
  { id: 'demo-assignment-d', name: `${t('assignments.marketing')}${suffix()}`, workspace_id: 'demo-ws-2' },
  { id: 'demo-assignment-e', name: `${t('assignments.history')}${suffix()}`, workspace_id: 'demo-ws-1' },
  { id: 'demo-assignment-f', name: `${t('assignments.mobileApp')}${suffix()}`, workspace_id: 'demo-ws-2' },
];

export const getDemoTasks = () => [
  { id: 'demo-task-1', title: `${t('tasks.calculus')}${suffix()}`, assignment: 'demo-assignment-a', workspace_id: 'demo-ws-1', completed: false, due_date: todayStr, deadline: todayStr, created_at: todayStr, difficulty: 'medium', completed_at: null },
  { id: 'demo-task-2', title: `${t('tasks.theorems')}${suffix()}`, assignment: 'demo-assignment-a', workspace_id: 'demo-ws-1', completed: true, due_date: yesterdayStr, deadline: yesterdayStr, created_at: yesterdayStr, difficulty: 'easy', completed_at: yesterdayStr },
  { id: 'demo-task-3', title: `${t('tasks.restApi')}${suffix()}`, assignment: 'demo-assignment-b', workspace_id: 'demo-ws-2', completed: false, due_date: tomorrowStr, deadline: tomorrowStr, created_at: tomorrowStr, difficulty: 'hard', completed_at: null },
];

// Demo notes are written in Markdown so the Obsidian-style editor shows headings,
// task lists, tables and code. `assignment` is the folder name shown in the sidebar.
const DEMO_NOTES_CONTENT = {
  en: {
    math: 'Advanced Mathematics',
    web: 'Web Project',
    notes: [
      {
        title: 'Important formulas',
        folder: 'math',
        body: `# Important formulas

Quick reference for the midterm. Review it before the **Calculus** session.

## Integration by parts

\`∫ u dv = uv − ∫ v du\`

Pick \`u\` with the **LIATE** rule: Logarithmic, Inverse trig, Algebraic, Trig, Exponential.

## Chain rule

If \`y = f(g(x))\` then \`y' = f'(g(x)) · g'(x)\`.

## Common derivatives

| Function | Derivative |
| --- | --- |
| \`sin x\` | \`cos x\` |
| \`eˣ\` | \`eˣ\` |
| \`ln x\` | \`1/x\` |

## To review

- [x] Integration by parts
- [x] Chain rule
- [ ] Taylor series
- [ ] Practice exam 2019
`,
      },
      {
        title: 'Design ideas',
        folder: 'math',
        body: `# Design ideas

> Notes for the **modeling project**: keep the architecture simple first, optimize later.

## Options

1. **MVC**: easy to explain, good for the first version.
2. **Microservices**: only if the team grows.

## Example

\`\`\`ts
// Keep the data layer behind one interface
interface Repository<T> {
  get(id: string): Promise<T>
  save(item: T): Promise<void>
}
\`\`\`

## Next steps

- [ ] Sketch the data model
- [ ] Compare MVC vs microservices
- [ ] Present to the group on Friday
`,
      },
      {
        title: 'Client meeting',
        folder: 'web',
        body: `# Client meeting

**Date:** next Friday · **Topic:** new payment module

## Requirements

- Accept card and bank transfer
- Send a receipt by email
- Refunds within 14 days

## Decisions

| Item | Owner | Status |
| --- | --- | --- |
| API design | Me | In progress |
| UI mockups | Sam | Done |
| Payment provider | Client | Pending |

## Action items

- [x] Send the meeting summary
- [ ] Draft the REST API
- [ ] Confirm the deadline
`,
      },
    ],
  },
  es: {
    math: 'Matemáticas Avanzadas',
    web: 'Proyecto Web',
    notes: [
      {
        title: 'Fórmulas importantes',
        folder: 'math',
        body: `# Fórmulas importantes

Referencia rápida para el parcial. Repásala antes de la sesión de **Cálculo**.

## Integración por partes

\`∫ u dv = uv − ∫ v du\`

Elige \`u\` con la regla **LIATE**: Logarítmica, Inversa trigonométrica, Algebraica, Trigonométrica, Exponencial.

## Regla de la cadena

Si \`y = f(g(x))\` entonces \`y' = f'(g(x)) · g'(x)\`.

## Derivadas comunes

| Función | Derivada |
| --- | --- |
| \`sin x\` | \`cos x\` |
| \`eˣ\` | \`eˣ\` |
| \`ln x\` | \`1/x\` |

## Por repasar

- [x] Integración por partes
- [x] Regla de la cadena
- [ ] Series de Taylor
- [ ] Examen de práctica 2019
`,
      },
      {
        title: 'Ideas de diseño',
        folder: 'math',
        body: `# Ideas de diseño

> Notas del **proyecto de modelado**: primero una arquitectura simple, optimizar después.

## Opciones

1. **MVC**: fácil de explicar, bueno para la primera versión.
2. **Microservicios**: solo si el equipo crece.

## Ejemplo

\`\`\`ts
// Mantén la capa de datos detrás de una interfaz
interface Repository<T> {
  get(id: string): Promise<T>
  save(item: T): Promise<void>
}
\`\`\`

## Siguientes pasos

- [ ] Dibujar el modelo de datos
- [ ] Comparar MVC y microservicios
- [ ] Presentar al grupo el viernes
`,
      },
      {
        title: 'Reunión con el cliente',
        folder: 'web',
        body: `# Reunión con el cliente

**Fecha:** próximo viernes · **Tema:** nuevo módulo de pagos

## Requisitos

- Aceptar tarjeta y transferencia bancaria
- Enviar el recibo por correo
- Reembolsos en 14 días

## Decisiones

| Punto | Responsable | Estado |
| --- | --- | --- |
| Diseño de la API | Yo | En curso |
| Maquetas de la UI | Sam | Hecho |
| Proveedor de pagos | Cliente | Pendiente |

## Pendientes

- [x] Enviar el resumen de la reunión
- [ ] Redactar la API REST
- [ ] Confirmar la fecha límite
`,
      },
    ],
  },
} as const;

export const getDemoNotes = () => {
  const lang = (i18n.resolvedLanguage ?? i18n.language ?? 'en').startsWith('es') ? 'es' : 'en';
  const content = DEMO_NOTES_CONTENT[lang];
  const stamps = [todayStr, todayStr, yesterdayStr];
  return content.notes.map((n, i) => ({
    id: `demo-note-${i + 1}`,
    title: n.title,
    assignment: content[n.folder as 'math' | 'web'],
    description: n.body,
    date: stamps[i] as string,
    created_at: `${stamps[i]}T09:00:00`,
    last_edited: `${stamps[i]}T09:00:00`,
  }));
};

export const getDemoSessions = () => [
  { id: 'demo-session-1', name: `${t('sessions.mathStudy')}${suffix()}`, started_at: todayStr + 'T09:00:00', ended_at: todayStr + 'T10:30:00', duration: '01:30:00', tasks_completed: 2, pomodoros_completed: 3 },
  { id: 'demo-session-2', name: `${t('sessions.webProgramming')}${suffix()}`, started_at: yesterdayStr + 'T14:00:00', ended_at: yesterdayStr + 'T15:00:00', duration: '01:00:00', tasks_completed: 1, pomodoros_completed: 2 },
  { id: 'demo-session-3', name: `${t('sessions.examPrep')}${suffix()}`, started_at: format(addDays(today, -7)) + 'T16:00:00', ended_at: format(addDays(today, -7)) + 'T18:00:00', duration: '02:00:00', tasks_completed: 3, pomodoros_completed: 4 },
  { id: 'demo-session-4', name: `${t('sessions.debugging')}${suffix()}`, started_at: format(addDays(today, -3)) + 'T11:00:00', ended_at: format(addDays(today, -3)) + 'T12:30:00', duration: '01:30:00', tasks_completed: 2, pomodoros_completed: 3 },
  { id: 'demo-session-5', name: `${t('sessions.frameworkResearch')}${suffix()}`, started_at: format(addDays(today, -5)) + 'T08:00:00', ended_at: format(addDays(today, -5)) + 'T09:00:00', duration: '01:00:00', tasks_completed: 1, pomodoros_completed: 2 },
];

export const getDemoHabits = () => [
  {
    id: 'demo-habit-1',
    name: t('habits.study.name'),
    description: t('habits.study.desc'),
    frequency: 'daily',
    target_count: 7,
    current_count: 5,
    color: '#3B82F6',
    icon: '📚',
    workspace_id: 'demo-ws-1',
    created_at: format(addDays(today, -7)),
    completed_dates: [format(addDays(today, -2)), format(addDays(today, -1)), todayStr],
    user_id: 'demo-user',
    completions: {
      [format(addDays(today, -2)) as string]: true,
      [format(addDays(today, -1)) as string]: true,
      [todayStr as string]: true
    } as Record<string, boolean>
  },
  {
    id: 'demo-habit-2',
    name: t('habits.exercise.name'),
    description: t('habits.exercise.desc'),
    frequency: 'daily',
    target_count: 5,
    current_count: 3,
    color: '#10B981',
    icon: '🏃',
    workspace_id: 'demo-ws-1',
    created_at: format(addDays(today, -5)),
    completed_dates: [yesterdayStr, todayStr],
    user_id: 'demo-user',
    completions: {
      [yesterdayStr as string]: true,
      [todayStr as string]: true
    } as Record<string, boolean>
  },
  {
    id: 'demo-habit-3',
    name: t('habits.code.name'),
    description: t('habits.code.desc'),
    frequency: 'daily',
    target_count: 7,
    current_count: 4,
    color: '#8B5CF6',
    icon: '💻',
    workspace_id: 'demo-ws-2',
    created_at: format(addDays(today, -6)),
    completed_dates: [format(addDays(today, -3)), format(addDays(today, -1)), todayStr],
    user_id: 'demo-user',
    completions: {
      [format(addDays(today, -3)) as string]: true,
      [format(addDays(today, -1)) as string]: true,
      [todayStr as string]: true
    } as Record<string, boolean>
  },
  {
    id: 'demo-habit-4',
    name: t('habits.project.name'),
    description: t('habits.project.desc'),
    frequency: 'weekly',
    target_count: 4,
    current_count: 2,
    color: '#F59E0B',
    icon: '📋',
    workspace_id: 'demo-ws-2',
    created_at: format(addDays(today, -14)),
    completed_dates: [format(addDays(today, -7)), format(addDays(today, -14))],
    user_id: 'demo-user',
    completions: {
      [format(addDays(today, -7)) as string]: true,
      [format(addDays(today, -14)) as string]: true
    } as Record<string, boolean>
  },
  {
    id: 'demo-habit-5',
    name: t('habits.reading.name'),
    description: t('habits.reading.desc'),
    frequency: 'weekly',
    target_count: 8,
    current_count: 5,
    color: '#EF4444',
    icon: '📖',
    workspace_id: 'demo-ws-1',
    created_at: format(addDays(today, -21)),
    completed_dates: [format(addDays(today, -7)), format(addDays(today, -3)), todayStr],
    user_id: 'demo-user',
    completions: {
      [format(addDays(today, -7)) as string]: true,
      [format(addDays(today, -3)) as string]: true,
      [todayStr as string]: true
    } as Record<string, boolean>
  }
];

// Demo StatData completo para evitar NaN
export const demoStats = {
  todayMinutes: 90,
  yesterdayMinutes: 120,
  weekMinutes: 420,
  monthMinutes: 1800,
  yearMinutes: 12000,
  lastYearMinutes: 9000,
  sessionsToday: 2,
  sessionsYesterday: 3,
  sessionsWeek: 8,
  sessionsMonth: 30,
  sessionsYear: 180,
  sessionsLastYear: 140,
  longestStreak: 4,
  currentStreak: 2,
  pomodoros: 15,
  tasksDone: 42,
};
