import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronLeft, Clock, MapPin, User, Bookmark, Share2, Check } from 'lucide-react';
import { Session } from '../../types';

interface SessionDetailViewProps {
  session: Session & { calculatedStartTime: string; calculatedEndTime: string };
  eventName?: string;
  isBookmarked: boolean;
  onToggleBookmark: (sessionId: string) => void;
  onShareSession: (session: Session, eventName?: string) => void;
  onBack: () => void;
}

/**
 * Full page view for a specific session's details, interactive actions, and speaker bios.
 */
export const SessionDetailView: React.FC<SessionDetailViewProps> = ({ 
  session, 
  eventName,
  isBookmarked,
  onToggleBookmark,
  onShareSession,
  onBack 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="space-y-6"
    >
      {/* Mobile Top Header Replacement for Session Details */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md text-on-primary h-16 flex items-center px-4 shadow-md md:hidden border-b border-white/10">
        <button 
          onClick={onBack} 
          className="p-2 -ml-2 hover:bg-white/10 active:scale-95 rounded-full transition-all flex items-center gap-1 cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-grow text-center font-extrabold pr-8 truncate text-sm">
          {session.title}
        </div>
      </header>

      <div className="space-y-6 pt-1 md:pt-0">
        {/* Back Button for Desktop & Tablet */}
        <div className="flex items-center justify-between gap-4">
          <button 
            onClick={onBack} 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-lowest text-primary font-bold text-sm shadow-xs hover:shadow-md hover:bg-white transition-all border border-outline-variant/40 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Schedule</span>
          </button>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleBookmark(session.id)}
              className={`p-2.5 rounded-full border transition-all cursor-pointer active:scale-95 ${
                isBookmarked 
                  ? 'bg-primary text-on-primary border-primary shadow-xs' 
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:bg-surface-variant'
              }`}
              title={isBookmarked ? "Remove bookmark" : "Bookmark session"}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-on-primary' : ''}`} />
            </button>
            <button
              onClick={() => onShareSession(session, eventName)}
              className="p-2.5 rounded-full bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40 hover:bg-surface-variant transition-all cursor-pointer active:scale-95"
              title="Share session"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-secondary-fixed text-on-secondary-fixed font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
            {session.track} Track
          </span>
          {session.isLive && (
            <span className="bg-error text-on-error px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              LIVE NOW
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-headline-lg text-primary text-2xl md:text-3xl font-extrabold leading-tight tracking-tight">
          {session.title}
        </h1>

        {/* Info Grid */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 grid grid-cols-1 md:grid-cols-2 gap-3 text-secondary font-medium text-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-surface-container-lowest text-primary shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider m-0">Time</p>
              <p className="text-on-surface font-bold m-0">{session.calculatedStartTime} - {session.calculatedEndTime} ({session.durationInMin} mins)</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-surface-container-lowest text-primary shadow-2xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider m-0">Location</p>
              <p className="text-on-surface font-bold m-0">{session.room}</p>
            </div>
          </div>
        </div>

        {/* About Section */}
        <section className="space-y-3 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/40 shadow-xs">
          <h3 className="font-headline-md text-primary text-lg font-bold">About this session</h3>
          <p className="font-body-lg text-on-surface-variant leading-relaxed m-0 text-sm md:text-base">
            {session.description}
          </p>
        </section>

        {/* Participants Section */}
        <section className="space-y-4">
          <h3 className="font-headline-md text-primary text-lg font-bold">
            {session.participants.length > 1 ? 'Featured Participants' : 'Participant'}
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {session.participants.map(participant => (
              <div 
                key={participant.id} 
                className="bg-surface-container-lowest rounded-3xl p-5 shadow-xs border border-outline-variant/40 flex flex-col md:flex-row items-center gap-5 text-center md:text-left"
              >
                <div className="w-20 h-20 rounded-full shrink-0 ring-4 ring-primary/10 bg-primary/10 flex items-center justify-center shadow-sm">
                  <span className="text-2xl font-bold text-primary">{participant.name.charAt(0)}</span>
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-headline-sm text-primary text-base md:text-lg font-bold">{participant.name}</h4>
                  <p className="text-xs md:text-sm font-medium text-secondary">
                    {participant.role ? `${participant.role}, ` : ''}<span className="text-primary font-semibold">{participant.group}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

