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
  GripVertical,
  RotateCcw,
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

  // Inline editing for CRM client fields (name, company, phone, email, lastNote)
  const [editingCrmCell, setEditingCrmCell] = useState<{ clientId: string; field: string } | null>(null);
  const [editingCrmValue, setEditingCrmValue] = useState<string>('');

  const handleStartEditCrmCell = (clientId: string, field: string, initialVal: string, e?: React.MouseEvent) => {
    if (!canEdit) return;
    if (e) e.stopPropagation();
    setEditingCrmCell({ clientId, field });
    setEditingCrmValue(initialVal || '');
  };

  const handleSaveCrmCell = (client: Client, field: string) => {
    setEditingCrmCell(null);
    if (!canEdit || !onUpdateClient) return;
    const trimmed = editingCrmValue.trim();
    if (trimmed === (client as any)[field]) return;

    const updated: Client = {
      ...client,
      [field]: trimmed,
      updatedDate: new Date().toISOString().slice(0, 10)
    };
    onUpdateClient(updated);
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

  // CRM Table Column Reordering (Drag and Drop)
  interface CrmColDef {
    key: string;
    label: string;
    minWidth: string;
    isCustom?: boolean;
    customCol?: CrmCustomColumn;
  }

  const BASE_CRM_COLUMNS: CrmColDef[] = [
    { key: 'contact', label: 'איש קשר / חברה', minWidth: 'min-w-[150px]' },
    { key: 'businessType', label: 'סוג עסק', minWidth: 'min-w-[140px]' },
    { key: 'status', label: 'סטטוס CRM', minWidth: 'min-w-[180px]' },
    { key: 'contactDetails', label: 'פרטי התקשרות', minWidth: 'min-w-[160px]' },
    { key: 'lastNote', label: 'הערה אחרונה', minWidth: 'min-w-[200px]' },
  ];

  const CRM_COL_STORAGE_KEY = 'claimai_crm_column_order';
  const CRM_COL_WIDTHS_KEY = 'claimai_crm_column_widths';

  // CRM Column Resizing (Excel-style)
  const [crmColumnWidths, setCrmColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(CRM_COL_WIDTHS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse crm column widths:', e);
    }
    return {};
  });

  const [crmResizingColKey, setCrmResizingColKey] = useState<string | null>(null);

  const getCrmColWidth = (key: string): number => {
    if (crmColumnWidths[key]) return crmColumnWidths[key];
    switch (key) {
      case 'contact': return 190;
      case 'businessType': return 140;
      case 'status': return 180;
      case 'contactDetails': return 160;
      case 'lastNote': return 260;
      case 'actions': return 80;
      default: return 140;
    }
  };

  const handleCrmResizeStart = (colKey: string, initialWidth: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const isRtl = document.dir === 'rtl' || (typeof window !== 'undefined' && getComputedStyle(document.body).direction === 'rtl');
    setCrmResizingColKey(colKey);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // In RTL, dragging left increases width; in LTR, dragging right increases width
      const delta = isRtl ? (startX - moveEvent.clientX) : (moveEvent.clientX - startX);
      const newWidth = Math.max(60, Math.min(800, Math.round(initialWidth + delta)));

      setCrmColumnWidths(prev => ({
        ...prev,
        [colKey]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setCrmResizingColKey(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setCrmColumnWidths(latest => {
        try {
          localStorage.setItem(CRM_COL_WIDTHS_KEY, JSON.stringify(latest));
        } catch {}
        return latest;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const [crmColumnOrder, setCrmColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CRM_COL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse crm column order:', e);
    }
    return ['contact', 'businessType', 'status', 'contactDetails', 'lastNote', 'actions'];
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

    setCrmColumnOrder(prev => {
      const fromIdx = prev.indexOf(draggedColKey);
      const toIdx = prev.indexOf(targetKey);
      if (fromIdx === -1 || toIdx === -1) return prev;

      const next = [...prev];
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, draggedColKey);
      try {
        localStorage.setItem(CRM_COL_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save crm column order:', err);
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
    const defaultOrder = ['contact', 'businessType', 'status', 'contactDetails', 'lastNote', ...crmCustomColumns.map(c => c.id), 'actions'];
    setCrmColumnOrder(defaultOrder);
    try {
      localStorage.removeItem(CRM_COL_STORAGE_KEY);
    } catch {}
  };

  const activeColumns = useMemo<CrmColDef[]>(() => {
    const colMap = new Map<string, CrmColDef>();
    BASE_CRM_COLUMNS.forEach(c => colMap.set(c.key, c));
    crmCustomColumns.forEach(c => {
      colMap.set(c.id, {
        key: c.id,
        label: c.label,
        minWidth: 'min-w-[130px]',
        isCustom: true,
        customCol: c
      });
    });
    colMap.set('actions', { key: 'actions', label: 'פעולות', minWidth: 'w-20 text-center' });

    const ordered: CrmColDef[] = [];
    crmColumnOrder.forEach(key => {
      if (colMap.has(key)) {
        ordered.push(colMap.get(key)!);
        colMap.delete(key);
      }
    });
    colMap.forEach(col => {
      if (col.key === 'actions') {
        ordered.push(col);
      } else {
        const actIdx = ordered.findIndex(c => c.key === 'actions');
        if (actIdx !== -1) {
          ordered.splice(actIdx, 0, col);
        } else {
          ordered.push(col);
        }
      }
    });
    return ordered;
  }, [crmColumnOrder, crmCustomColumns]);

  const totalCrmWidth = useMemo(() => {
    return activeColumns.reduce((sum, col) => sum + getCrmColWidth(col.key), 0);
  }, [activeColumns, crmColumnWidths]);

  const renderColCell = (
    col: CrmColDef,
    client: Client,
    style: { bg: string; text: string; border: string },
    waNumber: string | null,
    accentColor: string
  ) => {
    const colWidth = getCrmColWidth(col.key);
    const cellStyle: React.CSSProperties = {
      width: `${colWidth}px`,
      minWidth: `${colWidth}px`,
      maxWidth: `${colWidth}px`,
    };

    switch (col.key) {
      case 'contact':
        const isEditingName = editingCrmCell?.clientId === client.id && editingCrmCell.field === 'name';
        const isEditingCompany = editingCrmCell?.clientId === client.id && editingCrmCell.field === 'company';

        return (
          <td 
            key={`${client.id}-${col.key}`}
            style={{ ...cellStyle, borderRight: `4px solid ${accentColor}` }}
            className="py-2 px-2.5 overflow-hidden"
            onClick={(e) => {
              if (isEditingName || isEditingCompany) {
                e.stopPropagation();
              }
            }}
          >
            {isEditingName ? (
              <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  autoFocus
                  value={editingCrmValue}
                  onChange={(e) => setEditingCrmValue(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') handleSaveCrmCell(client, 'name');
                    else if (e.key === 'Escape') setEditingCrmCell(null);
                  }}
                  onBlur={() => handleSaveCrmCell(client, 'name')}
                  className="flex-1 text-[11px] font-semibold bg-slate-850 text-white border border-blue-500 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner w-full"
                  placeholder="שם לקוח"
                />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveCrmCell(client, 'name'); }}
                  className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white shrink-0 shadow-sm"
                  title="שמור (Enter)"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingCrmCell(null); }}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 shrink-0"
                  title="בטל (Esc)"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div 
                className="flex items-center justify-between group/name gap-1.5 cursor-pointer hover:bg-blue-950/30 rounded px-1 -mx-1 transition-colors"
                title="לחץ לעריכת שם הלקוח"
                onClick={(e) => handleStartEditCrmCell(client.id, 'name', client.name || '', e)}
              >
                <div className="font-semibold text-slate-100 group-hover/name:text-blue-400 transition-colors text-[10px] leading-tight truncate flex-1">
                  {client.name || 'ללא שם'}
                </div>
                {canEdit && (
                  <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/name:opacity-100 text-slate-400 hover:text-blue-400 transition-opacity shrink-0" />
                )}
              </div>
            )}

            {isEditingCompany ? (
              <div className="flex items-center gap-1.5 w-full mt-1" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  autoFocus
                  value={editingCrmValue}
                  onChange={(e) => setEditingCrmValue(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') handleSaveCrmCell(client, 'company');
                    else if (e.key === 'Escape') setEditingCrmCell(null);
                  }}
                  onBlur={() => handleSaveCrmCell(client, 'company')}
                  className="flex-1 text-[10px] bg-slate-850 text-white border border-blue-500 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner w-full"
                  placeholder="שם חברה / משרד"
                />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveCrmCell(client, 'company'); }}
                  className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white shrink-0 shadow-sm"
                  title="שמור (Enter)"
                >
                  <Check className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingCrmCell(null); }}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 shrink-0"
                  title="בטל (Esc)"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <div 
                className="text-[8px] text-slate-400 flex items-center justify-between gap-1 mt-0.5 cursor-pointer hover:bg-blue-950/30 rounded px-1 -mx-1 group/comp transition-colors"
                title="לחץ לעריכת שם חברה / עסק"
                onClick={(e) => handleStartEditCrmCell(client.id, 'company', client.company || '', e)}
              >
                <div className="flex items-center gap-0.5 truncate flex-1">
                  <Building className="w-2 h-2 text-slate-500 shrink-0" />
                  <span className="truncate">{client.company || 'הוסף חברה'}</span>
                </div>
                {canEdit && (
                  <Pencil className="w-2 h-2 opacity-0 group-hover/comp:opacity-100 text-slate-500 hover:text-blue-400 transition-opacity shrink-0" />
                )}
              </div>
            )}

            {client.requiresAttention && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (canEdit && onUpdateClient) {
                    onUpdateClient({
                      ...client,
                      requiresAttention: false,
                      status: client.status === 'Urgent' ? 'Follow-Up' : client.status
                    });
                  }
                }}
                className="inline-flex items-center gap-1 text-[8px] text-rose-300 font-semibold mt-0.5 px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 cursor-pointer transition-all group/badge"
                title="לחץ להסרה משולחן הדחוף וסימון כטופל"
              >
                <AlertCircle className="w-2 h-2 text-rose-400" />
                <span>דחוף</span>
                <span className="text-[7.5px] text-rose-300 group-hover/badge:text-white underline">✕ הסר</span>
              </button>
            )}
          </td>
        );

      case 'businessType':
        return (
          <td key={`${client.id}-${col.key}`} style={cellStyle} className="py-2 px-2.5 overflow-hidden">
            {canEdit ? (
              renderBusinessTypeCell(client)
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[8.5px] font-medium bg-slate-800 text-slate-300 border border-slate-700 block truncate" title={client.businessType || ''}>
                {client.businessType || '-'}
              </span>
            )}
          </td>
        );

      case 'status':
        return (
          <td key={`${client.id}-${col.key}`} style={cellStyle} className="py-2 px-2.5 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {canEdit ? (
              <select
                value={client.status}
                onChange={(e) => onUpdateClientStatus(client.id, e.target.value)}
                className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-md border focus:outline-none transition-all cursor-pointer shadow-sm ${style.bg} ${style.text} ${style.border} w-full truncate`}
              >
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s} className="bg-slate-900 text-slate-200 truncate">
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-md border inline-block shadow-sm ${style.bg} ${style.text} ${style.border} truncate max-w-full`}>
                {client.status}
              </span>
            )}
            {client.subStatus && (
              <div className="text-[8px] text-slate-400 mt-0.5 truncate">
                {client.subStatus}
              </div>
            )}
          </td>
        );

      case 'contactDetails':
        const isEditingPhone = editingCrmCell?.clientId === client.id && editingCrmCell.field === 'phone';
        const isEditingEmail = editingCrmCell?.clientId === client.id && editingCrmCell.field === 'email';

        if (isEditingPhone) {
          return (
            <td key={`${client.id}-${col.key}`} style={cellStyle} className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  autoFocus
                  value={editingCrmValue}
                  onChange={(e) => setEditingCrmValue(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') handleSaveCrmCell(client, 'phone');
                    else if (e.key === 'Escape') setEditingCrmCell(null);
                  }}
                  onBlur={() => handleSaveCrmCell(client, 'phone')}
                  className="flex-1 text-[9px] font-mono bg-slate-850 text-white border border-blue-500 rounded px-1.5 py-0.5 focus:outline-none shadow-inner w-full"
                  placeholder="מספר טלפון"
                />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveCrmCell(client, 'phone'); }}
                  className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white shrink-0 shadow-sm"
                  title="שמור"
                >
                  <Check className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingCrmCell(null); }}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 shrink-0"
                  title="בטל"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </td>
          );
        }

        if (isEditingEmail) {
          return (
            <td key={`${client.id}-${col.key}`} style={cellStyle} className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <input
                  type="email"
                  autoFocus
                  value={editingCrmValue}
                  onChange={(e) => setEditingCrmValue(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') handleSaveCrmCell(client, 'email');
                    else if (e.key === 'Escape') setEditingCrmCell(null);
                  }}
                  onBlur={() => handleSaveCrmCell(client, 'email')}
                  className="flex-1 text-[9px] bg-slate-850 text-white border border-blue-500 rounded px-1.5 py-0.5 focus:outline-none shadow-inner w-full"
                  placeholder="כתובת אימייל"
                />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveCrmCell(client, 'email'); }}
                  className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white shrink-0 shadow-sm"
                  title="שמור"
                >
                  <Check className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingCrmCell(null); }}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 shrink-0"
                  title="בטל"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </td>
          );
        }

        return (
          <td key={`${client.id}-${col.key}`} style={cellStyle} className="py-2 px-2.5 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1 overflow-hidden">
              {client.phone ? (
                <>
                  <a
                    href={`tel:${client.phone}`}
                    title={`חייג: ${client.phone}`}
                    className="w-5 h-5 rounded-lg bg-slate-800 hover:bg-blue-600/30 border border-slate-700 hover:border-blue-500/50 text-slate-300 hover:text-blue-300 flex items-center justify-center transition-all shrink-0"
                  >
                    <Phone className="w-2.5 h-2.5" />
                  </a>
                  {waNumber && (
                    <a
                      href={`https://wa.me/${waNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`שלח הודעת וואטסאפ ל-${client.phone}`}
                      className="w-5 h-5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 flex items-center justify-center transition-all shrink-0"
                    >
                      <MessageSquare className="w-2.5 h-2.5" />
                    </a>
                  )}
                  <span 
                    className="font-mono text-[8px] text-slate-300 truncate cursor-pointer hover:text-blue-400 hover:underline"
                    title="לחץ לעריכת טלפון"
                    onClick={(e) => handleStartEditCrmCell(client.id, 'phone', client.phone || '', e)}
                  >
                    {client.phone}
                  </span>
                </>
              ) : (
                <span 
                  className="text-slate-600 text-[8px] truncate cursor-pointer hover:text-slate-400"
                  title="לחץ להוספת טלפון"
                  onClick={(e) => handleStartEditCrmCell(client.id, 'phone', '', e)}
                >
                  + טלפון
                </span>
              )}

              {client.email ? (
                <span 
                  className="text-blue-400 hover:underline text-[8px] truncate cursor-pointer mr-0.5 max-w-[120px] block"
                  title={`לחץ לעריכת אימייל (${client.email})`}
                  onClick={(e) => handleStartEditCrmCell(client.id, 'email', client.email || '', e)}
                >
                  {client.email}
                </span>
              ) : (
                <span 
                  className="text-slate-600 text-[8px] truncate cursor-pointer hover:text-slate-400 mr-0.5"
                  title="לחץ להוספת אימייל"
                  onClick={(e) => handleStartEditCrmCell(client.id, 'email', '', e)}
                >
                  + אימייל
                </span>
              )}
            </div>
          </td>
        );

      case 'lastNote':
        const isEditingNote = editingCrmCell?.clientId === client.id && editingCrmCell.field === 'lastNote';

        if (isEditingNote) {
          return (
            <td key={`${client.id}-${col.key}`} style={cellStyle} className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start gap-1 w-full" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <textarea
                  autoFocus
                  rows={2}
                  value={editingCrmValue}
                  onChange={(e) => setEditingCrmValue(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSaveCrmCell(client, 'lastNote');
                    else if (e.key === 'Escape') setEditingCrmCell(null);
                  }}
                  className="flex-1 text-[9px] bg-slate-850 text-white border border-blue-500 rounded px-2 py-1 focus:outline-none shadow-inner w-full resize-none"
                  placeholder="הזן הערה (Ctrl+Enter לשמירה)"
                />
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveCrmCell(client, 'lastNote'); }}
                    className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                    title="שמור הערה"
                  >
                    <Check className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingCrmCell(null); }}
                    className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                    title="בטל (Esc)"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </td>
          );
        }

        return (
          <td 
            key={`${client.id}-${col.key}`} 
            style={cellStyle} 
            className="py-2 px-2.5 overflow-hidden cursor-pointer hover:bg-blue-950/20 transition-colors"
            title="לחץ לעריכת הערה"
            onClick={(e) => handleStartEditCrmCell(client.id, 'lastNote', client.lastNote || '', e)}
          >
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
                  className="space-y-1 overflow-hidden" 
                  title={`${hasLastNote ? `הערה אחרונה:\n${client.lastNote}\n\n` : ''}${hasGeneralNotes ? `הערות כלליות:\n${client.generalNotes}` : ''}`}
                >
                  {matchedInNotes && (
                    <span className="inline-flex items-center gap-0.5 text-[7.5px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30 truncate max-w-full">
                      🔍 נמצא בהערות
                    </span>
                  )}

                  {hasLastNote && (
                    <div className="overflow-hidden">
                      {client.lastNote!.includes('👤') && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20 mb-0.5 truncate max-w-full">
                          {client.lastNote!.match(/👤\s*([^|\n]+)/)?.[0] || '👤 הערה חתומה'}
                        </span>
                      )}
                      <p className="text-[8.5px] text-slate-300 line-clamp-2 break-words">
                        {client.lastNote!.replace(/^[0-9/:\s|]+👤[^|]+\|\s*/, '')}
                      </p>
                    </div>
                  )}

                  {hasGeneralNotes && (!hasLastNote || matchedInNotes) && (
                    <div className={`overflow-hidden ${hasLastNote ? 'pt-0.5 border-t border-slate-800/60' : ''}`}>
                      {hasLastNote && (
                        <span className="text-[7.5px] font-semibold text-purple-400 block truncate">הערות כלליות:</span>
                      )}
                      <p className="text-[8.5px] text-slate-400 line-clamp-2 break-words">
                        {client.generalNotes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </td>
        );

      case 'actions':
        return (
          <td key={`${client.id}-${col.key}`} style={cellStyle} className="py-2 px-2.5 text-center overflow-hidden">
            <button
              onClick={() => onSelectClient(client)}
              className="px-2 py-1 rounded-md bg-slate-800/80 group-hover:bg-blue-600 group-hover:text-white border border-slate-700/80 group-hover:border-blue-500 text-slate-300 text-[8.5px] font-semibold transition-all shadow-sm"
            >
              פרופיל
            </button>
          </td>
        );

      default:
        if (col.isCustom && col.customCol) {
          return (
            <td
              key={`${client.id}-${col.key}`}
              style={cellStyle}
              className="py-2 px-2.5 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {renderCustomCell(client, col.customCol)}
            </td>
          );
        }
        return null;
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
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          e.stopPropagation();
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
              <button
                type="button"
                onClick={handleResetColumnOrder}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
                title="איפוס סדר העמודות לברירת מחדל"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">איפוס סדר עמודות</span>
              </button>
              <span className="text-[11px] text-slate-400 hidden xl:inline-flex items-center gap-1 mr-1">
                <GripVertical className="w-3 h-3 text-slate-500" />
                <span>גרור עמודות לשינוי סדר</span>
              </span>
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
          onSelectClient={onSelectClient}
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
              <table style={{ width: `${totalCrmWidth}px`, minWidth: `${totalCrmWidth}px`, tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }} className="border-separate border-spacing-0 text-right text-[9px]">
                <thead style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="bg-slate-900 sticky top-0 z-20">
                  <tr style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="border-b border-slate-700 bg-slate-900">
                    {activeColumns.map((col) => {
                      const isDragging = draggedColKey === col.key;
                      const isOver = dragOverColKey === col.key;
                      const colWidth = getCrmColWidth(col.key);

                      return (
                        <th
                          key={col.key}
                          draggable
                          onDragStart={(e) => handleDragStart(e, col.key)}
                          onDragOver={(e) => handleDragOver(e, col.key)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, col.key)}
                          onDragEnd={handleDragEnd}
                          style={{ 
                            width: `${colWidth}px`,
                            minWidth: `${colWidth}px`,
                            maxWidth: `${colWidth}px`,
                            backgroundColor: 'var(--bg-th, #0f172a)' 
                          }}
                          className={`sticky top-0 z-20 bg-slate-900 shadow-sm py-1.5 px-2 select-none cursor-grab active:cursor-grabbing transition-all relative ${
                            isOver && dropSide === 'right' ? 'border-r-2 border-r-blue-400' : ''
                          } ${
                            isOver && dropSide === 'left' ? 'border-l-2 border-l-blue-400' : ''
                          } ${isDragging ? 'opacity-40 bg-slate-800' : ''}`}
                          title="גרור לשינוי סדר העמודה (או הרחב/צמצם משמאל)"
                        >
                          <div className="flex items-center justify-between gap-1 group/th overflow-hidden">
                            <div className="flex items-center gap-1 min-w-0">
                              <GripVertical className="w-3 h-3 text-slate-500 opacity-40 group-hover/th:opacity-100 transition-opacity shrink-0 cursor-grab" />
                              <span className="truncate font-bold text-slate-200 group-hover/th:text-white" title={col.label}>
                                {col.label}
                              </span>
                            </div>
                            {col.isCustom && canEdit && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`האם אתה בטוח שברצונך להסיר את העמודה "${col.label}"?`)) {
                                    handleDeleteCrmColumn(col.key);
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                                title="מחק עמודה זו"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Excel-style Drag-to-Resize Handle */}
                          <div
                            onMouseDown={(e) => handleCrmResizeStart(col.key, colWidth, e)}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setCrmColumnWidths(prev => {
                                const next = { ...prev };
                                delete next[col.key];
                                try { localStorage.setItem(CRM_COL_WIDTHS_KEY, JSON.stringify(next)); } catch {}
                                return next;
                              });
                            }}
                            className={`absolute left-0 top-0 bottom-0 w-2.5 -ml-1 cursor-col-resize z-30 transition-all ${
                              crmResizingColKey === col.key
                                ? 'bg-blue-500 shadow-lg scale-x-125'
                                : 'hover:bg-blue-500/60 active:bg-blue-400 bg-transparent'
                            }`}
                            title="גרור כדי להרחיב או לצמצם רוחב (דאבל-קליק לאיפוס)"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {groupedClients.length === 0 ? (
                    <tr>
                      <td colSpan={activeColumns.length} className="py-12 text-center text-slate-500 text-[10px]">
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
                                {activeColumns.map(col => renderColCell(col, client, style, waNumber, accentColor))}
                              </tr>
                            );
                          })}

                          {/* Per-group expander button if there are more than current limit */}
                          {hasMore && (
                            <tr key={`expand-${status}`}>
                              <td colSpan={activeColumns.length} className="py-3 px-4 bg-slate-900/90 border-b border-slate-800 text-center">
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
                            <td colSpan={activeColumns.length} className="h-3 bg-slate-950/30 border-0 p-0"></td>
                          </tr>
                        </React.Fragment>
                      );
                    })}

                    {/* Overall Summary Row */}
                    <tr>
                      <td colSpan={activeColumns.length} className="py-3 px-4 bg-slate-900/60 border-t border-slate-800/80 text-center text-xs text-slate-400">
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
