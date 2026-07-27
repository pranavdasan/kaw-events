import { describe, it, expect } from 'vitest';
import { Session } from './types';

// Pure logic calculation function replicating hook math for standalone node testing
function calculateAdaptiveTimes(sessions: Session[], dayStartTime: string) {
  const sorted = [...sessions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  let currentTime = dayStartTime;
  let currentOrder: number | null = null;
  let nextBlockTime = dayStartTime;

  return sorted.map(session => {
    const order = session.order ?? 0;
    if (currentOrder !== null && order !== currentOrder) {
      currentTime = nextBlockTime;
    }
    currentOrder = order;

    const start = currentTime;
    const [sh, sm] = start.split(':').map(Number);
    const startMinutes = (sh || 0) * 60 + (sm || 0);
    const endMinutes = startMinutes + session.durationInMin;

    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;

    const currNextMins = nextBlockTime.split(':').reduce((h, m) => Number(h) * 60 + Number(m), 0);
    if (endMinutes > currNextMins) {
      nextBlockTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    }

    return {
      ...session,
      startTime: start,
      endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
    };
  });
}

const mockSessions: Session[] = [
  {
    id: 's1',
    eventId: 'e1',
    title: 'Song Performance',
    description: 'Opening song',
    durationInMin: 45,
    track: 'Song',
    room: 'Main Hall',
    participants: [],
    isLive: false,
    order: 0
  },
  {
    id: 's2',
    eventId: 'e1',
    title: 'Dance Performance',
    description: 'Group dance',
    durationInMin: 30,
    track: 'Dance',
    room: 'Room 101',
    participants: [],
    isLive: false,
    order: 1
  }
];

describe('adaptive schedule algorithm', () => {
  it('calculates adaptive start and end times based on order and duration', () => {
    const adaptive = calculateAdaptiveTimes(mockSessions, '09:00');

    expect(adaptive.length).toBe(2);
    
    // First session starts at 09:00 and lasts 45 minutes -> ends at 09:45
    expect(adaptive[0].startTime).toBe('09:00');
    expect(adaptive[0].endTime).toBe('09:45');

    // Second session (order 1) starts at 09:45 and lasts 30 minutes -> ends at 10:15
    expect(adaptive[1].startTime).toBe('09:45');
    expect(adaptive[1].endTime).toBe('10:15');
  });
});
