import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Sparkles, 
  Table as TableIcon, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { parseExcelFile, parseRawText, processWithBuiltinAI } from '../../services/aiService';
import { CustomTable, CustomTableColumn } from '../../types';

interface UploadTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableCreated: (table: CustomTable) => void;
}

export const UploadTableModal: React.FC<UploadTableModalProps> = ({
  isOpen,
  onClose,
  onTableCreated
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [tableName, setTableName] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewColumns, setPreviewColumns] = useState<CustomTableColumn[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, any>[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setRawText('');
      
      // Auto-populate table name from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTableName(cleanName);
      
      // Fast parse preview
      try {
        setIsProcessing(true);
        const { headers, rows } = await parseExcelFile(file);
        if (headers.length > 0 && rows.length > 0) {
          const aiRes = processWithBuiltinAI(headers, rows, '', file.name);
          setPreviewColumns(aiRes.columns);
          setPreviewRows(aiRes.rows.slice(0, 5));
          if (!description) {
            setDescription(`קובץ שהועלה: ${file.name} (${rows.length} שורות)`);
          }
        }
      } catch (err: any) {
        console.warn('Preview parse failed:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    setSelectedFile(null);
    if (text.trim().length > 10) {
      try {
        const { headers, rows } = parseRawText(text);
        if (headers.length > 0 && rows.length > 0) {
          const aiRes = processWithBuiltinAI(headers, rows);
          setPreviewColumns(aiRes.columns);
          setPreviewRows(aiRes.rows.slice(0, 5));
          if (!tableName) {
            setTableName(aiRes.tableName || 'טבלה מועלית חדשה');
          }
        }
      } catch {}
    }
  };

  const handleSaveAndCreate = async () => {
    if (!selectedFile && !rawText.trim()) {
      alert('נא להעלות קובץ אקסל או להדביק נתונים');
      return;
    }

    if (!tableName.trim()) {
      alert('נא להזין כותרת מוגדרת לטבלה');
      return;
    }

    setIsProcessing(true);
    try {
      let headers: string[] = [];
      let rows: Record<string, any>[] = [];

      if (selectedFile) {
        const parsed = await parseExcelFile(selectedFile);
        headers = parsed.headers;
        rows = parsed.rows;
      } else {
        const parsed = parseRawText(rawText);
        headers = parsed.headers;
        rows = parsed.rows;
      }

      if (headers.length === 0 || rows.length === 0) {
        alert('לא נמצאו נתונים תקינים לעיבוד');
        setIsProcessing(false);
        return;
      }

      const aiRes = processWithBuiltinAI(headers, rows, '', selectedFile?.name);

      const newTable: CustomTable = {
        id: `tbl-${Date.now()}`,
        name: tableName.trim(),
        description: description.trim() || aiRes.description,
        columns: previewColumns.length > 0 ? previewColumns : aiRes.columns,
        rows: aiRes.rows,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10)
      };

      onTableCreated(newTable);
      onClose();
    } catch (err: any) {
      alert(`שגיאה ביצירת הטבלה: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in-50 duration-150" dir="rtl">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">העלאת טבלה חדשה לדף ניהול לקוחות</h2>
              <p className="text-xs text-slate-400">הטבלה תתווסף מיד בלשונית עצמאית עם כותרתה המוגדרת</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Defined Title Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              כותרת מוגדרת לטבלה (תופיע כלשונית בדף הלקוחות) <span className="text-purple-400">*</span>
            </label>
            <input
              type="text"
              placeholder="למשל: משתמשי פלטפורמה, סוכנויות צפון, נתוני פיילוט..."
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400">
              תיאור קצר (אופציונלי)
            </label>
            <input
              type="text"
              placeholder="למשל: ייבוא מקובץ אקסל חודשי, מכיל שדות טלפון ותביעות"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* File Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-2xl p-6 bg-slate-950/50 hover:bg-slate-900/80 transition-all text-center space-y-2 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv,.json"
              className="hidden"
            />
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-white">
              {selectedFile ? `קובץ שנבחר: ${selectedFile.name}` : 'גרור לכאן קובץ Excel / CSV או לחץ לבחירת קובץ'}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              תומך ב-.xlsx, .xls, .csv, .json
            </p>
          </div>

          {/* Or Paste Raw Text */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400">
              או הדבק טקסט מטבלה (CSV, TSV, JSON):
            </label>
            <textarea
              rows={3}
              placeholder="הדבק כאן שורות מועתקות מאקסל או CSV..."
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Preview of Columns & Rows if detected */}
          {previewColumns.length > 0 && (
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>זוהו {previewColumns.length} עמודות ושורות נתונים</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {previewRows.length} שורות תצוגה מקדימה
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                {previewColumns.map(col => (
                  <span
                    key={col.key}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1"
                  >
                    <span>{col.label}</span>
                    <span className="text-[9px] text-purple-400 font-mono">({col.type})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            ביטול
          </button>

          <button
            type="button"
            disabled={isProcessing || (!selectedFile && !rawText.trim()) || !tableName.trim()}
            onClick={handleSaveAndCreate}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all hover:scale-[1.02]"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>מעבד נתונים...</span>
              </>
            ) : (
              <>
                <TableIcon className="w-4 h-4" />
                <span>צור והוסף טבלה לדף הלקוחות</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
