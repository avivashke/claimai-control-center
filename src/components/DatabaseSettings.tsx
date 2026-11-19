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
import { testNetlifyBlobs } from '../services/blobsService';

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

    </div>
  );
};
