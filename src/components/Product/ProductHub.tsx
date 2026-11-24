import React, { useState, useMemo } from 'react';
import { 
  Bug, 
  Compass, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  Building2, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ProductItem, ProductStatus, ProductPriority } from '../../types';

interface ProductHubProps {
  productItems: ProductItem[];
  onSelectTicket: (ticket: ProductItem) => void;
  onUpdateTicketStatus: (ticketId: string, newStatus: ProductStatus) => void;
  onNewTicket: () => void;
  searchFilter: string;
  canEdit?: boolean;
}

const PRIORITY_BADGES: { [key: string]: string } = {
  Critical: 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold',
  High: 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold',
  Medium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Low: 'bg-slate-700/40 text-slate-400 border-slate-700',
};

const STATUS_COLORS: { [key: string]: { bg: string; text: string; border: string } } = {
  Backlog: { bg: 'bg-slate-700/30', text: 'text-slate-300', border: 'border-slate-700' },
  Open: { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' },
  'In Progress': { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
  'QA / Review': { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
  Done: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  Overdue: { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30' },
};

const ALL_STATUSES: ProductStatus[] = [
  'Backlog',
  'Open',
  'In Progress',
  'QA / Review',
  'Done',
  'Overdue'
];

const STATUS_OPTIONS: ProductStatus[] = [
  'Backlog',
  'Open',
  'In Progress',
  'QA / Review',
  'Done',
  'Overdue'
];

export const ProductHub: React.FC<ProductHubProps> = ({
  productItems,
  onSelectTicket,
  onUpdateTicketStatus,
  onNewTicket,
  searchFilter,
  canEdit = true
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'bug' | 'roadmap' | 'board'>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState('');

  const combinedSearch = (searchFilter || localSearch).trim().toLowerCase();

  // Extract unique clients in product list
  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    productItems.forEach(p => {
      if (p.client) set.add(p.client);
    });
    return Array.from(set);
  }, [productItems]);

  // Counts
  const bugCount = productItems.filter(p => p.category === 'bug').length;
  const roadmapCount = productItems.filter(p => p.category === 'roadmap').length;
  const criticalCount = productItems.filter(p => p.priority === 'Critical' || p.priority === 'High').length;
  const inProgressCount = productItems.filter(p => p.status === 'In Progress' || p.status === 'QA / Review').length;

  // Filtered items
  const filteredItems = useMemo(() => {
    return productItems.filter(item => {
      if (activeTab === 'bug' && item.category !== 'bug') return false;
      if (activeTab === 'roadmap' && item.category !== 'roadmap') return false;
      if (selectedClient !== 'all' && item.client !== selectedClient) return false;
      if (selectedPriority !== 'all' && item.priority !== selectedPriority) return false;
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;

      if (combinedSearch) {
        const matchTitle = item.title?.toLowerCase().includes(combinedSearch);
        const matchDesc = item.description?.toLowerCase().includes(combinedSearch);
        const matchClient = item.client?.toLowerCase().includes(combinedSearch);
        const matchModule = item.module?.toLowerCase().includes(combinedSearch);
        const matchId = item.id?.toLowerCase().includes(combinedSearch);
        return matchTitle || matchDesc || matchClient || matchModule || matchId;
      }
      return true;
    });
  }, [productItems, activeTab, selectedClient, selectedPriority, selectedStatus, combinedSearch]);

  // Group items by status
  const groupedItems = useMemo(() => {
    const byStatus = new Map<string, ProductItem[]>();
    filteredItems.forEach(p => {
      const key = p.status || '(ללא סטטוס)';
      if (!byStatus.has(key)) byStatus.set(key, []);
      byStatus.get(key)!.push(p);
    });

    const ordered: { status: string; items: ProductItem[] }[] = [];
    ALL_STATUSES.forEach(st => {
      const items = byStatus.get(st);
      if (items && items.length) {
        ordered.push({ status: st, items });
        byStatus.delete(st);
      }
    });
    byStatus.forEach((items, key) => {
      ordered.push({ status: key, items });
    });
    return ordered;
  }, [filteredItems]);

  const groupStyle = (status: string) => STATUS_COLORS[status] || {
    bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700'
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Metrics */}
      <div className="product-header-card p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="product-pill inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
            <Layers className="w-3.5 h-3.5" />
            <span>בקרה ומסירת פיתוח · Product & Delivery Control</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            ניהול תקלות, דרישות לקוח ומפת דרכים
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            מעקב ישיר אחר קצב מסירת הפיצ'רים, חלוקת משימות לפי לקוח (סוכנויות ומוסכים), וטיפול בתקלות מערכת.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="product-stat-card p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center min-w-[90px]">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">סה״כ פריטים</span>
            <span className="text-xl font-extrabold text-white">{productItems.length}</span>
          </div>
          <div className="product-stat-card p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center min-w-[90px]">
            <span className="text-[10px] text-amber-400 font-bold block uppercase">תקלות (Fixes)</span>
            <span className="text-xl font-extrabold text-white">{bugCount}</span>
          </div>
          <div className="product-stat-card p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center min-w-[90px]">
            <span className="text-[10px] text-emerald-400 font-bold block uppercase">Roadmap</span>
            <span className="text-xl font-extrabold text-white">{roadmapCount}</span>
          </div>
          <button
            onClick={onNewTicket}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>פנייה חדשה</span>
          </button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            הכל ({productItems.length})
          </button>

          <button
            onClick={() => setActiveTab('bug')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'bug'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>תקלות ובאגים ({bugCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'roadmap'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>מפת דרכים ({roadmapCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'board'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>לוח קנבן (Board)</span>
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Client Filter */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-xs py-1.5 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">כל הלקוחות / מקורות</option>
            {uniqueClients.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-xs py-1.5 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">כל רמות העדיפות</option>
            <option value="Critical">Critical (קריטי)</option>
            <option value="High">High (גבוה)</option>
            <option value="Medium">Medium (בינוני)</option>
            <option value="Low">Low (נמוך)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-xs py-1.5 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">כל הסטטוסים</option>
            {ALL_STATUSES.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW: KANBAN BOARD */}
      {activeTab === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[calc(100vh-450px)]">
          {['Backlog', 'Open', 'In Progress', 'Done'].map(columnStatus => {
            const columnItems = filteredItems.filter(item => {
              if (columnStatus === 'Done') return item.status === 'Done';
              if (columnStatus === 'In Progress') return item.status === 'In Progress' || item.status === 'QA / Review';
              if (columnStatus === 'Open') return item.status === 'Open';
              return item.status === 'Backlog';
            });

            return (
              <div key={columnStatus} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    {columnStatus}
                  </h3>
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-center font-bold">
                    {columnItems.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => onSelectTicket(item)}
                      className="p-3.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-blue-500/50 cursor-pointer transition-all space-y-2 shadow-sm group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-400">{item.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${PRIORITY_BADGES[item.priority] || 'border-slate-700'}`}>
                          {item.priority}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                        {item.title}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <span className="truncate max-w-[120px]">{item.client}</span>
                        <span className="text-amber-400 font-mono text-[10px]">{item.release || item.targetDate || 'Q1 2027'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW: TABLE - Natural Infinite Page Scroll with Unified Sticky Header (No inner rectangle trap) */
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 shadow-2xl ring-1 ring-slate-800/40 relative">
          <div className="flex relative">
            {/* Side Group Navigation - Sticky to viewport on natural page scroll */}
            <div className="w-40 sm:w-44 border-r border-slate-700/60 bg-slate-900/95 flex-none shrink-0 sticky top-[160px] self-start z-30 min-w-0 shadow-lg rounded-r-2xl">
              <div className="px-2.5 py-2 border-b border-slate-700/60 flex items-center justify-between text-slate-400 bg-slate-900/90">
                <span className="text-[11px] font-bold tracking-wide">ניווט סטטוסים</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-bold">{groupedItems.length}</span>
              </div>
              <div className="p-1.5 space-y-1">
                {groupedItems.map(({ status, items: groupItems }) => (
                  <button
                    key={`nav-${status}`}
                    onClick={() => {
                      const el = document.getElementById(`group-${status.replace(/[^\w]/g, '')}`);
                      if (el) {
                        const headerOffset = 195;
                        const elementPosition = el.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        window.scrollTo({
                          top: offsetPosition,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className={`w-full py-1.5 px-2 rounded-lg transition-all flex items-center justify-between gap-1.5 shadow-sm hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] text-right ${
                      (STATUS_COLORS[status]?.text || 'text-slate-200') + ' border border-slate-700/50 bg-slate-850/90 hover:bg-slate-800'
                    }`}
                    title={`${status} (${groupItems.length} משימות)`}
                  >
                    <bdi dir="auto" className="text-right leading-tight truncate text-[11px] sm:text-xs font-bold flex-1">
                      {status}
                    </bdi>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-900/90 border border-slate-700/60 opacity-90 shrink-0">
                      {groupItems.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Natural Infinite Scroll Table Area with Unified Sticky Header */}
            <div className="flex-1 min-w-0">
              <table 
                style={{ 
                  tableLayout: 'fixed', 
                  borderCollapse: 'separate', 
                  borderSpacing: 0,
                  '--table-header-top': '148px'
                } as React.CSSProperties} 
                className="w-full border-separate border-spacing-0 text-right text-[9px]"
              >
                <thead style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="bg-slate-900 sticky top-[148px] z-30 shadow-md">
                  <tr style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="border-b border-slate-700 bg-slate-900">
                    <th style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="sticky top-[148px] z-30 bg-slate-900 shadow-sm py-2 px-2.5 w-16 text-slate-300 font-bold border-b border-slate-700">מזהה</th>
                    <th style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="sticky top-[148px] z-30 bg-slate-900 shadow-sm py-2 px-2.5 w-24 text-slate-300 font-bold border-b border-slate-700">סוג</th>
                    <th style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="sticky top-[148px] z-30 bg-slate-900 shadow-sm py-2 px-2.5 min-w-[180px] text-slate-300 font-bold border-b border-slate-700">כותרת המשימה</th>
                    <th style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="sticky top-[148px] z-30 bg-slate-900 shadow-sm py-2 px-2.5 w-36 text-slate-300 font-bold border-b border-slate-700">לקוח / מקור</th>
                    <th style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="sticky top-[148px] z-30 bg-slate-900 shadow-sm py-2 px-2.5 w-28 text-slate-300 font-bold border-b border-slate-700">מודול במערכת</th>
                    <th style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="sticky top-[148px] z-30 bg-slate-900 shadow-sm py-2 px-2.5 w-20 text-slate-300 font-bold border-b border-slate-700">עדיפות</th>
                    <th style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="sticky top-[148px] z-30 bg-slate-900 shadow-sm py-2 px-2.5 w-36 text-slate-300 font-bold border-b border-slate-700">סטטוס מסירה</th>
                    <th style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="sticky top-[148px] z-30 bg-slate-900 shadow-sm py-2 px-2.5 w-28 text-slate-300 font-bold border-b border-slate-700">גרסה / יעד</th>
                    <th style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="sticky top-[148px] z-30 bg-slate-900 shadow-sm py-2 px-2.5 text-center w-20 text-slate-300 font-bold border-b border-slate-700">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                {groupedItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 text-[10px]">
                      לא נמצאו פריטי מוצר העונים לסינון
                    </td>
                  </tr>
                ) : (
                  <>
                  {groupedItems.map(({ status, items: groupItems }) => (
                    <React.Fragment key={`group-frag-${status}`}>
                      {/* Dark background band behind each group */}
                      <tr key={`band-${status}`}>
                        <td colSpan={9} className="h-2 bg-slate-950/40 border-0 p-0"></td>
                      </tr>

                      {/* Group header */}
                      <tr key={`group-${status}`} id={`group-${status.replace(/[^\w]/g, '')}`}>
                        <td colSpan={9} className="py-2.5 px-4 bg-slate-800/95 text-[10px] font-bold text-slate-100 border-b border-slate-700/80 rounded-t-xl rounded-b-none shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 ${groupStyle(status).bg} ${groupStyle(status).text} ${groupStyle(status).border} font-bold shadow-sm`}
                              >
                                {status}
                              </span>
                              <span className="text-slate-300 font-semibold text-xs">({groupItems.length} משימות)</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                      {groupItems.map(item => (
                        <tr
                          key={item.id}
                          onClick={() => onSelectTicket(item)}
                          className="monday-table-row transition-all group cursor-pointer"
                        >
                            {/* ID */}
                            <td 
                              style={{ borderRight: `4px solid ${item.category === 'bug' ? '#f43f5e' : '#10b981'}` }}
                              className="py-2 px-2.5 font-mono text-[8.5px] font-bold text-blue-400"
                            >
                              {item.id}
                            </td>

                            {/* Category Badge */}
                            <td className="py-2 px-2.5">
                              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8.5px] font-semibold border ${
                                item.category === 'bug'
                                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              }`}>
                                {item.category === 'bug' ? <Bug className="w-2.5 h-2.5" /> : <Compass className="w-2.5 h-2.5" />}
                                <span>{item.type}</span>
                              </span>
                            </td>

                            {/* Title & Description */}
                            <td className="py-2 px-2.5 max-w-xs">
                              <div className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors text-[9.5px] leading-tight">
                                {item.title}
                              </div>
                              {item.description && (
                                <div className="text-[8px] text-slate-400 line-clamp-1 mt-0.5">
                                  {item.description}
                                </div>
                              )}
                            </td>

                            {/* Client */}
                            <td className="py-2 px-2.5">
                              <span className="text-[8.5px] text-slate-200 font-medium flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5 text-slate-500" />
                                <span className="truncate max-w-xs">{item.client}</span>
                              </span>
                            </td>

                            {/* Module */}
                            <td className="py-2 px-2.5">
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                                {item.module || 'כללי'}
                              </span>
                            </td>

                            {/* Priority */}
                            <td className="py-2 px-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] border font-bold uppercase ${PRIORITY_BADGES[item.priority] || 'border-slate-700'}`}>
                                {item.priority}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-2 px-2.5" onClick={(e) => e.stopPropagation()}>
                              {canEdit ? (
                                <select
                                  value={item.status}
                                  onChange={(e) => onUpdateTicketStatus(item.id, e.target.value as ProductStatus)}
                                  className={`bg-slate-800 border border-slate-700 rounded text-[9px] py-1 px-2 text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 w-full shadow-sm ${styleForStatus(item.status)}`}
                                >
                                  {ALL_STATUSES.map(st => (
                                    <option key={st} value={st}>{st}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className={`px-2 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-300 border border-slate-700`}>
                                  {item.status}
                                </span>
                              )}
                            </td>

                            {/* Release / Target */}
                            <td className="py-2 px-2.5 font-mono text-[9px] text-amber-400">
                              {item.release || item.targetDate || 'Q1 2027'}
                            </td>

                            {/* Actions */}
                            <td className="py-2 px-2.5 text-center">
                              <button
                                onClick={() => onSelectTicket(item)}
                                className="px-2 py-1 rounded-md bg-slate-800 group-hover:bg-blue-600 group-hover:text-white border border-slate-700 text-slate-300 text-[8.5px] font-medium transition-all shadow-sm"
                              >
                                פרטים
                              </button>
                            </td>
                          </tr>
                        ))}
                        {/* Dark background band below each group */}
                        <tr key={`band-bottom-${status}`}>
                          <td colSpan={9} className="h-3 bg-slate-950/30 border-0 p-0"></td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </>
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const styleForStatus = (status: ProductStatus): string => {
  const s = STATUS_COLORS[status] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };
  return `${s.bg} ${s.text} ${s.border}`;
};
