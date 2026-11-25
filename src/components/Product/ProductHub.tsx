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
  Sparkles,
  GripVertical,
  RotateCcw
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

interface ProductColDef {
  key: string;
  label: string;
  widthClass: string;
}

const BASE_PRODUCT_COLUMNS: ProductColDef[] = [
  { key: 'id', label: 'מזהה', widthClass: 'w-16' },
  { key: 'type', label: 'סוג', widthClass: 'w-24' },
  { key: 'title', label: 'כותרת המשימה', widthClass: 'min-w-[220px]' },
  { key: 'client', label: 'לקוח / מקור', widthClass: 'min-w-[140px]' },
  { key: 'module', label: 'מודול במערכת', widthClass: 'w-28' },
  { key: 'priority', label: 'עדיפות', widthClass: 'w-20' },
  { key: 'status', label: 'סטטוס מסירה', widthClass: 'w-36' },
  { key: 'release', label: 'גרסה / יעד', widthClass: 'w-28' },
  { key: 'actions', label: 'פעולות', widthClass: 'w-20 text-center' },
];

const PRODUCT_COL_STORAGE_KEY = 'claimai_product_column_order';

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

  // Column Reordering (Drag and Drop)
  const [productColumnOrder, setProductColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(PRODUCT_COL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse product column order:', e);
    }
    return BASE_PRODUCT_COLUMNS.map(c => c.key);
  });

  const [draggedColKey, setDraggedColKey] = useState<string | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);
  const [dropSide, setDropSide] = useState<'left' | 'right' | null>(null);

  const handleDragStart = (e: React.DragEvent, key: string) => {
    setDraggedColKey(key);
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    if (draggedColKey === key) return;
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    setDragOverColKey(key);
    setDropSide(e.clientX > midX ? 'right' : 'left');
  };

  const handleDragLeave = () => {
    setDragOverColKey(null);
    setDropSide(null);
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggedColKey || draggedColKey === targetKey) {
      setDraggedColKey(null);
      setDragOverColKey(null);
      setDropSide(null);
      return;
    }

    setProductColumnOrder(prev => {
      const fromIdx = prev.indexOf(draggedColKey);
      const toIdx = prev.indexOf(targetKey);
      if (fromIdx === -1 || toIdx === -1) return prev;

      const next = [...prev];
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, draggedColKey);
      try {
        localStorage.setItem(PRODUCT_COL_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save product column order:', err);
      }
      return next;
    });

    setDraggedColKey(null);
    setDragOverColKey(null);
    setDropSide(null);
  };

  const handleDragEnd = () => {
    setDraggedColKey(null);
    setDragOverColKey(null);
    setDropSide(null);
  };

  const handleResetColumnOrder = () => {
    const defaultOrder = BASE_PRODUCT_COLUMNS.map(c => c.key);
    setProductColumnOrder(defaultOrder);
    try {
      localStorage.removeItem(PRODUCT_COL_STORAGE_KEY);
    } catch {}
  };

  const activeColumns = useMemo<ProductColDef[]>(() => {
    const colMap = new Map<string, ProductColDef>();
    BASE_PRODUCT_COLUMNS.forEach(c => colMap.set(c.key, c));
    const ordered: ProductColDef[] = [];
    productColumnOrder.forEach(key => {
      if (colMap.has(key)) {
        ordered.push(colMap.get(key)!);
        colMap.delete(key);
      }
    });
    colMap.forEach(col => ordered.push(col));
    return ordered;
  }, [productColumnOrder]);

  const renderProductCell = (col: ProductColDef, item: ProductItem) => {
    switch (col.key) {
      case 'id':
        return (
          <td 
            key={`${item.id}-${col.key}`}
            style={{ borderRight: `4px solid ${item.category === 'bug' ? '#f43f5e' : '#10b981'}` }}
            className="py-2 px-2.5 font-mono text-[8.5px] font-bold text-blue-400"
          >
            {item.id}
          </td>
        );
      case 'type':
        return (
          <td key={`${item.id}-${col.key}`} className="py-2 px-2.5">
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8.5px] font-semibold border ${
              item.category === 'bug'
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}>
              {item.category === 'bug' ? <Bug className="w-2.5 h-2.5" /> : <Compass className="w-2.5 h-2.5" />}
              <span>{item.type}</span>
            </span>
          </td>
        );
      case 'title':
        return (
          <td key={`${item.id}-${col.key}`} className="py-2 px-2.5 max-w-xs">
            <div className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors text-[9.5px] leading-tight">
              {item.title}
            </div>
            {item.description && (
              <div className="text-[8px] text-slate-400 line-clamp-1 mt-0.5">
                {item.description}
              </div>
            )}
          </td>
        );
      case 'client':
        return (
          <td key={`${item.id}-${col.key}`} className="py-2 px-2.5">
            <span className="text-[8.5px] text-slate-200 font-medium flex items-center gap-1">
              <Building2 className="w-2.5 h-2.5 text-slate-500" />
              <span className="truncate max-w-xs">{item.client}</span>
            </span>
          </td>
        );
      case 'module':
        return (
          <td key={`${item.id}-${col.key}`} className="py-2 px-2.5">
            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
              {item.module || 'כללי'}
            </span>
          </td>
        );
      case 'priority':
        return (
          <td key={`${item.id}-${col.key}`} className="py-2 px-2.5">
            <span className={`px-1.5 py-0.5 rounded text-[8px] border font-bold uppercase ${PRIORITY_BADGES[item.priority] || 'border-slate-700'}`}>
              {item.priority}
            </span>
          </td>
        );
      case 'status':
        return (
          <td key={`${item.id}-${col.key}`} className="py-2 px-2.5" onClick={(e) => e.stopPropagation()}>
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
        );
      case 'release':
        return (
          <td key={`${item.id}-${col.key}`} className="py-2 px-2.5 font-mono text-[9px] text-amber-400">
            {item.release || item.targetDate || 'Q1 2027'}
          </td>
        );
      case 'actions':
        return (
          <td key={`${item.id}-${col.key}`} className="py-2 px-2.5 text-center">
            <button
              onClick={() => onSelectTicket(item)}
              className="px-2 py-1 rounded-md bg-slate-800 group-hover:bg-blue-600 group-hover:text-white border border-slate-700 text-slate-300 text-[8.5px] font-medium transition-all shadow-sm"
            >
              פרטים
            </button>
          </td>
        );
      default:
        return null;
    }
  };

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

          {/* Reset column order button & drag indicator */}
          <button
            type="button"
            onClick={handleResetColumnOrder}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition-all cursor-pointer mr-auto"
            title="איפוס סדר העמודות לברירת מחדל"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">איפוס סדר עמודות</span>
          </button>
          <span className="text-[11px] text-slate-400 hidden xl:inline-flex items-center gap-1">
            <GripVertical className="w-3 h-3 text-slate-500" />
            <span>גרור עמודות לשינוי סדר</span>
          </span>
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
                    {activeColumns.map((col) => {
                      const isDragging = draggedColKey === col.key;
                      const isOver = dragOverColKey === col.key;

                      return (
                        <th
                          key={col.key}
                          draggable
                          onDragStart={(e) => handleDragStart(e, col.key)}
                          onDragOver={(e) => handleDragOver(e, col.key)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, col.key)}
                          onDragEnd={handleDragEnd}
                          style={{ backgroundColor: 'var(--bg-th, #0f172a)' }}
                          className={`sticky top-[148px] z-30 bg-slate-900 shadow-sm py-2 px-2.5 text-slate-300 font-bold border-b border-slate-700 select-none cursor-grab active:cursor-grabbing transition-all ${col.widthClass} ${
                            isOver && dropSide === 'right' ? 'border-r-2 border-r-blue-400' : ''
                          } ${
                            isOver && dropSide === 'left' ? 'border-l-2 border-l-blue-400' : ''
                          } ${isDragging ? 'opacity-40 bg-slate-800' : ''}`}
                          title="גרור כדי לשנות את מיקום העמודה ימינה או שמאלה"
                        >
                          <div className="flex items-center justify-between gap-1 group/th">
                            <div className="flex items-center gap-1 min-w-0">
                              <GripVertical className="w-3 h-3 text-slate-500 opacity-40 group-hover/th:opacity-100 transition-opacity shrink-0 cursor-grab" />
                              <span className="truncate" title={col.label}>
                                {col.label}
                              </span>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                {groupedItems.length === 0 ? (
                  <tr>
                    <td colSpan={activeColumns.length} className="py-12 text-center text-slate-500 text-[10px]">
                      לא נמצאו פריטי מוצר העונים לסינון
                    </td>
                  </tr>
                ) : (
                  <>
                  {groupedItems.map(({ status, items: groupItems }) => (
                    <React.Fragment key={`group-frag-${status}`}>
                      {/* Dark background band behind each group */}
                      <tr key={`band-${status}`}>
                        <td colSpan={activeColumns.length} className="h-2 bg-slate-950/40 border-0 p-0"></td>
                      </tr>

                      {/* Group header */}
                      <tr key={`group-${status}`} id={`group-${status.replace(/[^\w]/g, '')}`}>
                        <td colSpan={activeColumns.length} className="py-2.5 px-4 bg-slate-800/95 text-[10px] font-bold text-slate-100 border-b border-slate-700/80 rounded-t-xl rounded-b-none shadow-sm">
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
                          {activeColumns.map(col => renderProductCell(col, item))}
                        </tr>
                      ))}
                      {/* Dark background band below each group */}
                      <tr key={`band-bottom-${status}`}>
                        <td colSpan={activeColumns.length} className="h-3 bg-slate-950/30 border-0 p-0"></td>
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
