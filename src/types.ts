export interface Participant {
  id: string;
  name: string;
  role?: string;
  group?: string;
  avatarUrl?: string;
}

export type Track = 'Song' | 'Dance' | 'Committee' | 'Award' | 'General';

export interface Session {
  id: string;
  eventId: string;
  title: string;
  description: string;
  durationInMin: number;
  day: number;
  track: Track;
  room: string;
  participants: Participant[];
  isLive: boolean;
  type?: 'session' | 'break';
  order: number;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  startTimeByDay: Record<number, string>;
  endTimeByDay?: Record<number, string>;
  imageUrl: string;
  totalDays: number;
}