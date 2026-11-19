import React, { useState, useMemo } from 'react';
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
  ArrowUpDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CustomTable, CustomTableColumn } from '../../types';

interface CustomTableViewProps {
  tables: CustomTable[];
  selectedTableId: string;
  onSelectTable: (tableId: string) => void;
  onOpenAiStudio: () => void;
  onUpdateTable: (table: CustomTable) => void;
  onDeleteTable: (tableId: string) => void;
}

export const CustomTableView: React.FC<CustomTableViewProps> = ({
  tables,
  selectedTableId,
  onSelectTable,
  onOpenAiStudio,
  onUpdateTable,
  onDeleteTable
}) => {
  const currentTable = tables.find(t => t.id === selectedTableId) || tables[0];
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddRowOpen, setIsAddRowOpen] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});

  // Filter rows
  const filteredRows = useMemo(() => {
    if (!currentTable) return [];
    if (!searchQuery.trim()) return currentTable.rows;
    const q = searchQuery.toLowerCase();
    return currentTable.rows.filter(row => {
      return Object.values(row).some(val => 
        String(val || '').toLowerCase().includes(q)
      );
    });
  }, [currentTable, searchQuery]);

  // Export Table to XLSX
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

  const formatWhatsAppNumber = (phone?: string) => {
    if (!phone) return null;
    const cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.startsWith('0')) return `972${cleaned.substring(1)}`;
    if (cleaned.startsWith('972')) return cleaned;
    return `972${cleaned}`;
  };

  if (!currentTable) {
    return (
      <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
        <TableIcon className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-white">אין טבלאות מותאמות אישית עדיין</h3>
        <p className="text-xs text-slate-400">העלה קובץ או זרוק נתונים לסטודיו ה-AI כדי לבנות את הטבלה הראשונה שלך!</p>
        <button
          onClick={onOpenAiStudio}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
        >
          פתח את סטודיו ה-AI
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Table Switcher & Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        
        {/* Table Selector Tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {tables.map(tbl => (
              <button
                key={tbl.id}
                onClick={() => onSelectTable(tbl.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  tbl.id === currentTable.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{tbl.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-950/40">
                  {tbl.rows.length}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={onOpenAiStudio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>+ צור טבלה חדשה ב-AI</span>
          </button>
        </div>

        {/* Current Table Info & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>{currentTable.name}</span>
              <span className="text-xs font-mono font-semibold text-slate-400">
                ({currentTable.rows.length} שורות · {currentTable.columns.length} עמודות)
              </span>
            </h1>
            {currentTable.description && (
              <p className="text-xs text-slate-400 mt-0.5">{currentTable.description}</p>
            )}
          </div>

          {/* Search & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[180px]">
              <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="חיפוש בטבלה..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-8 pl-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <button
              onClick={() => setIsAddRowOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>הוסף שורה</span>
            </button>

            <button
              onClick={handleExportXLSX}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
              title="ייצוא ל-Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>ייצוא Excel</span>
            </button>

            {tables.length > 1 && (
              <button
                onClick={() => {
                  if (confirm(`האם אתה בטוח שברצונך למחוק את הטבלה "${currentTable.name}"?`)) {
                    onDeleteTable(currentTable.id);
                  }
                }}
                className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 text-rose-300 transition-all"
                title="מחק טבלה זו"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Main Table Grid */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[650px]">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/90 text-slate-300 font-bold border-b border-slate-700 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="py-3 px-3 w-12 text-slate-500">#</th>
                {currentTable.columns.map((col) => (
                  <th key={col.key} className="py-3 px-3 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <span>{col.label}</span>
                      <span className="text-[9px] font-mono text-purple-400 font-normal">
                        ({col.type})
                      </span>
                    </span>
                  </th>
                ))}
                <th className="py-3 px-3 w-12 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={currentTable.columns.length + 2} className="py-12 text-center text-slate-500 text-xs">
                    לא נמצאו שורות העונות לסינון
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {idx + 1}
                    </td>

                    {currentTable.columns.map((col) => {
                      const val = row[col.key];

                      if (col.type === 'phone' && val) {
                        const wa = formatWhatsAppNumber(val);
                        return (
                          <td key={col.key} className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <span>{String(val)}</span>
                              {wa && (
                                <a
                                  href={`https://wa.me/${wa}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-5 h-5 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 flex items-center justify-center border border-emerald-500/30"
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
                          <td key={col.key} className="py-2.5 px-3 whitespace-nowrap">
                            <a href={`mailto:${val}`} className="text-blue-400 hover:underline">
                              {String(val)}
                            </a>
                          </td>
                        );
                      }

                      if (col.type === 'badge' && val) {
                        return (
                          <td key={col.key} className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              {String(val)}
                            </span>
                          </td>
                        );
                      }

                      if (col.type === 'number') {
                        return (
                          <td key={col.key} className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-slate-200">
                            {val !== undefined && val !== null ? Number(val).toLocaleString() : '-'}
                          </td>
                        );
                      }

                      return (
                        <td key={col.key} className="py-2.5 px-3 text-slate-300 whitespace-nowrap max-w-xs truncate" title={String(val || '')}>
                          {String(val ?? '')}
                        </td>
                      );
                    })}

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="text-slate-600 hover:text-rose-400 transition-colors"
                        title="מחק שורה"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Row Modal */}
      {isAddRowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
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

    </div>
  );
};
