import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Save, Search, X, User, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Session, Participant } from '../../types';
import { createSlug, fileToBase64 } from '../../utils/imageUtils';

interface AdminEditViewProps {
  session: Session;
  allParticipants: Participant[];
  allSessions: Session[];
  onBack: () => void;
  onSave: (session: Session) => void;
  onCreateParticipant: (participant: Participant) => void;
}

/**
 * Detailed form view for editing a session's properties and participants.
 */
export const AdminEditView: React.FC<AdminEditViewProps> = ({ 
  session, 
  allParticipants, 
  allSessions,
  onBack, 
  onSave, 
  onCreateParticipant 
}) => {
  const [formData, setFormData] = useState(session);
  const [searchTerm, setSearchTerm] = useState('');
  const [showParticipantSearch, setShowParticipantSearch] = useState(false);
  const [isCreatingParticipant, setIsCreatingParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState<Partial<Participant>>({
    name: '',
    role: '',
    group: '',
    avatarUrl: ''
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return [];
    return allParticipants.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
      !formData.participants.some(selected => selected.id === p.id)
    );
  }, [allParticipants, searchTerm, formData.participants]);

  const addParticipant = (participant: Participant) => {
    setFormData({
      ...formData,
      participants: [...formData.participants, participant]
    });
    setSearchTerm('');
    setShowParticipantSearch(false);
  };

  const handleCreateParticipant = () => {
    if (!newParticipant.name) return;
    
    const createdParticipant: Participant = {
      id: createSlug(newParticipant.name),
      name: newParticipant.name,
      role: newParticipant.role || '',
      group: newParticipant.group || '',
      avatarUrl: newParticipant.avatarUrl || ''
    };

    onCreateParticipant(createdParticipant);
    setFormData({
      ...formData,
      participants: [...formData.participants, createdParticipant]
    });

    setNewParticipant({ name: '', role: '', group: '', avatarUrl: '' });
    setAvatarPreview(null);
    setIsCreatingParticipant(false);
    setShowParticipantSearch(false);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatarUploading(true);
      const base64 = await fileToBase64(file);
      setAvatarPreview(base64);
      setNewParticipant(prev => ({ ...prev, avatarUrl: base64 }));
    } catch (err) {
      console.error('Failed to convert image to base64:', err);
      alert('Failed to read image file. Please try another image.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const removeParticipant = (id: string) => {
    setFormData({
      ...formData,
      participants: formData.participants.filter(p => p.id !== id)
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-headline-lg text-primary">{session.id.startsWith('s-') ? 'Add Program Item' : 'Edit Program Item'}</h1>
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
                <option value="Song">Song</option>
                <option value="Dance">Dance</option>
                <option value="Committee">Committee</option>
                <option value="Award">Award</option>
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
            <h2 className="font-headline-sm text-primary">Participants</h2>
            <button 
              onClick={() => setShowParticipantSearch(!showParticipantSearch)}
              className="flex items-center gap-2 text-primary font-label-caps hover:underline"
            >
              <Search className="w-4 h-4" /> Add Participant
            </button>
          </div>

          <AnimatePresence>
            {showParticipantSearch && (
              <div className="relative">
                <div className="flex items-center gap-2 bg-surface-container rounded-xl p-2 border border-outline-variant">
                  <Search className="w-5 h-5 ml-2 text-on-surface-variant" />
                  <input 
                    placeholder="Search existing participants..." 
                    className="flex-1 bg-transparent border-none outline-none p-2"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="flex justify-between items-center px-1 mt-2">
                  <p className="text-xs text-on-surface-variant font-label-caps">Can't find them?</p>
                  <button 
                    onClick={() => { setIsCreatingParticipant(true); setAvatarPreview(null); }} 
                    className="text-primary text-xs font-bold hover:underline"
                  >
                    + Create New Participant
                  </button>
                </div>

                {filteredParticipants.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-20 mt-1 max-h-60 overflow-y-auto">
                    {filteredParticipants.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => addParticipant(p)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-surface-container-high transition-colors border-b border-outline-variant last:border-none"
                      >
                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant overflow-hidden shrink-0">
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-on-surface-variant" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-body-md font-bold">{p.name}</p>
                          <p className="text-xs text-on-surface-variant">{p.role} - {p.group}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isCreatingParticipant && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-primary-container/20 rounded-xl border border-primary/30 space-y-4 overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-label-caps text-primary">New Participant Info</h3>
                  <button onClick={() => { setIsCreatingParticipant(false); setAvatarPreview(null); }}><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    placeholder="Full Name (Required)" 
                    className="bg-surface-container-low p-2 rounded border border-outline-variant text-sm" 
                    value={newParticipant.name}
                    onChange={e => setNewParticipant({...newParticipant, name: e.target.value})}
                  />
                  <input 
                    placeholder="Role (Optional)" 
                    className="bg-surface-container-low p-2 rounded border border-outline-variant text-sm" 
                    value={newParticipant.role}
                    onChange={e => setNewParticipant({...newParticipant, role: e.target.value})}
                  />
                  <input 
                    placeholder="Group/Organization" 
                    className="bg-surface-container-low p-2 rounded border border-outline-variant text-sm" 
                    value={newParticipant.group}
                    onChange={e => setNewParticipant({...newParticipant, group: e.target.value})}
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="font-label-caps mb-2 block text-sm">Participant Photo (Optional)</label>
                  <div className="relative w-full h-40 rounded-xl border border-outline-variant overflow-hidden bg-black/10 flex items-center justify-center">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Participant Photo Preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center text-on-surface-variant p-4">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-xs">No image selected</span>
                      </div>
                    )}
                    {avatarUploading && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Processing Image...
                      </div>
                    )}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarFileChange}
                      className="hidden" 
                      disabled={avatarUploading}
                    />
                    <div className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 py-2.5 px-4 rounded-xl font-label-caps text-xs flex items-center justify-center gap-2 transition-colors font-bold">
                      <Upload className="w-4 h-4" /> Upload Photo
                    </div>
                    {avatarPreview && (
                      <button 
                        type="button"
                        onClick={() => { setAvatarPreview(null); setNewParticipant(prev => ({ ...prev, avatarUrl: '' })); }}
                        className="p-2 bg-error/10 text-error rounded-full hover:bg-error/20 transition-colors"
                        aria-label="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </label>
                </div>
                
                <button 
                  onClick={handleCreateParticipant}
                  disabled={!newParticipant.name}
                  className="w-full bg-primary text-on-primary py-2 rounded-lg font-label-caps disabled:opacity-50"
                >
                  Confirm & Add
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
             {formData.participants.length > 0 ? formData.participants.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-outline-variant group">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 overflow-hidden">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-5 h-5 text-on-surface-variant" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-body-md font-bold">{p.name}</p>
                  <p className="text-xs text-on-surface-variant line-clamp-1">
                    {p.role ? `${p.role} • ` : ''}{p.group}
                  </p>
                </div>
                <button 
                  onClick={() => removeParticipant(p.id)}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-error/10 hover:text-error rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )) : (
              <p className="text-on-surface-variant text-center py-8 bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                No participants assigned.
              </p>
            )}
          </div>
        </section>

        <button 
          onClick={() => {
            if (!formData.title.trim()) {
              alert('Please enter a title for the session');
              return;
            }
            // Keep the original ID for updates, only generate slug for truly new sessions
            // Check if it's a new session (either s- prefix from green button or createSlug from quick-add)
            const isNewSession = session.id.startsWith('s-') || 
              !allSessions.some(s => s.id === session.id);
            const finalId = isNewSession 
              ? createSlug(`${formData.eventId}-${formData.title}`)
              : session.id;
            console.log('Saving session:', { ...formData, id: finalId });
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