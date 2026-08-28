import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Utensils, MapPin, Users, ChevronRight, Layers, Bookmark, Share2 } from 'lucide-react';
import { Event, Session, Track } from '../../types';
import { useAdaptiveSchedule, AdaptiveSession } from '../../hooks/useAdaptiveSchedule';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  const adaptiveSessions = useAdaptiveSchedule(sessions, dayStartTime, isAutoLiveMode);

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

  const renderSingleSessionCard = (session: AdaptiveSession, isParallel: boolean = false) => {
    if (session.type === 'break') {
      return (
        <div key={session.id} className="bg-surface-container-high/70 backdrop-blur-sm rounded-2xl py-3.5 px-4 flex items-center gap-4 border border-outline-variant/20">
          <div className="flex shrink-0 items-center gap-2 text-secondary font-bold text-xs">
            <Utensils className="w-4 h-4" />
            <span>{session.calculatedStartTime}</span>
          </div>
          <p className="font-bold text-sm text-on-surface m-0">{session.title}</p>
        </div>
      );
    }

    const isBookmarked = bookmarkedSessionIds.includes(session.id);

    return (
      <motion.div 
        key={session.id}
        whileTap={{ scale: 0.985 }}
        onClick={() => onSessionClick(session.id)}
        className={cn(
          "bg-surface-container-lowest rounded-3xl p-5 shadow-xs border border-outline-variant/40 hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col justify-between gap-4 cursor-pointer group",
          session.isLive && "border-l-4 border-l-error ring-1 ring-error/30 bg-gradient-to-r from-error/5 via-surface-container-lowest to-surface-container-lowest",
          !isParallel && "md:flex-row md:gap-6"
        )}
      >
        {/* Left/Header Column: Time & Status */}
        <div className={cn(
          "flex items-center justify-between shrink-0 pb-2 border-b border-outline-variant/30",
          !isParallel && "md:flex-col md:items-start md:justify-start md:w-28 md:pb-0 md:border-b-0"
        )}>
          <div>
            <p className="font-time-display text-primary text-base md:text-lg font-extrabold m-0 leading-tight">
              {session.calculatedStartTime}
            </p>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              {session.durationInMin} min
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {isParallel && (
              <span className="bg-primary/10 text-primary font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3" /> Concurrent
              </span>
            )}
            {session.isLive && (
              <span className="inline-flex items-center gap-1.5 bg-error text-on-error px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wider uppercase shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                LIVE
              </span>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-grow space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                <span className={session.isLive ? "text-error" : "text-primary font-extrabold"}>
                  {session.track} Track
                </span>
                <span className="text-outline-variant">•</span>
                <span className="text-on-surface-variant flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {session.room}
                </span>
              </div>

              {/* Action buttons: Bookmark & Share */}
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {onShareSession && (
                  <button
                    onClick={() => onShareSession(session, event.name)}
                    className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer"
                    title="Share session"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  disabled
                  title="Bookmarks — coming soon"
                  className="p-1.5 rounded-xl opacity-50 cursor-not-allowed"
                >
                  <Bookmark className="w-3.5 h-3.5 text-on-surface-variant/50" />
                </button>
              </div>
            </div>

            <h3 className="font-headline-sm text-on-surface text-base md:text-lg font-bold group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {session.title}
            </h3>
            
            {session.isLive && session.description && (
              <p className="text-xs text-on-surface-variant line-clamp-2 mt-1.5 leading-relaxed">
                {session.description}
              </p>
            )}
          </div>

          {/* Participants footer */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2.5 overflow-hidden">
                {session.participants.slice(0, 3).map(p => (
                  <div 
                    key={p.id} 
                    className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-primary/10 shrink-0 shadow-xs flex items-center justify-center"
                  >
                    <span className="text-xs font-bold text-primary">{p.name.charAt(0)}</span>
                  </div>
                ))}
              </div>
              <div className="truncate max-w-[180px]">
                <p className="text-xs font-bold text-on-surface truncate m-0">
                  {session.participants.length > 1 ? 'Participants' : session.participants[0]?.name || 'Participant'}
                </p>
                {session.participants.length === 1 && session.participants[0].group && (
                  <p className="text-[11px] text-on-surface-variant truncate m-0">
                    {session.participants[0].group}
                  </p>
                )}
              </div>
            </div>

            <div className="p-1.5 rounded-full bg-surface-container-low text-primary opacity-80 group-hover:bg-primary group-hover:text-on-primary transition-all shrink-0">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

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
                {group.sessions.map(session => renderSingleSessionCard(session, group.sessions.length > 1))}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

