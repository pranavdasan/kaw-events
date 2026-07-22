import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Save, Search, X, User } from 'lucide-react';
import { Session, Speaker } from '../../types';
import { createSlug } from '../../utils/imageUtils';

interface AdminEditViewProps {
  session: Session;
  allSpeakers: Speaker[];
  onBack: () => void;
  onSave: (session: Session) => void;
  onCreateSpeaker: (speaker: Speaker) => void;
}

/**
 * Detailed form view for editing a session's properties and speakers.
 */
export const AdminEditView: React.FC<AdminEditViewProps> = ({ 
  session, 
  allSpeakers, 
  onBack, 
  onSave, 
  onCreateSpeaker 
}) => {
  const [formData, setFormData] = useState(session);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSpeakerSearch, setShowSpeakerSearch] = useState(false);
  const [isCreatingSpeaker, setIsCreatingSpeaker] = useState(false);
  const [newSpeaker, setNewSpeaker] = useState<Partial<Speaker>>({
    name: '',
    role: '',
    company: '',
    avatarUrl: ''
  });

  const filteredSpeakers = useMemo(() => {
    if (!searchTerm) return [];
    return allSpeakers.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
      !formData.speakers.some(selected => selected.id === s.id)
    );
  }, [allSpeakers, searchTerm, formData.speakers]);

  const addSpeaker = (speaker: Speaker) => {
    setFormData({
      ...formData,
      speakers: [...formData.speakers, speaker]
    });
    setSearchTerm('');
    setShowSpeakerSearch(false);
  };

  const handleCreateSpeaker = () => {
    if (!newSpeaker.name) return;
    
    const createdSpeaker: Speaker = {
      id: createSlug(newSpeaker.name),
      name: newSpeaker.name,
      role: newSpeaker.role || '',
      company: newSpeaker.company || 'Independent',
      avatarUrl: newSpeaker.avatarUrl || '',
    };

    onCreateSpeaker(createdSpeaker);
    setFormData({
      ...formData,
      speakers: [...formData.speakers, createdSpeaker]
    });

    setNewSpeaker({ name: '', role: '', company: '', avatarUrl: '' });
    setIsCreatingSpeaker(false);
    setShowSpeakerSearch(false);
  };

  const removeSpeaker = (id: string) => {
    setFormData({
      ...formData,
      speakers: formData.speakers.filter(s => s.id !== id)
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-headline-lg text-primary">Edit Program Item</h1>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="font-label-caps mb-2 block">Title</label>
              <input 
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg p-3 focus:border-primary outline-none" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <label className="font-label-caps mb-2 block">Track</label>
              <select 
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg p-3 focus:border-primary outline-none" 
                value={formData.track} 
                onChange={(e) => setFormData({...formData, track: e.target.value as any})}
              >
                <option value="General">General</option>
                <option value="Keynote">Keynote</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Workshop">Workshop</option>
              </select>
            </div>
          </div>
          <div className="space-y-4">
             <div>
              <label className="font-label-caps mb-2 block">Room</label>
              <input 
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg p-3 focus:border-primary outline-none" 
                value={formData.room} 
                onChange={(e) => setFormData({...formData, room: e.target.value})}
              />
            </div>
            <div>
              <label className="font-label-caps mb-2 block">Duration (Minutes)</label>
              <input 
                type="number"
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg p-3 focus:border-primary outline-none" 
                value={formData.durationInMin} 
                onChange={(e) => setFormData({...formData, durationInMin: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="font-label-caps mb-2 block">Description</label>
            <textarea 
              rows={4}
              className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg p-3 focus:border-primary outline-none" 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-sm text-primary">Speakers</h2>
            <button 
              onClick={() => setShowSpeakerSearch(!showSpeakerSearch)}
              className="flex items-center gap-2 text-primary font-label-caps hover:underline"
            >
              <Search className="w-4 h-4" /> Add Speaker
            </button>
          </div>

          <AnimatePresence>
            {showSpeakerSearch && (
              <div className="relative">
                <div className="flex items-center gap-2 bg-surface-container rounded-xl p-2 border border-outline-variant">
                  <Search className="w-5 h-5 ml-2 text-on-surface-variant" />
                  <input 
                    placeholder="Search existing speakers..." 
                    className="flex-1 bg-transparent border-none outline-none p-2"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="flex justify-between items-center px-1 mt-2">
                  <p className="text-xs text-on-surface-variant font-label-caps">Can't find them?</p>
                  <button 
                    onClick={() => setIsCreatingSpeaker(true)} 
                    className="text-primary text-xs font-bold hover:underline"
                  >
                    + Create New Speaker
                  </button>
                </div>

                {filteredSpeakers.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-20 mt-1 max-h-60 overflow-y-auto">
                    {filteredSpeakers.map(s => (
                      <button 
                        key={s.id} 
                        onClick={() => addSpeaker(s)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-surface-container-high transition-colors border-b border-outline-variant last:border-none"
                      >
                        <img src={s.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}`} className="w-8 h-8 rounded-full border border-outline-variant object-cover" />
                        <div className="text-left">
                          <p className="font-body-md font-bold">{s.name}</p>
                          <p className="text-xs text-on-surface-variant">{s.role} at {s.company}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isCreatingSpeaker && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-primary-container/20 rounded-xl border border-primary/30 space-y-4 overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-label-caps text-primary">New Speaker Info</h3>
                  <button onClick={() => setIsCreatingSpeaker(false)}><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    placeholder="Full Name (Required)" 
                    className="bg-surface-container-low p-2 rounded border border-outline-variant text-sm" 
                    value={newSpeaker.name}
                    onChange={e => setNewSpeaker({...newSpeaker, name: e.target.value})}
                  />
                  <input 
                    placeholder="Role (Optional)" 
                    className="bg-surface-container-low p-2 rounded border border-outline-variant text-sm" 
                    value={newSpeaker.role}
                    onChange={e => setNewSpeaker({...newSpeaker, role: e.target.value})}
                  />
                  <input 
                    placeholder="Company" 
                    className="bg-surface-container-low p-2 rounded border border-outline-variant text-sm" 
                    value={newSpeaker.company}
                    onChange={e => setNewSpeaker({...newSpeaker, company: e.target.value})}
                  />
                  <input 
                    placeholder="Avatar URL (Optional)" 
                    className="bg-surface-container-low p-2 rounded border border-outline-variant text-sm" 
                    value={newSpeaker.avatarUrl}
                    onChange={e => setNewSpeaker({...newSpeaker, avatarUrl: e.target.value})}
                  />
                </div>
                <button 
                  onClick={handleCreateSpeaker}
                  disabled={!newSpeaker.name}
                  className="w-full bg-primary text-on-primary py-2 rounded-lg font-label-caps disabled:opacity-50"
                >
                  Confirm & Add
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
             {formData.speakers.length > 0 ? formData.speakers.map(s => (
               <div key={s.id} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-outline-variant group">
                 <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden shrink-0">
                    {s.avatarUrl ? (
                      <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-full h-full p-2 text-on-surface-variant" />
                    )}
                 </div>
                 <div className="flex-1">
                   <p className="font-body-md font-bold">{s.name}</p>
                   <p className="text-xs text-on-surface-variant line-clamp-1">
                     {s.role ? `${s.role} • ` : ''}{s.company}
                   </p>
                 </div>
                 <button 
                   onClick={() => removeSpeaker(s.id)}
                   className="p-2 opacity-0 group-hover:opacity-100 hover:bg-error/10 hover:text-error rounded-full transition-all"
                 >
                   <X className="w-4 h-4" />
                 </button>
               </div>
             )) : (
               <p className="text-on-surface-variant text-center py-8 bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                 No speakers assigned.
               </p>
             )}
          </div>
        </section>

        <button 
          onClick={() => {
            const finalId = session.id.startsWith('s-') || session.id.startsWith('new-') 
              ? createSlug(`${formData.eventId}-${formData.title}`)
              : formData.id;
            onSave({ ...formData, id: finalId });
          }}
          className="w-full bg-primary text-on-primary py-4 rounded-full font-headline-sm shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer font-bold"
        >
          <Save className="w-5 h-5" /> Save Session
        </button>
      </div>
    </motion.div>
  );
};
