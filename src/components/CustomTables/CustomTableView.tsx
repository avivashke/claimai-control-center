import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Table as TableIcon, 
  Search, 
  Plus, 
  Download, 
  Trash2, 
  Sparkles, 
  Building, 
  Phone, 
  Mail, 
  MessageSquare, 
  Check, 
  X,
  Layers,
  ArrowUpDown,
  Settings2,
  RefreshCw,
  GitCompare,
  ArrowRightLeft,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Edit2,
  Save,
  GripVertical,
  User
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CustomTable, CustomTableColumn, Client } from '../../types';
import { FieldManagerModal } from './FieldManagerModal';
import { 
  findRowClientMatch, 
  updateClientFromRow, 
  updateRowFromClient,
  createClientFromRow,
  executeSeamlessSync,
  SyncResult 
} from '../../services/crossTableSync';

interface CustomTableViewProps {
  tables?: CustomTable[];
  selectedTableId?: string;
  onSelectTable?: (tableId: string) => void;
  onOpenAiStudio?: () => void;
  onOpenUploadModal?: () => void;
  currentTableOverride?: CustomTable;
  onUpdateTable: (table: CustomTable) => void;
  onDeleteTable?: (tableId: string) => void;
  canEdit?: boolean;
  clients?: Client[];
  onSelectClient?: (client: Client) => void;
  onUpdateClient?: (updatedClient: Client) => void;
  onBatchUpdateClients?: (updatedClients: Client[]) => void;
}

export const CustomTableView: React.FC<CustomTableViewProps> = ({
  tables = [],
  selectedTableId = '',
  onSelectTable,
  onOpenAiStudio,
  onOpenUploadModal,
  currentTableOverride,
  onUpdateTable,
  onDeleteTable,
  canEdit = true,
  clients = [],
  onSelectClient,
  onUpdateClient,
  onBatchUpdateClients
}) => {
  const currentTable = currentTableOverride || tables.find(t => t.id === selectedTableId) || tables[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [sortCol, setSortCol] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterDuplicatesOnly, setFilterDuplicatesOnly] = useState(false);

  // Modals & States
  const [isFieldManagerOpen, setIsFieldManagerOpen] = useState(false);
  const [isAddRowOpen, setIsAddRowOpen] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [syncSummary, setSyncSummary] = useState<SyncResult | null>(null);
  const [activeSyncToast, setActiveSyncToast] = useState<string | null>(null);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const [editCellValue, setEditCellValue] = useState<string>('');
  const isSavingInlineRef = useRef(false);

  // Excel-style Column Width Resizing State
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (!currentTable?.id) return {};
    try {
      const saved = localStorage.getItem(`claimai_table_widths_${currentTable.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!currentTable?.id) return;
    try {
      const saved = localStorage.getItem(`claimai_table_widths_${currentTable.id}`);
      setColumnWidths(saved ? JSON.parse(saved) : {});
    } catch {
      setColumnWidths({});
    }
  }, [currentTable?.id]);

  const [resizingColKey, setResizingColKey] = useState<string | null>(null);

  const getColWidth = (col: { key: string; type?: string; label?: string }): number => {
    if (columnWidths[col.key]) return columnWidths[col.key];
    if (col.key === '__crm_sync__') return 220;
    if (col.type === 'email' || col.label?.includes('חברה') || col.label?.includes('אימייל')) return 190;
    if (col.type === 'date' || col.label?.includes('תאריך')) return 130;
    if (col.type === 'number' || col.label?.includes('תביעות') || col.label?.includes('ימי')) return 120;
    return 160;
  };

  const totalTableWidth = useMemo(() => {
    const syncWidth = getColWidth({ key: '__crm_sync__' });
    const colsWidth = (currentTable?.columns || []).reduce((sum, col) => sum + getColWidth(col), 0);
    return 48 + syncWidth + colsWidth + 100;
  }, [currentTable?.columns, columnWidths]);

  const handleResizeStart = (colKey: string, initialWidth: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const isRtl = document.dir === 'rtl' || (typeof window !== 'undefined' && getComputedStyle(document.body).direction === 'rtl');
    setResizingColKey(colKey);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // In RTL, dragging left increases width; in LTR, dragging right increases width
      const delta = isRtl ? (startX - moveEvent.clientX) : (moveEvent.clientX - startX);
      const newWidth = Math.max(70, Math.min(900, Math.round(initialWidth + delta)));

      setColumnWidths(prev => ({
        ...prev,
        [colKey]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setResizingColKey(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (currentTable?.id) {
        setColumnWidths(latest => {
          try {
            localStorage.setItem(`claimai_table_widths_${currentTable.id}`, JSON.stringify(latest));
          } catch {}
          return latest;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Column Reordering (Drag and Drop)
  const [draggedColKey, setDraggedColKey] = useState<string | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);
  const [dropSide, setDropSide] = useState<'left' | 'right' | null>(null);

  const handleColDragStart = (e: React.DragEvent, key: string) => {
    setDraggedColKey(key);
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    if (draggedColKey === key) return;
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    setDragOverColKey(key);
    setDropSide(e.clientX > midX ? 'right' : 'left');
  };

  const handleColDragLeave = () => {
    setDragOverColKey(null);
    setDropSide(null);
  };

  const handleColDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!currentTable || !draggedColKey || draggedColKey === targetKey) {
      setDraggedColKey(null);
      setDragOverColKey(null);
      setDropSide(null);
      return;
    }

    const fromIdx = currentTable.columns.findIndex(c => c.key === draggedColKey);
    const toIdx = currentTable.columns.findIndex(c => c.key === targetKey);
    if (fromIdx !== -1 && toIdx !== -1) {
      const nextCols = [...currentTable.columns];
      const [removed] = nextCols.splice(fromIdx, 1);
      nextCols.splice(toIdx, 0, removed);

      onUpdateTable({
        ...currentTable,
        columns: nextCols,
        updatedAt: new Date().toISOString().slice(0, 10)
      });
    }

    setDraggedColKey(null);
    setDragOverColKey(null);
    setDropSide(null);
  };

  const handleColDragEnd = () => {
    setDraggedColKey(null);
    setDragOverColKey(null);
    setDropSide(null);
  };

  // Row deduplication matches cache
  const rowMatches = useMemo(() => {
    if (!currentTable || !clients || clients.length === 0) return new Map();
    const map = new Map<string, ReturnType<typeof findRowClientMatch>>();
    currentTable.rows.forEach(row => {
      const match = findRowClientMatch(row, currentTable.columns, clients);
      if (match) {
        map.set(row.id, match);
      }
    });
    return map;
  }, [currentTable, clients]);

  const duplicateCount = rowMatches.size;

  // Filter & Sort Rows
  const filteredAndSortedRows = useMemo(() => {
    if (!currentTable) return [];
    let rows = [...currentTable.rows];

    // Filter duplicates
    if (filterDuplicatesOnly) {
      rows = rows.filter(r => rowMatches.has(r.id));
    }

    // Search query with multi-keyword support
    if (searchQuery.trim()) {
      const keywords = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      rows = rows.filter(row => {
        const corpus = Object.values(row).map(val => String(val || '')).join(' ').toLowerCase();
        return keywords.every(kw => corpus.includes(kw));
      });
    }

    // Sort
    if (sortCol) {
      rows.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return rows;
  }, [currentTable, searchQuery, sortCol, sortDir, filterDuplicatesOnly, rowMatches]);

  const handleToggleSort = (key: string) => {
    if (sortCol === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(key);
      setSortDir('asc');
    }
  };

  // Export to Excel / CSV
  const handleExportXLSX = () => {
    if (!currentTable) return;
    const worksheet = XLSX.utils.json_to_sheet(currentTable.rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, currentTable.name.slice(0, 30));
    XLSX.writeFile(workbook, `${currentTable.name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Add Row
  const handleSaveNewRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTable) return;

    const rowObj: Record<string, any> = {
      id: `row-${Date.now()}`,
      ...newRowData
    };

    const updatedTable: CustomTable = {
      ...currentTable,
      rows: [rowObj, ...currentTable.rows],
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    onUpdateTable(updatedTable);
    setIsAddRowOpen(false);
    setNewRowData({});
  };

  // Delete Row
  const handleDeleteRow = (rowId: string) => {
    if (!currentTable) return;
    const updatedTable: CustomTable = {
      ...currentTable,
      rows: currentTable.rows.filter(r => r.id !== rowId),
      updatedAt: new Date().toISOString().slice(0, 10)
    };
    onUpdateTable(updatedTable);
  };

  // Save inline cell edit with automatic cross-table sync!
  const handleSaveInlineCell = (rowId: string, colKey: string) => {
    if (isSavingInlineRef.current) return;
    isSavingInlineRef.current = true;
    setEditingCell(null);
    setTimeout(() => {
      isSavingInlineRef.current = false;
    }, 150);

    if (!currentTable) return;
    const targetRow = currentTable.rows.find(r => r.id === rowId);
    if (!targetRow) return;

    const trimmed = editCellValue.trim();
    if (String(targetRow[colKey] ?? '').trim() === trimmed) return;

    const newRow = { ...targetRow, [colKey]: trimmed };
    const updatedRows = currentTable.rows.map(r => r.id === rowId ? newRow : r);

    const updatedTable: CustomTable = {
      ...currentTable,
      rows: updatedRows,
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    onUpdateTable(updatedTable);

    // Two-way cross-table sync: If this row overlaps with a client in CRM (or another table), sync it automatically!
    const match = rowMatches.get(rowId) || findRowClientMatch(targetRow, currentTable.columns, clients);
    if (match && match.client && onUpdateClient) {
      const updatedClient = updateClientFromRow(match.client, newRow, currentTable.columns);
      onUpdateClient(updatedClient);
      setActiveSyncToast(`השינוי עודכן וסונכרן אוטומטית מול כרטיס הלקוח "${updatedClient.name || updatedClient.company}"!`);
      setTimeout(() => setActiveSyncToast(null), 3000);
    }
  };

  // Single Row: Update Client in Main Table from this Row
  const handleUpdateClientFromRow = (rowId: string) => {
    const match = rowMatches.get(rowId);
    if (!match || !onUpdateClient) return;

    const updatedClient = updateClientFromRow(match.client, match.row, currentTable.columns);
    onUpdateClient(updatedClient);

    setActiveSyncToast(`הלקוח "${updatedClient.name || updatedClient.company}" עודכן בהצלחה מנתוני הטבלה!`);
    setTimeout(() => setActiveSyncToast(null), 3500);
  };

  // Single Row: Reverse Update: Update Row in this Table from Client
  const handleUpdateRowFromClient = (rowId: string) => {
    const match = rowMatches.get(rowId);
    if (!match || !currentTable) return;

    const updatedRow = updateRowFromClient(match.row, match.client, currentTable.columns);
    const updatedRows = currentTable.rows.map(r => (r.id === rowId ? updatedRow : r));

    const updatedTable: CustomTable = {
      ...currentTable,
      rows: updatedRows,
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    onUpdateTable(updatedTable);
    setActiveSyncToast(`שורת הטבלה עודכנה בהצלחה מנתוני הלקוח "${match.client.name || match.client.company}"!`);
    setTimeout(() => setActiveSyncToast(null), 3500);
  };

  // Open Client Card: if matched to existing CRM client, open that client; otherwise create Client object from row
  const handleOpenClientCard = (row: Record<string, any>) => {
    if (!onSelectClient) return;

    // Check if this row has an overlapping match with an existing client in CRM
    const match = rowMatches.get(row.id) || findRowClientMatch(row, currentTable?.columns || [], clients);
    if (match && match.client) {
      onSelectClient(match.client);
      return;
    }

    // Otherwise create a client object from this row and open card
    const clientFromRow = createClientFromRow(row, currentTable?.columns || [], currentTable?.name);
    onSelectClient(clientFromRow);
  };

  // Bulk Seamless Auto-Sync
  const handleRunSeamlessSync = () => {
    if (!currentTable || !clients || clients.length === 0) return;

    const result = executeSeamlessSync(currentTable, clients);
    onUpdateTable(result.updatedTable);
    if (onBatchUpdateClients && result.updatedClients.length > 0) {
      onBatchUpdateClients(result.updatedClients);
    }

    setSyncSummary(result);
  };

  const formatWhatsAppNumber = (phone?: string) => {
    if (!phone) return null;
    const cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.startsWith('0')) return `972${cleaned.substring(1)}`;
    if (cleaned.startsWith('972')) return cleaned;
    return `972${cleaned}`;
  };

  if (!currentTable) {
    return (
      <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4" dir="rtl">
        <TableIcon className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-white">אין טבלאות מותאמות אישית עדיין</h3>
        <p className="text-xs text-slate-400">העלה קובץ אקסל או השתמש בסטודיו ה-AI כדי לבנות טבלה ראשונה!</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          {onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all"
            >
              העלאת קובץ Excel / CSV
            </button>
          )}
          {onOpenAiStudio && (
            <button
              onClick={onOpenAiStudio}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all"
            >
              פתח סטודיו AI
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      
      {/* Toast Notification */}
      {activeSyncToast && (
        <div className="fixed bottom-6 left-6 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{activeSyncToast}</span>
        </div>
      )}

      {/* Table Control Header Bar */}
      <div style={{ backgroundColor: 'var(--bg-card, #0f172a)' }} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 transition-colors">
        
        {/* Top Info and Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Table Name & Stats */}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                <TableIcon className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-black text-white whitespace-nowrap">{currentTable.name}</h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-purple-800/40 shrink-0">
                {currentTable.rows.length} שורות · {currentTable.columns.length} שדות
              </span>
              {duplicateCount > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>{duplicateCount} כפילויות מזוהות ב-CRM</span>
                </span>
              )}
            </div>
            {currentTable.description && (
              <p className="text-xs text-slate-400 mt-1">{currentTable.description}</p>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Seamless Auto-Sync Button */}
            {clients.length > 0 && (
              <button
                onClick={handleRunSeamlessSync}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all hover:scale-[1.02]"
                title="סנכרון סימלס אוטומטי של כל השדות התואמים בין הטבלה ללקוחות הראשיים"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>סנכרון סימלס אוטומטי</span>
                {duplicateCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-950/60 text-emerald-200 text-[10px] font-mono">
                    {duplicateCount}
                  </span>
                )}
              </button>
            )}

            {/* Field Manager (הגדרת שדות) Button */}
            {canEdit && (
              <button
                onClick={() => setIsFieldManagerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all"
                title="ניהול שדות, הוספת עמודות ושינוי סוגי נתונים"
              >
                <Settings2 className="w-3.5 h-3.5 text-purple-400" />
                <span>הגדרת שדות ({currentTable.columns.length})</span>
              </button>
            )}

            {/* Add Row Button */}
            {canEdit && (
              <button
                onClick={() => setIsAddRowOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>הוסף שורה</span>
              </button>
            )}

            {/* Export Excel */}
            <button
              onClick={handleExportXLSX}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
              title="ייצוא קובץ Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>ייצוא Excel</span>
            </button>

            {/* Delete Table */}
            {canEdit && onDeleteTable && (
              <button
                onClick={() => {
                  if (confirm(`האם אתה בטוח שברצונך למחוק את הטבלה "${currentTable.name}"?`)) {
                    onDeleteTable(currentTable.id);
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 text-rose-300 hover:text-rose-200 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="מחק טבלה זו"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>מחק טבלה</span>
              </button>
            )}

          </div>
        </div>

        {/* Filter and Search Sub-bar */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800 flex-wrap">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div 
              className="relative w-full cursor-text"
              onClick={(e) => {
                const input = (e.currentTarget.querySelector('input') as HTMLInputElement);
                input?.focus();
              }}
            >
              <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="חיפוש בטבלה..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-8 pl-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {duplicateCount > 0 && (
              <button
                onClick={() => setFilterDuplicatesOnly(!filterDuplicatesOnly)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  filterDuplicatesOnly
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>הצג רק כפילויות מזוהות ({duplicateCount})</span>
              </button>
            )}

            <span className="text-xs text-slate-400 font-mono">
              מציג {filteredAndSortedRows.length} מתוך {currentTable.rows.length} שורות
            </span>

            <span className="text-[11px] text-slate-400 hidden xl:inline-flex items-center gap-1 border-r border-slate-700/60 pr-2 mr-1">
              <GripVertical className="w-3 h-3 text-slate-500" />
              <span>גרור עמודות לשינוי סדר</span>
            </span>
          </div>
        </div>

      </div>

      {/* Main Table Scrolling Area with Frozen Column Headers */}
      <div style={{ backgroundColor: 'var(--bg-card, #0f172a)' }} className="rounded-2xl border border-slate-700/70 bg-slate-900 shadow-2xl overflow-hidden relative transition-colors">
        <div className="overflow-x-auto overflow-y-auto h-[calc(100vh-270px)] min-h-[420px] relative scroll-smooth">
          <table 
            style={{ 
              width: `${totalTableWidth}px`,
              minWidth: `${totalTableWidth}px`, 
              borderCollapse: 'separate', 
              borderSpacing: 0,
              tableLayout: 'fixed'
            }} 
            className="w-full text-right text-xs"
          >
            <thead style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="bg-slate-900 sticky top-0 z-20 transition-colors">
              <tr style={{ backgroundColor: 'var(--bg-th, #0f172a)' }} className="border-b border-slate-700 bg-slate-900 transition-colors">
                {/* Index / ID Header */}
                <th style={{ backgroundColor: 'var(--bg-th, #0f172a)', width: '48px', minWidth: '48px', maxWidth: '48px' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-2 px-3 text-slate-400 text-center font-mono border-b border-slate-700 transition-colors">
                  #
                </th>

                {/* Cross-table Match & Sync Column Header */}
                {(() => {
                  const syncColWidth = getColWidth({ key: '__crm_sync__' });
                  return (
                    <th 
                      style={{ 
                        width: `${syncColWidth}px`,
                        minWidth: `${syncColWidth}px`,
                        maxWidth: `${syncColWidth}px`,
                        backgroundColor: 'var(--bg-th, #0f172a)' 
                      }} 
                      className="sticky top-0 z-20 bg-slate-900 shadow-sm py-2 px-3 text-amber-400 font-bold border-l border-slate-800 border-b border-slate-700 transition-colors relative group select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <GitCompare className="w-3.5 h-3.5" />
                        <span className="truncate">סנכרון וכפילויות CRM</span>
                      </div>

                      {/* Excel-style Drag-to-Resize Handle */}
                      <div
                        onMouseDown={(e) => handleResizeStart('__crm_sync__', syncColWidth, e)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setColumnWidths(prev => {
                            const next = { ...prev };
                            delete next['__crm_sync__'];
                            try { localStorage.setItem(`claimai_table_widths_${currentTable.id}`, JSON.stringify(next)); } catch {}
                            return next;
                          });
                        }}
                        className={`absolute left-0 top-0 bottom-0 w-2.5 -ml-1 cursor-col-resize z-30 transition-all ${
                          resizingColKey === '__crm_sync__'
                            ? 'bg-purple-500 shadow-lg scale-x-125'
                            : 'hover:bg-purple-500/60 active:bg-purple-400 bg-transparent'
                        }`}
                        title="גרור כדי להרחיב או לצמצם רוחב (דאבל-קליק לאיפוס)"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                  );
                })()}

                {/* Custom Dynamic Column Headers */}
                {currentTable.columns.map(col => {
                  const isDragging = draggedColKey === col.key;
                  const isOver = dragOverColKey === col.key;
                  const colWidth = getColWidth(col);

                  return (
                    <th 
                      key={col.key}
                      draggable
                      onDragStart={(e) => handleColDragStart(e, col.key)}
                      onDragOver={(e) => handleColDragOver(e, col.key)}
                      onDragLeave={handleColDragLeave}
                      onDrop={(e) => handleColDrop(e, col.key)}
                      onDragEnd={handleColDragEnd}
                      onClick={() => handleToggleSort(col.key)}
                      style={{ 
                        width: `${colWidth}px`,
                        minWidth: `${colWidth}px`,
                        maxWidth: `${colWidth}px`,
                        backgroundColor: 'var(--bg-th, #0f172a)'
                      }}
                      className={`sticky top-0 z-20 bg-slate-900 shadow-sm py-2 px-3 whitespace-nowrap select-none cursor-grab active:cursor-grabbing hover:bg-slate-800 transition-all group border-b border-slate-700 relative ${
                        isOver && dropSide === 'right' ? 'border-r-2 border-r-purple-400' : ''
                      } ${
                        isOver && dropSide === 'left' ? 'border-l-2 border-l-purple-400' : ''
                      } ${isDragging ? 'opacity-40 bg-slate-800' : ''}`}
                      title="גרור לשינוי סדר העמודה (לחץ למיון)"
                    >
                      <div className="flex items-center justify-between gap-1.5 overflow-hidden">
                        <div className="flex items-center gap-1 min-w-0">
                          <GripVertical className="w-3 h-3 text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity shrink-0 cursor-grab" />
                          <span className="font-bold text-slate-200 group-hover:text-white truncate" title={col.label}>
                            {col.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] font-mono text-purple-400 font-normal">
                            ({col.type})
                          </span>
                          <ArrowUpDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                        </div>
                      </div>

                      {/* Excel-style Drag-to-Resize Handle */}
                      <div
                        onMouseDown={(e) => handleResizeStart(col.key, colWidth, e)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setColumnWidths(prev => {
                            const next = { ...prev };
                            delete next[col.key];
                            try { localStorage.setItem(`claimai_table_widths_${currentTable.id}`, JSON.stringify(next)); } catch {}
                            return next;
                          });
                        }}
                        className={`absolute left-0 top-0 bottom-0 w-2.5 -ml-1 cursor-col-resize z-30 transition-all ${
                          resizingColKey === col.key
                            ? 'bg-purple-500 shadow-lg scale-x-125'
                            : 'hover:bg-purple-500/60 active:bg-purple-400 bg-transparent'
                        }`}
                        title="גרור כדי להרחיב או לצמצם רוחב (דאבל-קליק לאיפוס)"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                  );
                })}

                {/* Actions Header */}
                <th style={{ backgroundColor: 'var(--bg-th, #0f172a)', width: '100px', minWidth: '100px', maxWidth: '100px' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-2 px-3 text-center text-slate-400 border-b border-slate-700 transition-colors">
                  פעולות
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredAndSortedRows.length === 0 ? (
                <tr>
                  <td colSpan={currentTable.columns.length + 3} className="py-12 text-center text-slate-500 text-xs">
                    לא נמצאו שורות העונות לסינון המבוקש
                  </td>
                </tr>
              ) : (
                filteredAndSortedRows.map((row, idx) => {
                  const match = rowMatches.get(row.id);

                  return (
                    <tr 
                      key={row.id || idx}
                      onClick={() => handleOpenClientCard(row)}
                      className={`monday-table-row transition-all group cursor-pointer hover:bg-slate-800/60 ${
                        match ? 'bg-amber-950/20' : ''
                      }`}
                      title={match ? `לחץ לפתיחת כרטיס הלקוח "${match.client.name || match.client.company}"` : "לחץ לפתיחת כרטיס לקוח"}
                    >
                      {/* Index */}
                      <td className="py-2 px-3 font-mono text-[10px] text-slate-500 text-center">
                        {idx + 1}
                      </td>

                      {/* Deduplication & Two-Way Sync Actions */}
                      <td 
                        style={{
                          width: `${getColWidth({ key: '__crm_sync__' })}px`,
                          minWidth: `${getColWidth({ key: '__crm_sync__' })}px`,
                          maxWidth: `${getColWidth({ key: '__crm_sync__' })}px`,
                        }}
                        className="py-2 px-3 border-l border-slate-800 overflow-hidden"
                      >
                        {match ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                                <GitCompare className="w-3 h-3" />
                                <span>קיים ב-CRM</span>
                              </span>
                              <span className="text-[10px] font-semibold text-slate-300 truncate max-w-[120px]" title={match.client.name || match.client.company}>
                                {match.client.name || match.client.company}
                              </span>
                            </div>

                            {/* Two-Way Update Buttons */}
                            <div className="flex items-center gap-1">
                              {/* 1. Update Client from this Table Row */}
                              <button
                                type="button"
                                onClick={() => handleUpdateClientFromRow(row.id)}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-[9px] font-bold transition-all"
                                title="עדכן את הלקוח הראשי ב-CRM מתוך שורה זו"
                              >
                                <ArrowLeft className="w-2.5 h-2.5" />
                                <span>עדכן לקוח ראשי</span>
                              </button>

                              {/* 2. Reverse: Update this Row from Client */}
                              <button
                                type="button"
                                onClick={() => handleUpdateRowFromClient(row.id)}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-[9px] font-bold transition-all"
                                title="עדכן שורה זו מנתוני הלקוח הראשי ב-CRM"
                              >
                                <ArrowRight className="w-2.5 h-2.5" />
                                <span>עדכן שורה מה-CRM</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            — ללא כפילות
                          </span>
                        )}
                      </td>

                      {/* Dynamic Columns Data Cells */}
                      {currentTable.columns.map(col => {
                        const val = row[col.key];
                        const isEditingThis = editingCell?.rowId === row.id && editingCell?.colKey === col.key;
                        const colWidth = getColWidth(col);
                        const cellStyle = { 
                          width: `${colWidth}px`, 
                          minWidth: `${colWidth}px`, 
                          maxWidth: `${colWidth}px` 
                        };

                        if (isEditingThis) {
                          return (
                            <td key={col.key} style={cellStyle} className="py-1 px-2" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                <input
                                  type={col.type === 'number' ? 'number' : 'text'}
                                  value={editCellValue}
                                  onChange={(e) => setEditCellValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveInlineCell(row.id, col.key);
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault();
                                      setEditingCell(null);
                                    }
                                  }}
                                  onBlur={() => handleSaveInlineCell(row.id, col.key)}
                                  autoFocus
                                  className="w-full bg-slate-950 border border-purple-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none shadow-inner"
                                />
                                <button
                                  type="button"
                                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveInlineCell(row.id, col.key); }}
                                  className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shrink-0 shadow-sm"
                                  title="שמור שינוי (Enter)"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingCell(null); }}
                                  className="p-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors shrink-0"
                                  title="בטל (Esc)"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          );
                        }

                        if (col.type === 'phone' && val) {
                          const wa = formatWhatsAppNumber(val);
                          return (
                            <td 
                              key={col.key} 
                              style={cellStyle}
                              className="py-2 px-3 whitespace-nowrap font-mono text-slate-300 cursor-pointer overflow-hidden hover:bg-purple-900/20 transition-colors"
                              title="לחץ לעריכת טלפון (או לחץ על אייקון וואטסאפ לפתיחת שיחה)"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCell({ rowId: row.id, colKey: col.key });
                                setEditCellValue(String(val || ''));
                              }}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="truncate">{String(val)}</span>
                                {wa && (
                                  <a
                                    href={`https://wa.me/${wa}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-5 h-5 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 flex items-center justify-center border border-emerald-500/30 shrink-0"
                                    title="פתח שיחת וואטסאפ"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </td>
                          );
                        }

                        if (col.type === 'email' && val) {
                          return (
                            <td 
                              key={col.key} 
                              style={cellStyle}
                              className="py-2 px-3 whitespace-nowrap cursor-pointer overflow-hidden hover:bg-purple-900/20 transition-colors"
                              title="לחץ לעריכת אימייל"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCell({ rowId: row.id, colKey: col.key });
                                setEditCellValue(String(val || ''));
                              }}
                            >
                              <span className="text-blue-400 hover:underline truncate block">
                                {String(val)}
                              </span>
                            </td>
                          );
                        }

                        if (col.type === 'badge' && val) {
                          return (
                            <td 
                              key={col.key} 
                              style={cellStyle}
                              className="py-2 px-3 whitespace-nowrap cursor-pointer overflow-hidden hover:bg-purple-900/20 transition-colors"
                              title="לחץ לעריכת ערך"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCell({ rowId: row.id, colKey: col.key });
                                setEditCellValue(String(val || ''));
                              }}
                            >
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 truncate inline-block max-w-full">
                                {String(val)}
                              </span>
                            </td>
                          );
                        }

                        if (col.type === 'number') {
                          return (
                            <td 
                              key={col.key} 
                              style={cellStyle}
                              className="py-2 px-3 whitespace-nowrap font-mono font-bold text-slate-200 cursor-pointer overflow-hidden hover:bg-purple-900/20 transition-colors"
                              title="לחץ לעריכת מספר"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCell({ rowId: row.id, colKey: col.key });
                                setEditCellValue(String(val ?? ''));
                              }}
                            >
                              <span className="truncate block">
                                {val !== undefined && val !== null && val !== '' ? Number(val).toLocaleString() : '-'}
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td 
                            key={col.key} 
                            style={cellStyle}
                            className="py-2 px-3 text-slate-300 whitespace-nowrap truncate cursor-pointer hover:text-white hover:bg-purple-900/20 transition-colors overflow-hidden"
                            title={String(val || 'לחץ לעריכה')}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCell({ rowId: row.id, colKey: col.key });
                              setEditCellValue(String(val ?? ''));
                            }}
                          >
                            <span className="truncate block">{String(val ?? '')}</span>
                          </td>
                        );
                      })}

                      {/* Row Actions: Open Card + Delete */}
                      <td 
                        style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }} 
                        className="py-2 px-2 text-center" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenClientCard(row)}
                            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700 hover:border-blue-500 text-[10px] font-semibold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                            title={match ? `פתח כרטיס לקוח קיים (${match.client.name || match.client.company})` : "פתח כרטיס לקוח"}
                          >
                            <User className="w-3 h-3 text-blue-400 group-hover:text-white" />
                            <span>כרטיס</span>
                          </button>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                              title="מחק שורה"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Field Manager Modal (הגדרת שדות ועמודות) */}
      <FieldManagerModal
        isOpen={isFieldManagerOpen}
        onClose={() => setIsFieldManagerOpen(false)}
        table={currentTable}
        onUpdateTable={onUpdateTable}
        onDeleteTable={onDeleteTable}
      />

      {/* Add Row Modal */}
      {isAddRowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <h3 className="text-sm font-bold text-white">הוספת שורה ל-{currentTable.name}</h3>
              <button
                onClick={() => setIsAddRowOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRow} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {currentTable.columns.map((col) => (
                <div key={col.key}>
                  <label className="block text-xs text-slate-400 mb-1">{col.label}</label>
                  <input
                    type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                    value={newRowData[col.key] || ''}
                    onChange={(e) => setNewRowData({ ...newRowData, [col.key]: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              ))}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRowOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
                >
                  שמור שורה
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seamless Sync Summary Modal */}
      {syncSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">הסנכרון הסימלס הושלם בהצלחה!</h3>
                <p className="text-xs text-slate-300">
                  סונכרנו {syncSummary.syncedMatchesCount} רשומות כפולות ועודכנו {syncSummary.updatedFieldsCount} שדות תואמים
                </p>
              </div>
            </div>

            {syncSummary.details.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                {syncSummary.details.map((d, i) => (
                  <div key={i} className="text-[11px] p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-white">{d.name} ({d.clientId})</span>
                    <span className="text-emerald-400 font-mono">עודכנו: {d.updatedFields.join(', ')}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSyncSummary(null)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
              >
                סגור אישור
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
