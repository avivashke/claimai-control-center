import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Coffee,
  LogOut,
  X,
  ExternalLink
} from 'lucide-react';
import { AppUser, AppTheme, Client, ProductItem, CustomTable } from '../types';
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
  clients?: Client[];
  productItems?: ProductItem[];
  customTables?: CustomTable[];
  onSelectClient?: (client: Client) => void;
  onSelectTicket?: (ticket: ProductItem) => void;
  onSelectTable?: (tableId: string) => void;
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
  onThemeChange,
  clients = [],
  productItems = [],
  customTables = [],
  onSelectClient,
  onSelectTicket,
  onSelectTable
}) => {
  const isViewer = currentUser.role === 'viewer';
  const isAdmin = currentUser.role === 'admin' || currentUser.permissions.canManageUsers;

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const matchingClients = useMemo(() => {
    if (!trimmedQuery || !clients.length) return [];
    return clients.filter(c => 
      c.name?.toLowerCase().includes(trimmedQuery) ||
      c.company?.toLowerCase().includes(trimmedQuery) ||
      c.phone?.includes(trimmedQuery) ||
      c.email?.toLowerCase().includes(trimmedQuery) ||
      c.lastNote?.toLowerCase().includes(trimmedQuery) ||
      c.status?.toLowerCase().includes(trimmedQuery)
    ).slice(0, 6);
  }, [trimmedQuery, clients]);

  const matchingTickets = useMemo(() => {
    if (!trimmedQuery || !productItems.length) return [];
    return productItems.filter(p =>
      p.title?.toLowerCase().includes(trimmedQuery) ||
      p.description?.toLowerCase().includes(trimmedQuery) ||
      p.client?.toLowerCase().includes(trimmedQuery) ||
      p.module?.toLowerCase().includes(trimmedQuery)
    ).slice(0, 3);
  }, [trimmedQuery, productItems]);

  const matchingTables = useMemo(() => {
    if (!trimmedQuery || !customTables.length) return [];
    return customTables.filter(t =>
      t.name?.toLowerCase().includes(trimmedQuery) ||
      t.description?.toLowerCase().includes(trimmedQuery)
    ).slice(0, 2);
  }, [trimmedQuery, customTables]);

  const hasResults = matchingClients.length > 0 || matchingTickets.length > 0 || matchingTables.length > 0;

  return (
    <header style={{ backgroundColor: 'var(--bg-header, #0f172a)' }} className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-xl transition-colors">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0" onClick={() => onTabChange('overview')}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/30 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-sans">
                  Claim<span className="text-blue-400">AI</span>
                </span>
                <span className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full border ${
                  isViewer
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}>
                  {isViewer ? 'Viewer' : 'Hub'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xl:block font-medium">
                שליטה בלקוחות, מפת מוצר, סטודיו AI ופורטלים
              </p>
            </div>
          </div>

          {/* Global Quick Search with Autocomplete & Direct Jump */}
          <div ref={searchContainerRef} className="flex-1 min-w-[200px] sm:min-w-[280px] max-w-xl relative">
            <div 
              onClick={() => searchInputRef.current?.focus()}
              className="relative flex items-center cursor-text group"
            >
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="חיפוש מהיר של לקוח, חברה, טלפון, מודול, תקלה..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setIsSearchFocused(false);
                    onTabChange('crm');
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsSearchFocused(false);
                    searchInputRef.current?.blur();
                  }
                }}
                className="w-full pr-10 pl-9 py-2.5 bg-slate-800/90 border border-slate-700 hover:border-slate-600 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSearchChange('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                  title="נקה חיפוש"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Results Dropdown Popover */}
            {isSearchFocused && trimmedQuery.length > 0 && (
              <div 
                className="absolute top-full right-0 left-0 mt-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-100 max-h-[80vh] overflow-y-auto"
                style={{ backgroundColor: 'var(--bg-card, #0f172a)' }}
              >
                {/* Results count header */}
                <div className="px-3.5 py-2 bg-slate-800/60 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span>תוצאות חיפוש מהיר עבור "{trimmedQuery}"</span>
                  <span>{matchingClients.length + matchingTickets.length + matchingTables.length} תוצאות ישירות</span>
                </div>

                {/* Clients Section */}
                {matchingClients.length > 0 && (
                  <div className="p-1.5 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>לקוחות ב-CRM ({matchingClients.length})</span>
                    </div>
                    {matchingClients.map(client => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          setIsSearchFocused(false);
                          if (onSelectClient) {
                            onSelectClient(client);
                          } else {
                            onTabChange('crm');
                          }
                        }}
                        className="w-full text-right px-2.5 py-2 rounded-xl hover:bg-blue-600/15 flex items-center justify-between gap-2 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {(client.name || client.company || '?').charAt(0)}
                          </span>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white group-hover:text-blue-300 truncate">
                              {client.name || client.company}
                              {client.company && client.name && (
                                <span className="text-[10px] text-slate-400 font-normal mr-1.5">({client.company})</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {client.phone ? `📞 ${client.phone}` : ''} {client.email ? `✉️ ${client.email}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                          {client.status || 'ליד'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tickets Section */}
                {matchingTickets.length > 0 && (
                  <div className="p-1.5 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>משימות ותקלות מוצר ({matchingTickets.length})</span>
                    </div>
                    {matchingTickets.map(ticket => (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => {
                          setIsSearchFocused(false);
                          if (onSelectTicket) {
                            onSelectTicket(ticket);
                          } else {
                            onTabChange('product');
                          }
                        }}
                        className="w-full text-right px-2.5 py-2 rounded-xl hover:bg-purple-600/15 flex items-center justify-between gap-2 transition-colors group cursor-pointer"
                      >
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-white group-hover:text-purple-300 truncate">
                            {ticket.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {ticket.module ? `מודול: ${ticket.module} · ` : ''}{ticket.client ? `לקוח: ${ticket.client}` : ''}
                          </p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 shrink-0">
                          {ticket.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom Tables Section */}
                {matchingTables.length > 0 && (
                  <div className="p-1.5 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <TableIcon className="w-3 h-3" />
                      <span>טבלאות ודוחות ({matchingTables.length})</span>
                    </div>
                    {matchingTables.map(tbl => (
                      <button
                        key={tbl.id}
                        type="button"
                        onClick={() => {
                          setIsSearchFocused(false);
                          if (onSelectTable) {
                            onSelectTable(tbl.id);
                          }
                          onTabChange('crm');
                        }}
                        className="w-full text-right px-2.5 py-2 rounded-xl hover:bg-emerald-600/15 flex items-center justify-between gap-2 transition-colors group cursor-pointer"
                      >
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">
                          {tbl.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {tbl.rows.length} שורות
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* If no matches found */}
                {!hasResults && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    לא נמצאו לקוחות או משימות התואמים ל-"{trimmedQuery}"
                  </div>
                )}

                {/* Footer Action: Jump to CRM table with search query */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchFocused(false);
                    onTabChange('crm');
                  }}
                  className="w-full p-2.5 bg-slate-800/80 hover:bg-blue-600 hover:text-white text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>מעבר לטבלת ה-CRM לסינון מלא (Enter)</span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!isViewer && (
              <>
                <button
                  onClick={onOpenAiStudio}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/30 transition-all hover:scale-[1.02]"
                  title="זריקת נתוני לקוחות ויצירת טבלה בעזרת AI"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
                  <span className="hidden lg:inline">סטודיו AI</span>
                </button>

                <button
                  onClick={onNewClient}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span className="hidden sm:inline">ליד חדש</span>
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
              className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-xs transition-all hover:border-slate-600"
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

            {/* Direct Logout Button for ALL users */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 hover:text-white text-xs font-bold transition-all shadow-sm shrink-0"
              title="התנתקות מהמערכת (נעילת גישה)"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">התנתק</span>
            </button>
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
