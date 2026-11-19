import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, UserCheck, Eye, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { AppUser } from '../../types';

interface UserMenuProps {
  currentUser: AppUser;
  onOpenSwitchUser: () => void;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  currentUser,
  onOpenSwitchUser,
  onLogout
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = currentUser.role === 'admin';
  const isEditor = currentUser.role === 'editor';
  const isViewer = currentUser.role === 'viewer';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-850 border border-slate-700/80 hover:border-slate-600 transition-all text-right group"
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-sm ${
          isAdmin
            ? 'bg-amber-600'
            : isEditor
            ? 'bg-blue-600'
            : 'bg-purple-600'
        }`}>
          {currentUser.name.slice(0, 1)}
        </div>

        <div className="hidden sm:block text-right">
          <div className="font-bold text-xs text-white flex items-center gap-1.5 leading-tight">
            <span>{currentUser.name}</span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
              isAdmin
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : isEditor
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
            }`}>
              {currentUser.role}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono leading-tight">{currentUser.email}</div>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors mr-1" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in zoom-in-95 duration-150 space-y-1">
          <div className="p-3 border-b border-slate-800 bg-slate-850 rounded-xl space-y-1">
            <div className="font-bold text-xs text-white">{currentUser.name}</div>
            <div className="text-[11px] text-slate-400 font-mono truncate">{currentUser.email}</div>
            <div className="pt-1 flex items-center gap-1 text-[10px]">
              <span className="text-slate-400">רמת גישה:</span>
              <strong className={isAdmin ? 'text-amber-400' : isEditor ? 'text-blue-400' : 'text-purple-400'}>
                {isAdmin ? 'מנהל מערכת (Admin)' : isEditor ? 'עורך CRM ומוצר (Editor)' : 'צופה בלבד (Viewer Portal)'}
              </strong>
            </div>
            {isViewer && (
              <div className="text-[10px] text-purple-300 bg-purple-500/10 p-1.5 rounded border border-purple-500/20 mt-1">
                🔒 פורטל צפייה בלבד – כפתורי עריכה ומחיקה מוגבלים
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setIsOpen(false);
              onOpenSwitchUser();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-right"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>החלף משתמש / בדיקת פורטל</span>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors text-right"
          >
            <LogOut className="w-4 h-4" />
            <span>התנתק מהמערכת</span>
          </button>
        </div>
      )}
    </div>
  );
};
