import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  writeBatch,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';
import { Event, Session, Participant } from '../types';

// Collection references
const eventsCol = collection(db, 'events');
const sessionsCol = collection(db, 'sessions');
const performersCol = collection(db, 'performers');
const bookmarksCol = collection(db, 'bookmarks');

// Helper: Convert Firestore Timestamps to strings
const timestampToString = (ts: Timestamp | string): string => {
  if (typeof ts === 'string') return ts;
  if (ts?.toDate) return ts.toDate().toISOString().split('T')[0];
  return '';
};

const timeToString = (ts: Timestamp | string): string => {
  if (typeof ts === 'string') return ts;
  if (ts?.toDate) return ts.toDate().toTimeString().slice(0, 5);
  return '09:00';
};

// Transform Firestore doc to Event
export const docToEvent = (doc: DocumentSnapshot): Event => {
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name || '',
    description: data.description || '',
    date: timestampToString(data.date),
    startTime: data.startTime || '09:00',
    endTime: data.endTime || '17:00',
    imageUrl: data.imageUrl || '',
    createdAt: data.createdAt?.toDate?.().toISOString(),
    updatedAt: data.updateAt?.toDate?.().toISOString(),
  };
};

// Transform Firestore doc to Session
export const docToSession = (doc: DocumentSnapshot): Session => {
  const data = doc.data()!;
  return {
    id: doc.id,
    eventId: data.eventId || '',
    title: data.title || '',
    description: data.description || '',
    durationInMin: data.durationInMin || 15,
    track: data.track || 'General',
    room: data.room || 'Main Hall',
    participants: (data.participants || []).map(docToParticipant),
    isLive: data.isLive || false,
    type: data.type || 'session',
    order: data.order ?? 0,
  };
};

// Transform Firestore doc to Participant (Performer)
export const docToParticipant = (doc: DocumentSnapshot | { id: string; data(): any }): Participant => {
  const data = doc.data ? doc.data() : doc;
  return {
    id: doc.id,
    name: data.name || '',
    role: data.role || '',
    group: data.group || '',
    avatarUrl: data.avatarUrl || '',
    eventIds: data.eventIds || [],
  };
};

// ==================== EVENTS ====================

export const getEvents = async (): Promise<Event[]> => {
  const q = query(eventsCol, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToEvent);
};

export const getEvent = async (id: string): Promise<Event | null> => {
  const docRef = doc(eventsCol, id);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? docToEvent(snapshot) : null;
};

export const createEvent = async (event: Omit<Event, 'id'>): Promise<string> => {
  const id = `e-${Date.now()}`;
  const eventData = {
    ...event,
    id,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await setDoc(doc(eventsCol, id), eventData);
  return id;
};

export const updateEvent = async (id: string, event: Partial<Event>): Promise<void> => {
  const eventRef = doc(eventsCol, id);
  await updateDoc(eventRef, {
    ...event,
    updatedAt: Timestamp.now(),
  });
};

export const deleteEvent = async (id: string): Promise<void> => {
  const batch = writeBatch(db);
  
  const sessionsSnap = await getDocs(query(sessionsCol, where('eventId', '==', id)));
  sessionsSnap.docs.forEach(doc => batch.delete(doc.ref));
  
  const performersSnap = await getDocs(query(performersCol, where('eventIds', 'array-contains', id)));
  performersSnap.docs.forEach(doc => batch.delete(doc.ref));
  
  batch.delete(doc(eventsCol, id));
  
  await batch.commit();
};

export const subscribeToEvents = (callback: (events: Event[]) => void) => {
  const q = query(eventsCol, orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(docToEvent));
  });
};

// ==================== SESSIONS ====================

export const getSessionsByEvent = async (eventId: string): Promise<Session[]> => {
  const q = query(sessionsCol, where('eventId', '==', eventId), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToSession);
};

export const getSession = async (id: string): Promise<Session | null> => {
  const docRef = doc(sessionsCol, id);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? docToSession(snapshot) : null;
};

export const createSession = async (session: Omit<Session, 'id'>): Promise<string> => {
  const id = `s-${Date.now()}`;
  const sessionData = {
    ...session,
    id,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await setDoc(doc(sessionsCol, id), sessionData);
  return id;
};

export const updateSession = async (id: string, session: Partial<Session>): Promise<void> => {
  const sessionRef = doc(sessionsCol, id);
  await updateDoc(sessionRef, {
    ...session,
    updatedAt: Timestamp.now(),
  });
};

export const deleteSession = async (id: string): Promise<void> => {
  await deleteDoc(doc(sessionsCol, id));
};

export const reorderSessions = async (sessions: Session[]): Promise<void> => {
  const batch = writeBatch(db);
  sessions.forEach((session, index) => {
    batch.update(doc(sessionsCol, session.id), { 
      order: index, 
      updatedAt: Timestamp.now() 
    });
  });
  await batch.commit();
};

export const subscribeToSessions = (eventId: string, callback: (sessions: Session[]) => void) => {
  const q = query(sessionsCol, where('eventId', '==', eventId), orderBy('order', 'asc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(docToSession));
  });
};

// ==================== PERFORMERS ====================

export const getPerformers = async (): Promise<Participant[]> => {
  const snapshot = await getDocs(performersCol);
  return snapshot.docs.map(docToParticipant);
};

export const getPerformersByEvent = async (eventId: string): Promise<Participant[]> => {
  const q = query(performersCol, where('eventIds', 'array-contains', eventId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToParticipant);
};

export const subscribeToPerformersByEvent = (eventId: string, callback: (performers: Participant[]) => void) => {
  const q = query(performersCol, where('eventIds', 'array-contains', eventId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(docToParticipant));
  });
};

export const createPerformer = async (performer: Omit<Participant, 'id'>): Promise<string> => {
  const id = `p-${Date.now()}`;
  await setDoc(doc(performersCol, id), performer);
  return id;
};

export const updatePerformer = async (id: string, performer: Partial<Participant>): Promise<void> => {
  await updateDoc(doc(performersCol, id), performer);
};

// Aliases for backward compatibility
export const createParticipant = createPerformer;
export const updateParticipant = updatePerformer;
export const getParticipants = getPerformers;

export const deletePerformer = async (id: string): Promise<void> => {
  await deleteDoc(doc(performersCol, id));
};

// ==================== BOOKMARKS ====================

export const getBookmarks = async (userId: string): Promise<string[]> => {
  const q = query(bookmarksCol, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().sessionId);
};

export const addBookmark = async (userId: string, sessionId: string, eventId: string): Promise<void> => {
  const id = `b-${Date.now()}`;
  await setDoc(doc(bookmarksCol, id), { userId, sessionId, eventId, createdAt: Timestamp.now() });
};

export const removeBookmark = async (userId: string, sessionId: string): Promise<void> => {
  const q = query(bookmarksCol, where('userId', '==', userId), where('sessionId', '==', sessionId));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};

// ==================== UTILITIES ====================

export const generateId = (prefix: string = 'doc') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Batch operations for revert/publish
export const publishPendingChanges = async (
  events: Event[],
  sessions: Session[]
): Promise<void> => {
  const batch = writeBatch(db);
  
  events.forEach(event => {
    const eventRef = doc(eventsCol, event.id);
    batch.set(eventRef, {
      ...event,
      updatedAt: Timestamp.now(),
    });
  });
  
  sessions.forEach(session => {
    const sessionRef = doc(sessionsCol, session.id);
    batch.set(sessionRef, {
      ...session,
      updatedAt: Timestamp.now(),
    });
  });
  
  await batch.commit();
};