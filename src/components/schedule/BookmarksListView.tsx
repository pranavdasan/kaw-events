import React from 'react';
import { motion } from 'motion/react';
import { Bookmark, Sparkles } from 'lucide-react';
import { SessionCard } from '../../components/schedule/SessionCard';
import { AdaptiveSession } from '../../hooks/useAdaptiveSchedule';
import { Event } from '../../types';

function cn(...inputs: string[]) {
  return inputs.filter(Boolean).join(' ');
}

interface BookmarksListViewProps {
  bookmarkedSessionIds: string[];
  sessions: any[];
  events: Event[];
  onToggleBookmark: (sessionId: string) => void;
  onSessionClick: (sessionId: string) => void;
  onShareSession: (session: any, eventName: string) => void;
  onExploreEvents: () => void;
}

/**
 * Placeholder view for bookmarks feature (coming soon).
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
  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }}
      className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-5"
    >
      <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-8 ring-primary/5">
        <Bookmark className="w-10 h-10" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="font-headline-md text-primary font-extrabold text-xl md:text-2xl m-0">Bookmarks</h2>
        {sessions.length > 0 ? (
          sessions.map(session => (
            <SessionCard
              key={session.id}
              variant="bookmark"
              session={session as AdaptiveSession}
              onClick={onSessionClick}
              onShare={onShareSession}
              onToggleBookmark={onToggleBookmark}
              eventName={events[0]?.name || 'Event'}
            />
          ))
        ) : (
          <p className="text-on-surface-variant font-body-md text-sm md:text-base leading-relaxed">
            We're building cross-device saved agendas. For now, browse events and sessions freely!
          </p>
        )}
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
};