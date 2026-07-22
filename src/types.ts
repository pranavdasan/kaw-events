export interface Speaker {
  id: string;
  name: string;
  role?: string;
  company: string;
  avatarUrl?: string;
  bio?: string;
  linkedIn?: string;
  twitter?: string;
}

export type Track = 'Keynote' | 'Engineering' | 'Design' | 'Workshop' | 'General';

export interface Session {
  id: string;
  eventId: string;
  title: string;
  description: string;
  durationInMin: number;
  day: number; // 1, 2, 3
  track: Track;
  room: string;
  speakers: Speaker[];
  isLive: boolean;
  type?: 'session' | 'break';
  order: number;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string; // ISO date
  startTimeByDay: Record<number, string>; // Map of day number to HH:mm start time
  endTimeByDay?: Record<number, string>; // Map of day number to HH:mm end time
  imageUrl: string;
  totalDays: number;
}
