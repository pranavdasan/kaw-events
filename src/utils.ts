
/**
 * Utility to add minutes to a time string (HH:mm)
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Utility to format a time string to 12 hour format
 */
export function formatTimeTo12h(time: string): string {
  const [hours, mins] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}
