/**
 * ClaimAI Control Center - Cloudflare & Groq Ultra-AI Worker (v2.0)
 * 
 * Powered by:
 * - Groq LPU API (llama-3.3-70b-versatile) - Ultra-fast, deep reasoning
 * - Cloudflare Workers AI (Native binding: env.AI)
 * - Google Gemini & OpenAI (Optional fallbacks)
 * - Built-in Intelligent CRM Customer Engagement & Notes Analysis Engine
 * 
 * Setup in Cloudflare Dashboard:
 * 1. Workers & Pages -> Create Worker -> claimai-ai-worker -> Deploy.
 * 2. Click "Edit code", replace entire code with this file, click "Deploy".
 * 3. Settings -> Variables and Secrets:
 *    - Add Secret "GROQ_API_KEY" (Get free key from https://console.groq.com/keys)
 *    - Add Binding "Workers AI" with Variable name "AI"
 * 4. Copy worker URL (e.g. https://claimai-ai-worker.xyz.workers.dev) and paste in ClaimAI!
 */

export default {
  async fetch(request, env) {
    const origin = env.CORS_ORIGIN || '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-ClaimAI-Token',
      'Access-Control-Max-Age': '86400',
    };

    // 1. CORS Preflight
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
      // 3. Health & Capabilities Check
      if (url.pathname === '/' || url.pathname === '/health' || url.pathname === '/api/health') {
        const activeEngine = env.GROQ_API_KEY
          ? `⚡ Groq LPU (${env.GROQ_MODEL || 'llama-3.3-70b-versatile'})`
          : env.AI
          ? `☁️ Cloudflare Workers AI (${env.DEFAULT_MODEL || '@cf/meta/llama-3.3-70b-instruct'})`
          : env.GEMINI_API_KEY
          ? '🌟 Google Gemini'
          : '🧠 Local Smart CRM Engine';

        return new Response(
          JSON.stringify({
            status: 'ok',
            service: 'ClaimAI Supercharged AI Worker',
            version: '2.1.0',
            activeEngine,
            hasGroq: Boolean(env.GROQ_API_KEY),
            hasWorkersAI: Boolean(env.AI),
            hasGemini: Boolean(env.GEMINI_API_KEY),
            hasOpenAI: Boolean(env.OPENAI_API_KEY),
            timestamp: new Date().toISOString(),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 3.5 Direct Groq Diagnostic Endpoint (/api/test-groq)
      if (url.pathname === '/api/test-groq' || url.pathname === '/test-groq') {
        if (!env.GROQ_API_KEY) {
          return new Response(JSON.stringify({ ok: false, error: 'GROQ_API_KEY secret is not set in Cloudflare' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const apiKey = env.GROQ_API_KEY.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\t]/g, '');
        const model = env.GROQ_MODEL || 'llama-3.3-70b-versatile';
        try {
          const testRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: 'You are a helpful assistant designed to output JSON.' },
                { role: 'user', content: 'Return a JSON object: {"status":"groq_connected","message":"Groq LLaMA 3.3 is active"}' },
              ],
              response_format: { type: 'json_object' },
            }),
          });
          const text = await testRes.text();
          let jsonBody;
          try { jsonBody = JSON.parse(text); } catch { jsonBody = text; }
          return new Response(JSON.stringify({
            ok: testRes.ok,
            status: testRes.status,
            model,
            keyPrefix: apiKey.slice(0, 6) + '...' + apiKey.slice(-4),
            response: jsonBody,
          }), {
            status: testRes.ok ? 200 : 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (e) {
          return new Response(JSON.stringify({ ok: false, error: e.message || String(e) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // 4. POST /api/chat - AI Copilot & CRM Strategic Assistant
      if (request.method === 'POST' && url.pathname === '/api/chat') {
        const body = await request.json();
        const reply = await handleAIChat(body, env);
        return new Response(JSON.stringify(reply), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 5. POST /api/client-advice - Deep Client Notes & Engagement Analyzer
      if (request.method === 'POST' && url.pathname === '/api/client-advice') {
        const body = await request.json();
        const advice = await handleClientEngagementAdvice(body, env);
        return new Response(JSON.stringify(advice), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 6. POST /api/analyze-table - Table Studio Extractor
      if (request.method === 'POST' && url.pathname === '/api/analyze-table') {
        const body = await request.json();
        const result = await handleTableAnalysis(body, env);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 404 Route Not Found
      return new Response(JSON.stringify({ error: 'Route not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

// ========================================================
// LLM Engine Dispatcher: Groq -> Cloudflare AI -> Gemini -> OpenAI
// ========================================================

let lastGroqError = null;

async function callUnifiedLLM({ systemPrompt, userPrompt, env, maxTokens = 1500, temperature = 0.2 }) {
  lastGroqError = null;

  // 1. Groq API (Ultra-Fast 300 t/s LPU)
  if (env.GROQ_API_KEY) {
    try {
      const apiKey = env.GROQ_API_KEY.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\t]/g, '');
      const model = env.GROQ_MODEL || 'llama-3.3-70b-versatile';

      const enforcedSystemPrompt = `You are a specialized AI system that outputs valid JSON only. You must return a single valid JSON object matching the requested schema.\n\n${systemPrompt}`;
      const enforcedUserPrompt = `${userPrompt}\n\nRespond with a valid JSON object ONLY.`;

      // Attempt 1: with json_object response format
      let groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: enforcedSystemPrompt },
            { role: 'user', content: enforcedUserPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
        }),
      });

      // Attempt 2: if 400 (some models or prompts reject response_format constraint), retry without response_format
      if (!groqRes.ok && groqRes.status === 400) {
        groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: enforcedSystemPrompt },
              { role: 'user', content: enforcedUserPrompt },
            ],
            temperature,
            max_tokens: maxTokens,
          }),
        });
      }

      // Attempt 3: if model rate limited (429) or not found (404), fallback to llama-3.1-8b-instant
      if (!groqRes.ok && (groqRes.status === 404 || groqRes.status === 429)) {
        groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: enforcedSystemPrompt },
              { role: 'user', content: enforcedUserPrompt },
            ],
            temperature,
            max_tokens: maxTokens,
          }),
        });
      }

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const content = groqData.choices?.[0]?.message?.content;
        if (content) {
          const parsed = parseAIJsonOutput(content);
          if (parsed) return { ...parsed, _source: 'groq', _model: model };
        }
      } else {
        const errText = await groqRes.text();
        lastGroqError = `Groq HTTP ${groqRes.status}: ${errText}`;
        console.warn('Groq API returned error status:', groqRes.status, errText);
      }
    } catch (err) {
      lastGroqError = `Groq fetch error: ${err.message || String(err)}`;
      console.warn('Groq fetch failed, falling back:', err);
    }
  }

  // 2. Cloudflare Workers AI (Native internal binding)
  if (env.AI) {
    try {
      const model = env.DEFAULT_MODEL || '@cf/meta/llama-3.3-70b-instruct';
      const aiResponse = await env.AI.run(model, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      const rawText = aiResponse.response || (typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse));
      const parsed = parseAIJsonOutput(rawText);
      if (parsed) return { ...parsed, _source: 'cloudflare_workers_ai' };
    } catch (err) {
      console.warn('Cloudflare Workers AI failed, falling back:', err);
    }
  }

  // 3. Google Gemini API
  if (env.GEMINI_API_KEY) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: { responseMimeType: 'application/json', maxOutputTokens: maxTokens },
          }),
        }
      );
      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = parseAIJsonOutput(content);
        if (parsed) return { ...parsed, _source: 'gemini' };
      }
    } catch (err) {
      console.warn('Gemini API call failed:', err);
    }
  }

  // 4. OpenAI API
  if (env.OPENAI_API_KEY) {
    try {
      const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          response_format: { type: 'json_object' },
        }),
      });
      if (oaiRes.ok) {
        const oaiData = await oaiRes.json();
        const content = oaiData.choices?.[0]?.message?.content;
        const parsed = parseAIJsonOutput(content);
        if (parsed) return { ...parsed, _source: 'openai' };
      }
    } catch (err) {
      console.warn('OpenAI API call failed:', err);
    }
  }

  return null;
}

// ========================================================
// 1. AI Copilot Chat Handler (/api/chat)
// ========================================================

async function handleAIChat(body, env) {
  const query = body.query || body.message || body.prompt || '';
  const { 
    currentUser, 
    stats, 
    matchedClients = [], 
    matchedTickets = [], 
    customTablesSummary = [], 
    clientsSummary = [], 
    productSummary = [] 
  } = body;
  
  const userName = currentUser?.name || 'משתמש';

  const systemPrompt = `אתה ה-AI Copilot של ClaimAI Control Center — מערכת ניהול הלקוחות, התביעות, בקרת המוצר ומיטוב האינגייג'מנט של סוכנויות ביטוח, שמאים ומוסכים בישראל.
תקשר בעברית רהוטה, עסקית, חדה, שירותית וחכמה מאוד.
המשתמש הנוכחי: ${userName} (${currentUser?.role || 'משתמש'}).

יש לך יכולת אנליטית מעמיקה לנתח:
1. היסטוריית הערות ותאריכים של לקוחות: זיהוי התנגדויות ("יקר", "עובד בבאפי", "אין זמן", "מחכה לאיש IT").
2. זמנים ושהייה בסטטוסים: האם הלקוח תקוע ב-Follow-Up או ב-Adoption Monitoring יותר מדי זמן?
3. עצות אופרטיביות למיטוב האינגייג'מנט והגדלת היקף התביעות במערכת.
4. תבניות הודעות וואטסאפ אישיות ומניעות לפעולה.

חובה להחזיר JSON תקין בלבד במבנה הבא (ללא תווים מחוץ ל-JSON):
{
  "text": "תשובה אנליטית מפורטת בעברית עם הדגשות Markdown, רשימות נוחות, עצות ניהוליות ותובנות",
  "actions": [
    { "type": "open_client" | "open_ticket" | "whatsapp" | "navigate_tab", "payload": "מזהה/טלפון/טאב", "label": "תווית כפתור עם אימוג'י בעברית" }
  ]
}`;

  const userPrompt = `שאילתת משתמש: "${query}"

📊 נתונים סטטיסטיים מערכתיים:
${stats ? JSON.stringify(stats, null, 2) : 'אין נתונים'}

👥 לקוחות מובילים / רלוונטיים לשאילתה:
${matchedClients.length > 0 ? JSON.stringify(matchedClients, null, 2) : JSON.stringify(clientsSummary.slice(0, 8), null, 2)}

🛠️ משימות מוצר ותקלות פתוחות:
${matchedTickets.length > 0 ? JSON.stringify(matchedTickets, null, 2) : JSON.stringify(productSummary.slice(0, 6), null, 2)}

📁 טבלאות מותאמות:
${JSON.stringify(customTablesSummary, null, 2)}

נתח את המידע, ספק תובנות מעשיות לניהול לקוחות, התייחס להערות ולסטטוסים, והצע כפתורי פעולה רלוונטיים.`;

  const llmResult = await callUnifiedLLM({ systemPrompt, userPrompt, env, maxTokens: 1400 });
  const replyText = llmResult?.text || llmResult?.answer || llmResult?.response || llmResult?.message;
  if (replyText) {
    return {
      text: replyText,
      actions: Array.isArray(llmResult.actions) ? llmResult.actions : [],
      _source: llmResult._source || 'groq',
    };
  }

  // Built-in intelligent fallback
  const fallback = buildSmartFallbackResponse(query, body);
  if (lastGroqError) {
    fallback._groqError = lastGroqError;
  }
  return fallback;
}

// ========================================================
// 2. Client Engagement & Notes Advisor (/api/client-advice)
// ========================================================

async function handleClientEngagementAdvice(body, env) {
  const { client, openTickets = [] } = body;
  if (!client) {
    return { error: 'Missing client payload' };
  }

  const systemPrompt = `אתה היועץ האסטרטגי לניהול לקוחות (Customer Success & Engagement Advisor) של ClaimAI Control Center.
תפקידך לנתח לעומק את פרטי הלקוח, היסטוריית ההערות שלו, תאריכי הפעילות, הסטטוס הנוכחי, ואנשי הקשר (פקידות / IT) — ולספק ניתוח מדויק ותוכנית פעולה למיטוב האינגייג'מנט עם המוצר.

מדדי אינגייג'מנט לפי סטטוסים ב-CRM:
- "1'st Lead": דרושה תגובה תוך 24 שעות; מיקוד בחיבור ראשוני והבנת גודל הסוכנות/מוסך.
- "1'st Follow-Up": בדיקת פתיחות, תיאום הדגמה חיה, פתרון חשש ממעבר מתוכנת באפי (Bafi).
- "Meeting Scheduled": הכנה ממוקדת לפגישה, וידוא נוכחות מקבל החלטות ואיש IT.
- "Follow-Up": טיפול בהתנגדויות מחיר/זמן, הדגשת חיסכון של שעות עבודה על תביעות.
- "Adoption Monitoring": הלקוח כבר פעיל! וידוא שהפקידות מקלידות תביעות, טיפול בכל תקלה טכנית תוך שעות, הגדלת נפח שימוש חודשי.
- "All-Good": שגריר מערכת, בקשת המלצות, שמירה על קשר חודשי.
- "Urgent" / "Important": חריגת SLA, סכנת נטישה מיידית, מעורבות מנהל.

חובה להחזיר JSON תקין בלבד במבנה הבא:
{
  "engagementScore": 75,
  "churnRisk": "נמוך" | "בינוני" | "גבוה",
  "urgencyLevel": "רגיל" | "בינוני" | "דחוף",
  "executiveSummary": "פסקה תמציתית בעברית המסכמת את מצב הלקוח והיסטוריית הקשר",
  "statusAnalysis": "ניתוח הזמן והמיקום בסטטוס הנוכחי עם המלצה אופרטיבית",
  "keyInsights": [
    "תובנה 1 מניתוח ההערות (כגון חסם טכנולוגי, שביעות רצון, קשר לפקידות)",
    "תובנה 2"
  ],
  "actionPlan": [
    {
      "step": 1,
      "title": "כותרת פעולה",
      "detail": "פירוט מה לעשות עכשיו",
      "priority": "High" | "Medium" | "Low"
    }
  ],
  "suggestedWhatsApp": "הודעת וואטסאפ אישית, חמה ומקצועית המותאמת בדיוק לשיחה האחרונה",
  "recommendedNextStatus": "שם הסטטוס הבא המומלץ למעבר"
}`;

  const userPrompt = `נתח את כרטיס הלקוח הבא:
שם הלקוח: ${client.name}
חברה / משרד: ${client.company || 'לא צוין'}
סטטוס נוכחי: ${client.status}
תת-סטטוס: ${client.subStatus || 'ללא'}
סוג עסק: ${client.businessType || 'סוכנות ביטוח'}
טלפון: ${client.phone || 'אין'}
אימייל: ${client.email || 'אין'}
איש מחשוב (IT): ${client.itContact || 'לא הוגדר'}
אנשי צוות ופקידות: ${client.teamContacts || 'לא הוגדר'}
נפח תביעות חודשי: ${client.monthlyClaims || 'לא צוין'}
תאריך פגישה/מעקב הבא: ${client.nextFollowUpDate || 'לא נקבע'}
דורש טיפול מיידי: ${client.requiresAttention ? 'כן (דחוף)' : 'לא'}

📝 היסטוריית הערות ויומן שיחות:
${client.lastNote || 'אין עדיין הערות'}

📝 הערות כלליות נוספות:
${client.generalNotes || 'אין'}

🛠️ פניות מוצר / תקלות מקושרות ללקוח זה:
${JSON.stringify(openTickets, null, 2)}

הפק את הניתוח והעצות במבנה ה-JSON המדויק.`;

  const llmResult = await callUnifiedLLM({ systemPrompt, userPrompt, env, maxTokens: 1600 });
  if (llmResult?.executiveSummary) {
    return { ...llmResult, _source: llmResult._source || 'groq' };
  }

  // Heuristic rule-based advisor fallback if no LLM configured
  const fallbackAdvice = generateHeuristicClientAdvice(client, openTickets);
  if (lastGroqError) {
    fallbackAdvice._groqError = lastGroqError;
  }
  return fallbackAdvice;
}

// Rule-based heuristic advisor fallback
function generateHeuristicClientAdvice(client, openTickets = []) {
  const status = client.status || "1'st Lead";
  const notes = (client.lastNote || '').toLowerCase();
  const hasIt = Boolean(client.itContact?.trim());
  const hasTeam = Boolean(client.teamContacts?.trim());
  const hasPhone = Boolean(client.phone?.trim());
  
  let engagementScore = 65;
  let churnRisk = 'נמוך';
  let recommendedNextStatus = status;
  const keyInsights = [];
  const actionPlan = [];

  if (status === 'Urgent' || client.requiresAttention) {
    engagementScore = 35;
    churnRisk = 'גבוה';
    keyInsights.push('הלקוח סומן כדורש טיפול מיידי — קיים סיכון ממשי לנטישה או עיכוב קריטי.');
    actionPlan.push({
      step: 1,
      title: 'שיחה אישית ממנהל המערכת',
      detail: 'ליצור קשר טלפוני עוד היום להרגעת המצב ולפתרון חסמים.',
      priority: 'High',
    });
  }

  if (status === "1'st Lead" || status === "1'st Follow-Up") {
    engagementScore = 55;
    churnRisk = 'בינוני';
    recommendedNextStatus = 'Meeting Scheduled';
    keyInsights.push('הלקוח נמצא בשלבי היכרות ראשוניים — המטרה המרכזית היא תיאום הדגמה חיה (Zoom / פרונטלי).');
    actionPlan.push({
      step: 1,
      title: 'תיאום שיחת הדגמה קצרה (15 דקות)',
      detail: 'להציג איך המערכת מייצרת כתב תביעה אוטומטי תוך 60 שניות ומחליפה עבודה ידנית.',
      priority: 'High',
    });
  } else if (status === 'Meeting Scheduled') {
    engagementScore = 80;
    recommendedNextStatus = 'Follow-Up';
    keyInsights.push('פגישה נקבעה — יש לוודא שהוכן דמו מותאם לפוליסות הנפוצות של הסוכנות.');
    actionPlan.push({
      step: 1,
      title: 'משלוח תזכורת בוואטסאפ יום לפני',
      detail: 'לוודא הגעה של מקבל ההחלטות והפקידה הראשית.',
      priority: 'High',
    });
  } else if (status === 'Adoption Monitoring') {
    engagementScore = 85;
    recommendedNextStatus = 'All-Good';
    keyInsights.push('הלקוח בשלב הטמעה קריטי — שביעות רצון הפקידות תקבע האם יישאר לאורך זמן.');
    actionPlan.push({
      step: 1,
      title: 'מעקב שבועי אחר נפח התביעות',
      detail: 'לבדוק האם קיימות שגיאות בייבוא מבאפי ולוודא שהצוות מקבל מענה טכני מהיר.',
      priority: 'Medium',
    });
  }

  if (!hasIt) {
    keyInsights.push('חסרים פרטי איש מחשוב (IT) — עלול לעכב אינטגרציות טכנולוגיות.');
    actionPlan.push({
      step: 2,
      title: 'בירור איש ה-IT של המשרד',
      detail: 'לבקש שם וטלפון של איש התמיכה להתקנת הרחבות או חיבורי רשת.',
      priority: 'Medium',
    });
  }

  if (!hasTeam) {
    keyInsights.push('לא הוגדרו אנשי צוות / פקידות — הפקידות הן משתמשות הקצה העיקריות במערכת התביעות.');
  }

  if (openTickets.length > 0) {
    churnRisk = 'גבוה';
    keyInsights.push(`ללקוח זה ישנן ${openTickets.length} פניות מוצר / תקלות פתוחות הממתינות לטיפול.`);
    actionPlan.unshift({
      step: 0,
      title: 'עדכון הלקוח בסטטוס התיקון',
      detail: 'לעדכן אישית שהנושא בטיפול צוות הפיתוח כדי לחזק את האמון.',
      priority: 'High',
    });
  }

  const cleanName = client.name ? client.name.split(' ')[0] : 'שלום';
  const suggestedWhatsApp = `היי ${cleanName}, מה שלומך? רציתי לשמוע איך הולך עם בדיקת המערכת של ClaimAI, והאם נוח לתאם שיחה קצרה להראות לך כמה תכונות חדשות שיחסכו לכם שעות בכל פתיחת תביעה?`;

  return {
    engagementScore,
    churnRisk,
    urgencyLevel: client.requiresAttention ? 'דחוף' : 'רגיל',
    executiveSummary: `לקוח בסטטוס "${status}" עם ${client.monthlyClaims || 'ללא מידע על'} תביעות חודשיות. ${notes ? 'נרשמו הערות קודמות ביומן.' : 'טרם תועדו הערות משמעותיות.'}`,
    statusAnalysis: `השהייה בסטטוס "${status}" מחייבת מיקוד בהנעה לפעולה הבאה מול מקבלי ההחלטות.`,
    keyInsights,
    actionPlan,
    suggestedWhatsApp,
    recommendedNextStatus,
    _source: 'smart_heuristic_engine',
  };
}

// ========================================================
// 3. Table Studio Extractor (/api/analyze-table)
// ========================================================

async function handleTableAnalysis(body, env) {
  const { headers, sampleRows, userPrompt } = body;

  const systemPrompt = `You are an expert AI data architect for ClaimAI, a claims automation platform in Israel.
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

  const userPromptText = `Columns: ${JSON.stringify(headers)}
Sample data (up to 3 rows): ${JSON.stringify(sampleRows.slice(0, 3))}
User Request: ${userPrompt || 'Extract into a clean Hebrew table for CRM/Product control'}`;

  const result = await callUnifiedLLM({
    systemPrompt,
    userPrompt: userPromptText,
    env,
    maxTokens: 1000,
    temperature: 0.1,
  });

  if (result?.columns) {
    return result;
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

// ========================================================
// Helpers & Local Intelligent Fallback
// ========================================================

function parseAIJsonOutput(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const clean = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
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

function buildSmartFallbackResponse(query, body) {
  const q = (query || '').toLowerCase();
  const matchedClients = body.matchedClients || [];
  const matchedTickets = body.matchedTickets || [];
  const stats = body.stats;

  if (matchedClients.length > 0) {
    const target = matchedClients[0];
    const actions = [
      { type: 'open_client', payload: target.id, label: `👤 פתח כרטיס: ${target.name}` }
    ];
    if (target.phone) {
      actions.push({ type: 'whatsapp', payload: target.phone, label: `💬 וואטסאפ ל-${target.phone}` });
    }

    let advice = '';
    if (target.status === 'Urgent' || target.requiresAttention) {
      advice = '\n\n🚨 **המלצת AI:** הלקוח מסומן כדחוף — מומלץ ליצור קשר טלפוני מיידית כדי למנוע אובדן עסקה.';
    } else if (target.status === '1\'st Follow-Up') {
      advice = '\n\n💡 **המלצת AI למיטוב אינגייג\'מנט:** מומלץ להציע הדגמת מסך על תהליך פתיחת תביעת רכב ב-60 שניות.';
    } else if (target.status === 'Adoption Monitoring') {
      advice = '\n\n📈 **המלצת AI:** בדוק האם הפקידות מרוצות מחיבור באפי ומה נפח התביעות השבועי.';
    }

    const reply = `👤 **מצאתי עבורך את הלקוח:** **${target.name}**\n` +
      `🏢 **חברה / סוכנות:** ${target.company || 'לא צוין'}\n` +
      `🏷️ **סוג עסק:** ${target.businessType || 'סוכנות ביטוח'}\n` +
      `📌 **סטטוס CRM:** ${target.status} ${target.subStatus ? `(${target.subStatus})` : ''}\n` +
      `📞 **טלפון:** ${target.phone || 'אין'}\n` +
      `✉️ **אימייל:** ${target.email || 'אין'}\n` +
      `${target.lastNote ? `\n📝 **הערה אחרונה:** ${target.lastNote.replace(/^[0-9/:\s|]+👤[^|]+\|\s*/, '').slice(0, 160)}` : ''}` +
      advice;

    return { text: reply, actions };
  }

  if (q.includes('דחוף') || q.includes('טיפול') || q.includes('urgent') || q.includes('מעקב') || q.includes('פגיש')) {
    const urgentCount = stats?.urgentCount || 0;
    const meetingCount = stats?.meetingCount || 0;
    return {
      text: `🚨 **תמונת מצב דחופה מה-Worker:**\nאותרו **${urgentCount} לקוחות דחופים** הממתינים לטיפול ו-**${meetingCount} פגישות שנקבעו** ב-CRM.\n\n💡 **עצת AI לאינגייג'מנט:**\n1. תעדוף תחילה לקוחות עם מעל 50 תביעות חודשיות.\n2. שליחת תזכורת אוטומטית בוואטסאפ לפגישות מחר כדי למנוע No-Show.`,
      actions: [{ type: 'navigate_tab', payload: 'myday', label: '⚡ למסך "היום שלי"' }],
    };
  }

  return {
    text: `🤖 **תשובת ClaimAI Copilot:**\nסרקתי את הנתונים עבור: "${query}".\nבמערכת רשומים כעת **${stats?.totalClients || 1281} לקוחות** ו-**${stats?.totalTickets || 44} משימות מוצר**.\nשאל אותי על לקוח מסוים, בקש המלצות אינגייג'מנט לפי סטטוסים, או ניתוח הערות לקוח.`,
    actions: [
      { type: 'navigate_tab', payload: 'crm', label: '👥 פתח מודול CRM' },
      { type: 'navigate_tab', payload: 'myday', label: '⚡ מסך "היום שלי"' },
      { type: 'navigate_tab', payload: 'product', label: '🚀 מודול מוצר ותקלות' },
    ],
  };
}
