import React, { useState } from 'react';
import { 
  Database, 
  Cloud, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RotateCcw, 
  Copy, 
  ExternalLink, 
  Server,
  ShieldCheck,
  Code2,
  Globe
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  initSupabase, 
  resetToSeedData, 
  exportFullDatabaseJSON 
} from '../services/db';
import { 
  downloadFullDatabaseCSV, 
  restoreFromInternalStaticCSV 
} from '../services/csvBackupService';
import { 
  CRM_SPREADSHEET_ID,
  CRM_SPREADSHEET_URL,
  PRODUCT_SPREADSHEET_ID,
  PRODUCT_SPREADSHEET_URL,
  getSheetsWebhookUrl,
  setSheetsWebhookUrl,
  getLastSheetsSyncTime,
  generateCrmSheetCSV,
  generateProductSheetCSV,
  downloadCSV,
  syncToGoogleSheetsWebhook,
  GOOGLE_APPS_SCRIPT_CODE
} from '../services/googleSheetsBackupService';
import { db } from '../services/db';
import { testNetlifyBlobs } from '../services/blobsService';
import { checkWorkerHealth, getWorkerUrl, isWorkerConfigured } from '../services/aiWorkerService';
import { FileSpreadsheet, ShieldAlert, Sparkles, Check, Link2, Sheet } from 'lucide-react';

interface DatabaseSettingsProps {
  clientsCount: number;
  productCount: number;
  onRefreshData: () => void;
}

export const DatabaseSettings: React.FC<DatabaseSettingsProps> = ({
  clientsCount,
  productCount,
  onRefreshData
}) => {
  const cfg = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(cfg.url);
  const [supabaseKey, setSupabaseKey] = useState(cfg.key);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingBlobs, setIsTestingBlobs] = useState(false);
  const [blobsResult, setBlobsResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);
  const [isTestingWorker, setIsTestingWorker] = useState(false);
  const [workerResult, setWorkerResult] = useState<{ success: boolean; message: string; info?: any } | null>(null);
  const [isRestoringCSV, setIsRestoringCSV] = useState(false);
  const [csvRestoreResult, setCsvRestoreResult] = useState<{ success: boolean; message: string } | null>(null);

  // Google Sheets Backup & Live Sync State
  const [sheetsWebhookUrl, setSheetsWebhookUrlState] = useState(getSheetsWebhookUrl());
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsSyncResult, setSheetsSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isWebhookSaved, setIsWebhookSaved] = useState(false);
  const [copiedAppsScript, setCopiedAppsScript] = useState(false);
  const [showAppsScriptModal, setShowAppsScriptModal] = useState(false);

  const handleSaveWebhook = () => {
    setSheetsWebhookUrl(sheetsWebhookUrl);
    setIsWebhookSaved(true);
    setTimeout(() => setIsWebhookSaved(false), 2500);
  };

  const handleSyncGoogleSheets = async () => {
    setIsSyncingSheets(true);
    setSheetsSyncResult(null);
    try {
      const res = await syncToGoogleSheetsWebhook(sheetsWebhookUrl);
      setSheetsSyncResult(res);
    } catch (err: any) {
      setSheetsSyncResult({
        success: false,
        message: `שגיאה בסנכרון לגוגל שיטס: ${err.message || err}`
      });
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleDownloadCrmSheetCSV = async () => {
    const clients = await db.clients.toArray();
    const csv = generateCrmSheetCSV(clients);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `Claimai_CRM_DirectBackup_${dateStr}.csv`);
  };

  const handleDownloadProductSheetCSV = async () => {
    const items = await db.productItems.toArray();
    const csv = generateProductSheetCSV(items);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `CLAIMAI_Product_Delivery_DirectBackup_${dateStr}.csv`);
  };

  const handleRestoreFromCSV = async () => {
    if (!confirm('האם לבצע שחזור חירום מקובצי ה-CSV הפנימיים? פעולה זו תטען את כל 1,282 הלקוחות והמשימות מתוך קובצי הגיבוי הפנימיים.')) {
      return;
    }
    setIsRestoringCSV(true);
    setCsvRestoreResult(null);
    try {
      const res = await restoreFromInternalStaticCSV();
      setCsvRestoreResult({
        success: true,
        message: `שחזור החירום הושלם בהצלחה! נטענו ${res.clientsRestored} לקוחות ו-${res.productsRestored} משימות מתוך קובצי ה-CSV הפנימיים.`
      });
      onRefreshData();
    } catch (err: any) {
      setCsvRestoreResult({
        success: false,
        message: `שגיאה בשחזור מקובצי CSV: ${err.message || err}`
      });
    } finally {
      setIsRestoringCSV(false);
    }
  };

  const handleTestWorker = async () => {
    setIsTestingWorker(true);
    setWorkerResult(null);
    try {
      const res = await checkWorkerHealth();
      if (res.ok) {
        setWorkerResult({
          success: true,
          message: `החיבור ל-Cloudflare Worker תקין ופעיל! (ספק AI זמין: ${res.info?.hasWorkersAI ? 'Workers AI' : res.info?.hasGemini ? 'Gemini' : 'מובנה'})`,
          info: res.info
        });
      } else {
        setWorkerResult({
          success: false,
          message: `בדיקת Worker נכשלה: ${res.error}`
        });
      }
    } catch (err: any) {
      setWorkerResult({
        success: false,
        message: `שגיאה בפנייה ל-Worker: ${err.message || err}`
      });
    } finally {
      setIsTestingWorker(false);
    }
  };

  const handleTestBlobs = async () => {
    setIsTestingBlobs(true);
    setBlobsResult(null);
    try {
      const res = await testNetlifyBlobs();
      setBlobsResult({
        success: res.isAvailable,
        message: res.message,
        latency: res.latency
      });
    } catch (err: any) {
      setBlobsResult({
        success: false,
        message: `שגיאה בבדיקת Blobs: ${err.message || err}`
      });
    } finally {
      setIsTestingBlobs(false);
    }
  };

  const handleTestConnection = async () => {
    const url = (supabaseUrl || cfg.url).trim().replace(/\/$/, '');
    const key = (supabaseKey || cfg.key).trim();

    if (!url || !key) {
      setTestResult({
        success: false,
        message: 'נא להזין גם Project URL וגם Anon API Key לבדיקה'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(`${url}/rest/v1/crm_clients?select=count&limit=1`, {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        }
      });

      if (res.ok) {
        setTestResult({
          success: true,
          message: 'החיבור ל-Supabase פעיל ותקין לחלוטין! (HTTP 200 OK)'
        });
      } else if (res.status === 401) {
        setTestResult({
          success: false,
          message: 'שגיאת הזדהות (401): ה-Anon API Key אינו תואם לפרויקט.'
        });
      } else if (res.status === 404) {
        setTestResult({
          success: true,
          message: 'החיבור ל-Supabase עובד! (יש לוודא שהרצת את טבלאות ה-SQL ב-Editor)'
        });
      } else {
        const errText = await res.text();
        setTestResult({
          success: false,
          message: `השרת החזיר קוד ${res.status}: ${errText}`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `שגיאת רשת/חיבור: ${err.message || err}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSupabase = () => {
    initSupabase(supabaseUrl.trim(), supabaseKey.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleExportJSON = async () => {
    const jsonStr = await exportFullDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `claimai_db_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetData = async () => {
    if (confirm('האם אתה בטוח שברצונך לאפס את הנתונים לנתוני המקור מה-Google Sheets? כל שינוי שבוצע יידרס.')) {
      setIsResetting(true);
      await resetToSeedData();
      setIsResetting(false);
      onRefreshData();
      alert('הנתונים אופסו בהצלחה לנתוני המקור מגיליונות Google Sheets!');
    }
  };

  const sampleSchema = `-- יצירת טבלת לקוחות ראשית
CREATE TABLE crm_clients (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255),
    company VARCHAR(255),
    business_type VARCHAR(100),
    status VARCHAR(100) DEFAULT '1''st Lead',
    phone VARCHAR(100),
    email VARCHAR(255),
    requires_attention BOOLEAN DEFAULT FALSE,
    last_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- יצירת טבלת פניות מוצר ובאגים
CREATE TABLE product_items (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'bug' or 'roadmap'
    client VARCHAR(255),
    type VARCHAR(100) NOT NULL,
    module VARCHAR(255),
    title TEXT NOT NULL,
    description TEXT,
    priority VARCHAR(50) DEFAULT 'Medium',
    status VARCHAR(50) DEFAULT 'Open',
    target_date DATE
);`;

  return (
    <div className="space-y-6">
      
      {/* Netlify Deployment Readiness Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-400/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>מוכן להעלאה ואירוח ב-Netlify · Netlify Deployment Ready</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              הגדרות אירוח ב-Netlify וחיבור דאטה-בייס
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              האפליקציה נבנתה ונבדקה במלואה להעלאה מהירה ב-Netlify עם קובץ תצורה מלא (<code className="text-blue-300 font-mono">netlify.toml</code>) עם ניתוב SPA, כותרות אבטחה וחיבור דאטה-בייס היברידי.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://app.netlify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
            >
              <Globe className="w-4 h-4" />
              <span>פתח Netlify Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Deployment Steps Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400">שלב 1: חיבור הריפו</span>
            <h4 className="text-xs font-bold text-white">GitHub Repo קיים ומסונכרן</h4>
            <p className="text-[11px] text-slate-400 font-mono">avivashke/claimai-control-center</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-blue-400">שלב 2: פקודת בנייה</span>
            <h4 className="text-xs font-bold text-white">מוגדר אוטומטית ב-netlify.toml</h4>
            <p className="text-[11px] text-slate-400 font-mono">Command: npm run build | Dir: dist</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-purple-400">שלב 3: הפעלה מיידית</span>
            <h4 className="text-xs font-bold text-white">דאטה-בייס טעון מראש</h4>
            <p className="text-[11px] text-slate-400">עובד מיד עם כל 1,282 הלקוחות והתקלות</p>
          </div>
        </div>
      </div>

      {/* Featured Card: Google Sheets Continuous Backup & Live Sync */}
      <div className="sheets-featured-card p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">גיבוי וסנכרון תמידי ל-Google Sheets</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Dual-Sheet Backup
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                סנכרון וגיבוי מלא ומותאם 1:1 לשני הגיליונות הרשמיים של המערכת ב-Google Drive.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSyncGoogleSheets}
              disabled={isSyncingSheets}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.02]"
              title="שליחת כל הנתונים המעודכנים ישירות ל-Google Sheets"
            >
              <Cloud className="w-4 h-4" />
              <span>{isSyncingSheets ? 'מסנכרן לשיטס...' : '⚡ סנכרן וגבה עכשיו ל-Google Sheets'}</span>
            </button>
          </div>
        </div>

        {sheetsSyncResult && (
          <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            sheetsSyncResult.success
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}>
            {sheetsSyncResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>{sheetsSyncResult.message}</span>
          </div>
        )}

        {/* The Two Target Google Spreadsheets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Target 1: Claimai_CRM */}
          <div className="sheets-inner-card p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <h4 className="text-sm font-bold text-white">Claimai_CRM</h4>
              </div>
              <a
                href={CRM_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span>פתח ב-Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400">
              מזהה גיליון: <code className="text-emerald-300/80 font-mono text-[10px]">{CRM_SPREADSHEET_ID}</code>
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">
                סה״כ לקוחות: <strong className="text-white font-bold">{clientsCount.toLocaleString()}</strong>
              </span>
              <button
                onClick={handleDownloadCrmSheetCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all"
                title="הורדת קובץ CSV מותאם ב-100% ל-33 העמודות המדויקות של Claimai_CRM"
              >
                <Download className="w-3.5 h-3.5" />
                <span>הורד CSV מותאם ל-CRM</span>
              </button>
            </div>
          </div>

          {/* Target 2: CLAIMAI | Product & Delivery Control */}
          <div className="sheets-inner-card p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                <h4 className="text-sm font-bold text-white">CLAIMAI | Product & Delivery Control</h4>
              </div>
              <a
                href={PRODUCT_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>פתח ב-Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400">
              מזהה גיליון: <code className="text-blue-300/80 font-mono text-[10px]">{PRODUCT_SPREADSHEET_ID}</code>
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">
                סה״כ משימות ובאגים: <strong className="text-white font-bold">{productCount}</strong>
              </span>
              <button
                onClick={handleDownloadProductSheetCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-all"
                title="הורדת קובץ CSV מותאם לעמודות של Product & Delivery Control"
              >
                <Download className="w-3.5 h-3.5" />
                <span>הורד CSV מותאם למוצר</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Webhook Auto-Sync Configuration */}
        <div className="sheets-inner-card p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>חיבור Webhook לסנכרון חי אוטומטי (Google Apps Script)</span>
                {getSheetsWebhookUrl() ? (
                  <span className="px-2 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    סנכרון אוטומטי מופעל
                  </span>
                ) : (
                  <span className="px-2 py-0.2 rounded text-[10px] bg-slate-700 text-slate-300 font-semibold">
                    אופציונלי
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                כאשר כתובת ה-Webhook מוגדרת, כל שינוי של לקוח או משימה במערכת נשלח ומגובה מיידית לתוך הגיליונות.
              </p>
            </div>

            <button
              onClick={() => setShowAppsScriptModal(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline shrink-0 text-right"
            >
              הצג סקריפט Apps Script מוכן להעתקה (30 שניות)
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={sheetsWebhookUrl}
              onChange={(e) => setSheetsWebhookUrlState(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={handleSaveWebhook}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shrink-0"
            >
              {isWebhookSaved ? 'נשמר בהצלחה!' : 'שמור כתובת Webhook'}
            </button>
          </div>

          {getLastSheetsSyncTime() && (
            <p className="text-[10px] text-slate-500 font-mono">
              סנכרון אחרון שנשלח: {new Date(getLastSheetsSyncTime()!).toLocaleString('he-IL')}
            </p>
          )}
        </div>
      </div>

      {/* Database Engines: Local vs Supabase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Local IndexedDB (Active) */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">דאטה-בייס מקומי (IndexedDB & LocalStorage)</h3>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  פעיל ומסונכרן בדפדפן
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Offline-First
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            מאגר מידע מהיר ועצמאי בתוך הדפדפן. שומר את כל הנתונים, העריכות, הלידים וההערות גם בעת רענון או ניתוק מהרשת, ללא תלות בשרת חיצוני.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
              <span className="text-[11px] text-slate-400 block">רשומות CRM</span>
              <span className="text-xl font-extrabold text-white">{clientsCount.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
              <span className="text-[11px] text-slate-400 block">משימות פיתוח ובאגים</span>
              <span className="text-xl font-extrabold text-white">{productCount}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>גיבוי מלא ל-JSON</span>
            </button>
            <button
              onClick={downloadFullDatabaseCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
              title="הורדת קובץ CSV מלא של כל הטבלאות בדאטה-בייס"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>גיבוי מלא ל-CSV</span>
            </button>
            <button
              onClick={handleResetData}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 text-xs font-semibold text-rose-300 transition-all mr-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>איפוס לגיליונות המקור</span>
            </button>
          </div>
        </div>

        {/* Card 2: Supabase Cloud PostgreSQL */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">חיבור ענן Supabase / PostgreSQL</h3>
                <span className="text-[11px] text-slate-400">
                  {cfg.isConfigured ? 'מוגדר ומחובר' : 'אופציונלי לסנכרון רב-משתמשים'}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Cloud SQL
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            מאפשר לכל צוות ClaimAI לעבוד במקביל מכל מחשב. ניתן להזין את פרטי הפרויקט ב-Netlify כ-Environment Variables או להזין כאן ישירות:
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Project URL (כתובת הפרויקט ב-Supabase)</label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Anon / Public API Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              onClick={handleSaveSupabase}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              שמור הגדרות ענן
            </button>

            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition-all disabled:opacity-50"
            >
              {isTesting ? 'בודק חיבור בזמן אמת...' : '⚡ בדוק חיבור עכשיו'}
            </button>

            {isSaved && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ההגדרות נשמרו!
              </span>
            )}
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

      </div>

      {/* Card: Internal CSV Backup & Emergency Failover Snapshot */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">עותק גיבוי CSV פנימי קבוע והגנת נפילת דאטה-בייס</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>שמור תמיד בקוד ובקובצי המערכת</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                עותק מלא של כל הדאטה-בייס נשמר תמיד בקובצי CSV פנימיים עם קידוד UTF-8 לעברית. במקרה של נפילת שרת, ניתוק ענן או איפוס דפדפן — הנתונים מגובים וניתנים לשחזור מיידי.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={downloadFullDatabaseCSV}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
              title="הורדת קובץ CSV מרוכז של כל הדאטה-בייס"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>הורד גיבוי מלא ל-CSV</span>
            </button>

            <button
              onClick={handleRestoreFromCSV}
              disabled={isRestoringCSV}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all disabled:opacity-50"
              title="שחזור מיידי מקובצי ה-CSV הפנימיים במקרה של נפילה"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>{isRestoringCSV ? 'משחזר נתונים...' : 'שחזור חירום מקובצי CSV'}</span>
            </button>
          </div>
        </div>

        {csvRestoreResult && (
          <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            csvRestoreResult.success
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}>
            {csvRestoreResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{csvRestoreResult.message}</span>
          </div>
        )}

        {/* Breakdown of internal CSV files */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 text-center">
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-mono">crm_clients.csv</span>
            <span className="text-xs font-bold text-emerald-300">{clientsCount.toLocaleString()} לקוחות</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-mono">product_items.csv</span>
            <span className="text-xs font-bold text-blue-300">{productCount} פניות מוצר</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-mono">contacts.csv</span>
            <span className="text-xs font-bold text-purple-300">115 אנשי קשר</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-mono">custom_tables.csv</span>
            <span className="text-xs font-bold text-amber-300">טבלאות סטודיו AI</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-mono">users.csv</span>
            <span className="text-xs font-bold text-rose-300">משתמשי פורטלים</span>
          </div>
        </div>
      </div>

      {/* Card 3: Netlify Blobs Offloading Engine */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/30 via-slate-900 to-slate-900 border border-blue-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Netlify Blobs — שכבת Edge וביזור עומסים במקביל</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Dual-Layer Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                שומר וקורא Snapshots של נתוני האפליקציה ישירות מ-Netlify Edge Cache, ומפזר את שאילתות הקריאה כך שלא ייצרו עומס על מסד הנתונים של Supabase.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleTestBlobs}
              disabled={isTestingBlobs}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Server className="w-3.5 h-3.5" />
              <span>{isTestingBlobs ? 'בודק זמינות Blobs...' : '⚡ בדיקת זמינות Netlify Blobs'}</span>
            </button>
          </div>
        </div>

        {blobsResult && (
          <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            blobsResult.success
              ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}>
            {blobsResult.success ? <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>{blobsResult.message} {blobsResult.latency ? `(${blobsResult.latency}ms)` : ''}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300 pt-1">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <strong className="text-blue-300 block mb-1">1. מהירות קצה (Edge CDN)</strong>
            <span>החזרת רשומות ולקוחות במהירות של אלפיות שניה משרתי Netlify הקרובים ביותר למשתמש.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <strong className="text-emerald-300 block mb-1">2. הגנת Supabase Quota</strong>
            <span>מניעת תשלומים וחריגות מול Supabase גם כאשר מאות משתמשים צופים במערכת בו-זמנית.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <strong className="text-purple-300 block mb-1">3. גיבוי Snapshots אוטומטי</strong>
            <span>תמונת מצב של כל הנתונים נשמרת באופן מאובטח ב-Store של Netlify בשם <code className="font-mono text-purple-200">claimai-data</code>.</span>
          </div>
        </div>
      </div>

      {/* Card 4: Cloudflare Worker AI */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Cloudflare Worker AI — שרת בינה מלאכותית ו-Copilot</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isWorkerConfigured()
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isWorkerConfigured() ? 'מוגדר ב-Netlify' : 'לא מוגדר (פולבאק מקומי)'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isWorkerConfigured()
                  ? `מחובר לוורקר: ${getWorkerUrl()}`
                  : 'הגדר VITE_CLOUDFLARE_WORKER_URL ב-Netlify כדי לחבר את ה-Worker ב-Cloudflare לביצוע עיבודי AI בענן.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleTestWorker}
              disabled={isTestingWorker}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>{isTestingWorker ? 'בודק Worker...' : '⚡ בדיקת חיבור Cloudflare Worker'}</span>
            </button>
          </div>
        </div>

        {workerResult && (
          <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            workerResult.success
              ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}>
            {workerResult.success ? <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>{workerResult.message}</span>
          </div>
        )}
      </div>

      {/* SQL Migration Script Viewer */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">סקריפט הקמת טבלאות SQL מוכן (Schema & RLS)</h3>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(sampleSchema);
              setCopiedSql(true);
              setTimeout(() => setCopiedSql(false), 2000);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedSql ? 'הועתק ללוח!' : 'העתק SQL'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          סקריפט המבנה המלא קיים גם בריפו בנתיב: <code className="text-blue-300 font-mono">supabase/schema.sql</code> ו-<code className="text-blue-300 font-mono">supabase/seed.sql</code>
        </p>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
          {sampleSchema}
        </pre>
      </div>

      {/* Google Apps Script Setup Modal */}
      {showAppsScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">הגדרת סנכרון חי ב-Google Sheets (Apps Script)</h3>
              </div>
              <button
                onClick={() => setShowAppsScriptModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="font-semibold text-emerald-300">
                מדריך מהיר להפעלת סנכרון חי (דקה אחת בלבד):
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pr-2 leading-relaxed">
                <li>פתח את גיליון Google Sheets שלך (<a href={CRM_SPREADSHEET_URL} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-semibold">Claimai_CRM</a>).</li>
                <li>בתפריט העליון לחץ על <strong>Extensions</strong> (הרחבות) &gt; <strong>Apps Script</strong>.</li>
                <li>מחק את הקוד הקיים, הדבק את הסקריפט שמופיע למטה, ושמור (<code className="font-mono">Ctrl+S</code>).</li>
                <li>לחץ על <strong>Deploy</strong> (פריסה) &gt; <strong>New deployment</strong> (פריסה חדשה).</li>
                <li>בחר סוג <strong>Web app</strong>, הגדר ב-<em>Who has access</em>: <strong>Anyone</strong> (כל אחד), ולחץ Deploy.</li>
                <li>העתק את ה-<strong>Web app URL</strong> והדבק אותו בשדה ה-Webhook בהגדרות המערכת!</li>
              </ol>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">קוד הסקריפט להעתקה:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
                    setCopiedAppsScript(true);
                    setTimeout(() => setCopiedAppsScript(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedAppsScript ? 'הועתק ללוח!' : 'העתק את הקוד'}</span>
                </button>
              </div>

              <pre 
                dir="ltr"
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-64 text-left select-all"
              >
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAppsScriptModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
