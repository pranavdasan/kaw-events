import React, { useState } from 'react';
import { Settings, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebase';

interface AdminLoginViewProps {
  onLogin: (user: any) => void;
}

/**
 * Admin login view using Firebase Email/Password authentication.
 */
export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLogin(userCredential.user);
    } catch (err: any) {
      let message = 'Invalid email or password';
      switch (err.code) {
        case 'auth/user-not-found':
          message = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/invalid-credential':
          message = 'Invalid email or password';
          break;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto">
      <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-xl w-full border border-outline-variant">
        <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-6">
          <Settings className="w-8 h-8 text-on-primary-container" />
        </div>
        <h2 className="font-headline-md text-center mb-2">KAW Admin Portal</h2>
        <p className="text-on-surface-variant text-center mb-8 font-body-md">Sign in to manage KAW Events schedules.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-label-caps block mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg p-4 pl-12 font-body-lg focus:border-primary outline-none transition-all"
                placeholder="admin@kawevents.com"
                required
                autoComplete="email"
              />
            </div>
          </div>
          <div>
            <label className="font-label-caps block mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg p-4 pl-12 font-body-lg focus:border-primary outline-none transition-all"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-error text-xs mt-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 rounded-full font-headline-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
