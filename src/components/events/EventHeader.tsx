import React from 'react';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { Event } from '../../types';
import { formatTimeTo12h } from '../../utils';

interface EventHeaderProps {
  event: Event;
  onBack: () => void;
}

/**
 * Header section for a specific event showing key details like date and time.
 */
export const EventHeader: React.FC<EventHeaderProps> = ({ event, onBack }) => {
  return (
    <div className="mb-8 p-6 bg-primary-container text-on-primary-container rounded-2xl shadow-sm border border-primary-container/20">
      <button 
        onClick={onBack} 
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-lowest text-primary font-bold text-sm shadow-sm hover:shadow hover:bg-white transition-all mb-5 border border-outline-variant/30 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </button>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="font-headline-lg mb-2">{event.name}</h1>
          <p className="font-body-md text-on-primary-container/80 max-w-xl">{event.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2 font-body-lg">
            <Calendar className="w-5 h-5" />
            <span>{new Date(event.date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 font-body-lg">
            <Clock className="w-5 h-5" />
            <span>
              {formatTimeTo12h(event.startTime)} 
              {event.endTime ? ` - ${formatTimeTo12h(event.endTime)}` : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
