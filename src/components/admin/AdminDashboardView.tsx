import React, { useState, useMemo } from 'react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { Plus, Edit, GripVertical, RotateCcw, Zap, Sliders, ChevronDown, Check, Calendar, Trash2 } from 'lucide-react';
import { Event, Session } from '../../types';
import { useAdaptiveSchedule } from '../../hooks/useAdaptiveSchedule';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AdminDashboardViewProps {
  events: Event[];
  sessions: Session[];
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string) => void;
  isAutoLiveMode?: boolean;
  onResetAutoLive?: () => void;
  onToggleLive: (sessionId: string) => void;
  onEditSession: (sessionId: string) => void;
  onAddEvent: () => void;
  onEditEvent: (eventId: string) => void;
  onDeleteEvent?: (eventId: string) => void;
  onReorderSessions: (sessions: Session[]) => void;
  onQuickAdd: (title: string, duration: number, day: number) => void;
}

/**
 * Admin portal dashboard for managing programs, events, and live states.
 */
export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ 
  events, 
  sessions, 
  selectedEventId: propSelectedEventId,
  onSelectEvent,
  isAutoLiveMode = true,
  onResetAutoLive,
  onToggleLive, 
  onEditSession, 
  onAddEvent, 
  onEditEvent, 
  onDeleteEvent,
  onReorderSessions, 
  onQuickAdd 
}) => {
  const [internalSelectedEventId, setInternalSelectedEventId] = useState(events[0]?.id);
  const [isEventMenuOpen, setIsEventMenuOpen] = useState(false);

  const selectedEventId = propSelectedEventId || internalSelectedEventId || events[0]?.id;

  const handleSelectEvent = (id: string) => {
    setInternalSelectedEventId(id);
    setIsEventMenuOpen(false);
    if (onSelectEvent) {
      onSelectEvent(id);
    }
  };
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const upcoming: Event[] = [];
    const past: Event[] = [];
    events.forEach(evt => {
      if (evt.date >= todayStr) upcoming.push(evt);
      else past.push(evt);
    });
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events, todayStr]);

  const [activeDay, setActiveDay] = useState(1);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddDuration, setQuickAddDuration] = useState('15');
  const [customDuration, setCustomDuration] = useState('');

  const event = useMemo(() => events.find(e => e.id === selectedEventId), [events, selectedEventId]);

  const handleQuickAdd = () => {
    if (!quickAddTitle) return;
    const duration = quickAddDuration === 'custom' 
      ? (parseInt(customDuration) || 15) 
      : (parseInt(quickAddDuration) || 15);
    onQuickAdd(quickAddTitle, duration, activeDay);
    setQuickAddTitle('');
    if (quickAddDuration === 'custom') {
      setCustomDuration('');
      setQuickAddDuration('15');
    }
  };
  
  const filteredSessions = useMemo(() => 
    sessions.filter(s => s.eventId === selectedEventId && s.day === activeDay), 
    [sessions, selectedEventId, activeDay]
  );
  
  const orderedSessions = useMemo(() => 
    [...filteredSessions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [filteredSessions]
  );

  const handleReorder = (newOrderedSessions: Session[]) => {
    const updated = newOrderedSessions.map((s, idx) => ({ ...s, order: idx }));
    onReorderSessions(updated);
  };

  const dayStartTime = event?.startTimeByDay[activeDay] || event?.startTimeByDay[1] || '09:00';
  const adaptiveSessions = useAdaptiveSchedule(orderedSessions, dayStartTime, isAutoLiveMode);

  const liveSessionsCount = useMemo(() => adaptiveSessions.filter(s => s.isLive).length, [adaptiveSessions]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-primary font-extrabold m-0 tracking-tight">
              {event?.name || 'Program Sequence'}
            </h1>
            {event && (
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => onEditEvent(event.id)}
                  className="p-1.5 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface-variant transition-colors cursor-pointer"
                  title="Edit Event Details"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {onDeleteEvent && (
                  <button 
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${event.name}" and all its scheduled sessions?`)) {
                        onDeleteEvent(event.id);
                      }
                    }}
                    className="p-1.5 rounded-xl bg-error/10 hover:bg-error/20 text-error transition-colors cursor-pointer"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-on-surface-variant font-body-md mt-1">Manage live states and session schedule sequence.</p>
        </div>

        {events.length > 1 && (
          <div className="relative sm:hidden">
            <button
              onClick={() => setIsEventMenuOpen(!isEventMenuOpen)}
              className="w-full flex items-center justify-between gap-3 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl px-4 py-2.5 shadow-xs hover:border-primary/50 transition-all cursor-pointer active:scale-98"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Calendar className="w-4 h-4 shrink-0" />
                </div>
                <div className="text-left truncate">
                  <span className="block text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant/70 -mb-0.5">
                    Selected Event
                  </span>
                  <span className="font-extrabold text-xs text-primary truncate block">
                    {event?.name || 'Select Event'}
                  </span>
                </div>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-primary shrink-0 transition-transform duration-200", isEventMenuOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isEventMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-2xs" 
                    onClick={() => setIsEventMenuOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute left-0 right-0 top-full mt-2 z-50 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-1.5 shadow-xl space-y-0.5 overflow-hidden"
                  >
                    <div className="p-1 max-h-60 overflow-y-auto space-y-2">
                      {upcomingEvents.length > 0 && (
                        <div>
                          <p className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-primary">Active Events</p>
                          {upcomingEvents.map((e) => {
                            const isSelected = e.id === selectedEventId;
                            return (
                              <button
                                key={e.id}
                                onClick={() => handleSelectEvent(e.id)}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer",
                                  isSelected 
                                    ? "bg-primary text-on-primary shadow-xs" 
                                    : "text-on-surface-variant hover:bg-surface-variant/70 hover:text-on-surface"
                                )}
                              >
                                <span className="truncate">{e.name}</span>
                                {isSelected && <Check className="w-4 h-4 shrink-0 ml-2" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {pastEvents.length > 0 && (
                        <div>
                          <p className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant/70">Past Events Archive</p>
                          {pastEvents.map((e) => {
                            const isSelected = e.id === selectedEventId;
                            return (
                              <button
                                key={e.id}
                                onClick={() => handleSelectEvent(e.id)}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer opacity-80 hover:opacity-100",
                                  isSelected 
                                    ? "bg-surface-variant text-on-surface shadow-xs font-extrabold" 
                                    : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface"
                                )}
                              >
                                <span className="truncate">{e.name}</span>
                                {isSelected && <Check className="w-4 h-4 shrink-0 ml-2" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Event Sessions', value: filteredSessions.length, color: 'bg-surface-container-lowest' },
          { label: 'Live Now', value: liveSessionsCount, color: 'bg-error-container text-error', live: true },
          { label: 'Total Events', value: events.length, color: 'bg-surface-container-lowest' },
        ].map((stat, idx) => (
          <div key={idx} className={cn("rounded-xl p-5 shadow-sm border border-outline-variant/20 flex flex-col relative overflow-hidden", stat.color)}>
            {stat.live && (
              <div className="absolute top-3 right-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-error" />
                </span>
              </div>
            )}
            <span className="font-label-caps text-on-surface-variant mb-2">{stat.label}</span>
            <span className="font-headline-lg">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Hybrid Live Mode Control Banner */}
      <div className={cn(
        "rounded-2xl p-4 border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-sm",
        isAutoLiveMode 
          ? "bg-primary-container/20 border-primary/30 text-on-surface" 
          : "bg-amber-500/10 border-amber-500/30 text-on-surface"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl shrink-0", isAutoLiveMode ? "bg-primary/10 text-primary" : "bg-amber-500/20 text-amber-600")}>
            {isAutoLiveMode ? <Zap className="w-5 h-5" /> : <Sliders className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">
                Live Status: {isAutoLiveMode ? "Automatic Clock Schedule" : "Admin Manual Override Active"}
              </span>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide",
                isAutoLiveMode ? "bg-primary/15 text-primary border border-primary/20" : "bg-amber-500/20 text-amber-700 border border-amber-500/30"
              )}>
                {isAutoLiveMode ? "Auto Mode" : "Admin Override"}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              {isAutoLiveMode 
                ? "Live status automatically updates with current clock time. Toggling any session below switches to Admin Override."
                : "A session live state was manually set by admin. Re-enable Auto Mode anytime to return to system clock sync."}
            </p>
          </div>
        </div>

        {!isAutoLiveMode && onResetAutoLive && (
          <button
            onClick={onResetAutoLive}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-on-primary font-bold text-xs shadow-sm hover:opacity-90 transition-all shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Automatic Mode</span>
          </button>
        )}
      </div>

      {event && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-surface-container-low rounded-full p-1 border border-outline-variant w-max">
            {Array.from({ length: event.totalDays || 1 }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={cn(
                  "px-4 py-2 rounded-full font-label-caps transition-all",
                  activeDay === day ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                Day {day}
              </button>
            ))}
          </div>

          <div className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <input 
                placeholder="Quick add (e.g. Intermission, Lamp Lighting, Welcome Speech...)" 
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 focus:border-primary outline-none text-sm"
                value={quickAddTitle}
                onChange={e => setQuickAddTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {quickAddDuration === 'custom' ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <input 
                    type="number" 
                    placeholder="Mins" 
                    className="w-20 bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-2 text-sm focus:border-primary outline-none"
                    value={customDuration}
                    onChange={e => setCustomDuration(e.target.value)}
                    min="1"
                    autoFocus
                  />
                  <button 
                    onClick={() => { setQuickAddDuration('15'); setCustomDuration(''); }}
                    className="text-xs text-on-surface-variant hover:text-primary font-bold px-1.5 py-2 hover:bg-surface-variant rounded"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select 
                  className="bg-surface-container-lowest border border-outline-variant rounded-lg px-2 py-2 text-sm focus:border-primary outline-none"
                  value={quickAddDuration}
                  onChange={e => setQuickAddDuration(e.target.value)}
                >
                  <option value="5">5 min</option>
                  <option value="10">10 min</option>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 hr</option>
                  <option value="custom">Custom...</option>
                </select>
              )}
              <button 
                onClick={handleQuickAdd}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-caps whitespace-nowrap hover:opacity-90 transition-all flex items-center gap-2 font-bold"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          <Reorder.Group axis="y" values={adaptiveSessions} onReorder={handleReorder} className="space-y-2 relative">
            <div className="hidden sm:block absolute left-32 top-4 bottom-4 w-0.5 bg-outline-variant/30 -z-10" />
            {adaptiveSessions.length > 0 ? adaptiveSessions.map(session => (
              <Reorder.Item key={session.id} value={session}>
                <div className={cn(
                  "bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-xs border border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 group transition-all hover:shadow-md",
                  session.isLive && "border-l-4 border-l-error bg-gradient-to-r from-error/5 via-surface-container-lowest to-surface-container-lowest"
                )}>
                  <div className="flex items-center justify-between w-full sm:w-auto">
                    <div className="cursor-grab active:cursor-grabbing text-outline-variant hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-surface-container-high touch-none">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Mobile Only Time Display */}
                    <div className="sm:hidden flex items-center gap-2">
                      <span className="font-time-display text-primary font-bold text-sm">{session.calculatedStartTime}</span>
                      {session.isLive ? (
                        <span className="text-error font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 bg-error/10 px-2 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-error animate-ping" /> LIVE
                        </span>
                      ) : (
                        <span className="text-on-surface-variant text-[11px] font-bold uppercase">{session.durationInMin}m</span>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:block w-28 flex-shrink-0">
                    <span className="font-time-display text-primary font-bold">{session.calculatedStartTime}</span>
                    {session.isLive ? (
                      <span className="text-error font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-error animate-ping" /> LIVE
                      </span>
                    ) : (
                      <span className="text-on-surface-variant text-[11px] font-bold uppercase mt-0.5 block">{session.durationInMin} MIN</span>
                    )}
                  </div>

                  <div className="flex-1 w-full">
                    <h3 className="font-headline-sm text-primary text-base font-bold leading-snug">{session.title}</h3>
                    <p className="font-body-md text-on-surface-variant text-xs mt-0.5">{session.room} • {session.speakers[0]?.name || 'Staff'}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Live</span>
                      <button 
                        onClick={() => onToggleLive(session.id)}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-all shadow-inner cursor-pointer",
                          session.isLive ? "bg-error" : "bg-surface-dim border border-outline/20"
                        )}
                        aria-label="Toggle Live State"
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 rounded-full shadow-sm transition-all",
                          session.isLive ? "right-1 bg-white" : "left-1 bg-white"
                        )} />
                      </button>
                    </div>

                    <button 
                      onClick={() => onEditSession(session.id)} 
                      className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer border border-outline-variant/30"
                      aria-label="Edit Session"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Reorder.Item>
            )) : (
              <div className="p-8 text-center bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant">
                <p className="text-on-surface-variant font-medium text-sm">No sessions scheduled for this day.</p>
              </div>
            )}
          </Reorder.Group>
        </div>
      )}
    </motion.div>
  );
};
