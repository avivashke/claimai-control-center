import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Layers, 
  Database, 
  Plus, 
  Search,
  Sparkles,
  ShieldCheck,
  Table as TableIcon,
  ShieldAlert,
  Lock,
  Eye,
  Moon,
  Sun,
  Coffee
} from 'lucide-react';
import { AppUser, AppTheme } from '../types';
import { UserMenu } from './Auth/UserMenu';

export type TabType = 'overview' | 'crm' | 'myday' | 'product' | 'custom_tables' | 'ai_studio' | 'admin' | 'database';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onNewClient: () => void;
  onNewTicket: () => void;
  onOpenAiStudio: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  clientsCount: number;
  productCount: number;
  customTablesCount: number;
  attentionCount: number;
  currentUser: AppUser;
  onOpenSwitchUser: () => void;
  onLogout: () => void;
  supabaseConnected?: boolean | null;
  blobsConnected?: boolean | null;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onNewClient,
  onNewTicket,
  onOpenAiStudio,
  searchQuery,
  onSearchChange,
  clientsCount,
  productCount,
  customTablesCount,
  attentionCount,
  currentUser,
  onOpenSwitchUser,
  onLogout,
  supabaseConnected,
  blobsConnected,
  theme,
  onThemeChange
}) => {
  const isViewer = currentUser.role === 'viewer';
  const isAdmin = currentUser.role === 'admin' || currentUser.permissions.canManageUsers;

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('overview')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white font-sans">
                  Claim<span className="text-blue-400">AI</span>
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  isViewer
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}>
                  {isViewer ? 'Viewer Portal' : 'Control Hub'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block font-medium">
                שליטה בלקוחות, מפת מוצר, סטודיו AI ופורטלים
              </p>
            </div>
          </div>

          {/* Global Quick Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="חיפוש מהיר של לקוח, חברה, טלפון, מודול, תקלה..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pr-9 pl-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute left-2.5 top-2.5 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2">
            {!isViewer && (
              <>
                <button
                  onClick={onOpenAiStudio}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold shadow-md shadow-purple-600/30 transition-all hover:scale-[1.02]"
                  title="זריקת נתוני לקוחות ויצירת טבלה בעזרת AI"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span className="hidden sm:inline">סטודיו AI</span>
                </button>

                <button
                  onClick={onNewClient}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
                >
                  <Plus className="w-5 h-5" />
                  <span>ליד חדש</span>
                </button>
              </>
            )}

            {isViewer && (
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>מצב צפייה בלבד</span>
              </span>
            )}

            {/* Live Database & Blobs Status Indicator */}
            <button
              onClick={() => onTabChange('database')}
              className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-xs transition-all hover:border-slate-600"
              title="לחץ לפתיחת הגדרות ובדיקת תקינות מסד נתונים ו-Netlify Blobs"
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  supabaseConnected === true ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' :
                  supabaseConnected === false ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'
                }`} />
                <span className="text-[11px] font-semibold text-slate-300">
                  {supabaseConnected === true ? 'Supabase פעיל' : supabaseConnected === false ? 'Supabase מנותק' : 'Supabase בודק...'}
                </span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  blobsConnected === true ? 'bg-blue-400 shadow-sm shadow-blue-400/50' : 'bg-emerald-400'
                }`} />
                <span className="text-[11px] font-semibold text-slate-300">
                  {blobsConnected === true ? 'Blobs פעיל' : 'Blobs מוכן'}
                </span>
              </div>
            </button>

            {/* Theme Selector (Dark, Light, Sepia) */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-800/90 border border-slate-700/80">
              <button
                type="button"
                onClick={() => onThemeChange('dark')}
                title="מצב כהה (Dark Slate)"
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden xl:inline text-[11px]">כהה</span>
              </button>

              <button
                type="button"
                onClick={() => onThemeChange('light')}
                title="מצב בהיר (Clean Light)"
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                  theme === 'light'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden xl:inline text-[11px]">בהיר</span>
              </button>

              <button
                type="button"
                onClick={() => onThemeChange('sepia')}
                title="מצב ספיה מעודן ונעים לעין (Warm Sepia)"
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                  theme === 'sepia'
                    ? 'bg-amber-700 text-amber-50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span className="hidden xl:inline text-[11px]">ספיה</span>
              </button>
            </div>

            {/* Google User Profile Menu */}
            <UserMenu
              currentUser={currentUser}
              onOpenSwitchUser={onOpenSwitchUser}
              onLogout={onLogout}
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-3 border-t border-slate-800/80 no-scrollbar">
          <button
            onClick={() => onTabChange('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>סקירה כללית</span>
          </button>

          <button
            onClick={() => onTabChange('crm')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'crm'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>ניהול לקוחות CRM</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {clientsCount}
            </span>
          </button>

          <button
            onClick={() => onTabChange('myday')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'myday'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CalendarCheck className="w-5 h-5 text-amber-400" />
            <span>היום שלי & מעקבים</span>
            {attentionCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                {attentionCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('product')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'product'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>מוצר ומסירה</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {productCount}
            </span>
          </button>

          {/* Custom Tables Tab */}
          <button
            onClick={() => onTabChange('custom_tables')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'custom_tables'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TableIcon className="w-5 h-5 text-purple-400" />
            <span>טבלאות מותאמות & AI</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-950 text-purple-300 border border-purple-700/50 font-mono">
              {customTablesCount}
            </span>
          </button>

          {/* Admin Portal Tab (Visible only to Admin or users with manage permission) */}
          {isAdmin && (
            <button
              onClick={() => onTabChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>פורטל אדמין</span>
            </button>
          )}

          <button
            onClick={() => onTabChange('database')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all mr-auto ${
              activeTab === 'database'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-5 h-5 text-purple-400" />
            <span>דאטה-בייס ונטיפי</span>
            <span className={`w-2 h-2 rounded-full ${
              supabaseConnected === true ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' :
              supabaseConnected === false ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'
            }`}></span>
          </button>
        </div>
      </div>
    </header>
  );
};
