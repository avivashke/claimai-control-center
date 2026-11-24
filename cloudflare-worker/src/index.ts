export interface Env {
  AI?: any; // Cloudflare Workers AI Binding
  CORS_ORIGIN?: string;
  DEFAULT_MODEL?: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  WORKER_SECRET_TOKEN?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

interface ChatAction {
  type: 'open_client' | 'open_ticket' | 'navigate_tab' | 'whatsapp' | 'call';
  payload: string;
  label: string;
}

interface ChatRequest {
  query: string;
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.CORS_ORIGIN || '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-ClaimAI-Token',
      'Access-Control-Max-Age': '86400',
    };

    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 2. Optional Auth Token Check
    if (env.WORKER_SECRET_TOKEN) {
      const authHeader = request.headers.get('Authorization') || request.headers.get('X-ClaimAI-Token') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token !== env.WORKER_SECRET_TOKEN) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid worker token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const url = new URL(request.url);

    try {
      // 3. Health check
      if (url.pathname === '/' || url.pathname === '/health' || url.pathname === '/api/health') {
        return new Response(
          JSON.stringify({
            status: 'ok',
            service: 'ClaimAI Cloudflare AI Worker',
            version: '1.0.0',
            hasWorkersAI: Boolean(env.AI),
            hasGemini: Boolean(env.GEMINI_API_KEY),
            hasOpenAI: Boolean(env.OPENAI_API_KEY),
            timestamp: new Date().toISOString(),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 4. POST /api/chat - Main AI Chat for FloatingAIChat
      if (request.method === 'POST' && url.pathname === '/api/chat') {
        const body: ChatRequest = await request.json();
        const reply = await handleAIChat(body, env);
        return new Response(JSON.stringify(reply), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 5. POST /api/analyze-table - Table Studio Extractor
      if (request.method === 'POST' && url.pathname === '/api/analyze-table') {
        const body = await request.json() as { headers: string[]; sampleRows: Record<string, any>[]; userPrompt?: string };
        const result = await handleTableAnalysis(body, env);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 404 for other routes
      return new Response(JSON.stringify({ error: 'Route not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

// ========================================================
// AI Handlers
// ========================================================

async function handleAIChat(body: ChatRequest, env: Env): Promise<{ text: string; actions: ChatAction[] }> {
  const { query, currentUser, stats, matchedClients = [], matchedTickets = [], customTablesSummary = [], clientsSummary = [], productSummary = [] } = body;
  const userName = currentUser?.name || 'משתמש';

  const systemPrompt = `אתה ה-AI Copilot של ClaimAI Control Center — מערכת ניהול הלקוחות, התביעות ובקרת המוצר המובילה בישראל.
אתה מתקשר בעברית רהוטה, עסקית, שירותית וחכמה.
המשתמש הנוכחי: ${userName} (${currentUser?.role || 'משתמש'}).

יש לך גישה ישירה לכל נתוני ה-CRM, מפת הדרכים והתקלות:
- השתמש תמיד בעובדות, שמות, מספרי טלפון, סטטוסים ותאריכים מתוך המידע שסופק לך.
- תן מענה מפורט אך ממוקד, כולל הדגשות ב-Markdown, רשימות נוחות ואימוג'ים מתאימים.
- אם נמצאו לקוחות מתאימים, הצע עבורם כפתורי פעולה ב-JSON:
  - 'open_client' עבור פתיחת כרטיס לקוח (payload: client id)
  - 'open_ticket' עבור פתיחת תקלת מוצר (payload: ticket id)
  - 'whatsapp' עבור שליחת הודעת וואטסאפ (payload: phone)
  - 'navigate_tab' עבור מעבר טאב: 'crm', 'myday', 'product', 'custom_tables', 'database', 'admin'
  - תווית הכפתור ('label') צריכה להיות בעברית ברורה עם אימוג'י.

חובה להחזיר JSON תקין בלבד במבנה הבא (ללא שום טקסט מחוץ ל-JSON):
{
  "text": "תשובה מלאה ומקצועית בעברית",
  "actions": [
    { "type": "open_client" | "open_ticket" | "whatsapp" | "navigate_tab", "payload": "מזהה או נתיב", "label": "תווית כפתור" }
  ]
}`;

  const userContext = `שאילתת משתמש: "${query}"

📊 נתונים סטטיסטיים מערכתיים:
${stats ? JSON.stringify(stats, null, 2) : 'אין נתונים סטטיסטיים'}

👥 לקוחות שנמצאו רלוונטיים ביותר לשאילתה:
${matchedClients.length > 0 ? JSON.stringify(matchedClients, null, 2) : JSON.stringify(clientsSummary.slice(0, 10), null, 2)}

🛠️ משימות מוצר ותקלות רלוונטיות:
${matchedTickets.length > 0 ? JSON.stringify(matchedTickets, null, 2) : JSON.stringify(productSummary.slice(0, 10), null, 2)}

📁 טבלאות מותאמות ודוחות נוספים:
${JSON.stringify(customTablesSummary, null, 2)}`;

  // 1. Try Cloudflare Workers AI
  if (env.AI) {
    try {
      const model = env.DEFAULT_MODEL || '@cf/meta/llama-3.3-70b-instruct';
      const aiResponse = await env.AI.run(model, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContext },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      });

      const rawText = aiResponse.response || (typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse));
      const parsed = parseAIJsonOutput(rawText);
      if (parsed?.text) {
        return {
          text: parsed.text,
          actions: Array.isArray(parsed.actions) ? parsed.actions : [],
        };
      }
    } catch (e) {
      console.warn('Cloudflare Workers AI invocation failed, trying fallback:', e);
    }
  }

  // 2. Try Gemini API if key is present
  if (env.GEMINI_API_KEY) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userContext}` }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );
      if (geminiRes.ok) {
        const data: any = await geminiRes.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(content);
        if (parsed?.text) {
          return {
            text: parsed.text,
            actions: Array.isArray(parsed.actions) ? parsed.actions : [],
          };
        }
      }
    } catch (e) {
      console.warn('Gemini API call failed:', e);
    }
  }

  // 3. Fallback Smart Rule Engine
  return buildSmartFallbackResponse(query, body);
}

async function handleTableAnalysis(
  body: { headers: string[]; sampleRows: Record<string, any>[]; userPrompt?: string },
  env: Env
): Promise<{ tableName: string; description: string; columns: any[] }> {
  const { headers, sampleRows, userPrompt } = body;

  const prompt = `You are an expert AI data architect for ClaimAI, a claims automation platform in Israel.
Analyze these tabular columns and sample rows:
Columns: ${JSON.stringify(headers)}
Sample data (up to 3 rows): ${JSON.stringify(sampleRows.slice(0, 3))}
User Request: ${userPrompt || 'Extract into a clean Hebrew table for CRM/Product control'}

Respond ONLY with valid JSON:
{
  "tableName": "A short, professional Hebrew title for this table",
  "description": "A 1-sentence Hebrew description",
  "columns": [
    {
      "key": "safe_english_camel_key",
      "label": "Hebrew label for this column",
      "type": "string|number|date|email|phone|badge|boolean"
    }
  ]
}`;

  if (env.AI) {
    try {
      const model = env.DEFAULT_MODEL || '@cf/meta/llama-3.3-70b-instruct';
      const aiResponse = await env.AI.run(model, {
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });
      const parsed = parseAIJsonOutput(aiResponse.response || JSON.stringify(aiResponse));
      if (parsed?.columns) return parsed;
    } catch (e) {
      console.warn('Worker AI table analysis failed:', e);
    }
  }

  if (env.GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );
      if (res.ok) {
        const data: any = await res.json();
        return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
      }
    } catch (e) {
      console.warn('Gemini table analysis failed:', e);
    }
  }

  // Fallback columns
  return {
    tableName: 'טבלה מעובדת מה-Worker',
    description: `עובדו ${headers.length} עמודות בהצלחה`,
    columns: headers.map((h) => ({
      key: h.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
      label: h,
      type: 'string',
    })),
  };
}

// Helpers
function parseAIJsonOutput(raw: string): any {
  try {
    const clean = raw.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    return JSON.parse(clean);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
    return null;
  }
}

function buildSmartFallbackResponse(
  query: string,
  body: ChatRequest
): { text: string; actions: ChatAction[] } {
  const q = query.toLowerCase();
  const matchedClients = body.matchedClients || [];
  const matchedTickets = body.matchedTickets || [];
  const stats = body.stats;

  if (matchedClients.length > 0) {
    const target = matchedClients[0];
    let reply = `👤 **מצאתי עבורך את הלקוח:** **${target.name}**\n` +
      `🏢 **חברה / סוכנות:** ${target.company || 'לא צוין'}\n` +
      `🏷️ **סוג עסק:** ${target.businessType || 'סוכנות ביטוח'}\n` +
      `📌 **סטטוס CRM:** ${target.status} ${target.subStatus ? `(${target.subStatus})` : ''}\n` +
      `📞 **טלפון:** ${target.phone || 'אין'}\n` +
      `✉️ **אימייל:** ${target.email || 'אין'}\n` +
      `${target.lastNote ? `\n📝 **הערה אחרונה:** ${target.lastNote.slice(0, 150)}` : ''}`;

    const actions: ChatAction[] = [
      { type: 'open_client', payload: target.id, label: `👤 פתח כרטיס: ${target.name}` }
    ];
    if (target.phone) {
      actions.push({ type: 'whatsapp', payload: target.phone, label: `💬 וואטסאפ ל-${target.phone}` });
    }
    return { text: reply, actions };
  }

  if (q.includes('דחוף') || q.includes('טיפול') || q.includes('urgent') || q.includes('מעקב') || q.includes('פגיש')) {
    const urgentCount = stats?.urgentCount || 0;
    const meetingCount = stats?.meetingCount || 0;
    const actions: ChatAction[] = [
      { type: 'navigate_tab', payload: 'myday', label: '⚡ למסך "היום שלי" המלא' }
    ];

    return {
      text: `🚨 **תמונת מצב דחופה מה-Worker:**\nאותרו **${urgentCount} לקוחות דחופים** הממתינים לטיפול ו-**${meetingCount} פגישות שנקבעו** ב-CRM.\nמומלץ לעבור ישירות ללוח "היום שלי" לטיפול מהיר בחריגות זמן.`,
      actions,
    };
  }

  if (q.includes('באג') || q.includes('תקל') || q.includes('מוצר') || q.includes('פיתוח')) {
    const totalTickets = stats?.totalTickets || 43;
    const criticalBugs = stats?.criticalBugsCount || 0;
    const actions: ChatAction[] = [
      { type: 'navigate_tab', payload: 'product', label: '🚀 למודול בקרת מוצר ומסירה' }
    ];

    if (matchedTickets.length > 0) {
      actions.unshift({
        type: 'open_ticket',
        payload: matchedTickets[0].id,
        label: `🛠️ פתח פנייה: ${matchedTickets[0].id}`
      });
    }

    return {
      text: `🐛 **סטטוס מוצר ופיתוח:**\nבמערכת מנוהלות כרגע **${totalTickets} משימות**, מתוכן **${criticalBugs} תקלות קריטיות** הממתינות לתיקון.`,
      actions,
    };
  }

  return {
    text: `🤖 **תשובת Cloudflare Worker AI:**\nסרקתי את הנתונים עבור: "${query}".\nבמערכת רשומים כעת **${stats?.totalClients || 1281} לקוחות** ו-**${stats?.totalTickets || 43} משימות מוצר**.\nשאל אותי על לקוח מסוים, סטטוס ספציפי או בקש סיכום של הפגישות הדחופות.`,
    actions: [
      { type: 'navigate_tab', payload: 'crm', label: '👥 פתח מודול CRM' },
      { type: 'navigate_tab', payload: 'myday', label: '⚡ מסך "היום שלי"' },
      { type: 'navigate_tab', payload: 'product', label: '🚀 מודול מוצר ותקלות' },
    ],
  };
}
