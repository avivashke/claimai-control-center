import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Settings2, 
  Check, 
  Edit2, 
  Type, 
  Hash, 
  Calendar, 
  Mail, 
  Phone, 
  Tag, 
  CheckSquare 
} from 'lucide-react';
import { CustomTable, CustomTableColumn, ColumnType } from '../../types';

interface FieldManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: CustomTable;
  onUpdateTable: (updatedTable: CustomTable) => void;
}

const COLUMN_TYPES: { type: ColumnType; label: string; icon: React.ReactNode }[] = [
  { type: 'string', label: 'טקסט חופשי', icon: <Type className="w-4 h-4 text-blue-400" /> },
  { type: 'number', label: 'מספר / כמות', icon: <Hash className="w-4 h-4 text-emerald-400" /> },
  { type: 'date', label: 'תאריך', icon: <Calendar className="w-4 h-4 text-amber-400" /> },
  { type: 'email', label: 'אימייל', icon: <Mail className="w-4 h-4 text-cyan-400" /> },
  { type: 'phone', label: 'טלפון / וואטסאפ', icon: <Phone className="w-4 h-4 text-emerald-500" /> },
  { type: 'badge', label: 'תגית / סטטוס', icon: <Tag className="w-4 h-4 text-purple-400" /> },
  { type: 'boolean', label: 'כן / לא (בוליאני)', icon: <CheckSquare className="w-4 h-4 text-rose-400" /> },
];

export const FieldManagerModal: React.FC<FieldManagerModalProps> = ({
  isOpen,
  onClose,
  table,
  onUpdateTable
}) => {
  const [columns, setColumns] = useState<CustomTableColumn[]>(table.columns);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<ColumnType>('string');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editType, setEditType] = useState<ColumnType>('string');

  if (!isOpen) return null;

  const generateSafeKey = (label: string): string => {
    // Transliterate Hebrew to phonetics or generate safe key
    const base = label
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    const randomSuffix = Math.floor(Math.random() * 1000);
    return base ? `${base}_${randomSuffix}` : `field_${Date.now()}`;
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const key = generateSafeKey(newLabel);
    const newCol: CustomTableColumn = {
      key,
      label: newLabel.trim(),
      type: newType
    };

    const updatedCols = [...columns, newCol];
    setColumns(updatedCols);
    setNewLabel('');
    setNewType('string');

    // Update table in parent
    const updatedTable: CustomTable = {
      ...table,
      columns: updatedCols,
      rows: table.rows.map(r => ({
        ...r,
        [key]: newType === 'number' ? 0 : ''
      })),
      updatedAt: new Date().toISOString().slice(0, 10)
    };
    onUpdateTable(updatedTable);
  };

  const handleDeleteColumn = (colKey: string) => {
    if (columns.length <= 1) {
      alert('הטבלה חייבת לכלול לפחות עמודה אחת');
      return;
    }
    const target = columns.find(c => c.key === colKey);
    if (!confirm(`האם אתה בטוח שברצונך למחוק את השדה "${target?.label || colKey}"?`)) {
      return;
    }

    const updatedCols = columns.filter(c => c.key !== colKey);
    setColumns(updatedCols);

    const updatedTable: CustomTable = {
      ...table,
      columns: updatedCols,
      rows: table.rows.map(r => {
        const copy = { ...r };
        delete copy[colKey];
        return copy;
      }),
      updatedAt: new Date().toISOString().slice(0, 10)
    };
    onUpdateTable(updatedTable);
  };

  const handleStartEdit = (col: CustomTableColumn) => {
    setEditingKey(col.key);
    setEditLabel(col.label);
    setEditType(col.type);
  };

  const handleSaveEdit = (colKey: string) => {
    if (!editLabel.trim()) return;

    const updatedCols = columns.map(c => {
      if (c.key === colKey) {
        return { ...c, label: editLabel.trim(), type: editType };
      }
      return c;
    });

    setColumns(updatedCols);
    setEditingKey(null);

    const updatedTable: CustomTable = {
      ...table,
      columns: updatedCols,
      updatedAt: new Date().toISOString().slice(0, 10)
    };
    onUpdateTable(updatedTable);
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;

    const copy = [...columns];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setColumns(copy);

    const updatedTable: CustomTable = {
      ...table,
      columns: copy,
      updatedAt: new Date().toISOString().slice(0, 10)
    };
    onUpdateTable(updatedTable);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in-50 duration-150" dir="rtl">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">הגדרת שדות ועמודות</h2>
              <p className="text-xs text-slate-400">ניהול, עריכה והוספת שדות עבור: {table.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* Add New Field Box */}
          <form onSubmit={handleAddColumn} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              <span>הוספת שדה חדש לטבלה</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-7">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">שם השדה (כותרת העמודה בעברית)</label>
                <input
                  type="text"
                  placeholder="למשל: סוכן מטפל, מספר עובדים, תאריך חידוש..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">סוג נתונים</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ColumnType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  {COLUMN_TYPES.map(ct => (
                    <option key={ct.type} value={ct.type}>
                      {ct.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!newLabel.trim()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>הוסף שדה לטבלה</span>
              </button>
            </div>
          </form>

          {/* Existing Columns List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300">
              שדות קיימים בטבלה ({columns.length})
            </h3>

            <div className="space-y-1.5">
              {columns.map((col, idx) => {
                const isEditing = editingKey === col.key;
                const typeInfo = COLUMN_TYPES.find(t => t.type === col.type) || COLUMN_TYPES[0];

                return (
                  <div
                    key={col.key}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="flex-1 min-w-[150px] bg-slate-900 border border-purple-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                        />
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as ColumnType)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                        >
                          {COLUMN_TYPES.map(ct => (
                            <option key={ct.type} value={ct.type}>{ct.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(col.key)}
                          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                          title="שמור"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingKey(null)}
                          className="p-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs"
                          title="ביטול"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className="font-mono text-[10px] text-slate-500 w-5">{idx + 1}.</span>
                          <span className="p-1 rounded bg-slate-800 border border-slate-700/60">
                            {typeInfo.icon}
                          </span>
                          <div className="truncate">
                            <span className="text-xs font-bold text-white ml-2">{col.label}</span>
                            <span className="text-[10px] font-mono text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/40">
                              {typeInfo.label}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 mr-2">
                              ({col.key})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveColumn(idx, 'up')}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-30"
                            title="הזז למעלה"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === columns.length - 1}
                            onClick={() => handleMoveColumn(idx, 'down')}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-30"
                            title="הזז למטה"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(col)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="ערוך שדה"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteColumn(col.key)}
                            className="p-1 rounded hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
                            title="מחק שדה"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            סה"כ {columns.length} שדות מוגדרים
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md"
          >
            סיום וסגירה
          </button>
        </div>

      </div>
    </div>
  );
};
