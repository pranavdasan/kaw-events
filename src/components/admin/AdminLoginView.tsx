import React, { useState } from 'react';
import { Settings } from 'lucide-react';

interface AdminLoginViewProps {
  onLogin: () => void;
}

/**
 * simple admin password protection view.
 */
export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') {
      onLogin();
    } else {
      setError('Invalid admin password');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto">
      <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-xl w-full border border-outline-variant">
        <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-6">
          <Settings className="w-8 h-8 text-on-primary-container" />
        </div>
        <h2 className="font-headline-md text-center mb-2">KAW Admin Portal</h2>
        <p className="text-on-surface-variant text-center mb-8 font-body-md">Log in to manage KAW Events schedules.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-label-caps block mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg p-4 font-body-lg focus:border-primary outline-none transition-all"
              placeholder="Enter admin password"
            />
            {error && <p className="text-error text-xs mt-2">{error}</p>}
          </div>
          <button className="w-full bg-primary text-on-primary py-4 rounded-full font-headline-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};
