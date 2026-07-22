import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { Event } from '../../types';
import { fileToBase64, createSlug, ONAM_POOKALAM_BASE64, VISHU_BASE64, PICNIC_BASE64, DRAMA_BASE64 } from '../../utils/imageUtils';

interface EventEditViewProps {
  event: Event | null;
  onBack: () => void;
  onSave: (event: Event) => void;
  onDelete?: (eventId: string) => void;
}

/**
 * View for creating or editing an event's metadata with direct base64 image storage in Database.
 */
export const EventEditView: React.FC<EventEditViewProps> = ({ 
  event, 
  onBack, 
  onSave, 
  onDelete 
}) => {
  const [formData, setFormData] = useState<Event>(event || {
    id: `e-${Date.now()}`,
    name: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTimeByDay: { 1: '09:00' },
    endTimeByDay: { 1: '17:00' },
    imageUrl: ONAM_POOKALAM_BASE64,
    totalDays: 1
  });

  const [uploading, setUploading] = useState(false);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const base64 = await fileToBase64(file);
      setFormData(prev => ({ ...prev, imageUrl: base64 }));
    } catch (err) {
      console.error("Failed to convert image to base64:", err);
      alert("Failed to read image file. Please try another image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-surface-container-high rounded-full transition-colors cursor-pointer">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-headline-lg text-primary">{event ? 'Edit Event' : 'New Event'}</h1>
        </div>
        {event && onDelete && (
          <button 
            onClick={() => onDelete(event.id)}
            className="flex items-center gap-2 text-error font-label-caps hover:bg-error/10 px-4 py-2 rounded-lg transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete Event
          </button>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="font-label-caps mb-2 block font-bold">Event Title</label>
              <input 
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg p-3 focus:border-primary outline-none" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. KAW Onam Celebration"
              />
            </div>

            <div>
              <label className="font-label-caps mb-2 block font-bold">Cover Image (Stored directly in Database)</label>
              <div className="space-y-3">
                {/* Image Preview Box */}
                <div className="relative w-full h-44 rounded-xl border border-outline-variant overflow-hidden bg-black/10 flex items-center justify-center">
                  {formData.imageUrl ? (
                    <img 
                      src={formData.imageUrl} 
                      alt="Event Banner Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center text-on-surface-variant p-4">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <span className="text-xs">No image selected</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold">
                      Processing Image...
                    </div>
                  )}
                </div>

                {/* Upload File Input */}
                <div className="flex items-center gap-2">
                  <label className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 py-2.5 px-4 rounded-xl font-label-caps text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors font-bold">
                    <Upload className="w-4 h-4" /> Upload Local Image to Database
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageFileChange}
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* Preset Base64 Art Quick Selector */}
                <div>
                  <span className="text-[11px] font-bold text-on-surface-variant block mb-1.5 uppercase tracking-wider">
                    Or select KAW Preset Artwork:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: ONAM_POOKALAM_BASE64 })}
                      className="text-[11px] font-bold p-2 rounded-lg bg-surface-container-high hover:bg-primary/10 hover:text-primary transition-all text-center border border-outline-variant/50"
                    >
                      Athapookalam
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: VISHU_BASE64 })}
                      className="text-[11px] font-bold p-2 rounded-lg bg-surface-container-high hover:bg-primary/10 hover:text-primary transition-all text-center border border-outline-variant/50"
                    >
                      Vishukkani
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: PICNIC_BASE64 })}
                      className="text-[11px] font-bold p-2 rounded-lg bg-surface-container-high hover:bg-primary/10 hover:text-primary transition-all text-center border border-outline-variant/50"
                    >
                      Sports Picnic
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: DRAMA_BASE64 })}
                      className="text-[11px] font-bold p-2 rounded-lg bg-surface-container-high hover:bg-primary/10 hover:text-primary transition-all text-center border border-outline-variant/50"
                    >
                      Youth Drama
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-label-caps mb-2 block font-bold">Total Days</label>
              <input 
                type="number"
                min="1"
                max="7"
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg p-3 focus:border-primary outline-none" 
                value={formData.totalDays} 
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  const newStartTimes = { ...formData.startTimeByDay };
                  const newEndTimes = { ...formData.endTimeByDay };
                  for (let i = 1; i <= val; i++) {
                    if (!newStartTimes[i]) newStartTimes[i] = '09:00';
                    if (!newEndTimes[i]) newEndTimes[i] = '17:00';
                  }
                  setFormData({...formData, totalDays: val, startTimeByDay: newStartTimes, endTimeByDay: newEndTimes});
                }}
              />
            </div>
            <div>
              <label className="font-label-caps mb-2 block font-bold">Event Start Date</label>
              <input 
                type="date"
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg p-3 focus:border-primary outline-none" 
                value={formData.date} 
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="font-label-caps mb-2 block font-bold">Event Description</label>
              <textarea 
                rows={3}
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg p-3 focus:border-primary outline-none" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
             
            <div className="pt-4 border-t border-outline-variant">
              <h3 className="font-label-caps mb-4 font-bold">Start & End Times by Day</h3>
              <div className="space-y-4">
                {Array.from({ length: formData.totalDays }, (_, i) => i + 1).map(day => (
                  <div key={day} className="space-y-2">
                     <p className="font-body-md font-bold">Day {day}</p>
                     <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] text-on-surface-variant mb-1 font-bold">START</label>
                        <input 
                          type="time"
                          className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg p-2 focus:border-primary outline-none text-sm" 
                          value={formData.startTimeByDay[day] || '09:00'} 
                          onChange={(e) => {
                            const newTimes = { ...formData.startTimeByDay, [day]: e.target.value };
                            setFormData({ ...formData, startTimeByDay: newTimes });
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] text-on-surface-variant mb-1 font-bold">END</label>
                        <input 
                          type="time"
                          className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg p-2 focus:border-primary outline-none text-sm" 
                          value={formData.endTimeByDay?.[day] || '17:00'} 
                          onChange={(e) => {
                            const newTimes = { ...formData.endTimeByDay, [day]: e.target.value };
                            setFormData({ ...formData, endTimeByDay: newTimes });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            const finalId = event ? formData.id : createSlug(formData.name || 'new-event');
            onSave({ ...formData, id: finalId });
          }}
          className="w-full bg-primary text-on-primary py-4 rounded-full font-headline-sm shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 font-bold cursor-pointer"
        >
          <Save className="w-5 h-5" /> {event ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </motion.div>
  );
};
