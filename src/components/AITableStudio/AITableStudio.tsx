import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  FileSpreadsheet, 
  Table as TableIcon, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Settings2, 
  Layers, 
  Plus, 
  Trash2, 
  RefreshCw,
  FileText,
  Key,
  Users
} from 'lucide-react';
import { 
  parseExcelFile, 
  parseRawText, 
  processWithBuiltinAI, 
  processWithGeminiAI,
  convertCustomRowsToCrmLeads,
  AIAnalysisResult 
} from '../../services/aiService';
import { CustomTable, CustomTableColumn, ColumnType, Client } from '../../types';
import { analyzeTableWithWorker, isWorkerConfigured } from '../../services/aiWorkerService';

interface AITableStudioProps {
  onTableCreated: (table: CustomTable) => void;
  onSyncToCrm: (newClients: Client[]) => void;
  existingCrmLength: number;
}

export const AITableStudio: React.FC<AITableStudioProps> = ({
  onTableCreated,
  onSyncToCrm,
  existingCrmLength
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const hasCloudflareWorker = isWorkerConfigured();
  const [provider, setProvider] = useState<'builtin' | 'worker' | 'gemini' | 'openai'>(
    hasCloudflareWorker ? 'worker' : 'builtin'
  );
  const [apiKey, setApiKey] = useState(localStorage.getItem('claimai_ai_api_key') || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [syncToCrmSuccess, setSyncToCrmSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sample users_export data
  const handleLoadSampleUsersExport = () => {
    setUserPrompt('עבד את נתוני משתמשי הפלטפורמה של ClaimAI, חלק לסטטוסים לפי שימוש וימי ניסיון, ותרגם את כל העמודות לעברית מקצועית.');
    setRawText(`ID\tFirst Name\tLast Name\tEmail\tCompany Name\tCompany Phone\tCase Count\tPlan\tTrial Days Left\tCreated At
6afd94d75dd6a3f64675b8d1\tשילת אסתר\tקדם\teti@on-ins.com\tעפר נוסנבאום\t035377182\t1\tFree Trial\t0\t18.11.2026
6afc153cc60c1f658ea96791\tשיינדי\tגרינבויים\toffice4@5377177.co.il\tפינקל סוכנויות לביטוח\t0524493579\t0\tFree Trial\t0\t17.11.2026
6afc0a69c60c1f658ea7aa5d\tYossi\tRefaeli\tyr@5377177.co.il\tיוסף רפאלי סוכנות לביטוח\t0545232275\t6\tFree Trial\t5\t17.11.2026
6afc034fc60c1f658ea6a168\tרנדה\tעתמה\tranda.tviot@gmail.com\tסוכנות יוסף בחוס\t0525779577\t0\tFree Trial\t0\t17.11.2026
6af2c08230d737ce3a2b81b1\tרחלי\tאסרף\tracheli@aslaw.net\tמשרד עורכי דין רחלי אסרף\t0522603972\t4\tFree Trial\t12\t14.11.2026`);
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setRawText('');
    }
  };

  // Run AI processing
  const handleProcessData = async () => {
    if (!selectedFile && !rawText.trim()) {
      alert('נא להעלות קובץ Excel/CSV או להדביק נתונים');
      return;
    }

    setIsProcessing(true);
    setAnalysisResult(null);

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
        alert('לא זוהו שורות תקינות בנתונים שהוזנו');
        setIsProcessing(false);
        return;
      }

      // Process with AI
      const result = processWithBuiltinAI(headers, rows, userPrompt, selectedFile?.name);

      // If user selected Cloudflare Worker AI
      if (provider === 'worker') {
        try {
          const workerSchema = await analyzeTableWithWorker(headers, rows, userPrompt);
          if (workerSchema) {
            result.tableName = workerSchema.tableName || result.tableName;
            result.description = workerSchema.description || result.description;
            if (workerSchema.columns && workerSchema.columns.length > 0) {
              result.columns = workerSchema.columns;
            }
          }
        } catch (err) {
          console.warn('Cloudflare Worker table enrichment failed, using built-in parser result', err);
        }
      }

      // If user selected Gemini and provided an API key
      if (provider === 'gemini' && apiKey.trim()) {
        try {
          const geminiSchema = await processWithGeminiAI(headers, rows, apiKey.trim(), userPrompt);
          result.tableName = geminiSchema.tableName || result.tableName;
          result.description = geminiSchema.description || result.description;
          if (geminiSchema.columns && geminiSchema.columns.length > 0) {
            result.columns = geminiSchema.columns;
          }
        } catch (err) {
          console.warn('Gemini enrichment failed, using built-in AI parser result', err);
        }
      }

      setAnalysisResult(result);
    } catch (err: any) {
      alert(`שגיאה בעיבוד הנתונים: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Create new table in database
  const handleCreateTable = () => {
    if (!analysisResult) return;

    const newTable: CustomTable = {
      id: `table-${Date.now()}`,
      name: analysisResult.tableName,
      description: analysisResult.description,
      columns: analysisResult.columns,
      rows: analysisResult.rows,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    onTableCreated(newTable);
  };

  // Sync rows as leads to CRM
  const handleSyncToCrm = () => {
    if (!analysisResult) return;
    const newLeads = convertCustomRowsToCrmLeads(
      analysisResult.rows,
      analysisResult.columns,
      existingCrmLength
    );
    onSyncToCrm(newLeads);
    setSyncToCrmSuccess(true);
    setTimeout(() => setSyncToCrmSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Studio Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-2 border border-purple-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>סטודיו AI לבניית טבלאות וקליטת לקוחות אוטומטית</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              זריקת נתוני לקוחות ויצירת טבלאות דינמיות בעזרת AI
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              העלה קובץ Excel (כמו ייצוא משתמשי ClaimAI – <code className="text-purple-300 font-mono">users_export.xlsx</code>), קובץ CSV או הדבק רשימות גולמיות. מנוע ה-AI ינתח, יתרגם שדות לעברית ויבנה לך טבלה חדשה ומותאמת אישית בלחיצה אחת!
            </p>
          </div>

          <button
            onClick={handleLoadSampleUsersExport}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-all shadow-md self-start md:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>טען דוגמת users_export.xlsx</span>
          </button>
        </div>
      </div>

      {/* Input Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Data Input & Prompt */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* File Upload / Dropzone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-slate-700 hover:border-purple-500/60 rounded-2xl p-6 bg-slate-900/50 hover:bg-slate-900/80 transition-all text-center space-y-2 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv,.json"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">
              {selectedFile ? `קובץ נבחר: ${selectedFile.name}` : 'גרור קובץ Excel / CSV לכאן או לחץ לבחירה'}
            </h3>
            <p className="text-xs text-slate-400">
              תומך ב- <span className="font-mono text-purple-300">users_export.xlsx</span>, קובצי אקסל של לקוחות, סוכנויות ונתוני מערכת
            </p>
          </div>

          {/* Or Paste Raw Text */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              או הדבק נתוני לקוחות / רשימה בטקסט חופשי (CSV, TSV, JSON):
            </label>
            <textarea
              rows={5}
              placeholder="הדבק שורות מטבלה, רשימת שמות, אימיילים, טלפונים או JSON..."
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setSelectedFile(null);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed"
            />
          </div>

          {/* AI Prompt Input */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>הנחיות ל-AI (פרומפט - אופציונלי):</span>
            </label>
            <input
              type="text"
              placeholder="למשל: 'עבד את המשתמשים, זהה מי פתח תביעות במערכת, וסווג לפי חברות וסוכנויות'"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

        </div>

        {/* Right 1 Col: AI Engine Settings & Trigger */}
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Settings2 className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                הגדרות מנוע AI
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">ספק AI נבחר</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {hasCloudflareWorker && (
                    <option value="worker">⚡ Cloudflare Worker AI (מחובר ומאומת ב-Netlify)</option>
                  )}
                  <option value="builtin">🧠 מנוע AI מובנה (חינמי, מהיר וללא מפתח)</option>
                  <option value="gemini">✨ Google Gemini API (gemini-1.5-flash)</option>
                  <option value="openai">⚡ OpenAI API (GPT-4o-mini)</option>
                </select>
              </div>

              {provider !== 'builtin' && provider !== 'worker' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    API Key של {provider === 'gemini' ? 'Google Gemini' : 'OpenAI'}
                  </label>
                  <div className="relative">
                    <Key className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="password"
                      placeholder="הזן API Key אישי..."
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        localStorage.setItem('claimai_ai_api_key', e.target.value);
                      }}
                      className="w-full pr-9 pl-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 space-y-1">
                <span className="font-bold block">✨ יכולות המנוע:</span>
                <p className="text-[11px] text-slate-400">
                  זיהוי אוטומטי של שדות ClaimAI, תרגום עמודות לעברית, סיווג סוגי נתונים (טלפונים, אימיילים, תאריכים), והכנת טבלה פונקציונלית.
                </p>
              </div>
            </div>

            <button
              onClick={handleProcessData}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>מעבד נתונים בעזרת AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>עבד בעזרת AI והכן טבלה חדשה</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* AI Analysis & Preview Section */}
      {analysisResult && (
        <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
          
          {/* Result Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-purple-400" />
                <input
                  type="text"
                  value={analysisResult.tableName}
                  onChange={(e) => setAnalysisResult({ ...analysisResult, tableName: e.target.value })}
                  className="text-lg font-bold text-white bg-slate-800/60 border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <input
                type="text"
                value={analysisResult.description}
                onChange={(e) => setAnalysisResult({ ...analysisResult, description: e.target.value })}
                className="text-xs text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-purple-500 focus:outline-none w-full max-w-xl mt-1 px-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncToCrm}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
              >
                <Users className="w-4 h-4 text-blue-400" />
                <span>ייבא {analysisResult.suggestedCrmSyncCount} לידים ל-CRM</span>
              </button>

              <button
                onClick={handleCreateTable}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>צור טבלה זו עכשיו במערכת</span>
              </button>
            </div>
          </div>

          {/* Sync Success Alert */}
          {syncToCrmSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>הלידים סונכרנו בהצלחה לטבלת ה-CRM הראשית!</span>
            </div>
          )}

          {/* Columns Schema Editor */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              עמודות שחולצו על ידי ה-AI ({analysisResult.columns.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysisResult.columns.map((col, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                  <input
                    type="text"
                    value={col.label}
                    onChange={(e) => {
                      const updated = [...analysisResult.columns];
                      updated[idx].label = e.target.value;
                      setAnalysisResult({ ...analysisResult, columns: updated });
                    }}
                    className="bg-transparent text-white font-semibold focus:outline-none w-24"
                  />
                  <span className="text-[10px] text-purple-400 font-mono bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                    {col.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Table Data Preview */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-800 text-slate-300 font-semibold sticky top-0 border-b border-slate-700">
                  <tr>
                    {analysisResult.columns.map((col, idx) => (
                      <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {analysisResult.rows.slice(0, 8).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/60 transition-colors">
                      {analysisResult.columns.map((col, cIdx) => (
                        <td key={cIdx} className="py-2 px-3 text-slate-300 whitespace-nowrap max-w-xs truncate">
                          {String(row[col.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 text-center font-mono">
              מציג תצוגה מקדימה של {Math.min(8, analysisResult.rows.length)} שורות מתוך {analysisResult.rows.length} שורות שחולצו
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
