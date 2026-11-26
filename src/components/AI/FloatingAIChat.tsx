import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  Bot, 
  User, 
  ChevronRight, 
  ExternalLink, 
  Phone, 
  MessageSquare, 
  Building, 
  Bug, 
  Table as TableIcon, 
  CalendarClock, 
  ShieldCheck,
  ArrowRight,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  RefreshCw,
  Globe,
  KeyRound,
  Zap,
  HelpCircle,
  TrendingUp,
  Flame,
  Check
} from 'lucide-react';
import { Client, ProductItem, CustomTable, AppUser } from '../../types';
import { TabType } from '../Header';
import { 
  askWorkerAI, 
  isWorkerConfigured, 
  getWorkerUrl, 
  getWorkerToken,
  setCustomWorkerConfig, 
  clearCustomWorkerConfig, 
  checkWorkerHealth,
  ChatContextPayload,
  getDirectAIKey,
  setDirectAIKey,
  getAIProvider
} from '../../services/aiWorkerService';

export interface ChatAction {
  type: 'open_client' | 'open_ticket' | 'navigate_tab' | 'whatsapp' | 'call' | 'web_link';
  payload: string;
  label: string;
  icon?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  actions?: ChatAction[];
  timestamp: string;
}

interface FloatingAIChatProps {
  clients: Client[];
  productItems: ProductItem[];
  customTables: CustomTable[];
  currentUser: AppUser;
  onSelectClient: (client: Client) => void;
  onSelectTicket: (ticket: ProductItem) => void;
  onNavigateTab: (tab: TabType) => void;
  supabaseConnected: boolean;
  blobsConnected: boolean;
}

export const FloatingAIChat: React.FC<FloatingAIChatProps> = ({
  clients,
  productItems,
  customTables,
  currentUser,
  onSelectClient,
  onSelectTicket,
  onNavigateTab,
  supabaseConnected,
  blobsConnected
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings tab: 'keys' | 'worker'
  const [settingsTab, setSettingsTab] = useState<'keys' | 'worker'>('keys');
  const [showWorkerSettings, setShowWorkerSettings] = useState(false);
  
  // Direct AI Key State (Groq / Gemini)
  const initialProvider = getAIProvider();
  const [directKeyInput, setDirectKeyInput] = useState(getDirectAIKey());
  const [aiProviderInput, setAiProviderInput] = useState<'groq' | 'gemini' | 'openai'>(
    initialProvider === 'worker' ? 'groq' : (initialProvider as 'groq' | 'gemini' | 'openai')
  );
  const [directKeySaved, setDirectKeySaved] = useState(Boolean(getDirectAIKey()));

  // Cloudflare Worker settings state
  const [workerUrlInput, setWorkerUrlInput] = useState(getWorkerUrl());
  const [workerTokenInput, setWorkerTokenInput] = useState(getWorkerToken());
  const [workerStatusMsg, setWorkerStatusMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [isTestingWorker, setIsTestingWorker] = useState(false);
  const [workerConfigured, setWorkerConfigured] = useState(isWorkerConfigured());

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `שלום ${currentUser.name}! אני ה-Copilot החכם של ClaimAI Control Center 🤖. \n\nאני מחובר בזמן אמת לכל מאגר המידע: **${clients.length.toLocaleString()} לקוחות**, **${productItems.length} משימות מוצר ותקלות**, ודוחות הפעילות. \n\nתוכל לבקש ממני:\n- 🧭 **"תעשה לי סיור במערכת"** – הדרכה מלאה על כל מסך וכלי\n- 🚨 **"מי הלקוחות הדחופים היום?"** – מעקב וטיפול מיידי\n- 🔍 **חיפוש לקוח לפי שם, חברה או טלפון** – עם קישורי רשת וואטסאפ\n- 💡 **טיפים לשיחה והתמודדות עם התנגדויות** ("באפי", מחיר וכו')`,
      actions: [
        { type: 'navigate_tab', payload: 'myday', label: '⚡ היום שלי (מעקבים דחופים)' },
        { type: 'navigate_tab', payload: 'crm', label: '👥 פתח טבלת לקוחות מלאה' },
        { type: 'navigate_tab', payload: 'product', label: '🐛 צפה בתקלות קריטיות במוצר' }
      ],
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Handle Saving Direct Key
  const handleSaveDirectKey = () => {
    setDirectAIKey(directKeyInput, aiProviderInput);
    setDirectKeySaved(Boolean(directKeyInput.trim()));
    setWorkerStatusMsg({
      success: true,
      text: directKeyInput.trim() ? `חיבור למודל ${aiProviderInput === 'groq' ? 'Groq (Llama 3.3)' : 'Gemini'} נשמר בהצלחה!` : 'המפתח אופס'
    });
  };

  // Handle Testing & Saving Worker Config
  const handleTestAndSaveWorker = async () => {
    setIsTestingWorker(true);
    setWorkerStatusMsg(null);

    setCustomWorkerConfig(workerUrlInput, workerTokenInput);
    setWorkerConfigured(Boolean(workerUrlInput.trim()));

    try {
      const res = await checkWorkerHealth();
      if (res.ok) {
        setWorkerStatusMsg({
          success: true,
          text: `וורקר פעיל בהצלחה! מנוע: ${res.info?.activeEngine || 'LPU Engine'}`
        });
      } else {
        setWorkerStatusMsg({
          success: false,
          text: `בדיקת וורקר נכשלה: ${res.error || 'שגיאה לא ידועה'}`
        });
      }
    } catch (err: any) {
      setWorkerStatusMsg({
        success: false,
        text: `שגיאת תקשורת: ${err.message || err}`
      });
    } finally {
      setIsTestingWorker(false);
    }
  };

  const handleResetWorker = () => {
    clearCustomWorkerConfig();
    setWorkerUrlInput(getWorkerUrl());
    setWorkerTokenInput(getWorkerToken());
    setWorkerConfigured(isWorkerConfigured());
    setWorkerStatusMsg(null);
  };

  // Pre-calculate full system metrics
  const systemStats = useMemo(() => {
    const statusDistribution: Record<string, number> = {};
    const businessTypeDistribution: Record<string, number> = {};
    let urgentCount = 0;
    let meetingCount = 0;
    let importantCount = 0;

    clients.forEach(c => {
      const st = c.status || '(ללא סטטוס)';
      statusDistribution[st] = (statusDistribution[st] || 0) + 1;

      const bt = c.businessType || 'סוכנות ביטוח';
      businessTypeDistribution[bt] = (businessTypeDistribution[bt] || 0) + 1;

      if (c.requiresAttention || c.status === 'Urgent') urgentCount++;
      if (c.status === 'Meeting Scheduled') meetingCount++;
      if (c.status === 'Important') importantCount++;
    });

    const criticalBugsCount = productItems.filter(p => p.category === 'bug' && (p.priority === 'Critical' || p.priority === 'High')).length;

    return {
      totalClients: clients.length,
      urgentCount,
      meetingCount,
      importantCount,
      statusDistribution,
      businessTypeDistribution,
      totalTickets: productItems.length,
      criticalBugsCount
    };
  }, [clients, productItems]);

  const [lastReferencedClientId, setLastReferencedClientId] = useState<string | null>(null);

  // Highly Conversational Natural Hebrew CRM & Copilot Intelligence Engine
  const processUserQuery = (query: string): ChatMessage => {
    const raw = query.trim();
    const q = raw.toLowerCase();
    const time = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const userFirstName = currentUser.name ? currentUser.name.split(' ')[0] : 'שם';

    // Helper: format single client card with rich details and actionable buttons
    const buildSingleClientResponse = (target: Client, customContextTitle?: string): ChatMessage => {
      setLastReferencedClientId(target.id);
      const linkedTickets = productItems.filter(p => 
        (target.company && p.client && p.client.toLowerCase().includes(target.company.toLowerCase())) ||
        (target.name && p.client && p.client.toLowerCase().includes(target.name.toLowerCase()))
      );

      const companyOrName = target.company || target.name;
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(companyOrName + ' ביטוח')}`;
      const titleHeader = customContextTitle || `👤 מצאתי את כרטיס הלקוח: **${target.name}**`;

      let reply = `${titleHeader}\n\n` +
        `🏢 **חברה / סוכנות:** ${target.company || 'לא צוין'}\n` +
        `🏷️ **סוג עסק:** ${target.businessType || 'סוכנות ביטוח'}\n` +
        `📌 **סטטוס CRM:** **${target.status}** ${target.subStatus ? `(${target.subStatus})` : ''}\n` +
        `📞 **טלפון:** ${target.phone || 'לא הוזן'}\n` +
        `✉️ **אימייל:** ${target.email || 'לא הוזן'}\n` +
        `${target.location ? `📍 **מיקום / כתובת:** ${target.location}\n` : ''}` +
        `${target.monthlyClaims ? `📊 **היקף תביעות חודשי:** ${target.monthlyClaims}\n` : ''}` +
        `${target.nextFollowUpDate ? `⏰ **פגישה / מעקב קרוב:** ${target.nextFollowUpDate}\n` : ''}` +
        `${linkedTickets.length > 0 ? `\n✨ **משימות פיתוח מקושרות (${linkedTickets.length}):** ${linkedTickets.map(t => `[${t.id}] ${t.title}`).join(', ')}\n` : ''}` +
        `${target.lastNote ? `\n📝 **הערה אחרונה מהשטח:**\n"${target.lastNote.replace(/^[0-9/:\s|]+👤[^|]+\|\s*/, '')}"` : ''}`;

      // Contextual Smart Advice
      if (target.requiresAttention || target.status === 'Urgent') {
        reply += `\n\n🚨 **המלצה מיידית:** הלקוח סומן כדחוף! מומלץ ליצור קשר בהקדם כדי למנוע עיכוב תביעות או נטישה.`;
      } else if (target.status === "1'st Lead" || target.status === "1'st Follow-Up") {
        reply += `\n\n💡 **המלצה אופרטיבית:** הלקוח בשלב חם. כדאי להציע הדגמה קצרה בת 10 דקות של חילוץ תביעה אוטומטי תוך 60 שניות.`;
      } else if (target.status === "Meeting Scheduled") {
        reply += `\n\n📅 **המלצה לפגישה:** פגישה מתואמת. וודא הכנת דוגמה מותאמת לפוליסות הנפוצות ביותר אצלם.`;
      }

      const actions: ChatAction[] = [
        {
          type: 'open_client',
          payload: target.id,
          label: `👤 פתח כרטיס מלא: ${target.name}`
        },
        {
          type: 'web_link',
          payload: searchUrl,
          label: `🌐 חפש על "${companyOrName}" ברשת`
        }
      ];

      if (target.phone) {
        actions.push({
          type: 'whatsapp',
          payload: target.phone,
          label: `💬 וואטסאפ ל-${target.phone}`
        });
        actions.push({
          type: 'call',
          payload: target.phone,
          label: `📞 חיוג טלפוני ישיר`
        });
      }

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        actions,
        timestamp: time
      };
    };

    // 1. Pronoun / Follow-Up Reference ("מה איתו", "מה הטלפון שלו", "מה ההערות עליו", "פתח כרטיס שלו", "ספר לי עליו")
    if (lastReferencedClientId && (q.includes('איתו') || q.includes('שלו') || q.includes('עליו') || q.includes('אותו') || q.includes('הלקוח הזה') || q.includes('הלקוח הקודם'))) {
      const prevClient = clients.find(c => c.id === lastReferencedClientId);
      if (prevClient) {
        if (q.includes('טלפון') || q.includes('מספר') || q.includes('לחייג') || q.includes('וואטסאפ')) {
          return {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `📞 פרטי ההתקשרות של **${prevClient.name}**:\n- **טלפון:** ${prevClient.phone || 'אין טלפון מוגדר'}\n- **אימייל:** ${prevClient.email || 'אין אימייל'}\n- **חברה:** ${prevClient.company || 'לא צוין'}`,
            actions: [
              ...(prevClient.phone ? [
                { type: 'whatsapp' as const, payload: prevClient.phone, label: `💬 וואטסאפ: ${prevClient.phone}` },
                { type: 'call' as const, payload: prevClient.phone, label: `📞 חיוג` }
              ] : []),
              { type: 'open_client' as const, payload: prevClient.id, label: `👤 פתח כרטיס` }
            ],
            timestamp: time
          };
        }
        if (q.includes('הערה') || q.includes('הערות') || q.includes('יומן') || q.includes('נאמר')) {
          return {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `📝 **ההערות המתועדות עבור ${prevClient.name}:**\n\n${prevClient.lastNote || prevClient.generalNotes || 'אין הערות מתועדות עדיין עבור לקוח זה.'}`,
            actions: [
              { type: 'open_client' as const, payload: prevClient.id, label: `👤 פתח כרטיס לעדכון` }
            ],
            timestamp: time
          };
        }
        return buildSingleClientResponse(prevClient, `בהמשך לשאלתך על **${prevClient.name}**: הנה הפרטים המלאים שלו:`);
      }
    }

    // 2. Greetings, Warm Check-ins & Small Talk
    const isGreeting = /^(היי|שלום|אהלן|היוש|בוקר טוב|ערב טוב|צהריים טובים|מה נשמע|מה קורה|מה המצב|איך הולך|איך אתה|מה שלומך|שבוע טוב|שבת שלום)\b/i.test(q) ||
      ['היי', 'שלום', 'אהלן', 'מה קורה', 'מה נשמע', 'מה המצב', 'מי אתה', 'איך קוראים לך', 'איך אתה יכול לעזור'].includes(q);

    if (isGreeting) {
      const greetingResponses = [
        `אהלן ${userFirstName}! הכל מעולה אצלי, תמיד שמח לשוחח. כל המערכת רצה חלק ומסונכרנת עם גוגל שיטס בזמן אמת.`,
        `היי ${userFirstName}! יום מצוין לעשות עסקים. אני כאן איתך – מחובר לכל **${systemStats.totalClients.toLocaleString()} הלקוחות** ו-**${systemStats.totalTickets} משימות המוצר**.`,
        `שלום ${userFirstName}! כיף לשמוע ממך. אני מוכן לעזור בכל שאלה חופשית, ניתוח לקוחות, איתור שיחות או פתיחת כרטיסים.`
      ];
      const randomGreeting = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];

      const statusSummary = `\n\n📊 **דופק מהיר של המערכת הבוקר:**\n` +
        `- 🚨 **לקוחות שדורשים מענה מיידי:** ${systemStats.urgentCount}\n` +
        `- 📅 **פגישות דמו והדרכה ביומן:** ${systemStats.meetingCount}\n` +
        `- ⭐ **לקוחות חשובים במעקב:** ${systemStats.importantCount}\n\n` +
        `תוכל לדבר איתי בחופשיות על כל נושא — לבקש ממני למצוא לקוח, לשאול על התנגדויות, לקבל סיכום יומי או סתם לפתח שיחה. במה נתמקד?`;

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: randomGreeting + statusSummary,
        actions: [
          { type: 'navigate_tab', payload: 'myday', label: '⚡ למסך היום שלי' },
          { type: 'navigate_tab', payload: 'crm', label: '👥 פתח טבלת לקוחות' },
          { type: 'navigate_tab', payload: 'product', label: '🚀 תקלות ומוצר' }
        ],
        timestamp: time
      };
    }

    // 3. Humor, Jokes & Casual Banter
    if (q.includes('בדיחה') || q.includes('מצחיק') || q.includes('משעמם') || q.includes('ספר לי משהו')) {
      const jokes = [
        `😄 **הנה בדיחה מסורתית של סוכני ביטוח:**\n\nסוכן ביטוח עולה לשמיים ומגיע לשערי גן עדן. המלאך גבריאל מסתכל בספר הגדול ואומר: "שלום עליך! לפי שעות העבודה שדיווחת עליהן בתביעות — אתה בן 148!" 👴📈\n\n*מוסר השכל: טוב שיש את ClaimAI שסוגרת תביעה תוך דקה במקום לבלות עליה יום שלם!*`,
        `😄 **בדיחה קלאסית מעולם התביעות:**\n\nלקוח מתקשר בבהלה לסוכן הביטוח שלו: "הבית שלי נשרף כליל! מתי אני מקבל את הכסף מחברת הביטוח?!"\nהסוכן עונה בנחת: "אנחנו לא משלמים כסף. אנחנו שולחים לך בית בדיוק באותו גודל ומצב."\nהלקוח חושב רגע ושואל: "באמת?! ואם ביטחתי את אשתי?!" 😅`,
        `🤖 שואלים אותי לפעמים: "תגיד, AI כמוך לא מתעייף מלעקוב אחרי 1,480 לקוחות ביטוח בבת אחת?"\nעניתי: "להתעייף? תראה את הפקידה בסוכנות שממלאת 30 טפסי באפי ביום ידנית... היא הגיבורה האמיתית, אני כאן רק להציל אותה!" 🦸‍♀️⚡`
      ];
      const joke = jokes[Math.floor(Math.random() * jokes.length)];
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `${joke}\n\nתמיד כיף לצחוק בין פגישה לפגישה. במה עוד אוכל לעזור לך עכשיו?`,
        actions: [
          { type: 'navigate_tab', payload: 'myday', label: '⚡ חזור למעקבים' },
          { type: 'navigate_tab', payload: 'crm', label: '👥 לטבלת ה-CRM' }
        ],
        timestamp: time
      };
    }

    // 4. Gratitude & Friendly Closings ("תודה", "מעולה", "אחלה", "תותח", "יופי", "ביי", "להתראות")
    if (q.includes('תודה') || q.includes('מעולה') || q.includes('אחלה') || q.includes('תותח') || q.includes('סבבה') || q.includes('נהדר') || q.includes('מצוין') || q === 'ביי' || q === 'להתראות') {
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `בשמחה רבה ${userFirstName}! 🙌 שמחתי לעזור. אני נשאר כאן ברקע וממשיך לעקוב אחרי כל תנועה במערכת. אם תצטרך כל שאלה, ניתוח או עצה — אני במרחק לחיצה אחת. שיהיה המשך יום פורה ומוצלח!`,
        actions: [
          { type: 'navigate_tab', payload: 'myday', label: '⚡ למסך היום שלי' },
          { type: 'navigate_tab', payload: 'crm', label: '👥 פתח טבלת לקוחות' }
        ],
        timestamp: time
      };
    }

    // 5. Daily Briefing & Priorities ("מה לעשות היום", "איפה להתחיל", "סדר לי את היום", "מה על הפרק", "תקציר בוקר", "בריפינג", "עדיפויות")
    if (q.includes('מה לעשות') || q.includes('איפה להתחיל') || q.includes('סדר לי') || q.includes('על הפרק') || q.includes('תקציר') || q.includes('בריפינג') || q.includes('עדיפויות') || q.includes('מה המצב הבוקר')) {
      const urgentList = clients.filter(c => c.requiresAttention || c.status === 'Urgent');
      const meetingList = clients.filter(c => c.status === 'Meeting Scheduled');
      const firstFollowUps = clients.filter(c => c.status === "1'st Follow-Up" || c.status === "1'st Lead");

      let briefing = `📋 **בריפינג מנהלים יומי עבור ${currentUser.name}:**\n\n`;
      briefing += `הנה תוכנית הפעולה המומלצת שלך להיום לפי ניתוח עומסים ודחיפות:\n\n`;

      briefing += `1. 🚨 **עדיפות עליונה – טיפול בחריגות ומענים דחופים (${urgentList.length} לקוחות):**\n`;
      if (urgentList.length > 0) {
        urgentList.slice(0, 3).forEach((c, idx) => {
          briefing += `   - **${c.name}** (${c.company || 'סוכנות'}) | סטטוס: **${c.status}** ${c.phone ? `| 📞 ${c.phone}` : ''}\n`;
        });
      } else {
        briefing += `   - הכל נקי! אין כרגע לקוחות שסומנו בדחיפות עליונה.\n`;
      }

      briefing += `\n2. 📅 **פגישות דמו והדרכה שנקבעו (${meetingList.length} פגישות):**\n`;
      if (meetingList.length > 0) {
        meetingList.slice(0, 2).forEach(m => {
          briefing += `   - **${m.name}** (${m.company || 'לקוח'}) | מועד: ${m.nextFollowUpDate || 'מעקב יומי'}\n`;
        });
      } else {
        briefing += `   - אין פגישות שנקבעו להיום — מומלץ לתאם שיחות דמו ללידים חמים.\n`;
      }

      briefing += `\n3. ⚡ **קידום לידים בשלבים ראשוניים (${firstFollowUps.length} סוכנויות):**\n`;
      briefing += `   - סוכנויות שממתינות לשיחת פתיחה או הדגמה קצרה.\n\n`;
      briefing += `💡 **המלצת זהב:** התחל תמיד בשיחות ללקוחות הדחופים בבוקר, והשאר את שעות הצהריים להדגמות ופולו-אפים שקטים.`;

      const actions: ChatAction[] = [
        { type: 'navigate_tab', payload: 'myday', label: '⚡ למסך "היום שלי" הממוקד' },
        { type: 'navigate_tab', payload: 'crm', label: '👥 עבור לטבלת CRM' }
      ];

      if (urgentList.length > 0) {
        actions.unshift({
          type: 'open_client',
          payload: urgentList[0].id,
          label: `🚨 פתח דחוף: ${urgentList[0].name}`
        });
      }

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: briefing,
        actions,
        timestamp: time
      };
    }

    // 6. Guided System Tour & Navigation Help
    if (q.includes('סיור') || q.includes('הדרכה') || q.includes('איך עובדים') || q.includes('תכיר לי') || q.includes('מה אפשר לעשות') || q.includes('איך להשתמש')) {
      const tourText = `🧭 **סיור מודרך מקיף ב-ClaimAI Control Center:**\n` +
        `המערכת תוכננה בקפידה כדי לתת לך שליטה מלאה בלקוחות, במוצר ובסנכרונים. הנה המסכים המרכזיים:\n\n` +
        `1. ⚡ **מסך "היום שלי" (My Day):**\n` +
        `   המוקד היומי שלך. מרכז את כל הלקוחות הדחופים, הפגישות של היום, והמשימות האישיות שמחייבות טיפול לפני סוף היום.\n\n` +
        `2. 👥 **ניהול לקוחות CRM (טבלה ראשית בסגנון Monday/Excel):**\n` +
        `   ניהול של **${systemStats.totalClients.toLocaleString()} לקוחות**. כל תא ניתן לעריכה בלחיצה (שמירה ב-Enter!), אפשר לגרור רוחב עמודות כמו באקסל, לסדר עמודות, ולראות היסטוריית הערות מלאה.\n\n` +
        `3. 📑 **טבלאות מותאמות אישית ודוחות (למשל: דוח ללא תיקים):**\n` +
        `   משתמשים רשומים שעדיין לא פתחו תביעה. בלחיצה על כל שורה נפתח כרטיס הלקוח המלא עם סנכרון דו-כיווני אוטומטי ל-CRM.\n\n` +
        `4. 🐛 **בקרת מוצר ותקלות (Fixes & Roadmap):**\n` +
        `   ניהול **${systemStats.totalTickets} באגים ומשימות פיתוח**, מקושרים ישירות לשמות הסוכנויות שהעלו את הצורך.\n\n` +
        `5. ⚙️ **הגדרות, אדמין וסנכרון Google Sheets:**\n` +
        `   סנכרון דו-כיווני אוטומטי עם גליון הגוגל שיטס המרכזי שלך, ניהול משתמשים והרשאות.\n\n` +
        `לאן תרצה שאקח אותך עכשיו?`;

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: tourText,
        actions: [
          { type: 'navigate_tab', payload: 'myday', label: '⚡ למסך היום שלי' },
          { type: 'navigate_tab', payload: 'crm', label: '👥 לטבלת ה-CRM הראשית' },
          { type: 'navigate_tab', payload: 'product', label: '🐛 לבקרת מוצר ותקלות' },
          { type: 'navigate_tab', payload: 'database', label: '⚙️ להגדרות וסנכרון' }
        ],
        timestamp: time
      };
    }

    // 7. System Features & How-To Questions ("איך עובד הסנכרון", "איך עורכים", "גוגל שיטס", "משתמשים", "אדמין")
    if (q.includes('איך עובד') || q.includes('איך לערוך') || q.includes('איך להוסיף') || q.includes('סנכרון') || q.includes('שיטס') || q.includes('אדמין') || q.includes('הרשאות') || q.includes('משתמשים') || q.includes('עמודה')) {
      if (q.includes('שיטס') || q.includes('סנכרון') || q.includes('google')) {
        return {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `🔄 **כיצד עובד הסנכרון הדו-כיווני מול Google Sheets:**\n\n` +
            `- **סנכרון הערות ולידים חדשים:** המערכת מחוברת ישירות לגליון "Copy of CRM+PM" שלך, לשונית "לידים חדשים". כל הערה שנכתבת במערכת או בגליון מסתנכרנת באופן אוטומטי כולל חתימת שם המשתמש והשעה.\n` +
            `- **עדכון מיידי:** בכל פעם שאתה עורך שדה (שם, טלפון, תאריך השארת פרטים, הערה) המערכת מעבירה את השינוי לגליון בענן.\n` +
            `- **בדיקת תקינות:** תמיד אפשר לעבור ללשונית "דאטה-בייס וסנכרון" ולהפעיל בדיקת סנכרון בלחיצת כפתור.`,
          actions: [
            { type: 'navigate_tab', payload: 'database', label: '⚙️ פתח מסך הגדרות וסנכרון' },
            { type: 'web_link', payload: 'https://docs.google.com/spreadsheets/d/1DaEDKKsRVSuQxI7RNv8pMLMZII6KrnDMQj18FYosxpU/edit', label: '📊 פתח את גליון Google Sheets' }
          ],
          timestamp: time
        };
      }

      if (q.includes('ערוך') || q.includes('עריכ') || q.includes('עמודה') || q.includes('אנטר')) {
        return {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `✏️ **עריכת תאים ושינוי עמודות בסגנון Excel:**\n\n` +
            `1. **עריכה ישירה בכל טבלה:** לוחצים על כל תא (שם, חברה, טלפון, הערה, תאריך) ומקלידים ישירות.\n` +
            `2. **שמירה ב-Enter:** לחיצה על מקש **Enter** שומרת את הערך מיד! לחיצה על **Escape** מבטלת.\n` +
            `3. **שינוי רוחב עמודות:** בדיוק כמו באקסל — גוררים את הגבול שבין כותרות העמודות ימינה או שמאלה. הרוחב החדש נשמר אוטומטית בדפדפן שלך.\n` +
            `4. **סנכרון בין טבלאות:** אם שינית שדה בטבלה מותאמת אישית של לקוח קיים — השינוי מסתנכרן מיד גם לכרטיס הלקוח הראשי ב-CRM!`,
          actions: [
            { type: 'navigate_tab', payload: 'crm', label: '👥 פתח טבלת CRM לניסוי' }
          ],
          timestamp: time
        };
      }

      if (q.includes('משתמש') || q.includes('אדמין') || q.includes('הרשא')) {
        return {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `🔐 **ניהול משתמשים והרשאות בפורטל האדמין:**\n\n` +
            `- מנהלים (Admins) יכולים להוסיף משתמשים חדשים, להגדיר סיסמאות אישיות, ולשנות תפקידים.\n` +
            `- **תפקידי מערכת:** מנהל מערכת (Admin) עם גישה מלאה, עורך (Editor) לעריכת לקוחות ומשימות, וצופה (Viewer) לקריאה בלבד.\n` +
            `- המעבר לניהול מתבצע בלשונית "ניהול משתמשים" בסרגל העליון.`,
          actions: [
            { type: 'navigate_tab', payload: 'admin', label: '👥 פתח פורטל ניהול משתמשים' }
          ],
          timestamp: time
        };
      }
    }

    // 8. Sales Coaching & Objection Handling ("באפי", "Bafi", "מחיר", "יקר", "התנגדות", "איך לסגור", "תסריט")
    if (q.includes('באפי') || q.includes('bafi') || q.includes('מחיר') || q.includes('יקר') || q.includes('התנגדות') || q.includes('איך לסגור') || q.includes('איך לשכנע') || q.includes('תסריט') || q.includes('טיפ') || q.includes('טיפים')) {
      const salesAdvice = `💼 **ארגז כלים מנצח לטיפול בהתנגדויות סוכנויות ביטוח:**\n\n` +
        `1. ⚡ **התנגדות: "אנחנו כבר עובדים עם באפי (Bafi)"**\n` +
        `   - **התשובה שמפילה את ההתנגדות:** "מעולה שאתם בבאפי! ClaimAI לא מחליפה את באפי אלא משלימה אותה בדיוק איפה שהפקידות קורסות. באפי היא תוכנת הלינה לפוליסות, אבל את מסמכי התביעות והתמונות הפקידה צריכה להקליד ידנית 25 דקות. ClaimAI מחלצת הכל אוטומטית תוך 60 שניות — ומשם הנתונים עוברים לבאפי בלחיצה אחת."\n` +
        `   - **המסר:** חוסך חצי משרה של פקידה בריכוז תביעות.\n\n` +
        `2. 💰 **התנגדות: "יקר לנו / אין תקציב עכשיו"**\n` +
        `   - **חשבון פשוט מול הסוכן:** פקידת תביעות ממוצעת עולה לסוכנות כ-10,000-12,000 ₪ בחודש. אם המערכת חוסכת לה 30-40 שעות בחודש על פתיחת תיקים ומעקבים, החזרתם פי 4 מעלות המנוי כבר בחודש הראשון.\n\n` +
        `3. ⏳ **התנגדות: "אין לנו זמן להטמעה מסובכת"**\n` +
        `   - **התשובה:** "ההטמעה אצלנו לוקחת בדיוק 15 דקות בזום. לא מתקינים כלום על המחשב, ובאותו יום הפקידה כבר מעלה תביעה ראשונה ומרוצה."\n\n` +
        `4. 📲 **הצעת פולו-אפ מהירה בוואטסאפ:**\n` +
        `   *"היי [שם הסוכן], רציתי לשלוח לך סרטון קצר של 40 שניות שמראה איך המערכת ממלאת כתב תביעה שלם מסריקת וואטסאפ אחת. מתי נוח שנקפוץ לזום של 10 דקות השבוע?"*`;

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: salesAdvice,
        actions: [
          { type: 'navigate_tab', payload: 'myday', label: '⚡ חזור למעקב היום שלי' },
          { type: 'navigate_tab', payload: 'crm', label: '👥 פתח טבלת לקוחות' }
        ],
        timestamp: time
      };
    }

    // 9. Location & City Queries ("מי מתל אביב", "סוכנויות בירושלים", "צפון", "דרום", "חיפה", "מרכז")
    const cities = ['תל אביב', 'ירושלים', 'חיפה', 'פתח תקווה', 'ראשון לציון', 'אשדוד', 'באר שבע', 'נתניה', 'חולון', 'רמת גן', 'הרצליה', 'רעננה', 'כפר סבא', 'מודיעין', 'צפון', 'דרום', 'מרכז'];
    const matchedCity = cities.find(city => q.includes(city));
    if (matchedCity) {
      const cityClients = clients.filter(c => (c.location || '').toLowerCase().includes(matchedCity) || (c.company || '').toLowerCase().includes(matchedCity));
      if (cityClients.length > 0) {
        let reply = `📍 **איתרתי ${cityClients.length} לקוחות / סוכנויות באזור ${matchedCity}:**\n\n`;
        const actions: ChatAction[] = [];
        cityClients.slice(0, 4).forEach((c, idx) => {
          reply += `${idx + 1}. **${c.name}** (${c.company || 'סוכנות'}) | סטטוס: **${c.status}** ${c.phone ? `| 📞 ${c.phone}` : ''}\n`;
          actions.push({
            type: 'open_client',
            payload: c.id,
            label: `👤 ${c.name}`
          });
        });
        if (cityClients.length > 4) {
          reply += `\n*(ועוד ${cityClients.length - 4} לקוחות נוספים באזור)*\n`;
        }
        actions.push({
          type: 'navigate_tab',
          payload: 'crm',
          label: `🔍 צפה בכולם ב-CRM`
        });
        return {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          actions,
          timestamp: time
        };
      }
    }

    // 10. High Volume / VIP Clients ("מי הלקוחות הכי גדולים", "מי מגיש הכי הרבה תביעות", "נפח תביעות", "תביעות חודשיות")
    if (q.includes('הכי גדול') || q.includes('הכי הרבה תביעות') || q.includes('נפח תביעות') || q.includes('תביעות חודשי') || q.includes('גדולים ביותר')) {
      const parsedClaims = clients.map(c => {
        const val = parseInt(String(c.monthlyClaims || '0').replace(/\D/g, ''), 10) || 0;
        return { client: c, claims: val };
      }).sort((a, b) => b.claims - a.claims);

      const topClients = parsedClaims.filter(p => p.claims > 0).slice(0, 5);
      if (topClients.length > 0) {
        let reply = `🏆 **הסוכנויות המובילות לפי היקף תביעות חודשי מדווח:**\n\n`;
        const actions: ChatAction[] = [];
        topClients.forEach((item, idx) => {
          const c = item.client;
          reply += `${idx + 1}. **${c.name}** (${c.company || 'סוכנות'}) — **${item.claims} תביעות/חודש** | סטטוס: **${c.status}**\n`;
          actions.push({
            type: 'open_client',
            payload: c.id,
            label: `👤 ${c.name} (${item.claims})`
          });
        });
        reply += `\n💡 **תובנה:** לקוחות עם מעל 50 תביעות חודשיות הם בעלי ה-LTV הגבוה ביותר. שווה להשקיע בליווי אישי שבועי כדי להבטיח שימוש רציף.`;
        return {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          actions,
          timestamp: time
        };
      }
    }

    // 11. Overdue / Meetings / Urgent Queries
    if (q.includes('דחוף') || q.includes('טיפול') || q.includes('urgent') || q.includes('עדיפות עליונה') || q.includes('מעקבים') || q.includes('חריגות') || q.includes('מי ממתין')) {
      const urgentClients = clients.filter(c => c.requiresAttention || c.status === 'Urgent');
      const meetings = clients.filter(c => c.status === 'Meeting Scheduled');

      let reply = `🚨 **איתרתי ${urgentClients.length} לקוחות בעדיפות עליונה ו-${meetings.length} פגישות שנקבעו:**\n\n`;
      const actions: ChatAction[] = [];

      urgentClients.slice(0, 4).forEach((c, i) => {
        reply += `${i + 1}. **${c.name}** (${c.company || 'ללא חברה'}) | סטטוס: **${c.status}**`;
        if (c.phone) reply += ` | 📞 ${c.phone}`;
        if (c.lastNote) reply += `\n   📝 "${c.lastNote.replace(/^[0-9/:\s|]+👤[^|]+\|\s*/, '').slice(0, 85)}..."\n`;
        
        actions.push({
          type: 'open_client',
          payload: c.id,
          label: `🚨 כרטיס: ${c.name}`
        });
      });

      if (meetings.length > 0) {
        reply += `\n📅 **פגישות דמו והדרכה ביומן:**\n`;
        meetings.slice(0, 3).forEach((m, idx) => {
          reply += `- **${m.name}** (${m.company || 'סוכנות'}) | מועד: ${m.nextFollowUpDate || 'מעקב יומי'}\n`;
        });
      }

      actions.push({
        type: 'navigate_tab',
        payload: 'myday',
        label: '⚡ פתח מסך "היום שלי"'
      });

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        actions,
        timestamp: time
      };
    }

    // 12. Product, Bugs & Roadmap Queries
    if (q.includes('תקלה') || q.includes('תקלות') || q.includes('באג') || q.includes('מוצר') || q.includes('פיתוח') || q.includes('גרסה') || q.includes('ticket') || q.includes('roadmap')) {
      const openTickets = productItems.filter(p => p.status !== 'Done');
      const bugs = openTickets.filter(p => p.category === 'bug');
      const roadmapItems = openTickets.filter(p => p.category === 'roadmap');

      let reply = `🐛 **תמונת מצב מודול מוצר ותקלות (Fixes & Roadmap):**\n\n` +
        `- סה"כ משימות פעילות: **${openTickets.length}** מתוך ${productItems.length}\n` +
        `- באגים פתוחים: **${bugs.length}** (מתוכם ${systemStats.criticalBugsCount} קריטיים)\n` +
        `- פיצ'רים ופיתוחים ב-Roadmap: **${roadmapItems.length}**\n\n` +
        `🚨 **תקלות בעדיפות גבוהה שמחכות לטיפול:**\n`;

      const actions: ChatAction[] = [];
      const criticalBugs = bugs.filter(b => b.priority === 'Critical' || b.priority === 'High').slice(0, 3);
      criticalBugs.forEach((b, idx) => {
        reply += `${idx + 1}. **[${b.id}] ${b.title}** (${b.client || 'כללי'})\n`;
        actions.push({
          type: 'open_ticket',
          payload: b.id,
          label: `🐛 ${b.title.slice(0, 22)}...`
        });
      });

      actions.push({
        type: 'navigate_tab',
        payload: 'product',
        label: '🚀 פתח מודול מוצר ותקלות מלא'
      });

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        actions,
        timestamp: time
      };
    }

    // 13. Smart Entity Resolution: Search for specific Client Name, Company or Phone
    // Only search clients if digits exist, or if user explicitly mentions "לקוח" / "סוכנות" / "הערה", or query has specific tokens that match a client's NAME or COMPANY (not just common dictionary words)
    const phoneDigits = q.replace(/\D/g, '');
    const isExplicitClientSearch = q.includes('לקוח') || q.includes('סוכנות') || q.includes('כרטיס') || q.includes('חפש') || q.includes('מצא') || q.includes('הערות של') || q.includes('טלפון של') || phoneDigits.length >= 7;

    const stopWords = new Set([
      'של', 'את', 'על', 'מי', 'זה', 'מה', 'עם', 'הוא', 'היא', 'הם', 'אנחנו', 'אתה', 'אתם', 
      'רוצה', 'אפשר', 'צריך', 'כדאי', 'מומלץ', 'תמליץ', 'ספר', 'תגיד', 'תסביר', 'בבקשה', 
      'תודה', 'היי', 'שלום', 'אהלן', 'הכל', 'כל', 'יותר', 'פחות', 'בדיקה', 'טסט', 'חדש', 
      'ישן', 'קודם', 'הבא', 'אחרון', 'שאלות', 'שאלה', 'תשובה', 'עזרה', 'איך', 'לעזור', 
      'יכול', 'היום', 'שיחה', 'שיחות', 'עבודה', 'עסקים', 'ביטוח', 'בוקר', 'ערב', 'צהריים', 
      'טוב', 'למה', 'איפה', 'מתי', 'כמה', 'למי'
    ]);

    const meaningfulTokens = q.split(/[\s,?.!-]+/).filter(t => t.length >= 2 && !stopWords.has(t));

    let matchedClients: Client[] = [];

    if (phoneDigits.length >= 7) {
      matchedClients = clients.filter(c => (c.phone || '').replace(/\D/g, '').includes(phoneDigits));
    } else if (isExplicitClientSearch || meaningfulTokens.length > 0) {
      // Prioritize name and company exact/substring matches
      matchedClients = clients.filter(c => {
        const name = (c.name || '').toLowerCase();
        const comp = (c.company || '').toLowerCase();
        const email = (c.email || '').toLowerCase();

        // Direct full phrase match in name or company
        if (meaningfulTokens.length >= 1 && (name.includes(q) || comp.includes(q) || email.includes(q))) {
          return true;
        }

        // Token match against name or company specifically (NOT arbitrary note text!)
        if (meaningfulTokens.length > 0) {
          return meaningfulTokens.some(tok => name.includes(tok) || comp.includes(tok));
        }

        return false;
      });
    }

    if (matchedClients.length > 0) {
      if (matchedClients.length === 1) {
        return buildSingleClientResponse(matchedClients[0]);
      } else {
        let reply = `🔍 **איתרתי ${matchedClients.length} לקוחות התואמים לשאלתך:**\n\n`;
        const actions: ChatAction[] = [];

        matchedClients.slice(0, 4).forEach((c, idx) => {
          reply += `${idx + 1}. **${c.name}** (${c.company || 'סוכנות'}) | סטטוס: **${c.status}** ${c.phone ? `| 📞 ${c.phone}` : ''}\n`;
          if (c.lastNote) {
            reply += `   📝 "${c.lastNote.replace(/^[0-9/:\s|]+👤[^|]+\|\s*/, '').slice(0, 70)}..."\n`;
          }
          actions.push({
            type: 'open_client',
            payload: c.id,
            label: `👤 ${c.name}`
          });
        });

        if (matchedClients.length > 4) {
          reply += `\n*(נמצאו עוד ${matchedClients.length - 4} לקוחות נוספים במאגר)*\n`;
        }

        const top = matchedClients[0];
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent((top.company || top.name) + ' ביטוח')}`;
        actions.push({
          type: 'web_link',
          payload: searchUrl,
          label: `🌐 חפש ברשת: ${top.company || top.name}`
        });

        actions.push({
          type: 'navigate_tab',
          payload: 'crm',
          label: '🔍 צפה בתוצאות בטבלת ה-CRM'
        });

        return {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          actions,
          timestamp: time
        };
      }
    }

    // 14. Conversational Catch-All Dialogue (Natural, Friendly & Context-Aware)
    // Instead of robotic fallback, engages with the user's thought and provides helpful insights
    const conversationalReply = `הבנתי אותך! לגבי **"${raw}"** — \n\n` +
      `כסוכן ה-AI האישי שלך ב-ClaimAI, אני מחובר בזמן אמת לכל מאגר המידע (${systemStats.totalClients.toLocaleString()} לקוחות, ${systemStats.totalTickets} משימות מוצר) וזמין לסייע לך לקדם את הפעילות:\n\n` +
      `🎯 **הנה כמה דברים שתוכל לעשות איתי מיד:**\n` +
      `- **לבדוק עומסים:** שאל "מה לעשות היום?" או "מי הלקוחות הדחופים?".\n` +
      `- **ייעוץ מכירות והתנגדויות:** שאל "איך לענות ללקוח שטוען שהוא כבר עובד עם באפי?" או "איך לטפל בהתנגדות מחיר?".\n` +
      `- **איתור מהיר של סוכנות:** הקלד שם של סוכן, סוכנות או מספר טלפון.\n` +
      `- **הדרכה וסיור במערכת:** בקש "תעשה לי סיור במערכת" לסקירה על כל מסך.\n\n` +
      `איך תרצה שנתקדם?`;

    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: conversationalReply,
      actions: [
        { type: 'navigate_tab', payload: 'myday', label: '⚡ למסך היום שלי' },
        { type: 'navigate_tab', payload: 'crm', label: '👥 פתח טבלת לקוחות' },
        { type: 'navigate_tab', payload: 'product', label: '🐛 תקלות ומוצר' }
      ],
      timestamp: time
    };
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 1. If Worker or Direct Key is available, try it
      let workerRes: any = null;
      const directKey = getDirectAIKey();

      if (workerConfigured || directKey) {
        const qLower = textToSend.toLowerCase();
        const relevantClients = clients.filter(c => {
          const name = (c.name || '').toLowerCase();
          const comp = (c.company || '').toLowerCase();
          const note = (c.lastNote || '').toLowerCase();
          return name.includes(qLower) || comp.includes(qLower) || note.includes(qLower);
        }).slice(0, 10);

        // Build recent conversation history
        const chatHistory = messages.slice(-6).map(m => ({
          role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.text
        }));

        const workerPayload: ChatContextPayload = {
          currentUser: { name: currentUser.name, role: currentUser.role, email: currentUser.email },
          stats: systemStats,
          matchedClients: relevantClients.map(c => ({
            id: c.id,
            name: c.name,
            company: c.company,
            businessType: c.businessType,
            status: c.status,
            subStatus: c.subStatus,
            phone: c.phone,
            email: c.email,
            lastNote: c.lastNote,
            requiresAttention: c.requiresAttention,
            location: c.location
          })),
          matchedTickets: productItems.slice(0, 8).map(t => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            status: t.status,
            client: t.client,
            category: t.category
          })),
          customTablesSummary: customTables.map(tbl => ({
            id: tbl.id,
            name: tbl.name,
            rowCount: tbl.rows.length
          })),
          chatHistory
        };

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
          workerRes = await askWorkerAI(textToSend, workerPayload);
          clearTimeout(timeoutId);
        } catch {
          workerRes = null;
        }
      }

      if (workerRes && workerRes.text && workerRes.text.length > 15) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: workerRes.text,
            actions: workerRes.actions,
            timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsLoading(false);
        return;
      }

      // 2. High-intelligence local CRM reasoning engine
      const aiResponse = processUserQuery(textToSend);
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    } catch {
      const aiResponse = processUserQuery(textToSend);
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1 py-0.5 rounded bg-purple-950/60 text-purple-200 border border-purple-500/30 font-mono text-[11px]">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const handleActionClick = (action: ChatAction) => {
    if (action.type === 'navigate_tab') {
      onNavigateTab(action.payload as TabType);
    } else if (action.type === 'open_client') {
      const client = clients.find(c => c.id === action.payload);
      if (client) onSelectClient(client);
    } else if (action.type === 'open_ticket') {
      const ticket = productItems.find(p => p.id === action.payload);
      if (ticket) onSelectTicket(ticket);
    } else if (action.type === 'whatsapp') {
      const cleanPhone = action.payload.replace(/\D/g, '');
      const waNumber = cleanPhone.startsWith('0') ? `972${cleanPhone.slice(1)}` : cleanPhone;
      window.open(`https://wa.me/${waNumber}`, '_blank');
    } else if (action.type === 'call') {
      window.open(`tel:${action.payload}`);
    } else if (action.type === 'web_link') {
      window.open(action.payload, '_blank');
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'web_link':
        return <Globe className="w-3 h-3 text-cyan-400 shrink-0" />;
      case 'whatsapp':
        return <MessageSquare className="w-3 h-3 text-emerald-400 shrink-0" />;
      case 'call':
        return <Phone className="w-3 h-3 text-blue-400 shrink-0" />;
      case 'open_client':
        return <User className="w-3 h-3 text-purple-400 shrink-0" />;
      case 'open_ticket':
        return <Bug className="w-3 h-3 text-rose-400 shrink-0" />;
      case 'navigate_tab':
      default:
        return <ChevronRight className="w-3 h-3 text-indigo-400 shrink-0" />;
    }
  };

  return (
    <>
      {/* Floating Launcher Pill Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-2xl shadow-purple-900/50 border border-purple-400/40 transition-all hover:scale-105 group"
          title="פתח את ה-Copilot החכם של ClaimAI"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="flex flex-col text-right">
            <span className="font-extrabold text-[13px] tracking-wide flex items-center gap-1.5">
              <span>ClaimAI Copilot</span>
              <span className="px-1.5 py-0.2 rounded-full bg-purple-900/80 text-[9px] text-purple-200 border border-purple-400/40">שיחה חיה</span>
            </span>
            <span className="text-[10px] text-purple-200/90 font-normal">
              מחובר ל-{clients.length.toLocaleString()} לקוחות ומשימות
            </span>
          </div>
        </button>
      )}

      {/* Main Floating Chat Window */}
      {isOpen && (
        <div 
          className={`fixed left-6 z-50 flex flex-col rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 shadow-2xl shadow-purple-950/60 overflow-hidden transition-all duration-300 ${
            isMinimized 
              ? 'bottom-6 w-80 h-14' 
              : 'bottom-6 w-[430px] max-w-[94vw] h-[640px] max-h-[88vh]'
          }`}
          style={{ direction: 'rtl' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900 border-b border-purple-500/30 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-purple-600/40 border border-purple-400/30 shadow-inner">
                <Bot className="w-5 h-5 text-purple-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    <span>ClaimAI Copilot</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[9px] font-mono">
                    {directKeySaved ? `${aiProviderInput.toUpperCase()} ⚡` : (workerConfigured ? 'Worker Active' : 'Smart Engine')}
                  </span>
                </div>
                <p className="text-[10px] text-purple-200/80">
                  {directKeySaved ? 'מחובר למודל שפה חי (Direct LLM)' : 'עוזר אישי מבוסס נתונים וסנכרון'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setShowWorkerSettings(!showWorkerSettings)}
                className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
                  showWorkerSettings ? 'text-purple-400 bg-purple-950/40' : 'hover:text-white'
                }`}
                title="הגדרות מודל שפה וחיבור AI"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                title={isMinimized ? 'הגדל חלון' : 'מזער חלון'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-colors"
                title="סגור צ'אט"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AI Settings Drawer */}
          {showWorkerSettings && !isMinimized && (
            <div className="p-3 bg-slate-950/95 border-b border-purple-500/20 text-xs text-slate-300 space-y-3">
              {/* Tab Selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSettingsTab('keys')}
                  className={`flex-1 py-1 px-2 rounded-md font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                    settingsTab === 'keys'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3 h-3" />
                  <span>חיבור מודל ישיר (חינמי)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('worker')}
                  className={`flex-1 py-1 px-2 rounded-md font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                    settingsTab === 'worker'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Cloud className="w-3 h-3" />
                  <span>שרת Worker</span>
                </button>
              </div>

              {settingsTab === 'keys' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>מודל שיחה ישיר ללא הגבלה</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {directKeySaved ? '🟢 מפתח שמור ופעיל' : '⚪ לא מוגדר (מנוע מקומי)'}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal">
                    הדבק מפתח API חינמי לקבלת תשובות שיחתיות חכמות ופתוחות בזמן אמת:
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-700 bg-slate-900 cursor-pointer text-[10px]">
                      <input 
                        type="radio" 
                        name="aiProvider" 
                        checked={aiProviderInput === 'groq'} 
                        onChange={() => setAiProviderInput('groq')}
                        className="text-purple-600 focus:ring-0" 
                      />
                      <span className="font-bold text-white">Groq (Llama 3.3 70B)</span>
                    </label>
                    <label className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-700 bg-slate-900 cursor-pointer text-[10px]">
                      <input 
                        type="radio" 
                        name="aiProvider" 
                        checked={aiProviderInput === 'gemini'} 
                        onChange={() => setAiProviderInput('gemini')}
                        className="text-purple-600 focus:ring-0" 
                      />
                      <span className="font-bold text-white">Google Gemini</span>
                    </label>
                  </div>

                  <input
                    type="password"
                    placeholder={aiProviderInput === 'groq' ? "הדבק מפתח gsk_..." : "הדבק מפתח AIzaSy..."}
                    value={directKeyInput}
                    onChange={(e) => setDirectKeyInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={aiProviderInput === 'groq' ? "https://console.groq.com/keys" : "https://aistudio.google.com/"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-purple-400 hover:text-purple-300 underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span>קבל מפתח חינמי תוך 30 שניות</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleSaveDirectKey}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>שמור מפתח</span>
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'worker' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 text-purple-400" />
                      <span>שרת Cloudflare Worker AI</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {workerConfigured ? 'מוגדר' : 'ברירת מחדל'}
                    </span>
                  </div>

                  <input
                    type="url"
                    placeholder="https://small-sea-ba86.avivashke95.workers.dev"
                    value={workerUrlInput}
                    onChange={(e) => setWorkerUrlInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleResetWorker}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      איפוס
                    </button>
                    <button
                      type="button"
                      onClick={handleTestAndSaveWorker}
                      disabled={isTestingWorker}
                      className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTestingWorker ? 'animate-spin' : ''}`} />
                      <span>{isTestingWorker ? 'בודק...' : 'בדוק חיבור'}</span>
                    </button>
                  </div>
                </div>
              )}

              {workerStatusMsg && (
                <div className={`p-2 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 ${
                  workerStatusMsg.success 
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                    : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                }`}>
                  {workerStatusMsg.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  <span>{workerStatusMsg.text}</span>
                </div>
              )}
            </div>
          )}

          {/* Messages Body */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-900/60">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans text-right">
                      {renderFormattedText(msg.text)}
                    </div>

                    {/* Interactive Action Buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                        {msg.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(action)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 hover:text-white border border-purple-500/30 text-[10px] font-bold transition-all hover:scale-[1.02] shadow-sm"
                          >
                            {getActionIcon(action.type)}
                            <span>{action.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-950/20 p-2.5 rounded-xl border border-purple-800/30 w-fit">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>מעבד תשובה מתוך מאגר הנתונים...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Quick Prompt Suggestions */}
          {!isMinimized && (
            <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => handleSendMessage(undefined, 'תעשה לי סיור במערכת')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] whitespace-nowrap border border-slate-700 transition-all flex items-center gap-1 shrink-0"
              >
                <span>🧭 סיור במערכת</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage(undefined, 'מי הלקוחות הדחופים היום?')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] whitespace-nowrap border border-slate-700 transition-all flex items-center gap-1 shrink-0"
              >
                <span>🚨 לקוחות דחופים</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage(undefined, 'איך לענות ללקוח שעובד עם באפי?')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] whitespace-nowrap border border-slate-700 transition-all flex items-center gap-1 shrink-0"
              >
                <span>💡 התנגדות לבאפי</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage(undefined, 'מה מצב התקלות במוצר?')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] whitespace-nowrap border border-slate-700 transition-all flex items-center gap-1 shrink-0"
              >
                <span>🐛 תקלות מוצר</span>
              </button>
            </div>
          )}

          {/* Input Footer */}
          {!isMinimized && (
            <form 
              onSubmit={handleSendMessage}
              className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="שאל כל דבר על לקוחות, תקלות, או בקש סיור..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md disabled:opacity-40 transition-all hover:scale-105"
                title="שלח הודעה"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};
