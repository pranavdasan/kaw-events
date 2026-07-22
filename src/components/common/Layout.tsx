import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Calendar,
  Radio,
  LogOut,
  Eye,
  Plus,
  Sparkles,
  Archive,
  History,
  Bookmark
} from 'lucide-react';
import { Event } from '../../types';
import { KawLogo } from './KawLogo';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CalendarIcon = ({ className }: { className?: string }) => <Calendar className={className || "w-6 h-6"} />;
const DashboardIcon = ({ className }: { className?: string }) => <LayoutDashboard className={className || "w-6 h-6"} />;

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  title: string;
  isAdmin?: boolean;
  bookmarkedCount?: number;
  onLogout?: () => void;
  events?: Event[];
  selectedAdminEventId?: string | null;
  onSelectAdminEvent?: (eventId: string) => void;
  onAddEvent?: () => void;
}

/**
 * Main Layout component providing navigation and responsive structure with mobile optimizations.
 */
export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  title, 
  isAdmin, 
  bookmarkedCount = 0,
  onLogout,
  events = [],
  selectedAdminEventId,
  onSelectAdminEvent,
  onAddEvent
}) => {
  const isUserViewActive = activeTab === 'events' || activeTab === 'schedule' || activeTab === 'session-details';

  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const { upcomingEvents, pastEvents } = React.useMemo(() => {
    const upcoming: Event[] = [];
    const past: Event[] = [];
    events.forEach(evt => {
      if (evt.date >= todayStr) upcoming.push(evt);
      else past.push(evt);
    });
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events, todayStr]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background antialiased selection:bg-primary selection:text-on-primary">
      {/* Mobile Top App Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-primary/95 backdrop-blur-md shadow-md h-16 flex items-center justify-between px-4 text-on-primary border-b border-white/10">
        <div className="flex items-center gap-3">
          <KawLogo className="w-8 h-8" />
          <h1 className="font-headline-sm font-extrabold truncate max-w-[220px] tracking-tight">{title}</h1>
        </div>
        {isAdmin && onLogout && (
          <button 
            onClick={onLogout} 
            className="p-2 hover:bg-white/10 active:scale-95 rounded-full transition-transform cursor-pointer"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 text-on-primary" />
          </button>
        )}
      </header>

      {/* Desktop Navigation Drawer */}
      <aside className="hidden md:flex flex-col h-full py-6 gap-2 w-80 bg-surface-container shadow-2xl fixed left-0 top-0 z-40 border-r border-outline-variant/60 overflow-y-auto">
        <div className="px-6 mb-6 flex items-center gap-3">
          <KawLogo className="w-12 h-12" showText={true} />
        </div>
        
        <nav className="flex flex-col gap-2 flex-grow px-3">
          {isAdmin ? (
            <>
              {/* User View Tab for Admins */}
              <button
                onClick={() => onTabChange('events')}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-2xl font-body-lg transition-all text-left font-bold cursor-pointer group",
                  isUserViewActive 
                    ? "bg-primary text-on-primary shadow-md" 
                    : "text-on-surface-variant hover:bg-surface-variant/80 hover:text-on-surface"
                )}
              >
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 shrink-0" />
                  <span>User View</span>
                </div>
                <span className={cn(
                  "text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider",
                  isUserViewActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                )}>
                  Preview
                </span>
              </button>

              <div className="my-3 border-t border-outline-variant/40 pt-3 space-y-4">
                {/* Active / Upcoming Events */}
                <div>
                  <p className="px-4 text-[10px] font-extrabold text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Active Events</span>
                  </p>

                  <div className="space-y-1">
                    {upcomingEvents.map((evt) => {
                      const isEventActive = activeTab === 'admin-dashboard' && selectedAdminEventId === evt.id;
                      return (
                        <button
                          key={evt.id}
                          onClick={() => {
                            if (onSelectAdminEvent) onSelectAdminEvent(evt.id);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer truncate",
                            isEventActive 
                              ? "bg-secondary-container text-on-secondary-container font-extrabold shadow-xs border border-outline-variant/40" 
                              : "text-on-surface-variant hover:bg-surface-variant/70 hover:text-on-surface"
                          )}
                        >
                          <CalendarIcon className={cn("w-4 h-4 shrink-0", isEventActive ? "text-primary" : "text-outline")} />
                          <span className="truncate">{evt.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Past Events Archive */}
                {pastEvents.length > 0 && (
                  <div>
                    <p className="px-4 text-[10px] font-extrabold text-on-surface-variant/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <History className="w-3 h-3" />
                      <span>Past Events Archive</span>
                    </p>

                    <div className="space-y-1">
                      {pastEvents.map((evt) => {
                        const isEventActive = activeTab === 'admin-dashboard' && selectedAdminEventId === evt.id;
                        return (
                          <button
                            key={evt.id}
                            onClick={() => {
                              if (onSelectAdminEvent) onSelectAdminEvent(evt.id);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer truncate opacity-80 hover:opacity-100",
                              isEventActive 
                                ? "bg-surface-variant text-on-surface font-extrabold shadow-xs border border-outline-variant/60" 
                                : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface"
                            )}
                          >
                            <Archive className={cn("w-3.5 h-3.5 shrink-0", isEventActive ? "text-primary" : "text-on-surface-variant")} />
                            <span className="truncate">{evt.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {onAddEvent && (
                  <button
                    onClick={onAddEvent}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-all text-left cursor-pointer mt-2 border border-dashed border-primary/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Event</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => onTabChange('events')}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl font-body-lg transition-all text-left font-bold cursor-pointer",
                  activeTab === 'events' || activeTab === 'schedule' || activeTab === 'session-details'
                    ? "bg-primary text-on-primary shadow-md" 
                    : "text-on-surface-variant hover:bg-surface-variant/80 hover:text-on-surface"
                )}
              >
                <CalendarIcon className="w-5 h-5" />
                <span>All Events</span>
              </button>

              <button
                onClick={() => onTabChange('bookmarks')}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-2xl font-body-lg transition-all text-left font-bold cursor-pointer",
                  activeTab === 'bookmarks'
                    ? "bg-primary text-on-primary shadow-md" 
                    : "text-on-surface-variant hover:bg-surface-variant/80 hover:text-on-surface"
                )}
              >
                <div className="flex items-center gap-4">
                  <Bookmark className="w-5 h-5" />
                  <span>My Saved Agenda</span>
                </div>
                {bookmarkedCount > 0 && (
                  <span className={cn(
                    "text-xs font-black px-2 py-0.5 rounded-full",
                    activeTab === 'bookmarks' 
                      ? "bg-on-primary text-primary" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {bookmarkedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onTabChange('admin-dashboard')}
                className="mt-auto flex items-center gap-4 px-4 py-3 rounded-2xl font-body-lg text-primary hover:bg-primary/5 transition-all font-bold border-2 border-dashed border-primary/20 cursor-pointer"
              >
                <DashboardIcon className="w-5 h-5" />
                Access Admin Portal
              </button>
            </>
          )}

          {isAdmin && onLogout && (
            <button
              onClick={onLogout}
              className="mt-auto flex items-center gap-4 px-4 py-3 rounded-2xl font-body-lg text-error hover:bg-error/10 transition-all font-bold cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          )}
        </nav>
      </aside>

      {/* Main Content Area - Mobile Safe Padding */}
      <main className="flex-grow w-full md:pl-80 pt-20 pb-28 md:pt-6 md:pb-12 transition-all">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/30 shadow-2xl pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {isAdmin ? (
            [
              { id: 'events', label: 'User View', icon: Eye },
              { id: 'admin-dashboard', label: 'Admin Portal', icon: DashboardIcon },
            ].map((item) => {
              const isActive = item.id === 'events' ? isUserViewActive : activeTab === 'admin-dashboard';
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className="relative flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all cursor-pointer"
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobileActiveTab"
                      className="absolute inset-x-3 inset-y-1 bg-primary/10 rounded-2xl -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn("w-5 h-5 transition-transform", isActive ? "text-primary scale-110" : "text-secondary")} />
                  <span className={cn("text-[11px] font-bold mt-0.5", isActive ? "text-primary" : "text-secondary")}>
                    {item.label}
                  </span>
                </button>
              );
            })
          ) : (
            [
              { id: 'events', label: 'Events', icon: CalendarIcon },
              { id: 'bookmarks', label: 'Saved', icon: Bookmark, badge: bookmarkedCount },
              { id: 'admin-dashboard', label: 'Admin', icon: DashboardIcon },
            ].map((item) => {
              const isActive = activeTab === item.id || (item.id === 'events' && (activeTab === 'schedule' || activeTab === 'session-details'));
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className="relative flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all cursor-pointer"
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobileActiveTab"
                      className="absolute inset-x-3 inset-y-1 bg-primary/10 rounded-2xl -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className="relative">
                    <item.icon className={cn("w-5 h-5 transition-transform", isActive ? "text-primary scale-110" : "text-secondary")} />
                    {item.badge && item.badge > 0 ? (
                      <span className="absolute -top-1.5 -right-2 bg-primary text-on-primary text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className={cn("text-[11px] font-bold mt-0.5", isActive ? "text-primary" : "text-secondary")}>
                    {item.label}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </nav>
    </div>
  );
};

