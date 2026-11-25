import { ChatAction } from '../components/AI/FloatingAIChat';

const STORAGE_WORKER_URL_KEY = 'claimai_custom_worker_url';
const STORAGE_WORKER_TOKEN_KEY = 'claimai_custom_worker_token';
const STORAGE_AI_API_KEY = 'claimai_ai_api_key';
const STORAGE_AI_PROVIDER = 'claimai_ai_provider'; // 'worker' | 'groq' | 'gemini' | 'openai'

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

export const getDirectAIKey = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_AI_API_KEY) || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GROQ_API_KEY || '';
};

export const setDirectAIKey = (key: string, provider: 'groq' | 'gemini' | 'openai' = 'groq'): void => {
  if (typeof window === 'undefined') return;
  if (key && key.trim()) {
    localStorage.setItem(STORAGE_AI_API_KEY, key.trim());
    localStorage.setItem(STORAGE_AI_PROVIDER, provider);
  } else {
    localStorage.removeItem(STORAGE_AI_API_KEY);
  }
};

export const getAIProvider = (): 'worker' | 'groq' | 'gemini' | 'openai' => {
  if (typeof window === 'undefined') return 'groq';
  return (localStorage.getItem(STORAGE_AI_PROVIDER) as any) || 'groq';
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
    return { ok: false, error: 'לא הוגדר URL עבור הוורקר.' };
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

export interface ChatHistoryEntry {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

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
    location?: string;
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
  chatHistory?: ChatHistoryEntry[];
}

/**
 * Call Groq directly from client if key is configured (Ultra-fast LLM conversation)
 */
async function callGroqDirect(
  query: string,
  systemPrompt: string,
  history: ChatHistoryEntry[] = [],
  apiKey: string
): Promise<{ text: string; actions?: ChatAction[] } | null> {
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
      { role: 'user', content: query }
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.3,
        max_tokens: 1800,
        response_format: { type: 'json_object' }
      })
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          text: parsed.text || parsed.answer || parsed.message || content,
          actions: parsed.actions || []
        };
      }
    }
  } catch (err) {
    console.warn('Direct Groq call error:', err);
  }
  return null;
}

/**
 * Call Gemini directly from client if key is configured
 */
async function callGeminiDirect(
  query: string,
  systemPrompt: string,
  history: ChatHistoryEntry[] = [],
  apiKey: string
): Promise<{ text: string; actions?: ChatAction[] } | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nהיסטוריית שיחה:\n${JSON.stringify(history.slice(-4))}\n\nשאילתת משתמש: ${query}` }] }
          ],
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 1800 }
        })
      }
    );

    if (res.ok) {
      const data = await res.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          text: parsed.text || parsed.answer || parsed.message || content,
          actions: parsed.actions || []
        };
      }
    }
  } catch (err) {
    console.warn('Direct Gemini call error:', err);
  }
  return null;
}

/**
 * Main AI Copilot invocation:
 * 1. Direct LLM (Groq / Gemini) if user has a free API key for instant unlimited reasoning
 * 2. Cloudflare Worker AI endpoint (/api/chat)
 * 3. Deep Hebrew Semantic Reasoning Engine
 */
export const askWorkerAI = async (
  query: string,
  context: ChatContextPayload
): Promise<{ text: string; actions?: ChatAction[] } | null> => {
  const directKey = getDirectAIKey();
  const provider = getAIProvider();

  const systemPrompt = `אתה ה-AI Copilot האישי והאינטראקטיבי של מערכת ClaimAI Control Center.
אתה לא משיב תשובות גנריות! אתה סוכן אינטליגנטי, רהוט, בעל חשיבה עסקית חדה ושיחה שוטפת בעברית.

המשתמש שמדבר איתך: ${context.currentUser?.name || 'משתמש'} (${context.currentUser?.role || 'מנהל'}).

תפקידך:
1. לספק תובנות עסקיות חכמות על לקוחות, התנגדויות ("יקר", "עובד בבאפי", "אין זמן"), סיכויי נטישה והמלצות אינגייג'מנט.
2. לסייע בניווט במערכת: בלחיצת כפתור לפתוח כרטיסי לקוח, לעבור בין מסכים (CRM, משימות, דוח ללא תיקים, תקלות מוצר), לפתוח שיחת וואטסאפ או חיוג.
3. לקשר לאינטרנט: עבור כל לקוח/סוכנות שמוזכרים, חפש קישור רלוונטי ברשת (למשל חיפוש גוגל: https://www.google.com/search?q=...) כדי שהמשתמש יוכל לחקור עליהם מיד.
4. לשוחח בחופשיות על כל שאלה, לענות בהומור מקצועי, לזכור את ההקשר של השיחה ולהציע צעדים הבאים פרקטיים.

נתונים זמינים:
- סטטיסטיקה: ${JSON.stringify(context.stats || {})}
- לקוחות רלוונטיים: ${JSON.stringify(context.matchedClients || [])}
- תקלות/משימות מוצר: ${JSON.stringify(context.matchedTickets || [])}
- טבלאות נוספות: ${JSON.stringify(context.customTablesSummary || [])}

חובה להחזיר JSON תקין בלבד במבנה הבא:
{
  "text": "תשובה שיחתית מפורטת ועשירה ב-Markdown בעברית, כולל ניתוח, תובנות מעשיות, וקישורים חיצוניים שימושיים",
  "actions": [
    { "type": "open_client" | "open_ticket" | "navigate_tab" | "whatsapp" | "call" | "web_link", "payload": "מזהה / טלפון / טאב / כתובת URL", "label": "תווית כפתור פעולה עם אימוג'י" }
  ]
}`;

  // 1. Direct LLM Call if API key configured (Instant LPU reasoning)
  if (directKey) {
    if (provider === 'gemini') {
      const res = await callGeminiDirect(query, systemPrompt, context.chatHistory, directKey);
      if (res && res.text) return res;
    } else {
      const res = await callGroqDirect(query, systemPrompt, context.chatHistory, directKey);
      if (res && res.text) return res;
    }
  }

  // 2. Cloudflare Worker AI Proxy (/api/chat)
  if (isWorkerConfigured()) {
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

      if (res.ok) {
        const data = await res.json();
        if (data && data.text && data.text.length > 10) {
          return {
            text: data.text,
            actions: data.actions || [],
          };
        }
      }
    } catch (err) {
      console.warn('Worker chat error:', err);
    }
  }

  return null;
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
  return getLocalClientAdvice(client, openTickets);
};

export const getLocalClientAdvice = (client: any, openTickets: any[] = []): ClientEngagementAdvice => {
  const status = client.status || "1'st Lead";
  const notes = (client.lastNote || '').toLowerCase();
  
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
    keyInsights.push('הלקוח נמצא בשלבי היכרות ראשוניים — המטרה המרכזית היא תיאום הדגמה חיה ממוקדת.');
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
      title: 'בדיקת קצב הזנת תביעות שבועי',
      detail: 'לוודא שהפקידה לא נתקלת בבאגים במודול המסמכים או בתאימות מול באפי.',
      priority: 'Medium',
    });
  }

  const clientName = client.name ? client.name.split(' ')[0] : 'שלום';
  const suggestedWhatsApp = `היי ${clientName}, מה שלומך? רציתי לשמוע איך הולך עם בדיקת המערכת של ClaimAI, והאם נוח לתאם שיחה קצרה להראות לך כמה תכונות חדשות שיחסכו לכם שעות בכל פתיחת תביעה?`;

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

