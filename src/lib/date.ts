const LONG_DATE = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const SHORT_DATE = new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric' });

const FULL_DATE = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/** "Tuesday, August 23" */
export function formatLongDate(iso: string): string {
  const parts = LONG_DATE.formatToParts(new Date(iso));
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return weekday + ', ' + month + ' ' + day;
}

/** "Aug 23" */
export function formatShortDate(iso: string): string {
  return SHORT_DATE.format(new Date(iso)).replace(/(\d+)\s(\w+)/, '$2 $1');
}

/** "October 18, 2026" */
export function formatFullDate(iso: string): string {
  const parts = FULL_DATE.formatToParts(new Date(iso));
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  return month + ' ' + day + ', ' + year;
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function weeksBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Math.max(0, Math.round(ms / MS_PER_WEEK));
}

/** "today", "yesterday", "3 days ago", then falls back to a short date. */
export function formatRelativeDay(iso: string, now = new Date()): string {
  const then = new Date(iso);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(then)) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return days + ' days ago';
  return formatShortDate(iso);
}

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
