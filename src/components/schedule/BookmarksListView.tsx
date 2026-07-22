import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Bookmark, Clock, MapPin, ChevronRight, Share2, Calendar, Trash2, BookmarkX, Sparkles, Layers } from 'lucide-react';
import { Session, Event } from '../../types';
import { formatTimeTo12h } from '../../utils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface AdaptiveBookmarkedSession extends Session {
  calculatedStartTime: string;
  calculatedEndTime: string;
}

interface BookmarksListViewProps {
  bookmarkedSessionIds: string[];
  sessions: Session[];
  events: Event[];
  onToggleBookmark: (sessionId: string) => void;
  onSessionClick: (sessionId: string) => void;
  onShareSession: (session: Session, eventName: string) => void;
  onExploreEvents: () => void;
}

/**
 * Calculate exact adaptive start and end times for sessions of a specific event day.
 */
function calculateAdaptiveTimesForDay(sessionsForDay: Session[], dayStartTime: string): AdaptiveBookmarkedSession[] {
  const sorted = [...sessionsForDay].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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

    const calculatedStartTime = formatTimeTo12h(start);

    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    const calculatedEndTime = formatTimeTo12h(`${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`);

    const currNextMins = nextBlockTime.split(':').reduce((h, m) => Number(h) * 60 + Number(m), 0);
    if (endMinutes > currNextMins) {
      nextBlockTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    }

    return {
      ...session,
      calculatedStartTime,
      calculatedEndTime
    };
  });
}

/**
 * Dedicated view listing all bookmarked sessions saved by the user across events,
 * complete with calculated session start and end times.
 */
export const BookmarksListView: React.FC<BookmarksListViewProps> = ({
  bookmarkedSessionIds,
  sessions,
  events,
  onToggleBookmark,
  onSessionClick,
  onShareSession,
  onExploreEvents
}) => {
  // Calculate adaptive timing for all sessions grouped by event and day
  const allAdaptiveSessions = useMemo(() => {
    const map = new Map<string, AdaptiveBookmarkedSession>();

    events.forEach(event => {
      for (let day = 1; day <= event.totalDays; day++) {
        const dayStartTime = event.startTimeByDay[day] || '09:00';
        const daySessions = sessions.filter(s => s.eventId === event.id && s.day === day);
        const adaptiveDaySessions = calculateAdaptiveTimesForDay(daySessions, dayStartTime);
        
        adaptiveDaySessions.forEach(as => {
          map.set(as.id, as);
        });
      }
    });

    return map;
  }, [events, sessions]);

  // Filter bookmarked sessions with adaptive timings
  const bookmarkedSessions = useMemo(() => {
    return bookmarkedSessionIds
      .map(id => allAdaptiveSessions.get(id))
      .filter((s): s is AdaptiveBookmarkedSession => Boolean(s));
  }, [bookmarkedSessionIds, allAdaptiveSessions]);

  // Group bookmarked sessions by Event
  const groupedByEvent = useMemo(() => {
    const map = new Map<string, { event: Event; sessions: AdaptiveBookmarkedSession[] }>();

    bookmarkedSessions.forEach(session => {
      const event = events.find(e => e.id === session.eventId);
      if (event) {
        if (!map.has(event.id)) {
          map.set(event.id, { event, sessions: [] });
        }
        map.get(event.id)!.sessions.push(session);
      }
    });

    return Array.from(map.values());
  }, [bookmarkedSessions, events]);

  if (bookmarkedSessions.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 12 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0 }}
        className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-5"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-8 ring-primary/5">
          <BookmarkX className="w-10 h-10" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="font-headline-md text-primary font-extrabold text-xl md:text-2xl m-0">No Bookmarked Sessions Yet</h2>
          <p className="text-on-surface-variant font-body-md text-sm md:text-base leading-relaxed">
            Keep track of keynotes, workshops, and panels you don't want to miss. Tap the bookmark icon on any session card to save it here.
          </p>
        </div>
        <button
          onClick={onExploreEvents}
          className="bg-primary text-on-primary px-6 py-3 rounded-2xl font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Browse Event Schedules</span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-headline-lg text-primary font-extrabold tracking-tight m-0">My Saved Schedule</h1>
            <span className="bg-primary text-on-primary text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
              {bookmarkedSessions.length}
            </span>
          </div>
          <p className="text-on-surface-variant font-body-md mt-1">Your curated agenda across all conference programs.</p>
        </div>
      </div>

      <div className="space-y-8">
        {groupedByEvent.map(({ event, sessions: eventSessions }) => (
          <div key={event.id} className="space-y-4">
            {/* Event Header Banner */}
            <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/40">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-surface-container">
                <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <h2 className="font-headline-sm text-on-surface font-extrabold text-base truncate m-0">{event.name}</h2>
              </div>
            </div>

            {/* Sessions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventSessions.map((session) => (
                <div 
                  key={session.id}
                  onClick={() => onSessionClick(session.id)}
                  className="bg-surface-container-lowest rounded-3xl p-5 shadow-xs border border-outline-variant/40 hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col justify-between gap-4 cursor-pointer group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-secondary-fixed text-on-secondary-fixed font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Day {session.day} • {session.track} Track
                      </span>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onShareSession(session, event.name)}
                          className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer"
                          title="Share session"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onToggleBookmark(session.id)}
                          className="p-1.5 rounded-xl text-error hover:bg-error/10 transition-colors cursor-pointer"
                          title="Remove bookmark"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-headline-sm text-on-surface text-base font-bold group-hover:text-primary transition-colors line-clamp-2 leading-snug m-0">
                      {session.title}
                    </h3>

                    {/* Session Timing Chip - Below Title */}
                    <div>
                      <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-xl border border-primary/20 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-time-display font-bold text-xs">
                          {session.calculatedStartTime} – {session.calculatedEndTime}
                        </span>
                        <span className="text-[10px] font-semibold text-on-surface-variant/80 border-l border-primary/20 pl-1.5">
                          {session.durationInMin} min
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-outline-variant/30 text-xs font-semibold text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="text-on-surface font-bold">{session.room}</span>
                      {session.speakers.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[140px] text-on-surface-variant">
                            {session.speakers[0].name}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="p-1.5 rounded-full bg-surface-container-low text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

