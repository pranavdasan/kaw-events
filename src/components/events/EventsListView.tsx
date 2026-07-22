import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Clock, ChevronRight, Calendar, Layers, Archive, Sparkles, History } from 'lucide-react';
import { Event } from '../../types';
import { formatTimeTo12h } from '../../utils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface EventsListViewProps {
  events: Event[];
  onSelect: (id: string) => void;
  onAdminClick: () => void;
}

/**
 * Responsive grid view of events organized by Upcoming and Past Events.
 */
export const EventsListView: React.FC<EventsListViewProps> = ({ 
  events, 
  onSelect 
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'past'>('all');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const upcoming: Event[] = [];
    const past: Event[] = [];
    events.forEach(evt => {
      if (evt.date >= todayStr) {
        upcoming.push(evt);
      } else {
        past.push(evt);
      }
    });
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events, todayStr]);

  const renderEventCard = (event: Event, index: number, isPast: boolean = false) => (
    <motion.div 
      key={event.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 350, damping: 25 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(event.id)}
      className={cn(
        "bg-surface-container-lowest rounded-3xl overflow-hidden shadow-xs hover:shadow-xl border transition-all duration-300 flex flex-col group cursor-pointer",
        isPast 
          ? "border-outline-variant/40 opacity-90 hover:opacity-100" 
          : "border-outline-variant/60"
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-container">
        <img 
          src={event.imageUrl} 
          alt={event.name} 
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback to high quality floral carpet pookalam image if error occurs
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=800";
          }}
          className={cn(
            "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out",
            isPast && "grayscale-[30%] group-hover:grayscale-0"
          )} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/20 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary-fixed" />
            {new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {isPast ? (
            <span className="bg-surface-variant/90 backdrop-blur-md text-on-surface-variant text-xs font-extrabold px-2.5 py-1.5 rounded-full shadow-lg flex items-center gap-1 border border-outline-variant/30 uppercase tracking-wider">
              <Archive className="w-3.5 h-3.5 text-on-surface-variant" />
              Past Event
            </span>
          ) : (
            <span className="bg-primary/90 backdrop-blur-md text-on-primary text-xs font-bold px-2.5 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              {event.totalDays} {event.totalDays === 1 ? 'Day' : 'Days'}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-headline-md text-white font-extrabold drop-shadow-md leading-tight break-words">{event.name}</h3>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow justify-between gap-4">
        <p className="text-on-surface-variant font-body-md line-clamp-2 leading-relaxed m-0">
          {event.description}
        </p>

        <div className="flex items-center justify-between text-secondary pt-3 border-t border-outline-variant/30">
          <div className="flex items-center gap-2 font-body-md font-medium text-xs md:text-sm">
            <Clock className="w-4 h-4 text-primary" />
            <span>{isPast ? 'Concluded' : `Starts at ${formatTimeTo12h(event.startTimeByDay[1] || '09:00')}`}</span>
          </div>
          <div className="flex items-center gap-1 text-primary font-bold text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>{isPast ? 'View Archive' : 'View Schedule'}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-5">
        <div>
          <p className="text-on-surface-variant font-body-md m-0">Explore upcoming celebrations, festival schedules, and past event archives.</p>
        </div>

        {/* View Filter Switcher on the Right */}
        <div className="flex items-center p-1 bg-surface-container-high rounded-2xl border border-outline-variant/40 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              filterTab === 'all' 
                ? "bg-surface-container-lowest text-primary shadow-xs" 
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            All ({events.length})
          </button>
          <button
            onClick={() => setFilterTab('upcoming')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              filterTab === 'upcoming' 
                ? "bg-primary text-on-primary shadow-xs" 
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Upcoming ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setFilterTab('past')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              filterTab === 'past' 
                ? "bg-surface-variant text-on-surface shadow-xs" 
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <History className="w-3.5 h-3.5" />
            Past ({pastEvents.length})
          </button>
        </div>
      </div>

      {/* Upcoming Events Section */}
      {(filterTab === 'all' || filterTab === 'upcoming') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-headline-md text-primary font-bold m-0 text-lg">Upcoming & Active Events</h2>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {upcomingEvents.map((event, idx) => renderEventCard(event, idx, false))}
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-container-low rounded-3xl border border-outline-variant/40">
              <p className="text-on-surface-variant font-medium text-sm">No upcoming events scheduled right now.</p>
            </div>
          )}
        </div>
      )}

      {/* Past Events Section */}
      {(filterTab === 'all' || filterTab === 'past') && (
        <div className={cn("space-y-4", filterTab === 'all' && "pt-6 border-t border-outline-variant/30")}>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-on-surface-variant" />
            <h2 className="font-headline-md text-on-surface-variant font-bold m-0 text-lg">Past Events Archive</h2>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant">
              {pastEvents.length}
            </span>
          </div>
          {pastEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {pastEvents.map((event, idx) => renderEventCard(event, idx, true))}
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-container-low rounded-3xl border border-outline-variant/40">
              <p className="text-on-surface-variant font-medium text-sm">No past events found in archive.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

