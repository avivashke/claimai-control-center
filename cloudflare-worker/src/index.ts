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
  const { query, currentUser, clientsSummary = [], productSummary = [] } = body;
  const userName = currentUser?.name || 'משתמש';

  const systemPrompt = `אתה עוזר ה-AI הרשמי של ClaimAI Control Center (מרכז השליטה האוטומטי לתביעות ביטוח בישראל).
אתה מדבר בעברית מקצועית, שירותית וממוקדת.
אתה מקבל שאילתה מ-${userName}.
יש לך גישה למידע בזמן אמת על לקוחות ה-CRM ומשימות המוצר של המערכת.
שים לב:
- כאשר רלוונטי, הפנה ללקוח ספציפי או לתקלה ספציפית לפי ה-ID שלהם.
- השב בפורמט JSON בלבד בצורה הבאה:
{
  "text": "התשובה המפורטת בעברית עם אימוג'ים ופסקאות נוחות",
  "actions": [
    { "type": "open_client" | "open_ticket" | "navigate_tab" | "whatsapp", "payload": "id או טאב", "label": "תווית כפתור פעולה" }
  ]
}`;

  const userContext = `שאילתת משתמש: "${query}"

תמונת מצב CRM (מדגם לקוחות דחופים ופעילים):
${JSON.stringify(clientsSummary.slice(0, 15), null, 2)}

תמונת מצב משימות מוצר ותקלות:
${JSON.stringify(productSummary.slice(0, 15), null, 2)}`;

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
        max_tokens: 1024,
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
  return buildSmartFallbackResponse(query, clientsSummary, productSummary);
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
  clients: Array<{ id: string; name: string; company?: string; status: string; phone?: string; requiresAttention?: boolean }>,
  tickets: Array<{ id: string; title: string; priority: string; status: string; client?: string }>
): { text: string; actions: ChatAction[] } {
  const q = query.toLowerCase();

  if (q.includes('דחוף') || q.includes('טיפול') || q.includes('urgent')) {
    const urgent = clients.filter((c) => c.requiresAttention || c.status === 'Urgent');
    const actions: ChatAction[] = urgent.slice(0, 3).map((c) => ({
      type: 'open_client',
      payload: c.id,
      label: `👤 כרטיס לקוח: ${c.name}`,
    }));
    actions.push({ type: 'navigate_tab', payload: 'myday', label: '⚡ למסך "היום שלי"' });

    return {
      text: `🚨 **אותרו ${urgent.length} לקוחות בעדיפות גבוהה / דורשים טיפול ב-CRM.**\nה-Worker סרק את הרשומות וממליץ להתחיל במעקב עם הלקוחות המובילים.`,
      actions,
    };
  }

  return {
    text: `🤖 **תשובת Cloudflare Worker AI:**\nקיבלתי את השאילתה שלך: "${query}".\nהמערכת מנטרת כעת ${clients.length} לקוחות ו-${tickets.length} משימות מוצר ותקלות פעילות.`,
    actions: [
      { type: 'navigate_tab', payload: 'crm', label: '👥 פתח מודול CRM' },
      { type: 'navigate_tab', payload: 'product', label: '🚀 פתח מודול מוצר' },
    ],
  };
}
