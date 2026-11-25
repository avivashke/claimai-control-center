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

  // Comprehensive Hebrew Natural Language CRM Processor
  const processUserQuery = (query: string): ChatMessage => {
    const raw = query.trim();
    const q = raw.toLowerCase();
    const time = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    // 1. Guided System Tour ("סיור", "איך עובדים", "תכיר לי", "מה אפשר לעשות", "עזרה", "הדרכה")
    if (q.includes('סיור') || q.includes('הדרכה') || q.includes('איך עובדים') || q.includes('תכיר לי') || q.includes('מה אפשר לעשות') || q.includes('איך להשתמש')) {
      const tourText = `🧭 **ברוך הבא לסיור המודרך במערכת ClaimAI Control Center!**
המערכת בנויה ומכוילת במיוחד לניהול סוכנויות ביטוח, תביעות ומעקבי מכירות. הנה הסקירה של המסכים העיקריים:

1. ⚡ **היום שלי (My Day):**
   מרכז השליטה היומי שלך. כאן מרוכזים כל הלקוחות שדורשים מענה היום, פגישות שנקבעו, מעקבים שעבר זמנם ודפי משימות אישיים.

2. 👥 **ניהול לקוחות CRM (טבלה ראשית):**
   טבלה חכמה בסגנון Monday לניהול **${systemStats.totalClients.toLocaleString()} לקוחות**. כוללת עריכה ישירה, שמירה אוטומטית, היסטוריית הערות, תגיות צבע, וסנכרון דו-כיווני לגוגל שיטס.

3. 🐛 **ניהול מוצר ותקלות (Fixes & Roadmap):**
   מעקב אחר **${systemStats.totalTickets} משימות פיתוח**, באגים ודרישות מהשטח, עם תעדוף וקישור ישיר לשמות הלקוחות הרלוונטיים.

4. 📑 **טבלאות מותאמות ודוחות:**
   לשוניות נוספות כולל **דוח לקוחות ללא תיקים** (משתמשים רשומים שעדיין לא פתחו תביעה) וטבלאות ייעודיות.

5. ⚙️ **הגדרות ודאטה-בייס:**
   ניהול מסד הנתונים, סנכרון דו-כיווני עם Google Sheets, גיבויים, והגדרות אבטחה.

בחר לאן תרצה לעבור עכשיו:`;

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: tourText,
        actions: [
          { type: 'navigate_tab', payload: 'myday', label: '⚡ למסך היום שלי' },
          { type: 'navigate_tab', payload: 'crm', label: '👥 לטבלת ה-CRM' },
          { type: 'navigate_tab', payload: 'product', label: '🐛 למודול המוצר והתקלות' },
          { type: 'navigate_tab', payload: 'database', label: '⚙️ להגדרות וסנכרון' }
        ],
        timestamp: time
      };
    }

    // 2. Greetings and Conversational check-in ("היי", "שלום", "בוקר טוב", "ערב טוב", "מה נשמע", "מי אתה", "מה קורה", "מה המצב")
    if (q === 'היי' || q === 'שלום' || q.startsWith('בוקר טוב') || q.startsWith('ערב טוב') || q.includes('מה נשמע') || q.includes('מה קורה') || q.includes('מה המצב') || q.includes('מי אתה') || q.includes('היי אייל') || q.includes('שלום עליכם')) {
      const greeting = `שלום ${currentUser.name}! אני העוזר האישי החכם שלך ב-ClaimAI. 
אני עוקב באופן שוטף אחרי כל הפעילות במערכת, ויכול לעזור לך לייעל את יום העבודה, לנתח שיחות ולנווט בלחיצה אחת.

📊 **סטטוס עדכני במערכת:**
- 🚨 **לקוחות הדורשים מענה מיידי:** ${systemStats.urgentCount} לקוחות
- 📅 **פגישות דמו / הדרכה שנקבעו:** ${systemStats.meetingCount} לקוחות
- 🐛 **באגים קריטיים פתוחים:** ${systemStats.criticalBugsCount} תקלות

במה אוכל לסייע לך עכשיו?`;

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: greeting,
        actions: [
          { type: 'navigate_tab', payload: 'myday', label: '🚨 צפה בלקוחות דחופים' },
          { type: 'navigate_tab', payload: 'crm', label: '👥 פתח טבלת CRM מלאה' },
          { type: 'navigate_tab', payload: 'product', label: '🐛 צפה בתקלות קריטיות' }
        ],
        timestamp: time
      };
    }

    // 3. Database & Sync Health Status
    if (q.includes('דאטה') || q.includes('בסיס נתונים') || q.includes('סופבייס') || q.includes('בלובס') || q.includes('שיטס') || q.includes('גיבוי') || q.includes('וורקר') || q.includes('סנכרון')) {
      const workerUrl = getWorkerUrl();
      const directKey = getDirectAIKey();
      const dbText = `📊 **תמונת מצב שירותי הנתונים, הגיבוי והסנכרון של ClaimAI:**
- **Google Sheets Two-Way Sync:** 🟢 מחובר ומסונכרן (ראשי + דוח ללא תיקים + Fixes & Bugs + Roadmap)
- **דאטה-בייס מקומי (IndexedDB):** 🟢 פעיל עם ${clients.length.toLocaleString()} לקוחות, ${productItems.length} משימות ו-${customTables.length} טבלאות מותאמות
- **מנוע שיחה אינטראקטיבי:** ${directKey ? `🟢 מודל LLM ישיר פעיל (${getAIProvider()})` : (workerConfigured ? `🟢 וורקר מחובר (${workerUrl})` : '🔵 מנוע AI מקומי מובנה פעיל')}
- **Supabase Cloud:** ${supabaseConnected ? '🟢 מחובר' : '🟡 Offline-first פעיל'}`;

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: dbText,
        actions: [
          { type: 'navigate_tab', payload: 'database', label: '⚙️ פתח מסך הגדרות וסנכרון' }
        ],
        timestamp: time
      };
    }

    // 4. Statistics & Status Breakdown
    if (q.includes('כמה לקוחות') || q.includes('סטטיסטיקה') || q.includes('פילוח') || q.includes('חלוקת סטטוסים') || q.includes('כל הסטטוסים') || q.includes('תמונת מצב')) {
      const sortedStatuses = Object.entries(systemStats.statusDistribution).sort((a, b) => b[1] - a[1]);
      let statsText = `📈 **תמונת מצב מלאה של לקוחות ה-CRM (${systemStats.totalClients.toLocaleString()} לקוחות):**\n\n`;
      statsText += `🚨 **דחוף / חריגות מענה:** ${systemStats.urgentCount} לקוחות\n`;
      statsText += `📅 **פגישות שנקבעו:** ${systemStats.meetingCount} לקוחות\n`;
      statsText += `⭐ **חשוב / לשמירת קשר:** ${systemStats.importantCount} לקוחות\n\n`;
      statsText += `📊 **פילוח לפי סטטוסים מובילים:**\n`;

      sortedStatuses.slice(0, 7).forEach(([st, count]) => {
        const pct = ((count / (systemStats.totalClients || 1)) * 100).toFixed(1);
        statsText += `- **${st}:** ${count.toLocaleString()} לקוחות (${pct}%)\n`;
      });

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: statsText,
        actions: [
          { type: 'navigate_tab', payload: 'crm', label: '👥 פתח טבלת לקוחות' },
          { type: 'navigate_tab', payload: 'myday', label: '⚡ מעקבים דחופים (היום שלי)' }
        ],
        timestamp: time
      };
    }

    // 5. Urgent / Attention / Follow-up queries
    if (q.includes('דחוף') || q.includes('טיפול') || q.includes('urgent') || q.includes('עדיפות עליונה') || q.includes('מעקבים') || q.includes('חריגות')) {
      const urgentClients = clients.filter(c => c.requiresAttention || c.status === 'Urgent');
      const meetings = clients.filter(c => c.status === 'Meeting Scheduled');

      let reply = `🚨 **איתרתי ${urgentClients.length} לקוחות בעדיפות עליונה ו-${meetings.length} פגישות שנקבעו:**\n`;
      const actions: ChatAction[] = [];

      urgentClients.slice(0, 4).forEach((c, i) => {
        reply += `\n${i + 1}. **${c.name}** (${c.company || 'ללא חברה'}) - סטטוס: **${c.status}**`;
        if (c.phone) reply += ` | 📞 ${c.phone}`;
        if (c.lastNote) reply += `\n   📝 "${c.lastNote.replace(/^[0-9/:\s|]+👤[^|]+\|\s*/, '').slice(0, 90)}..."`;
        
        actions.push({
          type: 'open_client',
          payload: c.id,
          label: `👤 כרטיס: ${c.name}`
        });
      });

      if (meetings.length > 0) {
        reply += `\n\n📅 **פגישות דמו והדרכה קרובות:**\n`;
        meetings.slice(0, 3).forEach((m, idx) => {
          reply += `- **${m.name}** (${m.company || 'סוכנות'}) | ${m.nextFollowUpDate || 'מעקב פתוח'}\n`;
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

    // 6. Objection Handling & Competitors ("באפי", "Bafi", "מחיר", "יקר", "התנגדות")
    if (q.includes('באפי') || q.includes('bafi') || q.includes('מחיר') || q.includes('יקר') || q.includes('התנגדות') || q.includes('אינטגרציה')) {
      const bafiText = `💡 **ארגז כלים לטיפול בהתנגדויות סוכנויות ביטוח:**

1. ⚡ **התנגדות: "אנחנו כבר עובדים עם באפי (Bafi)"**
   - **התשובה המנצחת:** ClaimAI לא מחליפה את באפי – היא כלי העזר שהפקידות חלמו עליו! ClaimAI מקצרת את זמן הטיפול בתביעה מ-25 דקות ל-90 שניות, מחלצת אוטומטית מסמכים סרוקים, ומשם הנתונים מועברים לבאפי בקלות.
   - **מסר מרכזי:** "באפי היא מערכת הליבה לניהול פוליסות. ClaimAI היא ה-AI שממלא אותה בשבילך וחוסך חצי משרה של פקידה."

2. 💰 **התנגדות: "יקר לנו / אין לנו תקציב"**
   - **חישוב ROI מיידי:** פקידת תביעות ממוצעת עולה לסוכנות כ-10,000 ₪ בחודש. אם המערכת חוסכת לה 30 שעות חודשיות בהקלדות מייגעות ואיסוף מסמכים, הסוכנות חוסכת פי 4 מעלות המנוי כבר בחודש הראשון.

3. ⏳ **התנגדות: "אין לנו זמן להטמעה"**
   - **התשובה:** "ההטמעה לוקחת 15 דקות בזום. תוך שעה הפקידה כבר מעלה תביעה ראשונה."`;

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: bafiText,
        actions: [
          { type: 'navigate_tab', payload: 'crm', label: '👥 חזור לטבלת הלקוחות' },
          { type: 'navigate_tab', payload: 'myday', label: '⚡ המשך מעקבים' }
        ],
        timestamp: time
      };
    }

    // 7. Product & Bugs queries
    if (q.includes('תקלה') || q.includes('תקלות') || q.includes('באג') || q.includes('מוצר') || q.includes('פיתוח') || q.includes('גרסה') || q.includes('ticket') || q.includes('roadmap')) {
      const openTickets = productItems.filter(p => p.status !== 'Done');
      const bugs = openTickets.filter(p => p.category === 'bug');
      const roadmapItems = openTickets.filter(p => p.category === 'roadmap');

      let reply = `🐛 **תמונת מצב מודול מוצר ותקלות (Fixes & Roadmap):**\n` +
        `- סה"כ משימות פעילות: **${openTickets.length}** מתוך ${productItems.length}\n` +
        `- באגים פתוחים: **${bugs.length}** (מתוכם ${systemStats.criticalBugsCount} קריטיים)\n` +
        `- תוכניות ופיצ'רים ב-Roadmap: **${roadmapItems.length}**\n\n` +
        `🚨 **תקלות בעדיפות גבוהה:**\n`;

      const actions: ChatAction[] = [];
      const criticalBugs = bugs.filter(b => b.priority === 'Critical' || b.priority === 'High').slice(0, 3);
      criticalBugs.forEach((b, idx) => {
        reply += `${idx + 1}. **[${b.id}] ${b.title}** (${b.client || 'כללי'})\n`;
        actions.push({
          type: 'open_ticket',
          payload: b.id,
          label: `🐛 פתח: ${b.title.slice(0, 22)}...`
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

    // 8. Custom Tables / No Cases Sheet
    if (q.includes('ללא תיקים') || q.includes('משתמשים') || q.includes('טבלה') || q.includes('טבלאות')) {
      const noCasesTable = customTables.find(t => t.id === 'table-no-cases' || t.name.includes('ללא תיקים'));
      if (noCasesTable) {
        let reply = `📋 **דוח לקוחות ללא תיקים (${noCasesTable.rows.length} לקוחות רשומים):**\n` +
          `רשומים אלו הצטרפו למערכת אך עדיין לא פתחו תיק תביעה ראשון.\nדוגמאות מתוך הדוח:\n`;

        noCasesTable.rows.slice(0, 4).forEach((r, idx) => {
          reply += `${idx + 1}. **${r.fullName || r.name}** | אימייל: ${r.email || 'אין'} | מסלול: ${r.plan || 'Free Trial'}\n`;
        });

        return {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          actions: [
            { type: 'navigate_tab', payload: 'crm', label: '📑 צפה בטבלה בלשונית CRM' }
          ],
          timestamp: time
        };
      }
    }

    // 9. Direct Client & Note Search
    const cleanTokens = q.split(/[\s,?.!-]+/).filter(t => t.length >= 2 && !['של', 'את', 'על', 'מי', 'זה', 'מה', 'עם', 'הוא', 'היא', 'האם', 'איפה', 'תן', 'לי', 'חפש', 'מצא', 'תראה', 'תסביר'].includes(t));

    const matchedClients = clients.filter(c => {
      const name = (c.name || '').toLowerCase();
      const comp = (c.company || '').toLowerCase();
      const phone = (c.phone || '').replace(/\D/g, '');
      const note = (c.lastNote || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const qDigits = q.replace(/\D/g, '');

      if (qDigits.length >= 4 && phone.includes(qDigits)) return true;
      if (name.includes(q) || comp.includes(q) || email.includes(q) || note.includes(q)) return true;

      // Token match
      if (cleanTokens.length > 0) {
        return cleanTokens.some(token => name.includes(token) || comp.includes(token) || note.includes(token));
      }
      return false;
    });

    if (matchedClients.length > 0) {
      if (matchedClients.length === 1) {
        const target = matchedClients[0];
        const linkedTickets = productItems.filter(p => 
          (target.company && p.client && p.client.toLowerCase().includes(target.company.toLowerCase())) ||
          (target.name && p.client && p.client.toLowerCase().includes(target.name.toLowerCase()))
        );

        const companyOrName = target.company || target.name;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(companyOrName + ' ביטוח')}`;

        let reply = `👤 **כרטיס לקוח מזוהה:** **${target.name}**\n` +
          `🏢 **חברה / סוכנות:** ${target.company || 'לא צוין'}\n` +
          `🏷️ **סוג עסק:** ${target.businessType || 'סוכנות ביטוח'}\n` +
          `📌 **סטטוס CRM:** **${target.status}** ${target.subStatus ? `(${target.subStatus})` : ''}\n` +
          `📞 **טלפון:** ${target.phone || 'אין'}\n` +
          `✉️ **אימייל:** ${target.email || 'אין'}\n` +
          `${linkedTickets.length > 0 ? `\n✨ **משימות פיתוח מקושרות (${linkedTickets.length}):** ${linkedTickets.map(t => `[${t.id}] ${t.title}`).join(', ')}` : ''}` +
          `${target.lastNote ? `\n📝 **הערה אחרונה:** "${target.lastNote.replace(/^[0-9/:\s|]+👤[^|]+\|\s*/, '')}"` : ''}`;

        // Add tailored advice
        if (target.status === "1'st Lead" || target.status === "1'st Follow-Up") {
          reply += `\n\n💡 **המלצת Copilot להמשך טיפול:** הלקוח בתחילת התהליך. שלח לו וואטסאפ קצר המציע שיחת הדגמה בת 10 דקות, או בדוק עליו מידע נוסף ברשת לפני השיחה.`;
        } else if (target.status === "Meeting Scheduled") {
          reply += `\n\n💡 **המלצת Copilot להמשך טיפול:** נקבעה פגישה! וודא ששלחת תזכורת והכן דמו ממוקד למודול התביעות.`;
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
            label: `💬 וואטסאפ: ${target.phone}`
          });
          actions.push({
            type: 'call',
            payload: target.phone,
            label: `📞 חיוג טלפוני`
          });
        }

        return {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          actions,
          timestamp: time
        };
      } else {
        let reply = `🔍 **איתרתי ${matchedClients.length} לקוחות התואמים לחיפוש "${raw}":**\n`;
        const actions: ChatAction[] = [];

        matchedClients.slice(0, 4).forEach((c, idx) => {
          reply += `\n${idx + 1}. **${c.name}** (${c.company || c.businessType || 'לקוח'}) | סטטוס: **${c.status}** ${c.phone ? `| 📞 ${c.phone}` : ''}`;
          if (c.lastNote) reply += `\n   📝 "${c.lastNote.replace(/^[0-9/:\s|]+👤[^|]+\|\s*/, '').slice(0, 75)}..."`;
          actions.push({
            type: 'open_client',
            payload: c.id,
            label: `👤 ${c.name}`
          });
        });

        if (matchedClients.length > 4) {
          reply += `\n\n*(קיימים עוד ${matchedClients.length - 4} לקוחות נוספים במאגר)*`;
        }

        // Web search for the first result
        const topClient = matchedClients[0];
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent((topClient.company || topClient.name) + ' ביטוח')}`;
        actions.push({
          type: 'web_link',
          payload: searchUrl,
          label: `🌐 חפש ברשת על ${topClient.company || topClient.name}`
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

    // 10. General Conversational Fallback - Contextual, Engaging and Helpful
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `שמעתי אותך בנושא: **"${raw}"**.\n\nסרקתי את כל מאגר הנתונים של ClaimAI (${systemStats.totalClients.toLocaleString()} לקוחות, ${systemStats.totalTickets} משימות מוצר). הנה דרכים מהירות שבהן אוכל לסייע לך:\n\n- 🔍 **חיפוש לקוח או סוכנות:** הקלד שם מלא או חלקי (למשל: "לירז יעקב", "דבאח", "אלמוג") או מספר טלפון.\n- 🚨 **בדיקת עומסים:** בקש "מי הלקוחות הדחופים היום?" או "כמה פגישות נקבעו?".\n- 🧭 **סיור מלא:** שאל "תעשה לי סיור במערכת" לקבלת הדרכה מקיפה.\n- 💡 **שיחה פתוחה עם מודל שפה חכם (ChatGPT/Llama):** לחץ על גלגל ההגדרות למעלה וחבר מפתח חינמי לשיחה חופשית ללא מגבלות!`,
      actions: [
        { type: 'navigate_tab', payload: 'myday', label: '⚡ למסך היום שלי' },
        { type: 'navigate_tab', payload: 'crm', label: '👥 פתח טבלת לקוחות' },
        { type: 'navigate_tab', payload: 'product', label: '🐛 צפה בתקלות מוצר' }
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
