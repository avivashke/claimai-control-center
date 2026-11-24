import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Columns, 
  ListFilter, 
  Zap, 
  CheckSquare, 
  Type, 
  Calendar, 
  Tag, 
  PhoneCall, 
  MessageCircle, 
  Copy, 
  Mail, 
  ExternalLink 
} from 'lucide-react';
import { CrmCustomColumn, CrmColumnType, CrmColumnOption } from '../../types';

interface CrmColumnManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: CrmCustomColumn[];
  onAddColumn: (column: CrmCustomColumn) => void;
  onDeleteColumn: (columnId: string) => void;
}

const PRESET_COLORS = [
  { id: 'blue', label: 'כחול', bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40' },
  { id: 'emerald', label: 'ירוק', bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  { id: 'amber', label: 'כתום', bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' },
  { id: 'rose', label: 'אדום', bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40' },
  { id: 'purple', label: 'סגול', bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  { id: 'slate', label: 'אפור', bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/40' },
];

export const CrmColumnManagerModal: React.FC<CrmColumnManagerModalProps> = ({
  isOpen,
  onClose,
  columns,
  onAddColumn,
  onDeleteColumn
}) => {
  const [label, setLabel] = useState('');
  const [colType, setColType] = useState<CrmColumnType>('dropdown');
  const [actionType, setActionType] = useState<'whatsapp' | 'call' | 'copy' | 'email' | 'link'>('whatsapp');
  const [actionLabel, setActionLabel] = useState('שליחת וואטסאפ');
  
  // For dropdown options
  const [options, setOptions] = useState<CrmColumnOption[]>([
    { label: 'ממתין לטיפול', color: 'amber' },
    { label: 'בבדיקה', color: 'blue' },
    { label: 'אושר ובוצע', color: 'emerald' },
    { label: 'סורב', color: 'rose' }
  ]);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionColor, setNewOptionColor] = useState('blue');

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;
    setOptions([...options, { label: newOptionLabel.trim(), color: newOptionColor }]);
    setNewOptionLabel('');
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const key = `crm_col_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newCol: CrmCustomColumn = {
      id: key,
      key,
      label: label.trim(),
      type: colType,
      options: colType === 'dropdown' ? options : undefined,
      actionType: colType === 'action' ? actionType : undefined,
      actionLabel: colType === 'action' ? (actionLabel.trim() || 'בצע') : undefined
    };

    onAddColumn(newCol);
    setLabel('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">הוספת עמודה מותאמת אישית לטבלה הראשית</h3>
              <p className="text-[11px] text-slate-400">הגדרת עמודות חדשות עם דרופדאונים, כפתורי פעולה חכמים, צ'קבוקס או טקסט</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Column Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                שם העמודה <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="לדוגמה: סטטוס בדיקת חיתום / פעולת וואטסאפ / אושר מנהל"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Column Type Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                סוג העמודה והפעולה בתא
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                
                {/* Dropdown */}
                <button
                  type="button"
                  onClick={() => setColType('dropdown')}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    colType === 'dropdown'
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ListFilter className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold">רשימת בחירה (דרופדאון)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">בחירת סטטוס או ערך מתפריט עם תגיות צבע</p>
                </button>

                {/* Smart Action Button */}
                <button
                  type="button"
                  onClick={() => setColType('action')}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    colType === 'action'
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold">פעולה חכמה ישירה</span>
                  </div>
                  <p className="text-[10px] text-slate-400">וואטסאפ מהיר, חיוג, העתקת פרטים, מייל</p>
                </button>

                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => setColType('checkbox')}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    colType === 'checkbox'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">תיבת סימון (צ'קבוקס)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">כן / לא בלחיצה ישירה מהתא (אושר, נבדק)</p>
                </button>

                {/* Free Text */}
                <button
                  type="button"
                  onClick={() => setColType('text')}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    colType === 'text'
                      ? 'bg-amber-600/20 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Type className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold">טקסט חופשי</span>
                  </div>
                  <p className="text-[10px] text-slate-400">הזנת הערה או ערך טקסט ישירות בתא</p>
                </button>

                {/* Date */}
                <button
                  type="button"
                  onClick={() => setColType('date')}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    colType === 'date'
                      ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-sm ring-1 ring-cyan-500/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold">תאריך</span>
                  </div>
                  <p className="text-[10px] text-slate-400">בחירת מועד מעקב או תאריך רלוונטי</p>
                </button>

                {/* Badge */}
                <button
                  type="button"
                  onClick={() => setColType('badge')}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    colType === 'badge'
                      ? 'bg-pink-600/20 border-pink-500 text-white shadow-sm ring-1 ring-pink-500/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-bold">תגית מעוצבת</span>
                  </div>
                  <p className="text-[10px] text-slate-400">תגית מודגשת עם מראה ייחודי</p>
                </button>

              </div>
            </div>

            {/* Custom Configuration for Dropdown */}
            {colType === 'dropdown' && (
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">ערכים לרשימת הבחירה (אפשרויות)</span>
                  <span className="text-[10px] text-slate-400 font-mono">{options.length} אפשרויות</span>
                </div>

                {/* Options List */}
                <div className="flex flex-wrap gap-2">
                  {options.map((opt, idx) => {
                    const colorDef = PRESET_COLORS.find(c => c.id === opt.color) || PRESET_COLORS[0];
                    return (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${colorDef.bg} ${colorDef.text} ${colorDef.border}`}
                      >
                        <span>{opt.label}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>

                {/* Add Option Sub-bar */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60">
                  <input
                    type="text"
                    value={newOptionLabel}
                    onChange={(e) => setNewOptionLabel(e.target.value)}
                    placeholder="שם אפשרות חדשה..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  
                  {/* Color Selector */}
                  <div className="flex items-center gap-1">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setNewOptionColor(c.id)}
                        className={`w-5 h-5 rounded-md border transition-all cursor-pointer ${c.bg} ${c.border} ${
                          newOptionColor === c.id ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>הוסף</span>
                  </button>
                </div>
              </div>
            )}

            {/* Custom Configuration for Action */}
            {colType === 'action' && (
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-200 block">בחר את סוג הפעולה שיבצע הכפתור בתא</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionType('whatsapp');
                      setActionLabel('וואטסאפ');
                    }}
                    className={`p-2 rounded-xl border flex items-center gap-2 text-right transition-all cursor-pointer ${
                      actionType === 'whatsapp'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold">וואטסאפ ישיר</div>
                      <div className="text-[10px] opacity-75">פתיחת שיחה עם טלפון הלקוח</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionType('call');
                      setActionLabel('חיוג');
                    }}
                    className={`p-2 rounded-xl border flex items-center gap-2 text-right transition-all cursor-pointer ${
                      actionType === 'call'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-1 ring-blue-500'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <PhoneCall className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-bold">חיוג מהיר</div>
                      <div className="text-[10px] opacity-75">חיוג ישיר לטלפון</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionType('copy');
                      setActionLabel('העתק פרטים');
                    }}
                    className={`p-2 rounded-xl border flex items-center gap-2 text-right transition-all cursor-pointer ${
                      actionType === 'copy'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Copy className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold">העתקת פרטי לקוח</div>
                      <div className="text-[10px] opacity-75">העתקה מהירה לקליפבורד</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionType('email');
                      setActionLabel('שלח מייל');
                    }}
                    className={`p-2 rounded-xl border flex items-center gap-2 text-right transition-all cursor-pointer ${
                      actionType === 'email'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 ring-1 ring-purple-500'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-bold">דוא"ל</div>
                      <div className="text-[10px] opacity-75">פתיחת הודעת דוא"ל</div>
                    </div>
                  </button>
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    טקסט שיוצג על הכפתור בתא
                  </label>
                  <input
                    type="text"
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                    placeholder="לדוגמה: וואטסאפ / חייג / העתק פרטים"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>הוסף עמודה זו לטבלה הראשית</span>
            </button>

          </form>

          {/* Existing Custom Columns Section */}
          {columns.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">עמודות מותאמות קיימות ({columns.length})</span>
                <span className="text-[10px] text-slate-500">ניתן למחוק עמודות בכל עת</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {columns.map(col => (
                  <div
                    key={col.id}
                    className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      {col.type === 'dropdown' && <ListFilter className="w-4 h-4 text-blue-400" />}
                      {col.type === 'action' && <Zap className="w-4 h-4 text-purple-400" />}
                      {col.type === 'checkbox' && <CheckSquare className="w-4 h-4 text-emerald-400" />}
                      {col.type === 'text' && <Type className="w-4 h-4 text-amber-400" />}
                      {col.type === 'date' && <Calendar className="w-4 h-4 text-cyan-400" />}
                      {col.type === 'badge' && <Tag className="w-4 h-4 text-pink-400" />}
                      
                      <div>
                        <div className="text-xs font-bold text-white">{col.label}</div>
                        <div className="text-[10px] text-slate-400">
                          {col.type === 'dropdown' && `רשימת בחירה (${col.options?.length || 0} אפשרויות)`}
                          {col.type === 'action' && `פעולה: ${col.actionLabel || col.actionType}`}
                          {col.type === 'checkbox' && "תיבת סימון (כן / לא)"}
                          {col.type === 'text' && "טקסט חופשי"}
                          {col.type === 'date' && "תאריך"}
                          {col.type === 'badge' && "תגית"}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`האם למחוק את העמודה "${col.label}" מהטבלה הראשית?`)) {
                          onDeleteColumn(col.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
                      title="מחק עמודה"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            סגור
          </button>
        </div>

      </div>
    </div>
  );
};
