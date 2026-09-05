import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Event, Session, Track } from '../../types';
import { useAdaptiveSchedule, AdaptiveSession } from '../../hooks/useAdaptiveSchedule';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SessionCard } from './SessionCard';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface EventScheduleViewProps {
  event: Event;
  sessions: Session[];
  isAutoLiveMode?: boolean;
  bookmarkedSessionIds?: string[];
  onToggleBookmark?: (sessionId: string) => void;
  onShareSession?: (session: Session, eventName: string) => void;
  onSessionClick: (id: string) => void;
}

/**
 * Detailed schedule view with sticky day & track filtering and mobile-first card design.
 * Features side-by-side parallel session support when multiple sessions run simultaneously.
 */
export const EventScheduleView: React.FC<EventScheduleViewProps> = ({ 
  event, 
  sessions, 
  isAutoLiveMode = true,
  bookmarkedSessionIds = [],
  onToggleBookmark,
  onShareSession,
  onSessionClick 
}) => {
  const [activeTrack, setActiveTrack] = useState<Track | 'All'>('All');

  const dayStartTime = event.startTime || '09:00';
  const adaptiveSessions = useAdaptiveSchedule(sessions, dayStartTime, isAutoLiveMode, event.id);

  const finalSessions = useMemo(() => {
    return adaptiveSessions.filter(s => activeTrack === 'All' || s.track === activeTrack);
  }, [adaptiveSessions, activeTrack]);

  // Group sessions by start time slot for simultaneous/parallel track support
  const timeSlotGroups = useMemo(() => {
    const groups: { time: string; isParallel: boolean; sessions: AdaptiveSession[] }[] = [];
    
    finalSessions.forEach(session => {
      const existing = groups.find(g => g.time === session.calculatedStartTime);
      if (existing) {
        existing.sessions.push(session);
        existing.isParallel = true;
      } else {
        groups.push({
          time: session.calculatedStartTime,
          isParallel: false,
          sessions: [session]
        });
      }
    });

    return groups;
  }, [finalSessions]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      {/* Sticky Header Filters on Mobile for smooth scrolling */}
      <div className="sticky top-16 md:top-0 z-30 bg-background/95 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 border-b border-outline-variant/30 space-y-3">
        {/* Track Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
          {['All', 'Song', 'Dance', 'Committee', 'Award', 'General'].map((track) => {
            const isActive = activeTrack === track;
            return (
              <button
                key={track}
                onClick={() => setActiveTrack(track as Track | 'All')}
                className={cn(
                  "relative px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer transition-all",
                  isActive 
                    ? "bg-secondary-container text-on-secondary-container border-outline-variant shadow-xs" 
                    : "bg-surface text-on-surface-variant border-outline-variant/60 hover:bg-surface-variant"
                )}
              >
                {track === 'All' ? 'All Tracks' : track}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Section */}
      <div className="relative border-l-2 border-outline-variant/40 pl-4 md:pl-8 space-y-6 pt-2">
        {timeSlotGroups.length === 0 ? (
          <div className="p-8 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/40 text-on-surface-variant">
            <p className="font-bold text-sm">No sessions found for this track filter.</p>
          </div>
        ) : (
          timeSlotGroups.map((group) => (
            <div key={group.time} className="relative space-y-3">
              {/* Timeline Node */}
              <div className={cn(
                "absolute -left-[23px] md:-left-[39px] top-6 w-3.5 h-3.5 rounded-full border-2 border-background shadow-xs z-10 transition-transform",
                group.sessions.some(s => s.isLive) ? "bg-error animate-pulse ring-4 ring-error/20" : "bg-outline-variant"
              )} />

              {/* Grid of Sessions (1 col on mobile, 2 cols on desktop if parallel) */}
              <div className={cn(
                "grid grid-cols-1 gap-4",
                group.sessions.length > 1 && "md:grid-cols-2"
              )}>
                {group.sessions.map(session => (
                  <SessionCard
                    key={session.id}
                    variant="user"
                    session={session}
                    onClick={onSessionClick}
                    onShare={onShareSession}
                    onToggleBookmark={onToggleBookmark}
                    eventName={event.name}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

