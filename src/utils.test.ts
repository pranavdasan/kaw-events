import { describe, it, expect } from 'vitest';
import { addMinutesToTime, formatTimeTo12h } from './utils';

describe('utils formatting & time math', () => {
  it('formatTimeTo12h should correctly format 24h string to 12h AM/PM format', () => {
    const formatted0900 = formatTimeTo12h('09:00');
    expect(formatted0900.toLowerCase()).toContain('9:00');
    expect(formatted0900.toLowerCase()).toContain('am');

    const formatted1430 = formatTimeTo12h('14:30');
    expect(formatted1430.toLowerCase()).toContain('2:30');
    expect(formatted1430.toLowerCase()).toContain('pm');
  });

  it('addMinutesToTime should correctly add minutes', () => {
    const result = addMinutesToTime('09:30', 45);
    expect(result.toLowerCase()).toContain('10:15');
    expect(result.toLowerCase()).toContain('am');
  });
});
