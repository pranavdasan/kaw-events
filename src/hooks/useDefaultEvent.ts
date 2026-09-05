import { Event } from '../types';

export function getDefaultEventId(events: Event[]): string | null {
  if (!events.length) return null;

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const upcoming = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  if (upcoming) return upcoming.id;

  const past = events
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  if (past) return past.id;

  return events[0].id;
}