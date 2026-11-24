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
  Pencil,
  Users,
  Table as TableIcon,
  Sparkles,
  GitCompare,
  Check,
  Copy,
  PhoneCall,
  Columns,
  Zap,
  ListFilter,
  CheckSquare,
  Trash2,
  Calendar,
  Tag,
  X
} from 'lucide-react';
import { Client, CustomTable, CrmCustomColumn } from '../../types';
import { CustomTableView } from '../CustomTables/CustomTableView';
import { UploadTableModal } from '../CustomTables/UploadTableModal';
import { CrmColumnManagerModal } from './CrmColumnManagerModal';

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

const STATUS_ACCENT_COLORS: { [key: string]: string } = {
  "1'st Lead": '#a855f7',
  "1'st Follow-Up": '#f59e0b',
  "Follow-Up": '#f97316',
  "Meeting Scheduled": '#3b82f6',
  "Important": '#ec4899',
  "Urgent": '#f43f5e',
  "Adoption Monitoring": '#06b6d4',
  "All-Good": '#10b981',
  "Irrelevant": '#64748b',
  "ליד ראשוני מהמאנדיי": '#a855f7',
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
  const [expandedGroupLimits, setExpandedGroupLimits] = useState<Record<string, number>>({});

  // Inline editing for client name
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingClientName, setEditingClientName] = useState<string>('');

  const handleSaveInlineName = (client: Client, newName: string) => {
    const trimmed = newName.trim();
    setEditingClientId(null);
    if (!trimmed || trimmed === client.name) return;
    if (onUpdateClient) {
      onUpdateClient({
        ...client,
        name: trimmed,
        updatedDate: new Date().toISOString().slice(0, 10)
      });
    }
  };

  // CRM Main Table Custom Columns (persistent in localStorage)
  const [crmCustomColumns, setCrmCustomColumns] = useState<CrmCustomColumn[]>(() => {
    try {
      const saved = localStorage.getItem('claimai_crm_custom_columns');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse crm custom columns:', e);
    }
    return [
      {
        id: 'col_quick_actions',
        key: 'quick_actions',
        label: 'וואטסאפ מהיר',
        type: 'action',
        actionType: 'whatsapp',
        actionLabel: 'וואטסאפ'
      },
      {
        id: 'col_audit_status',
        key: 'audit_status',
        label: 'סטטוס בדיקת חיתום',
        type: 'dropdown',
        options: [
          { label: 'ממתין לבדיקה', color: 'amber' },
          { label: 'בבדיקה', color: 'blue' },
          { label: 'אושר להמשך', color: 'emerald' },
          { label: 'נדחה', color: 'rose' }
        ]
      }
    ];
  });
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);

  const handleAddCrmColumn = (newCol: CrmCustomColumn) => {
    const updated = [...crmCustomColumns, newCol];
    setCrmCustomColumns(updated);
    try {
      localStorage.setItem('claimai_crm_custom_columns', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save crm custom columns:', e);
    }
  };

  const handleDeleteCrmColumn = (colId: string) => {
    const updated = crmCustomColumns.filter(c => c.id !== colId);
    setCrmCustomColumns(updated);
    try {
      localStorage.setItem('claimai_crm_custom_columns', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save crm custom columns:', e);
    }
  };

  const handleCellCustomFieldChange = (client: Client, fieldKey: string, value: any) => {
    if (!onUpdateClient) return;
    const updatedClient: Client = {
      ...client,
      customFields: {
        ...(client.customFields || {}),
        [fieldKey]: value
      }
    };
    onUpdateClient(updatedClient);
  };

  const handleCellAction = (client: Client, col: CrmCustomColumn) => {
    if (col.actionType === 'whatsapp') {
      const wa = formatWhatsAppNumber(client.phone);
      if (wa) {
        const msg = encodeURIComponent(`שלום ${client.name}, פנייה מחברת ClaimAI.`);
        window.open(`https://wa.me/${wa}?text=${msg}`, '_blank');
      } else {
        alert('ללקוח זה לא מוגדר מספר טלפון תקין לוואטסאפ');
      }
    } else if (col.actionType === 'call') {
      if (client.phone) {
        window.location.href = `tel:${client.phone}`;
      } else {
        alert('אין מספר טלפון זמין לחיוג');
      }
    } else if (col.actionType === 'copy') {
      const text = `לקוח: ${client.name}\nחברה: ${client.company || '-'}\nטלפון: ${client.phone || '-'}\nאימייל: ${client.email || '-'}\nסטטוס: ${client.status}`;
      navigator.clipboard.writeText(text);
      setCopiedFeedback(`${client.id}_${col.id}`);
      setTimeout(() => setCopiedFeedback(null), 2000);
    } else if (col.actionType === 'email') {
      if (client.email) {
        window.location.href = `mailto:${client.email}?subject=${encodeURIComponent(`פנייה עבור ${client.name}`)}`;
      } else {
        alert('אין כתובת אימייל זמינה');
      }
    }
  };

  const getOptionColorClass = (options: CrmCustomColumn['options'], val?: string) => {
    if (!val) return 'bg-slate-800 text-slate-300 border-slate-700';
    const opt = options?.find(o => o.label === val);
    const color = opt?.color || 'blue';
    switch (color) {
      case 'emerald': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'amber': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'rose': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'purple': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'slate': return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  const renderCustomCell = (client: Client, col: CrmCustomColumn) => {
    const val = client.customFields?.[col.key];

    switch (col.type) {
      case 'dropdown':
        return (
          <select
            value={val || ''}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => handleCellCustomFieldChange(client, col.key, e.target.value)}
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border focus:outline-none transition-all cursor-pointer w-full truncate ${getOptionColorClass(col.options, val)}`}
          >
            <option value="" className="bg-slate-900 text-slate-400">בחר אפשרות...</option>
            {col.options?.map(opt => (
              <option key={opt.label} value={opt.label} className="bg-slate-900 text-slate-200">
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'action':
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCellAction(client, col);
            }}
            className="px-2 py-0.5 rounded-md bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-[8px] font-bold transition-all flex items-center justify-center gap-1 w-full cursor-pointer shadow-sm"
          >
            {col.actionType === 'whatsapp' && <MessageSquare className="w-2.5 h-2.5 text-emerald-400 shrink-0" />}
            {col.actionType === 'call' && <Phone className="w-2.5 h-2.5 text-blue-400 shrink-0" />}
            {col.actionType === 'copy' && (copiedFeedback === `${client.id}_${col.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" /> : <Copy className="w-2.5 h-2.5 text-amber-400 shrink-0" />)}
            {col.actionType === 'email' && <Mail className="w-2.5 h-2.5 text-cyan-400 shrink-0" />}
            <span className="truncate">{copiedFeedback === `${client.id}_${col.id}` ? 'הועתק!' : (col.actionLabel || col.label)}</span>
          </button>
        );

      case 'checkbox':
        return (
          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCellCustomFieldChange(client, col.key, !val);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center justify-center cursor-pointer py-0.5 select-none"
          >
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all ${
              val 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
            }`}>
              <CheckSquare className={`w-2.5 h-2.5 ${val ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{val ? 'כן' : 'לא'}</span>
            </span>
          </div>
        );

      case 'text':
        return (
          <input
            type="text"
            value={val || ''}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => handleCellCustomFieldChange(client, col.key, e.target.value)}
            placeholder="הזן טקסט..."
            className="w-full text-[9px] px-1.5 py-0.5 bg-slate-800/80 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-blue-500"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={val || ''}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => handleCellCustomFieldChange(client, col.key, e.target.value)}
            className="w-full text-[9px] px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 focus:outline-none"
          />
        );

      case 'badge':
      default:
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 truncate max-w-full">
            {val || '-'}
          </span>
        );
    }
  };

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
    // Split search into individual keyword tokens (supports multi-keyword searches like "סודיות באפי")
    const keywords = combinedSearch ? combinedSearch.split(/\s+/).filter(Boolean) : [];

    return clients.filter(c => {
      if (selectedStatus !== 'all' && c.status !== selectedStatus) {
        return false;
      }
      if (selectedBusinessType !== 'all' && c.businessType !== selectedBusinessType) {
        return false;
      }
      if (keywords.length > 0) {
        const customValues = c.customFields
          ? Object.values(c.customFields).filter(v => typeof v === 'string' || typeof v === 'number').join(' ')
          : '';

        // Deep searchable text across all client attributes, especially lastNote, generalNotes and custom fields
        const searchCorpus = [
          c.id,
          c.name,
          c.company,
          c.phone,
          c.email,
          c.businessType,
          c.status,
          c.subStatus,
          c.lastNote,
          c.generalNotes,
          c.nextFollowUpDate,
          c.teamContacts,
          c.itContact,
          c.location,
          c.source,
          c.monthlyClaims,
          customValues
        ].filter(Boolean).join(' ').toLowerCase();

        // Every keyword must be matched in the corpus
        return keywords.every(kw => searchCorpus.includes(kw));
      }
      return true;
    });
  }, [clients, selectedStatus, selectedBusinessType, combinedSearch]);

  // Group ALL filtered clients by status (so that ALL statuses appear in navigation menu with full counts)
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
        style={{ backgroundColor: 'var(--bg-page, #0b0f19)' }}
        className="sticky top-[138px] z-30 bg-[#0b0f19] pb-2 pt-1 border-b border-slate-800 space-y-2.5 shadow-md transition-colors"
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
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeSubTab === 'main_crm'
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-700/50 text-slate-400'
              }`}>
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
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeSubTab === tbl.id
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-700/50 text-slate-400'
                }`}>
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
              <div className="relative min-w-[220px] flex-1 max-w-md">
                <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="חיפוש לפי שם, חברה, טלפון, הערות ומילות מפתח..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pr-8 pl-8 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => setLocalSearch('')}
                    className="absolute left-2.5 top-2.5 text-slate-400 hover:text-white transition-colors"
                    title="נקה חיפוש"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                title="ייצוא ל-Excel/CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ייצוא CSV</span>
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsAddColumnModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  title="הוספת עמודה חדשה עם דרופדאון, פעולות תא או צ'קבוקס"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>הוסף עמודה</span>
                </button>
              )}
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
          tables={customTables}
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
            <div className="w-40 sm:w-44 border-r border-slate-700/60 bg-slate-900/95 shrink-0 sticky top-0 self-start z-20 min-w-0 shadow-lg">
              <div className="px-2.5 py-2 border-b border-slate-700/60 flex items-center justify-between text-slate-400 bg-slate-900/90">
                <span className="text-[11px] font-bold tracking-wide">ניווט סטטוסים</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-bold">{groupedClients.length}</span>
              </div>
              <div className="p-1.5 space-y-1">
                {groupedClients.map(({ status, clients: groupClients }) => (
                  <button
                    key={`nav-${status}`}
                    onClick={() => scrollToStatusGroup(status)}
                    className={`w-full py-1.5 px-2 rounded-lg transition-all flex items-center justify-between gap-1.5 shadow-sm hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] text-right ${
                      status === '(ללא סטטוס)'
                        ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750'
                        : (STATUS_COLORS[status]?.text || 'text-slate-200') + ' border border-slate-700/50 bg-slate-850/90 hover:bg-slate-800'
                    }`}
                    title={`${status} (${groupClients.length} לקוחות)`}
                  >
                    <bdi dir="auto" className="text-right leading-tight truncate text-[11px] sm:text-xs font-bold flex-1">
                      {status === '(ללא סטטוס)' ? 'ללא סטטוס' : status}
                    </bdi>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-900/90 border border-slate-700/60 opacity-90 shrink-0">
                      {groupClients.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-w-0">
              <table style={{ tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }} className="w-full border-separate border-spacing-0 text-right text-[9px]">
                <thead style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="bg-slate-900 sticky top-0 z-20">
                  <tr style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="border-b border-slate-700 bg-slate-900">
                    <th style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-1.5 px-2 min-w-[150px]">איש קשר / חברה</th>
                    <th style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-1.5 px-2 min-w-[140px]">סוג עסק</th>
                    <th style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-1.5 px-2 min-w-[180px]">סטטוס CRM</th>
                    <th style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-1.5 px-2">פרטי התקשרות</th>
                    <th style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-1.5 px-2">הערה אחרונה</th>
                    {crmCustomColumns.map((col) => (
                      <th
                        key={col.id}
                        style={{ backgroundColor: 'var(--bg-th, #0f172a)' }}
                        className="sticky top-0 z-20 bg-slate-900 shadow-sm py-1.5 px-2 min-w-[130px]"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate font-bold text-white" title={col.label}>{col.label}</span>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`האם אתה בטוח שברצונך להסיר את העמודה "${col.label}"?`)) {
                                  handleDeleteCrmColumn(col.id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                              title="מחק עמודה זו"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    <th style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-1.5 px-2 text-center w-20">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {groupedClients.length === 0 ? (
                    <tr>
                      <td colSpan={6 + crmCustomColumns.length} className="py-12 text-center text-slate-500 text-[10px]">
                        לא נמצאו רשומות העונות לסינון המבוקש
                      </td>
                    </tr>
                  ) : (
                    <>
                      {groupedClients.map(({ status, clients: groupClients }) => {
                        const limit = expandedGroupLimits[status] || 60;
                        const visibleInGroup = groupClients.slice(0, limit);
                        const hasMore = groupClients.length > limit;

                        return (
                          <React.Fragment key={`group-frag-${status}`}>
                            {/* Dark background band behind each group */}
                            <tr key={`band-${status}`}>
                              <td colSpan={6 + crmCustomColumns.length} className="h-2 bg-slate-950/40 border-0 p-0"></td>
                            </tr>

                            {/* Group header */}
                            <tr key={`group-${status}`} id={`group-${status.replace(/[^\w]/g, '')}`}>
                              <td colSpan={6 + crmCustomColumns.length} className="py-2.5 px-4 bg-slate-800/95 text-[10px] font-bold text-slate-100 border-b border-slate-700/80 rounded-t-xl rounded-b-none shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 ${groupStyle(status).bg} ${groupStyle(status).text} ${groupStyle(status).border} font-bold shadow-sm`}
                                    >
                                      {status === '(ללא סטטוס)' ? 'ללא סטטוס' : status}
                                    </span>
                                    <span className="text-slate-300 font-semibold text-xs">({groupClients.length} לקוחות)</span>
                                  </div>
                                </div>
                              </td>
                            </tr>

                            {visibleInGroup.map((client) => {
                            const style = STATUS_COLORS[client.status] || {
                              bg: 'bg-slate-800',
                              text: 'text-slate-300',
                              border: 'border-slate-700'
                            };
                            const waNumber = formatWhatsAppNumber(client.phone);
                            const accentColor = STATUS_ACCENT_COLORS[client.status] || '#3b82f6';

                            return (
                              <tr 
                                key={client.id}
                                className="monday-table-row transition-all group cursor-pointer"
                                onClick={() => onSelectClient(client)}
                              >
                                {/* Name & Company */}
                                <td 
                                  style={{ borderRight: `4px solid ${accentColor}` }}
                                  className="py-2 px-2.5 min-w-[170px]"
                                  onClick={(e) => {
                                    if (editingClientId === client.id) {
                                      e.stopPropagation();
                                    }
                                  }}
                                >
                                  {editingClientId === client.id ? (
                                    <div className="flex items-center gap-1.5 min-w-[210px] w-full" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        autoFocus
                                        value={editingClientName}
                                        onChange={(e) => setEditingClientName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveInlineName(client, editingClientName);
                                          } else if (e.key === 'Escape') {
                                            setEditingClientId(null);
                                          }
                                        }}
                                        onBlur={() => handleSaveInlineName(client, editingClientName)}
                                        className="flex-1 text-[11px] font-semibold bg-slate-850 text-white border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                                        placeholder="שם לקוח"
                                      />
                                      <button
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          handleSaveInlineName(client, editingClientName);
                                        }}
                                        className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white shrink-0 shadow-sm transition-transform active:scale-95"
                                        title="שמור שינוי (Enter)"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          setEditingClientId(null);
                                        }}
                                        className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 shrink-0 transition-transform active:scale-95"
                                        title="בטל (Esc)"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between group/name gap-1.5">
                                      <div 
                                        className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors text-[10px] leading-tight truncate flex-1"
                                      >
                                        {client.name || 'ללא שם'}
                                      </div>
                                      {canEdit && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingClientId(client.id);
                                            setEditingClientName(client.name || '');
                                          }}
                                          className="opacity-30 group-hover:opacity-100 hover:opacity-100 p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-all shrink-0"
                                          title="ערוך שם לקוח"
                                        >
                                          <Pencil className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </div>
                                  )}
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
                                <td className="py-2 px-2.5 min-w-[140px]">
                                  {canEdit ? (
                                    renderBusinessTypeCell(client)
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[8.5px] font-medium bg-slate-800 text-slate-300 border border-slate-700 block max-w-xs truncate" title={client.businessType || ''}>
                                      {client.businessType || '-'}
                                    </span>
                                  )}
                                </td>

                                {/* Status */}
                                <td className="py-2 px-2.5 min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                                  {canEdit ? (
                                    <select
                                      value={client.status}
                                      onChange={(e) => onUpdateClientStatus(client.id, e.target.value)}
                                      className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-md border focus:outline-none transition-all cursor-pointer shadow-sm ${style.bg} ${style.text} ${style.border} w-full`}
                                    >
                                      {ALL_STATUSES.map(s => (
                                        <option key={s} value={s} className="bg-slate-900 text-slate-200 truncate">
                                          {s}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-md border inline-block shadow-sm ${style.bg} ${style.text} ${style.border}`}>
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
                                <td className="py-2 px-2.5" onClick={(e) => e.stopPropagation()}>
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

                                {/* Notes & Highlights */}
                                <td className="py-2 px-2.5 max-w-xs">
                                  {(() => {
                                    const hasLastNote = !!client.lastNote?.trim();
                                    const hasGeneralNotes = !!client.generalNotes?.trim();
                                    if (!hasLastNote && !hasGeneralNotes) {
                                      return <span className="text-[8px] text-slate-600">אין הערות</span>;
                                    }

                                    // Check if current search keywords matched specifically inside notes
                                    const searchTerms = combinedSearch ? combinedSearch.split(/\s+/).filter(Boolean) : [];
                                    const notesContent = `${client.lastNote || ''} ${client.generalNotes || ''}`.toLowerCase();
                                    const matchedInNotes = searchTerms.length > 0 && searchTerms.some(term => notesContent.includes(term));

                                    return (
                                      <div 
                                        className="space-y-1" 
                                        title={`${hasLastNote ? `הערה אחרונה:\n${client.lastNote}\n\n` : ''}${hasGeneralNotes ? `הערות כלליות:\n${client.generalNotes}` : ''}`}
                                      >
                                        {matchedInNotes && (
                                          <span className="inline-flex items-center gap-0.5 text-[7.5px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                                            🔍 נמצא בהערות
                                          </span>
                                        )}

                                        {hasLastNote && (
                                          <div>
                                            {client.lastNote!.includes('👤') && (
                                              <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20 mb-0.5">
                                                {client.lastNote!.match(/👤\s*([^|\n]+)/)?.[0] || '👤 הערה חתומה'}
                                              </span>
                                            )}
                                            <p className="text-[8.5px] text-slate-300 line-clamp-2">
                                              {client.lastNote!.replace(/^[0-9/:\s|]+👤[^|]+\|\s*/, '')}
                                            </p>
                                          </div>
                                        )}

                                        {hasGeneralNotes && (!hasLastNote || matchedInNotes) && (
                                          <div className={`${hasLastNote ? 'pt-0.5 border-t border-slate-800/60' : ''}`}>
                                            {hasLastNote && (
                                              <span className="text-[7.5px] font-semibold text-purple-400 block">הערות כלליות:</span>
                                            )}
                                            <p className="text-[8.5px] text-slate-400 line-clamp-2">
                                              {client.generalNotes}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </td>

                                {/* Custom CRM Columns */}
                                {crmCustomColumns.map((col) => (
                                  <td
                                    key={col.id}
                                    className="py-2 px-2.5 min-w-[130px]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {renderCustomCell(client, col)}
                                  </td>
                                ))}

                                {/* Profile Action */}
                                <td className="py-2 px-2.5 text-center">
                                  <button
                                    onClick={() => onSelectClient(client)}
                                    className="px-2 py-1 rounded-md bg-slate-800/80 group-hover:bg-blue-600 group-hover:text-white border border-slate-700/80 group-hover:border-blue-500 text-slate-300 text-[8.5px] font-semibold transition-all shadow-sm"
                                  >
                                    פרופיל
                                  </button>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Per-group expander button if there are more than current limit */}
                          {hasMore && (
                            <tr key={`expand-${status}`}>
                              <td colSpan={6 + crmCustomColumns.length} className="py-3 px-4 bg-slate-900/90 border-b border-slate-800 text-center">
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
                                  <span className="text-slate-400">
                                    מוצגים <strong className="text-white font-semibold">{visibleInGroup.length}</strong> מתוך <strong className="text-white font-semibold">{groupClients.length}</strong> לקוחות בסטטוס {status}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedGroupLimits(prev => ({ ...prev, [status]: (prev[status] || 60) + 100 }))}
                                      className="px-3 py-1 rounded-md bg-blue-600/80 hover:bg-blue-600 text-white font-medium text-xs transition-colors shadow-sm"
                                    >
                                      + הצג 100 נוספים
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedGroupLimits(prev => ({ ...prev, [status]: groupClients.length }))}
                                      className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 transition-colors"
                                    >
                                      הצג את כל ה-{groupClients.length}
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Dark background band below each group */}
                          <tr key={`band-bottom-${status}`}>
                            <td colSpan={6 + crmCustomColumns.length} className="h-3 bg-slate-950/30 border-0 p-0"></td>
                          </tr>
                        </React.Fragment>
                      );
                    })}

                    {/* Overall Summary Row */}
                    <tr>
                      <td colSpan={6 + crmCustomColumns.length} className="py-3 px-4 bg-slate-900/60 border-t border-slate-800/80 text-center text-xs text-slate-400">
                        סה״כ נמצאו <strong className="text-slate-200 font-bold">{filteredClients.length}</strong> לקוחות המסודרים לפי <strong className="text-slate-200 font-bold">{groupedClients.length}</strong> קבוצות סטטוס (כל הנתונים מגובים ומסונכרנים עם גוגל שיטס)
                      </td>
                    </tr>
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

      {/* CRM Column Manager Modal */}
      <CrmColumnManagerModal
        isOpen={isAddColumnModalOpen}
        onClose={() => setIsAddColumnModalOpen(false)}
        columns={crmCustomColumns}
        onAddColumn={handleAddCrmColumn}
        onDeleteColumn={handleDeleteCrmColumn}
      />

    </div>
  );
};
