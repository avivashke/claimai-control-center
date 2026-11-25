import { ChatAction } from '../components/AI/FloatingAIChat';

const STORAGE_WORKER_URL_KEY = 'claimai_custom_worker_url';
const STORAGE_WORKER_TOKEN_KEY = 'claimai_custom_worker_token';

export const getWorkerUrl = (): string => {
  const custom = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_WORKER_URL_KEY) : null;
  if (custom && custom.trim().length > 5) {
    return custom.trim().replace(/\/$/, '');
  }
  return (import.meta.env.VITE_CLOUDFLARE_WORKER_URL || 'https://small-sea-ba86.avivashke95.workers.dev').replace(/\/$/, '');
};

export const getWorkerToken = (): string => {
  const custom = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_WORKER_TOKEN_KEY) : null;
  if (custom && custom.trim()) {
    return custom.trim();
  }
  return import.meta.env.VITE_WORKER_AUTH_TOKEN || '';
};

export const setCustomWorkerConfig = (url: string, token?: string): void => {
  if (typeof window === 'undefined') return;
  const cleanUrl = url.trim().replace(/\/$/, '');
  if (cleanUrl) {
    localStorage.setItem(STORAGE_WORKER_URL_KEY, cleanUrl);
  } else {
    localStorage.removeItem(STORAGE_WORKER_URL_KEY);
  }

  if (token && token.trim()) {
    localStorage.setItem(STORAGE_WORKER_TOKEN_KEY, token.trim());
  } else {
    localStorage.removeItem(STORAGE_WORKER_TOKEN_KEY);
  }
};

export const clearCustomWorkerConfig = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_WORKER_URL_KEY);
  localStorage.removeItem(STORAGE_WORKER_TOKEN_KEY);
};

export const isWorkerConfigured = (): boolean => {
  const url = getWorkerUrl();
  return Boolean(url && url.length > 5);
};

const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getWorkerToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-ClaimAI-Token'] = token;
  }
  return headers;
};

export const checkWorkerHealth = async (): Promise<{ ok: boolean; info?: any; error?: string }> => {
  if (!isWorkerConfigured()) {
    return { ok: false, error: 'לא הוגדר URL עבור הוורקר. ניתן להגדיר ב-Netlify (VITE_CLOUDFLARE_WORKER_URL) או ישירות בהגדרות המערכת' };
  }

  const url = getWorkerUrl();
  try {
    const res = await fetch(`${url}/api/health`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      return { ok: false, error: `Worker returned HTTP ${res.status}` };
    }
    const info = await res.json();
    return { ok: true, info };
  } catch (err: any) {
    return { ok: false, error: err.message || 'שגיאת רשת בפנייה לוורקר' };
  }
};

export interface ChatContextPayload {
  currentUser?: { name?: string; role?: string; email?: string };
  stats?: {
    totalClients: number;
    urgentCount: number;
    meetingCount: number;
    importantCount: number;
    statusDistribution: Record<string, number>;
    businessTypeDistribution: Record<string, number>;
    totalTickets: number;
    criticalBugsCount: number;
  };
  matchedClients?: Array<{
    id: string;
    name: string;
    company?: string;
    businessType?: string;
    status: string;
    subStatus?: string;
    phone?: string;
    email?: string;
    lastNote?: string;
    requiresAttention?: boolean;
  }>;
  matchedTickets?: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    client?: string;
    category?: string;
  }>;
  customTablesSummary?: Array<{
    id: string;
    name: string;
    rowCount: number;
  }>;
  clientsSummary?: Array<{ id: string; name: string; company?: string; status: string; phone?: string; requiresAttention?: boolean }>;
  productSummary?: Array<{ id: string; title: string; priority: string; status: string; client?: string; category?: string }>;
}

export const askWorkerAI = async (
  query: string,
  context: ChatContextPayload
): Promise<{ text: string; actions?: ChatAction[] } | null> => {
  if (!isWorkerConfigured()) return null;

  const url = getWorkerUrl();
  try {
    const res = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        query,
        ...context,
      }),
    });

    if (!res.ok) {
      console.warn(`Cloudflare Worker chat failed with HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    return {
      text: data.text || '',
      actions: data.actions || [],
    };
  } catch (err) {
    console.warn('Failed to contact Cloudflare Worker AI, falling back to local engine:', err);
    return null;
  }
};

export interface ClientEngagementAdvice {
  engagementScore: number;
  churnRisk: 'נמוך' | 'בינוני' | 'גבוה';
  urgencyLevel: 'רגיל' | 'בינוני' | 'דחוף';
  executiveSummary: string;
  statusAnalysis: string;
  keyInsights: string[];
  actionPlan: Array<{
    step: number;
    title: string;
    detail: string;
    priority: 'High' | 'Medium' | 'Low';
  }>;
  suggestedWhatsApp: string;
  recommendedNextStatus: string;
  _source?: string;
}

export const getClientSmartAdvice = async (
  client: any,
  openTickets: any[] = []
): Promise<ClientEngagementAdvice> => {
  if (isWorkerConfigured()) {
    const url = getWorkerUrl();
    try {
      const res = await fetch(`${url}/api/client-advice`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ client, openTickets }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.executiveSummary) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Worker client advice endpoint unreachable, using local fallback:', err);
    }
  }

  // Local rule-based advisor fallback
  return getLocalClientAdvice(client, openTickets);
};

export const getLocalClientAdvice = (client: any, openTickets: any[] = []): ClientEngagementAdvice => {
  const status = client.status || "1'st Lead";
  const notes = (client.lastNote || '').toLowerCase();
  const hasIt = Boolean(client.itContact?.trim());
  const hasTeam = Boolean(client.teamContacts?.trim());
  
  let engagementScore = 65;
  let churnRisk: 'נמוך' | 'בינוני' | 'גבוה' = 'נמוך';
  let recommendedNextStatus = status;
  const keyInsights: string[] = [];
  const actionPlan: Array<{ step: number; title: string; detail: string; priority: 'High' | 'Medium' | 'Low' }> = [];

  if (status === 'Urgent' || client.requiresAttention) {
    engagementScore = 30;
    churnRisk = 'גבוה';
    keyInsights.push('הלקוח סומן כדורש טיפול מיידי — קיים סיכון ממשי לנטישה או עיכוב תביעות קריטי.');
    actionPlan.push({
      step: 1,
      title: 'שיחה אישית ממנהל עוד היום',
      detail: 'ליצור קשר טלפוני אישי להרגעת הלקוח, בדיקת עיכובים וסגירת קצוות פתוחים.',
      priority: 'High',
    });
  }

  if (status === "1'st Lead" || status === "1'st Follow-Up") {
    engagementScore = 55;
    churnRisk = 'בינוני';
    recommendedNextStatus = 'Meeting Scheduled';
    keyInsights.push('הלקוח נמצא בשלבי היכרות ראשוניים — המטרה המרכזית היא תיאום הדגמה חיה ממוקדת (Zoom / פרונטלי).');
    actionPlan.push({
      step: 1,
      title: 'הצעת הדגמה קצרה בת 15 דקות',
      detail: 'להראות למקבל ההחלטות כיצד המערכת מפיקה כתב תביעה אוטומטי תוך 60 שניות ומחליפה עבודה ידנית.',
      priority: 'High',
    });
  } else if (status === 'Meeting Scheduled') {
    engagementScore = 80;
    recommendedNextStatus = 'Follow-Up';
    keyInsights.push('פגישה תואמה בהצלחה — מומלץ להכין דוגמה המותאמת לפוליסות הנפוצות ביותר בסוכנות.');
    actionPlan.push({
      step: 1,
      title: 'שליחת תזכורת בוואטסאפ יום לפני',
      detail: 'לוודא הגעה של מקבל ההחלטות והפקידה המטפלת בתביעות.',
      priority: 'High',
    });
  } else if (status === 'Adoption Monitoring') {
    engagementScore = 85;
    recommendedNextStatus = 'All-Good';
    keyInsights.push('הלקוח כבר פעיל ומטמיע את המערכת — שביעות רצון הפקידות תקבע את המשך המנוי.');
    actionPlan.push({
      step: 1,
      title: 'מעקב שבועי אחר נפח התביעות המוקלדות',
      detail: 'לוודא חיבור תקין למערכת באפי (Bafi) ולפתור תקלות תוך שעות ספורות.',
      priority: 'Medium',
    });
  }

  if (!hasIt) {
    keyInsights.push('חסרים פרטי איש מחשוב (IT) — עלול לעכב אינטגרציות טכנולוגיות וחיבורי רשת.');
    actionPlan.push({
      step: 2,
      title: 'בירור פרטי איש IT',
      detail: 'לבקש שם וטלפון של איש התמיכה להתקנת הרחבות או הגדרות מייל.',
      priority: 'Medium',
    });
  }

  if (!hasTeam) {
    keyInsights.push('לא הוגדרו פקידות או מזכירות — הפקידות הן משתמשות הקצה העיקריות המייצרות אינגייג\'מנט יומיומי.');
  }

  if (openTickets.length > 0) {
    churnRisk = 'גבוה';
    keyInsights.push(`ללקוח ישנן ${openTickets.length} פניות מוצר או תקלות פתוחות במערכת.`);
    actionPlan.unshift({
      step: 0,
      title: 'עדכון יזום בסטטוס התקלה',
      detail: 'לעדכן את הלקוח שהנושא נמצא בטיפול צוות הפיתוח כדי לחזק אמון.',
      priority: 'High',
    });
  }

  const cleanName = client.name ? client.name.split(' ')[0] : 'שלום';
  const suggestedWhatsApp = `היי ${cleanName}, מה שלומך? רציתי לשמוע איך הולך עם בדיקת המערכת של ClaimAI, והאם נוח לתאם שיחה קצרה להראות לך כמה תכונות חדשות שיחסכו לכם שעות בכל פתיחת תביעה?`;

  return {
    engagementScore,
    churnRisk,
    urgencyLevel: client.requiresAttention ? 'דחוף' : 'רגיל',
    executiveSummary: `לקוח בסטטוס "${status}" עם ${client.monthlyClaims || 'ללא מידע על'} תביעות חודשיות. ${notes ? 'נרשמו הערות קודמות ביומן השיחות.' : 'טרם תועדו הערות משמעותיות.'}`,
    statusAnalysis: `השהייה בסטטוס "${status}" מחייבת מיקוד בהנעה לפעולה הבאה מול מקבלי ההחלטות.`,
    keyInsights,
    actionPlan,
    suggestedWhatsApp,
    recommendedNextStatus,
    _source: 'built_in_smart_advisor',
  };
};

export const analyzeTableWithWorker = async (
  headers: string[],
  sampleRows: Record<string, any>[],
  userPrompt?: string
): Promise<{ tableName: string; description: string; columns: any[] } | null> => {
  if (!isWorkerConfigured()) return null;

  const url = getWorkerUrl();
  try {
    const res = await fetch(`${url}/api/analyze-table`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        headers,
        sampleRows: sampleRows.slice(0, 10),
        userPrompt,
      }),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Worker table analysis error:', err);
    return null;
  }
};
