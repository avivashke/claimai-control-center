import React, { useState, useMemo, useRef } from 'react';
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
  Save
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CustomTable, CustomTableColumn, Client } from '../../types';
import { FieldManagerModal } from './FieldManagerModal';
import { 
  findRowClientMatch, 
  updateClientFromRow, 
  updateRowFromClient, 
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

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(row => {
        return Object.values(row).some(val => 
          String(val || '').toLowerCase().includes(q)
        );
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

  // Save inline cell edit
  const handleSaveInlineCell = (rowId: string, colKey: string) => {
    if (!currentTable) return;
    const updatedRows = currentTable.rows.map(r => {
      if (r.id === rowId) {
        return { ...r, [colKey]: editCellValue };
      }
      return r;
    });

    const updatedTable: CustomTable = {
      ...currentTable,
      rows: updatedRows,
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    onUpdateTable(updatedTable);
    setEditingCell(null);
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
      <div style={{ backgroundColor: '#0f172a' }} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        
        {/* Top Info and Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Table Name & Stats */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <TableIcon className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-black text-white">{currentTable.name}</h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-purple-800/40">
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
            {canEdit && onDeleteTable && tables.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(`האם אתה בטוח שברצונך למחוק את הטבלה "${currentTable.name}"?`)) {
                    onDeleteTable(currentTable.id);
                  }
                }}
                className="p-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 text-rose-300 transition-all"
                title="מחק טבלה זו"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

          </div>
        </div>

        {/* Filter and Search Sub-bar */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800 flex-wrap">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
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
          </div>
        </div>

      </div>

      {/* Main Table Scrolling Area with Frozen Column Headers */}
      <div style={{ backgroundColor: '#0f172a' }} className="rounded-2xl border border-slate-700/70 bg-slate-900 shadow-2xl overflow-hidden relative">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)]">
          <table 
            style={{ 
              minWidth: `${Math.max(1000, 260 + currentTable.columns.length * 160)}px`, 
              borderCollapse: 'separate', 
              borderSpacing: 0 
            }} 
            className="w-full text-right text-xs"
          >
            <thead style={{ backgroundColor: '#0f172a' }} className="bg-slate-900 sticky top-0 z-20">
              <tr style={{ backgroundColor: '#0f172a' }} className="border-b border-slate-700 bg-slate-900">
                {/* Index / ID Header */}
                <th style={{ backgroundColor: '#0f172a' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-2 px-3 w-12 text-slate-400 text-center font-mono border-b border-slate-700">
                  #
                </th>

                {/* Cross-table Match & Sync Column Header */}
                <th style={{ backgroundColor: '#0f172a' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-2 px-3 w-56 min-w-[220px] text-amber-400 font-bold border-l border-slate-800 border-b border-slate-700">
                  <div className="flex items-center gap-1.5">
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>סנכרון וכפילויות CRM</span>
                  </div>
                </th>

                {/* Custom Dynamic Column Headers */}
                {currentTable.columns.map(col => (
                  <th 
                    key={col.key}
                    onClick={() => handleToggleSort(col.key)}
                    style={{ 
                      minWidth: col.type === 'email' || col.label.includes('חברה') ? '180px' : '150px',
                      backgroundColor: '#0f172a'
                    }}
                    className="sticky top-0 z-20 bg-slate-900 shadow-sm py-2 px-3 whitespace-nowrap cursor-pointer hover:bg-slate-800 transition-colors group select-none border-b border-slate-700"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-200 group-hover:text-white">
                        {col.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono text-purple-400 font-normal">
                          ({col.type})
                        </span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                      </div>
                    </div>
                  </th>
                ))}

                {/* Actions Header */}
                <th style={{ backgroundColor: '#0f172a' }} className="sticky top-0 z-20 bg-slate-900 shadow-sm py-2 px-3 w-16 text-center text-slate-400 border-b border-slate-700">
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
                      className={`hover:bg-slate-800/40 transition-colors group ${
                        match ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Index */}
                      <td className="py-2 px-3 font-mono text-[10px] text-slate-500 text-center">
                        {idx + 1}
                      </td>

                      {/* Deduplication & Two-Way Sync Actions */}
                      <td className="py-2 px-3 border-l border-slate-800">
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

                        if (isEditingThis) {
                          return (
                            <td key={col.key} className="py-1 px-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type={col.type === 'number' ? 'number' : 'text'}
                                  value={editCellValue}
                                  onChange={(e) => setEditCellValue(e.target.value)}
                                  autoFocus
                                  className="w-full bg-slate-950 border border-purple-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineCell(row.id, col.key)}
                                  className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCell(null)}
                                  className="p-1 rounded bg-slate-700 text-slate-300"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          );
                        }

                        // Render based on column type
                        const cellStyle = { minWidth: col.type === 'email' || col.label.includes('חברה') ? '180px' : '150px' };

                        if (col.type === 'phone' && val) {
                          const wa = formatWhatsAppNumber(val);
                          return (
                            <td 
                              key={col.key} 
                              style={cellStyle}
                              className="py-2 px-3 whitespace-nowrap font-mono text-slate-300 cursor-pointer"
                              onDoubleClick={() => {
                                setEditingCell({ rowId: row.id, colKey: col.key });
                                setEditCellValue(String(val || ''));
                              }}
                            >
                              <div className="flex items-center gap-1.5">
                                <span>{String(val)}</span>
                                {wa && (
                                  <a
                                    href={`https://wa.me/${wa}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-5 h-5 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 flex items-center justify-center border border-emerald-500/30"
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
                              className="py-2 px-3 whitespace-nowrap cursor-pointer"
                              onDoubleClick={() => {
                                setEditingCell({ rowId: row.id, colKey: col.key });
                                setEditCellValue(String(val || ''));
                              }}
                            >
                              <a href={`mailto:${val}`} className="text-blue-400 hover:underline">
                                {String(val)}
                              </a>
                            </td>
                          );
                        }

                        if (col.type === 'badge' && val) {
                          return (
                            <td 
                              key={col.key} 
                              style={cellStyle}
                              className="py-2 px-3 whitespace-nowrap cursor-pointer"
                              onDoubleClick={() => {
                                setEditingCell({ rowId: row.id, colKey: col.key });
                                setEditCellValue(String(val || ''));
                              }}
                            >
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
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
                              className="py-2 px-3 whitespace-nowrap font-mono font-bold text-slate-200 cursor-pointer"
                              onDoubleClick={() => {
                                setEditingCell({ rowId: row.id, colKey: col.key });
                                setEditCellValue(String(val ?? ''));
                              }}
                            >
                              {val !== undefined && val !== null && val !== '' ? Number(val).toLocaleString() : '-'}
                            </td>
                          );
                        }

                        return (
                          <td 
                            key={col.key} 
                            style={cellStyle}
                            className="py-2 px-3 text-slate-300 whitespace-nowrap max-w-xs truncate cursor-pointer hover:text-white"
                            title={String(val || '')}
                            onDoubleClick={() => {
                              setEditingCell({ rowId: row.id, colKey: col.key });
                              setEditCellValue(String(val ?? ''));
                            }}
                          >
                            {String(val ?? '')}
                          </td>
                        );
                      })}

                      {/* Row Delete Action */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className="text-slate-600 hover:text-rose-400 transition-colors p-1"
                          title="מחק שורה"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
