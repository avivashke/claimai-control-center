import React, { useState, useMemo, useCallback, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Phone, 
  MessageSquare, 
  Mail, 
  Building, 
  ChevronRight, 
  ChevronLeft, 
  ArrowUpDown,
  Download, 
  AlertCircle, 
  ExternalLink, 
  UserCheck, 
  Plus, 
  Edit,
  Users,
  Table as TableIcon,
  Sparkles,
  GitCompare
} from 'lucide-react';
import { Client, CustomTable } from '../../types';
import { CustomTableView } from '../CustomTables/CustomTableView';
import { UploadTableModal } from '../CustomTables/UploadTableModal';

interface ClientTableProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
  onUpdateClientStatus: (clientId: string, newStatus: string) => void;
  onUpdateClientBusinessType: (clientId: string, newBusinessType: string) => void;
  searchFilter: string;
  canEdit?: boolean;
  customTables?: CustomTable[];
  onTableCreated?: (table: CustomTable) => void;
  onUpdateTable?: (table: CustomTable) => void;
  onDeleteTable?: (tableId: string) => void;
  onUpdateClient?: (updatedClient: Client) => void;
  onBatchUpdateClients?: (updatedClients: Client[]) => void;
  onOpenAiStudio?: () => void;
}

const STATUS_COLORS: { [key: string]: { bg: string; text: string; border: string } } = {
  "1'st Lead": { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
  "1'st Follow-Up": { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
  "Follow-Up": { bg: 'bg-orange-500/15', text: 'text-orange-300', border: 'border-orange-500/30' },
  "Meeting Scheduled": { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' },
  "Important": { bg: 'bg-pink-500/15', text: 'text-pink-300', border: 'border-pink-500/30' },
  "Urgent": { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30' },
  "Adoption Monitoring": { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  "All-Good": { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  "Irrelevant": { bg: 'bg-slate-700/30', text: 'text-slate-400', border: 'border-slate-700' },
  "ליד ראשוני מהמאנדיי": { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
};

const ALL_STATUSES = [
  "1'st Lead",
  "1'st Follow-Up",
  "Meeting Scheduled",
  "Important",
  "Urgent",
  "Follow-Up",
  "Adoption Monitoring",
  "All-Good",
  "Irrelevant"
];

export const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  onSelectClient,
  onUpdateClientStatus,
  onUpdateClientBusinessType,
  searchFilter,
  canEdit = true,
  customTables = [],
  onTableCreated,
  onUpdateTable,
  onDeleteTable,
  onUpdateClient,
  onBatchUpdateClients,
  onOpenAiStudio
}) => {
  // Tab within CRM: 'main_crm' or a customTable.id
  const [activeSubTab, setActiveSubTab] = useState<string>('main_crm');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [localSearch, setLocalSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('all');
  const [additionalBusinessTypes, setAdditionalBusinessTypes] = useState<string[]>([]);

  // Ref to the inner table container for smooth, collision-free scrolling
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const combinedSearch = (searchFilter || localSearch).trim().toLowerCase();

  const groupStyle = (status: string) => STATUS_COLORS[status] || {
    bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700'
  };

  // Scroll to status group within the container without window jumping or header collisions
  const scrollToStatusGroup = (status: string) => {
    const container = tableContainerRef.current;
    const targetId = `group-${status.replace(/[^\w]/g, '')}`;
    const el = document.getElementById(targetId);
    if (!container || !el) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    // 38px accounts for the sticky table column headers
    const targetScrollTop = container.scrollTop + (elRect.top - containerRect.top) - 38;

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });
  };

  // All business types available globally
  const allBusinessTypes = useMemo(() => {
    const set = new Set<string>();
    clients.forEach(c => {
      if (c.businessType) set.add(c.businessType);
    });
    additionalBusinessTypes.forEach(bt => set.add(bt));
    return Array.from(set);
  }, [clients, additionalBusinessTypes]);

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (selectedStatus !== 'all' && c.status !== selectedStatus) {
        return false;
      }
      if (selectedBusinessType !== 'all' && c.businessType !== selectedBusinessType) {
        return false;
      }
      if (combinedSearch) {
        const matchesName = c.name?.toLowerCase().includes(combinedSearch);
        const matchesCompany = c.company?.toLowerCase().includes(combinedSearch);
        const matchesPhone = c.phone?.toLowerCase().includes(combinedSearch);
        const matchesEmail = c.email?.toLowerCase().includes(combinedSearch);
        const matchesId = c.id?.toLowerCase().includes(combinedSearch);
        const matchesNotes = c.lastNote?.toLowerCase().includes(combinedSearch);
        return matchesName || matchesCompany || matchesPhone || matchesEmail || matchesId || matchesNotes;
      }
      return true;
    });
  }, [clients, selectedStatus, selectedBusinessType, combinedSearch]);

  // Group clients by status
  const groupedClients = useMemo(() => {
    const byStatus = new Map<string, Client[]>();
    filteredClients.forEach(c => {
      const key = c.status || '(ללא סטטוס)';
      if (!byStatus.has(key)) byStatus.set(key, []);
      byStatus.get(key)!.push(c);
    });

    const ordered: { status: string; clients: Client[] }[] = [];
    ALL_STATUSES.forEach(st => {
      const items = byStatus.get(st);
      if (items && items.length) {
        ordered.push({ status: st, clients: items });
        byStatus.delete(st);
      }
    });
    byStatus.forEach((items, key) => {
      ordered.push({ status: key, clients: items });
    });
    return ordered;
  }, [filteredClients]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'שם', 'חברה', 'סוג עסק', 'סטטוס', 'טלפון', 'אימייל', 'הערה אחרונה'];
    const rows = filteredClients.map(c => [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.company || '').replace(/"/g, '""')}"`,
      `"${(c.businessType || '').replace(/"/g, '""')}"`,
      `"${(c.status || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.lastNote || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `claimai_crm_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatWhatsAppNumber = (phone?: string) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return `972${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith('972')) {
      return cleaned;
    }
    return `972${cleaned}`;
  };

  const handleAddGlobalBusinessType = useCallback((clientId: string) => {
    const name = window.prompt('הזן שם לסוג עסק חדש שיתווסף לרשימה הגלובלית:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    setAdditionalBusinessTypes(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    onUpdateClientBusinessType(clientId, trimmed);
  }, [onUpdateClientBusinessType]);

  const renderBusinessTypeCell = (client: Client) => {
    const currentType = client.businessType || '';

    return (
      <select
        value={currentType}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '__add_new__') {
            handleAddGlobalBusinessType(client.id);
            return;
          }
          onUpdateClientBusinessType(client.id, val);
        }}
        className="w-full text-[10px] bg-slate-800 text-slate-200 border border-slate-700 rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
      >
        <option value="" className="bg-slate-900 text-slate-500">
          {!currentType ? '— ללא סוג —' : currentType}
        </option>
        {allBusinessTypes.map(bt => (
          <option key={bt} value={bt} className="bg-slate-900 text-slate-200">
            {bt}
          </option>
        ))}
        <option value="__add_new__" className="bg-slate-800 text-blue-400 font-semibold italic">
          + הוסף סוג עסק חדש…
        </option>
      </select>
    );
  };

  // Handle newly uploaded table: immediately select it as active tab
  const handleUploadedTable = (newTable: CustomTable) => {
    if (onTableCreated) {
      onTableCreated(newTable);
    }
    setActiveSubTab(newTable.id);
  };

  const activeCustomTable = customTables.find(t => t.id === activeSubTab);

  return (
    <div className="space-y-4" dir="rtl">
      
      {/* 
        SECONDARY MENU (Frozen & Static on scroll, below Header):
        Contains Table Tabs + Filters & Controls Bar
      */}
      <div 
        style={{ backgroundColor: '#0b0f19' }}
        className="sticky top-[138px] z-30 bg-[#0b0f19] pb-2 pt-1 border-b border-slate-800 space-y-2.5 shadow-md"
      >
        
        {/* Table Tabs Navigation in Client Management */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-1.5 flex-nowrap">
            
            {/* Main CRM Clients Table Tab */}
            <button
              onClick={() => setActiveSubTab('main_crm')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeSubTab === 'main_crm'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>טבלה ראשית (לקוחות CRM)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 font-mono">
                {clients.length}
              </span>
            </button>

            {/* Uploaded / Custom Tables as Independent Tabs with their Defined Titles */}
            {customTables.map(tbl => (
              <button
                key={tbl.id}
                onClick={() => setActiveSubTab(tbl.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeSubTab === tbl.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/40'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/60'
                }`}
              >
                <TableIcon className="w-4 h-4 text-purple-300" />
                <span>{tbl.name}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-950/60 font-mono text-purple-200">
                  {tbl.rows.length}
                </span>
              </button>
            ))}

          </div>

          {/* Upload Table & AI Studio Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-900/30 transition-all hover:scale-[1.02]"
                title="העלה קובץ Excel / CSV שיופיע מיד בלשונית עצמאית עם כותרתו"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ העלאת טבלה חדשה</span>
              </button>
            )}

            {onOpenAiStudio && (
              <button
                onClick={onOpenAiStudio}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-purple-500/30 text-purple-300 text-xs font-semibold"
                title="סטודיו AI לניתוח וטבלאות מתקדמות"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>סטודיו AI</span>
              </button>
            )}
          </div>
        </div>

        {/* If Active Sub-Tab is Main CRM: Render Filters and Controls Bar */}
        {activeSubTab === 'main_crm' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-slate-900/90 p-3 rounded-xl border border-slate-800 shadow-md">
            
            {/* Search & Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[180px] flex-1 max-w-sm">
                <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="חיפוש בטבלה..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pr-8 pl-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg text-xs py-1.5 px-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">כל הסטטוסים ({clients.length})</option>
                {ALL_STATUSES.map(st => (
                  <option key={st} value={st}>
                    {st} ({clients.filter(c => c.status === st).length})
                  </option>
                ))}
              </select>

              {/* Business Type Filter */}
              <select
                value={selectedBusinessType}
                onChange={(e) => setSelectedBusinessType(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg text-xs py-1.5 px-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">כל סוגי העסקים</option>
                {allBusinessTypes.map(bt => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-slate-400 font-mono">
                מציג {filteredClients.length.toLocaleString()} מתוך {clients.length.toLocaleString()}
              </span>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
                title="ייצוא ל-Excel/CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ייצוא CSV</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 
        IF ACTIVE SUB-TAB IS AN UPLOADED/CUSTOM TABLE:
        Render it as an independent table with full field management, deduplication & seamless sync
      */}
      {activeSubTab !== 'main_crm' && activeCustomTable && (
        <CustomTableView
          currentTableOverride={activeCustomTable}
          onUpdateTable={(updated) => onUpdateTable && onUpdateTable(updated)}
          onDeleteTable={(tableId) => {
            if (onDeleteTable) {
              onDeleteTable(tableId);
              setActiveSubTab('main_crm');
            }
          }}
          canEdit={canEdit}
          clients={clients}
          onUpdateClient={onUpdateClient}
          onBatchUpdateClients={onBatchUpdateClients}
          onOpenAiStudio={onOpenAiStudio}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
        />
      )}

      {/* 
        IF ACTIVE SUB-TAB IS MAIN CRM:
        Render Main CRM Table with smooth, container-only group scrolling (no header collision)
      */}
      {activeSubTab === 'main_crm' && (
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 shadow-2xl ring-1 ring-slate-800/40">
          <div 
            ref={tableContainerRef} 
            className="flex overflow-y-auto overflow-x-auto h-[calc(100vh-250px)] relative scroll-smooth"
          >
            {/* Side Group Navigation - sticky inside the scroll container, z-20 */}
            <div className="w-28 border-r border-slate-700/60 bg-slate-900/95 shrink-0 sticky top-0 self-start z-20 min-w-0">
              <div className="p-1 space-y-0.5">
                {groupedClients.map(({ status, clients: groupClients }) => (
                  <button
                    key={`nav-${status}`}
                    onClick={() => scrollToStatusGroup(status)}
                    className={`w-full py-1 px-1.5 rounded text-[7px] font-semibold transition-all flex flex-col items-end justify-between gap-0.5 ${
                      status === '(ללא סטטוס)'
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : (STATUS_COLORS[status]?.text || 'text-slate-300') + ' border border-slate-700/50 bg-slate-800/50'
                    }`}
                    title={`${status} (${groupClients.length})`}
                  >
                    <span className="text-right leading-tight">{status === '(ללא סטטוס)' ? 'ללא סטטוס' : status}</span>
                    <span className="text-[7px] opacity-60">{groupClients.length}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-w-0">
              <table style={{ tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }} className="w-full border-separate border-spacing-0 text-right text-[9px]">
                <thead style={{ backgroundColor: '#0f172a' }} className="bg-slate-900 sticky top-0 z-20">
                  <tr style={{ backgroundColor: '#0f172a' }} className="border-b border-slate-700 bg-slate-900">
                    <th style={{ backgroundColor: '#0f172a' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-1.5 px-2 min-w-[150px]">איש קשר / חברה</th>
                    <th style={{ backgroundColor: '#0f172a' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-1.5 px-2 min-w-[140px]">סוג עסק</th>
                    <th style={{ backgroundColor: '#0f172a' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-1.5 px-2 min-w-[180px]">סטטוס CRM</th>
                    <th style={{ backgroundColor: '#0f172a' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-1.5 px-2">פרטי התקשרות</th>
                    <th style={{ backgroundColor: '#0f172a' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-1.5 px-2">הערה אחרונה</th>
                    <th style={{ backgroundColor: '#0f172a' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-1.5 px-2 text-center w-20">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {groupedClients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 text-[10px]">
                        לא נמצאו רשומות העונות לסינון המבוקש
                      </td>
                    </tr>
                  ) : (
                    <>
                      {groupedClients.map(({ status, clients: groupClients }) => (
                        <React.Fragment key={`group-frag-${status}`}>
                          {/* Dark background band behind each group */}
                          <tr key={`band-${status}`}>
                            <td colSpan={6} className="h-2 bg-slate-950/40 border-0 p-0"></td>
                          </tr>

                          {/* Group header */}
                          <tr key={`group-${status}`} id={`group-${status.replace(/[^\w]/g, '')}`}>
                            <td colSpan={6} className="py-2.5 px-4 bg-slate-800/90 text-[9px] font-bold text-slate-100 border-b border-slate-700/60 flex items-center justify-between rounded-t-xl rounded-b-none shadow-sm">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded border inline-flex items-center gap-1 ${groupStyle(status).bg} ${groupStyle(status).text} ${groupStyle(status).border} font-bold`}
                                >
                                  {status === '(ללא סטטוס)' ? 'ללא סטטוס' : status}
                                </span>
                                <span className="ml-1.5 text-slate-300 font-normal">({groupClients.length})</span>
                              </div>
                            </td>
                          </tr>

                          {groupClients.map((client) => {
                            const style = STATUS_COLORS[client.status] || {
                              bg: 'bg-slate-800',
                              text: 'text-slate-300',
                              border: 'border-slate-700'
                            };
                            const waNumber = formatWhatsAppNumber(client.phone);

                            return (
                              <tr 
                                key={client.id}
                                className="hover:bg-slate-800/30 transition-colors group cursor-pointer border-b border-slate-800/40"
                                onClick={() => onSelectClient(client)}
                              >
                                {/* Name & Company */}
                                <td className="py-1.5 px-2 min-w-[150px]">
                                  <div className="font-semibold text-white group-hover:text-blue-400 transition-colors text-[9px] leading-tight">
                                    {client.name || 'ללא שם'}
                                  </div>
                                  {client.company && client.company !== client.name && (
                                    <div className="text-[8px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                                      <Building className="w-2 h-2 text-slate-500" />
                                      <span className="truncate">{client.company}</span>
                                    </div>
                                  )}
                                  {client.requiresAttention && (
                                    <span className="inline-flex items-center gap-0.5 text-[8px] text-rose-400 font-semibold mt-0.5">
                                      <AlertCircle className="w-2 h-2" />
                                      <span>דחוף</span>
                                    </span>
                                  )}
                                </td>

                                {/* Business Type */}
                                <td className="py-1.5 px-2 min-w-[140px]">
                                  {canEdit ? (
                                    renderBusinessTypeCell(client)
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-slate-800 text-slate-300 border border-slate-700 block max-w-xs truncate" title={client.businessType || ''}>
                                      {client.businessType || '-'}
                                    </span>
                                  )}
                                </td>

                                {/* Status */}
                                <td className="py-1.5 px-2 min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                                  {canEdit ? (
                                    <select
                                      value={client.status}
                                      onChange={(e) => onUpdateClientStatus(client.id, e.target.value)}
                                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border focus:outline-none transition-all cursor-pointer ${style.bg} ${style.text} ${style.border} w-full`}
                                    >
                                      {ALL_STATUSES.map(s => (
                                        <option key={s} value={s} className="bg-slate-900 text-slate-200 truncate">
                                          {s}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border inline-block ${style.bg} ${style.text} ${style.border}`}>
                                      {client.status}
                                    </span>
                                  )}
                                  {client.subStatus && (
                                    <div className="text-[8px] text-slate-400 mt-0.5">
                                      {client.subStatus}
                                    </div>
                                  )}
                                </td>

                                {/* Contact Channels */}
                                <td className="py-1.5 px-2" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center gap-1">
                                    {client.phone && (
                                      <>
                                        <a
                                          href={`tel:${client.phone}`}
                                          title={`חייג: ${client.phone}`}
                                          className="w-5 h-5 rounded-lg bg-slate-800 hover:bg-blue-600/30 border border-slate-700 hover:border-blue-500/50 text-slate-300 hover:text-blue-300 flex items-center justify-center transition-all"
                                        >
                                          <Phone className="w-2.5 h-2.5" />
                                        </a>
                                        {waNumber && (
                                          <a
                                            href={`https://wa.me/${waNumber}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={`שלח הודעת וואטסאפ ל-${client.phone}`}
                                            className="w-5 h-5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 flex items-center justify-center transition-all"
                                          >
                                            <MessageSquare className="w-2.5 h-2.5" />
                                          </a>
                                        )}
                                        <span className="font-mono text-[8px] text-slate-300 truncate max-w-xs">
                                          {client.phone}
                                        </span>
                                      </>
                                    )}
                                    {!client.phone && (
                                      <span className="text-slate-600 text-[8px]">אין טלפון</span>
                                    )}
                                    {client.email && (
                                      <a
                                        href={`mailto:${client.email}`}
                                        title={client.email}
                                        className="w-5 h-5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all mr-0.5"
                                      >
                                        <Mail className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                </td>

                                {/* Last Note */}
                                <td className="py-1.5 px-2 max-w-xs">
                                  {client.lastNote ? (
                                    <div className="space-y-0.5" title={client.lastNote}>
                                      {client.lastNote.includes('👤') && (
                                        <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20">
                                          {client.lastNote.match(/👤\s*([^|\n]+)/)?.[0] || '👤 הערה חתומה'}
                                        </span>
                                      )}
                                      <p className="text-[8px] text-slate-300 line-clamp-2">
                                        {client.lastNote.replace(/^[0-9/:\s|]+👤[^|]+\|\s*/, '')}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-[8px] text-slate-600">אין הערות</span>
                                  )}
                                </td>

                                {/* Profile Action */}
                                <td className="py-1.5 px-2 text-center">
                                  <button
                                    onClick={() => onSelectClient(client)}
                                    className="px-1.5 py-0.5 rounded-lg bg-slate-800 group-hover:bg-blue-600 group-hover:text-white border border-slate-700 group-hover:border-blue-500 text-slate-300 text-[8px] font-medium transition-all"
                                  >
                                    פרופיל
                                  </button>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Dark background band below each group */}
                          <tr key={`band-bottom-${status}`}>
                            <td colSpan={6} className="h-3 bg-slate-950/30 border-0 p-0"></td>
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

      {/* Upload Table Modal */}
      <UploadTableModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onTableCreated={handleUploadedTable}
      />

    </div>
  );
};
