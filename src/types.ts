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
  track: Track;
  room: string;
  participants: Participant[];
  isLive: boolean;
  type?: 'session' | 'break';
  order: number;
  isPending?: boolean;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  imageUrl: string;
}