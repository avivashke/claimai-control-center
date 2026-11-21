import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ArrowRight, UserCheck, Check, Sparkles, X } from 'lucide-react';
import { AppUser } from '../../types';
import { loadGoogleIdentityServices, renderGoogleSignInButton } from '../../services/authService';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLogin: (email: string, name?: string) => void;
  availableUsers: AppUser[];
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  availableUsers
}) => {
  if (!isOpen) return null;

  const [customEmail, setCustomEmail] = useState('');
  const [gisReady, setGisReady] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const buttonRef = useRef<HTMLDivElement>(null);
  const containerId = 'claimai-google-signin-btn';

  useEffect(() => {
    if (!isOpen) return;
    const id = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    setGoogleClientId(id);
    loadGoogleIdentityServices().then(() => setGisReady(true)).catch(() => setGisReady(false));
  }, [isOpen]);

  useEffect(() => {
    if (gisReady && googleClientId && buttonRef.current) {
      renderGoogleSignInButton(containerId, googleClientId, (email, name) => {
        onLogin(email, name);
      });
    }
  }, [gisReady, googleClientId, onLogin]);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    onLogin(customEmail.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="p-6 text-center space-y-2 border-b border-slate-800 bg-gradient-to-b from-blue-950/40 to-slate-900 relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute left-4 top-4 w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-xl font-extrabold text-white">
            התחברות ל-ClaimAI Control Hub
          </h2>
          <p className="text-xs text-slate-400">
            הזדהות מאובטחת באמצעות פרוטוקול Google Sign-In
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Official Google Sign-In Button */}
          <div id={containerId} ref={buttonRef} className="mb-2">
            {gisReady && googleClientId ? (
              <div className="w-full py-3 px-4 rounded-xl bg-white border border-slate-300 flex items-center justify-center gap-3 shadow-sm transition-all">
                <span className="text-sm font-medium text-slate-700">טוען התחברות Google…</span>
              </div>
            ) : (
              <div className="w-full py-3 px-4 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center gap-3 text-xs text-slate-400 animate-pulse">
                <span>הגדר את Client ID של Google בהגדרות האדמין כדי לאפשר התחברות אמיתית</span>
              </div>
            )}
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-[11px]">או בחר משתמש צוות מוגדר מראש</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Quick Team Portal Picker */}
          <div className="space-y-2">
            {availableUsers.map((u) => {
              const isAdmin = u.role === 'admin';
              const isEditor = u.role === 'editor';

              return (
                <div
                  key={u.id}
                  onClick={() => onLogin(u.email, u.name)}
                  className="p-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold font-mono">
                      {u.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs group-hover:text-blue-400 transition-colors">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                    isAdmin
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : isEditor
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  }`}>
                    {isAdmin ? 'Admin' : isEditor ? 'Editor' : 'Viewer'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Custom Google Email Input */}
          <form onSubmit={handleCustomLogin} className="pt-2 border-t border-slate-800 space-y-2">
            <label className="block text-[11px] text-slate-400">
              התחברות עם כתובת Google אחרת:
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0"
              >
                התחבר
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
