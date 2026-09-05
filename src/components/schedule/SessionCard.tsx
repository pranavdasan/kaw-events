import React from 'react';
import { motion } from 'motion/react';
import { Reorder } from 'motion/react';
import { Utensils, MapPin, Users, ChevronRight, Layers, Bookmark, Share2, Edit, Trash2, Zap } from 'lucide-react';
import { GripVertical } from 'lucide-react';
import { AdaptiveSession } from '../../hooks/useAdaptiveSchedule';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Variant = 'user' | 'admin' | 'bookmark';

interface SessionCardProps {
  session: AdaptiveSession;
  variant: Variant;
  onClick?: (id: string) => void;
  onShare?: (session: AdaptiveSession, eventName: string) => void;
  onToggleBookmark?: (id: string) => void;
  onToggleLive?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReorder?: (sessions: AdaptiveSession[]) => void;
  eventName?: string;
}

export const SessionCard = React.memo<SessionCardProps>(({ session, variant, onClick, onShare, onToggleBookmark, onToggleLive, onEdit, onDelete, onReorder, eventName }) => {
  const isBookmarked = false;

  const renderUserVariant = () => {
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

    return (
      <motion.div
        key={session.id}
        whileTap={{ scale: 0.985 }}
        onClick={() => onClick?.(session.id)}
        className={cn(
          "bg-surface-container-lowest rounded-3xl p-5 shadow-xs border border-outline-variant/40 hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col justify-between gap-4 cursor-pointer group",
          session.isLive && "border-l-4 border-l-error ring-1 ring-error/30 bg-gradient-to-r from-error/5 via-surface-container-lowest to-surface-container-lowest",
          !session.isLive && "border-l-4 border-l-primary ring-1 ring-primary/30 bg-gradient-to-r from-primary/5 via-surface-container-lowest to-surface-container-lowest"
        )}
      >
        <div className={cn(
          "flex items-center justify-between shrink-0 pb-2 border-b border-outline-variant/30",
          "md:flex-col md:items-start md:justify-start md:w-28 md:pb-0 md:border-b-0"
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
            {session.isLive && (
              <span className="inline-flex items-center gap-1.5 bg-error text-on-error px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wider uppercase shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                LIVE
              </span>
            )}
          </div>
        </div>

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

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
{onShare && (
                  <button
                    onClick={() => onShare(session, eventName || 'Event')}
                    className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer"
                    title="Share session"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                )}
              {onToggleBookmark && (
                  <button
                    onClick={() => onToggleBookmark(session.id)}
                    className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer"
                    title="Toggle bookmark"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-primary" />
                  </button>
                )}
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

  const renderAdminVariant = () => {
    return (
      <Reorder.Item key={session.id} value={session}>
        <div className={cn(
          "bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-xs border border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 group transition-all hover:shadow-md",
          session.isLive && "border-l-4 border-l-error bg-gradient-to-r from-error/5 via-surface-container-lowest to-surface-container-lowest"
        )}>
          <div className="cursor-grab active:cursor-grabbing text-outline-variant hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-surface-container-high touch-none">
            <GripVertical className="w-5 h-5" />
          </div>

          <div className="hidden sm:block">
            <span className="font-time-display text-primary font-bold text-sm">{session.calculatedStartTime}</span>
            {session.isLive && (
              <span className="text-error font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 bg-error/10 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-error animate-ping" /> LIVE
              </span>
            )}
          </div>

          <div className="hidden sm:block w-28 flex-shrink-0">
            <span className="font-time-display text-primary font-bold">{session.calculatedStartTime}</span>
            {session.isLive && (
              <span className="text-error font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-error animate-ping" /> LIVE
              </span>
            )}
          </div>

          <div className="flex-1 w-full">
            <h3 className="font-headline-sm text-primary text-base font-bold leading-snug">{session.title}</h3>
            <p className="font-body-md text-on-surface-variant text-xs mt-0.5">{session.room} • {session.participants[0]?.name || 'Staff'}</p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Live</span>
              <button
                onClick={() => onToggleLive?.(session.id)}
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
              onClick={() => onEdit?.(session.id)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer border border-outline-variant/30"
              aria-label="Edit Session"
            >
              <Edit className="w-4 h-4" />
            </button>

            {onDelete && (
              <button
                onClick={() => onDelete?.(session.id)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error active:scale-95 transition-all cursor-pointer border border-outline-variant/30"
                aria-label="Delete Session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {onReorder && (
              <div className="hidden" />
            )}
          </div>
        </div>
      </Reorder.Item>
    );
  };

  const renderBookmarkVariant = () => {
    return (
      <motion.div
        key={session.id}
        whileTap={{ scale: 0.985 }}
        onClick={() => onClick?.(session.id)}
        className={cn(
          "bg-surface-container-lowest rounded-3xl p-4 shadow-xs border border-outline-variant/40 hover:shadow-md transition-all duration-200 cursor-pointer group",
          session.isLive && "border-l-4 border-l-error ring-1 ring-error/30 bg-gradient-to-r from-error/5 via-surface-container-lowest to-surface-container-lowest"
        )}
      >
        <div className="flex items-center justify-between mb-3 border-b border-outline-variant/30 pb-3">
          <div>
            <p className="font-time-display text-primary text-base font-extrabold m-0 leading-tight">
              {session.calculatedStartTime}
            </p>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              {session.durationInMin} min
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {session.isLive && (
              <span className="inline-flex items-center gap-1.5 bg-error text-on-error px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wider uppercase shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                LIVE
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
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

            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {onShare && (
                <button
                  onClick={() => onShare(session, eventName || 'Event')}
                  className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer"
                  title="Share session"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onToggleBookmark && (
                <button
                  onClick={() => onToggleBookmark?.(session.id)}
                  className="p-1.5 rounded-xl text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  title="Remove bookmark"
                >
                  <Bookmark className="w-3.5 h-3.5 text-primary" />
                </button>
              )}
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
      </motion.div>
    );
  };

  switch (variant) {
    case 'user':
      return renderUserVariant();
    case 'admin':
      return renderAdminVariant();
    case 'bookmark':
      return renderBookmarkVariant();
    default:
      return null;
  }
});