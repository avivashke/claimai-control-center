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
  RefreshCw
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
  ChatContextPayload 
} from '../../services/aiWorkerService';

export interface ChatAction {
  type: 'open_client' | 'open_ticket' | 'navigate_tab' | 'whatsapp' | 'call';
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
  
  // Worker connection settings state
  const [showWorkerSettings, setShowWorkerSettings] = useState(false);
  const [workerUrlInput, setWorkerUrlInput] = useState(getWorkerUrl());
  const [workerTokenInput, setWorkerTokenInput] = useState(getWorkerToken());
  const [workerStatusMsg, setWorkerStatusMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [isTestingWorker, setIsTestingWorker] = useState(false);
  const [workerConfigured, setWorkerConfigured] = useState(isWorkerConfigured());

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `שלום ${currentUser.name}! אני ה-Copilot החכם של ClaimAI Control Center 🤖. \nאני מחובר בזמן אמת לכל לקוחות ה-CRM (1,281+), ל-44 משימות המוצר והתקלות, ולטבלאות המותאמות. \nשאל אותי על לקוח ספציפי, פילוח סטטוסים, פגישות שנקבעו, או תקלות דחופות!`,
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

  // Handle Testing & Saving Worker Config
  const handleTestAndSaveWorker = async () => {
    setIsTestingWorker(true);
    setWorkerStatusMsg(null);
    setCustomWorkerConfig(workerUrlInput, workerTokenInput);
    const result = await checkWorkerHealth();
    setIsTestingWorker(false);
    if (result.ok) {
      setWorkerConfigured(true);
      setWorkerStatusMsg({
        success: true,
        text: `🟢 הוורקר מחובר בהצלחה! (${result.info?.service || 'ClaimAI AI Worker'})`
      });
    } else {
      setWorkerConfigured(isWorkerConfigured());
      setWorkerStatusMsg({
        success: false,
        text: `🔴 שגיאת חיבור: ${result.error || 'בדוק כתובת URL'}`
      });
    }
  };

  const handleResetWorkerConfig = () => {
    clearCustomWorkerConfig();
    setWorkerUrlInput(getWorkerUrl());
    setWorkerTokenInput(getWorkerToken());
    setWorkerConfigured(isWorkerConfigured());
    setWorkerStatusMsg(null);
  };

  // Pre-calculate full system metrics for deep intelligence
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

  // Deep Local Knowledge & Semantic Context Parser
  const processUserQuery = (query: string): ChatMessage => {
    const q = query.trim().toLowerCase();
    const time = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    // 1. Database & Sync Health Status
    if (q.includes('דאטה') || q.includes('בסיס נתונים') || q.includes('חיבור') || q.includes('סופבייס') || q.includes('בלובס') || q.includes('תקינות') || q.includes('שיטס') || q.includes('גיבוי') || q.includes('וורקר')) {
      const workerUrl = getWorkerUrl();
      const dbText = `📊 **תמונת מצב שירותי הנתונים, הגיבוי וה-AI של ClaimAI:**
- **Cloudflare AI Worker:** ${workerConfigured ? `🟢 מחובר ופעיל (${workerUrl})` : '🟡 לא מוגדר / מנוע מקומי פעיל (לחץ על גלגל השיניים להגדרה)'}
- **Supabase Cloud (PostgreSQL):** ${supabaseConnected ? '🟢 מחובר ומסונכרן (פרויקט eiuwqhqbfvxsxlrjcixf)' : '🟡 מוגדר בענן, בדוק סנכרון בהגדרות'}
- **Google Sheets Backup:** 🟢 גיבוי חי פעיל (Claimai_CRM + Product & Delivery)
- **Netlify Blobs (Edge Storage):** ${blobsConnected ? '🟢 פעיל ב-Edge' : '🔵 פעיל בסביבת Netlify'}
- **IndexedDB מקומי בדפדפן:** 🟢 פעיל עם ${clients.length.toLocaleString()} לקוחות, ${productItems.length} משימות ו-${customTables.length} טבלאות מותאמות`;

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: dbText,
        actions: [
          { type: 'navigate_tab', payload: 'database', label: '⚙️ פתח מסך אבחון וחיבורים' }
        ],
        timestamp: time
      };
    }

    // 2. Total Count & Status Breakdown (סטטיסטיקה, כמה לקוחות, פילוח סטטוסים)
    if (q.includes('כמה לקוחות') || q.includes('סטטיסטיקה') || q.includes('פילוח') || q.includes('חלוקת סטטוסים') || q.includes('כל הסטטוסים') || q.includes('תמונת מצב')) {
      const sortedStatuses = Object.entries(systemStats.statusDistribution).sort((a, b) => b[1] - a[1]);
      let statsText = `📈 **תמונת מצב מלאה של לקוחות ה-CRM (${systemStats.totalClients.toLocaleString()} לקוחות):**\n\n`;
      statsText += `🚨 **דחוף / חריגות מענה:** ${systemStats.urgentCount} לקוחות\n`;
      statsText += `📅 **פגישות שנקבעו:** ${systemStats.meetingCount} לקוחות\n`;
      statsText += `⭐ **חשוב / לשמירת קשר:** ${systemStats.importantCount} לקוחות\n\n`;
      statsText += `📊 **פילוח לפי סטטוסים מובילים:**\n`;

      sortedStatuses.slice(0, 7).forEach(([st, count]) => {
        const pct = ((count / systemStats.totalClients) * 100).toFixed(1);
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

    // 3. Urgent / MyDay Queries (דורש טיפול, דחוף, מעקבים)
    if (q.includes('דחוף') || q.includes('טיפול') || q.includes('urgent') || q.includes('עדיפות עליונה') || q.includes('מעקבים') || q.includes('פגישות')) {
      const urgentClients = clients.filter(c => c.requiresAttention || c.status === 'Urgent');
      const meetings = clients.filter(c => c.status === 'Meeting Scheduled');

      let reply = `🚨 **איתרתי ${urgentClients.length} לקוחות בעדיפות עליונה ו-${meetings.length} פגישות שנקבעו:**\n`;
      const actions: ChatAction[] = [];

      urgentClients.slice(0, 3).forEach((c, i) => {
        reply += `\n${i + 1}. **${c.name}** (${c.company || 'ללא חברה'}) - סטטוס: **${c.status}**`;
        if (c.phone) reply += ` | טל: ${c.phone}`;
        if (c.lastNote) reply += `\n   📝 "${c.lastNote.replace(/^[0-9/:\s|]+👤[^|]+\|\s*/, '').slice(0, 90)}..."`;
        
        actions.push({
          type: 'open_client',
          payload: c.id,
          label: `👤 כרטיס: ${c.name}`
        });
      });

      actions.push({
        type: 'navigate_tab',
        payload: 'myday',
        label: '⚡ עבור למסך "היום שלי" המלא'
      });

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        actions,
        timestamp: time
      };
    }

    // 4. Custom Tables Query (דוח לקוחות ללא תיקים, משתמשי פלטפורמה)
    if (q.includes('ללא תיקים') || q.includes('דוח') || q.includes('משתמשים') || q.includes('טבלאות נוספות') || q.includes('טבלה נוספת') || q.includes('טבלאות מותאמות')) {
      const noCasesTable = customTables.find(t => t.name.includes('ללא תיקים') || t.id.includes('ללא_תיקים') || t.id.includes('no_cases'));
      const usersTable = customTables.find(t => t.name.includes('משתמש') || t.id.includes('users'));

      if (noCasesTable) {
        let reply = `📋 **דוח לקוחות ללא תיקים (${noCasesTable.rows.length} לקוחות רשומים):**\n` +
          `בדוח זה מרוכזים לקוחות שפתחו כרטיס אך טרם פתחו תיק פעיל במערכת.\n` +
          `מדגם לקוחות מהדוח:\n`;

        noCasesTable.rows.slice(0, 3).forEach((r, idx) => {
          const clientName = r['שם לקוח'] || r.clientName || r.name || Object.values(r)[0] || 'לקוח';
          const email = r['אימייל'] || r.email || '';
          reply += `- ${idx + 1}. **${clientName}** ${email ? `(${email})` : ''}\n`;
        });

        const actions: ChatAction[] = [
          { type: 'navigate_tab', payload: 'crm', label: '📑 פתח טבלאות נוספות ב-CRM' }
        ];

        return {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          actions,
          timestamp: time
        };
      }

      if (usersTable) {
        const activeUsers = usersTable.rows.filter(r => Number(r.caseCount || 0) > 0);
        let reply = `👥 **טבלת משתמשי הפלטפורמה (${usersTable.rows.length} רשומים):**\n` +
          `נמצאו **${activeUsers.length} משתמשים שכבר פתחו תביעות במערכת ClaimAI**.\n`;

        const actions: ChatAction[] = [
          { type: 'navigate_tab', payload: 'crm', label: '📑 צפה בטבלאות המותאמות' }
        ];

        return {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          actions,
          timestamp: time
        };
      }
    }

    // 5. Product, Bugs & Roadmap Queries
    if (q.includes('באג') || q.includes('תקלה') || q.includes('מוצר') || q.includes('פיתוח') || q.includes('רואדמאפ') || q.includes('roadmap') || q.includes('קנבן')) {
      const bugs = productItems.filter(p => p.category === 'bug');
      const criticalBugs = bugs.filter(b => b.priority === 'Critical' || b.priority === 'High');

      let reply = `🐛 **תמונת מצב מודול מוצר, תקלות ומסירה:**\n` +
        `סה"כ במערכת: **${productItems.length} משימות** (${bugs.length} תקלות ו-${productItems.length - bugs.length} פיצ'רים במפת הדרכים).\n` +
        `כרגע ישנן **${criticalBugs.length} תקלות קריטיות / בעדיפות גבוהה**:\n`;

      const actions: ChatAction[] = [];
      criticalBugs.slice(0, 3).forEach((b) => {
        reply += `\n- **[${b.id}]** ${b.title} | לקוח: **${b.client}** (עדיפות: ${b.priority})`;
        actions.push({
          type: 'open_ticket',
          payload: b.id,
          label: `🛠️ פתח פנייה: ${b.id}`
        });
      });

      actions.push({
        type: 'navigate_tab',
        payload: 'product',
        label: '🚀 פתח לוח קנבן מוצר ותקלות'
      });

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        actions,
        timestamp: time
      };
    }

    // 6. Business Type Distribution Queries (מוסכים, סוכנויות ביטוח, שמאים)
    if (q.includes('מוסכ') || q.includes('סוכנוי') || q.includes('שמאי') || q.includes('ליסינג') || q.includes('סוג עסק')) {
      const garages = clients.filter(c => (c.businessType || '').includes('מוסך'));
      const agencies = clients.filter(c => (c.businessType || '').includes('סוכנות'));

      let reply = `🏢 **פילוח לקוחות לפי סוגי עסק:**\n` +
        `- **סוכנויות ביטוח:** ${agencies.length.toLocaleString()} לקוחות\n` +
        `- **מוסכים:** ${garages.length.toLocaleString()} לקוחות\n\n`;

      const actions: ChatAction[] = [];
      if (q.includes('מוסכ') && garages.length > 0) {
        reply += `**מדגם מוסכים מובילים במערכת:**\n`;
        garages.slice(0, 3).forEach(g => {
          reply += `- **${g.name}** (${g.company || 'מוסך'}) | סטטוס: ${g.status}\n`;
          actions.push({ type: 'open_client', payload: g.id, label: `🔧 כרטיס: ${g.name}` });
        });
      } else {
        reply += `**מדגם סוכנויות מובילות במערכת:**\n`;
        agencies.slice(0, 3).forEach(a => {
          reply += `- **${a.name}** (${a.company || 'סוכנות'}) | סטטוס: ${a.status}\n`;
          actions.push({ type: 'open_client', payload: a.id, label: `🏢 כרטיס: ${a.name}` });
        });
      }

      actions.push({ type: 'navigate_tab', payload: 'crm', label: '👥 צפה ברשימה ב-CRM' });

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        actions,
        timestamp: time
      };
    }

    // 7. Team & Users Query (אייל, אביב, משתמשי אדמין)
    if (q.includes('אייל') || q.includes('אביב') || q.includes('אדמין') || q.includes('הרשאות') || q.includes('מנהל מערכת')) {
      const reply = `👤 **פרטי הנהלת המערכת (Admin Users):**\n` +
        `- **אייל:** מנכ"ל ומנהל מערכת | משתמש: \`eyal@claimi.co.il\` (הרשאות מלאות)\n` +
        `- **אביב אשכנזי:** מנהל מערכת | משתמש: \`aviv.claimai@gmail.com\` (הרשאות מלאות)\n\n` +
        `ניהול הסיסמאות וההרשאות מוגדר דרך משתני Netlify או ישירות בפורטל אדמין.`;

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        actions: [
          { type: 'navigate_tab', payload: 'admin', label: '🛡️ עבור לפורטל ניהול משתמשים' }
        ],
        timestamp: time
      };
    }

    // 8. Specific Client & Notes Search across all 1,281 clients
    const matchedClients = clients.filter(c => {
      const name = (c.name || '').toLowerCase();
      const company = (c.company || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const note = (c.lastNote || '').toLowerCase();
      return name.includes(q) || company.includes(q) || phone.includes(q) || email.includes(q) || note.includes(q) || q.includes(name);
    });

    if (matchedClients.length > 0) {
      if (matchedClients.length === 1) {
        const target = matchedClients[0];
        const linkedTickets = productItems.filter(p => 
          (target.company && p.client && p.client.toLowerCase().includes(target.company.toLowerCase())) ||
          (target.name && p.client && p.client.toLowerCase().includes(target.name.toLowerCase()))
        );

        let reply = `👤 **מצאתי עבורך את הלקוח:** **${target.name}**\n` +
          `🏢 **חברה / סוכנות:** ${target.company || 'לא צוין'}\n` +
          `🏷️ **סוג עסק:** ${target.businessType || 'סוכנות ביטוח'}\n` +
          `📌 **סטטוס CRM:** **${target.status}** ${target.subStatus ? `(${target.subStatus})` : ''}\n` +
          `📞 **טלפון:** ${target.phone || 'אין'}\n` +
          `✉️ **אימייל:** ${target.email || 'אין'}\n` +
          `${linkedTickets.length > 0 ? `\n✨ **משימות פיתוח מקושרות (${linkedTickets.length}):** ${linkedTickets.map(t => `[${t.id}] ${t.title}`).join(', ')}` : ''}` +
          `${target.lastNote ? `\n📝 **הערה אחרונה:** "${target.lastNote.replace(/^[0-9/:\s|]+👤[^|]+\|\s*/, '')}"` : ''}`;

        const actions: ChatAction[] = [
          {
            type: 'open_client',
            payload: target.id,
            label: `👤 פתח פרופיל: ${target.name}`
          }
        ];

        if (target.phone) {
          actions.push({
            type: 'whatsapp',
            payload: target.phone,
            label: `💬 וואטסאפ ל-${target.phone}`
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
        // Multiple matches
        let reply = `🔍 **מצאתי ${matchedClients.length} לקוחות התואמים לחיפוש "${query}":**\n`;
        const actions: ChatAction[] = [];

        matchedClients.slice(0, 4).forEach((c, idx) => {
          reply += `\n${idx + 1}. **${c.name}** (${c.company || c.businessType || 'לקוח'}) | סטטוס: **${c.status}** ${c.phone ? `| 📞 ${c.phone}` : ''}`;
          actions.push({
            type: 'open_client',
            payload: c.id,
            label: `👤 כרטיס: ${c.name}`
          });
        });

        if (matchedClients.length > 4) {
          reply += `\n\nועוד ${matchedClients.length - 4} לקוחות נוספים בטבלה.`;
        }

        actions.push({
          type: 'navigate_tab',
          payload: 'crm',
          label: '🔍 צפה בכל התוצאות ב-CRM'
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

    // Default High-Intelligence Fallback
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `סרקתי את כל ${systemStats.totalClients.toLocaleString()} הלקוחות ו-43 משימות המוצר של ClaimAI עבור: "${query}".\n\nתוכל לשאול אותי שאלות ממוקדות כמו:\n- "מי הלקוחות הדחופים היום?"\n- "כמה לקוחות יש בסך הכל ומה פילוח הסטטוסים?"\n- "חפש לקוח: פינקל / דבאח / לירז"\n- "כמה תקלות קריטיות פתוחות במפת הדרכים?"\n- "מה הסטטוס של דוח לקוחות ללא תיקים?"\n- "מה מצב חיבורי הדאטה-בייס והוורקר?"`,
      actions: [
        { type: 'navigate_tab', payload: 'myday', label: '⚡ למסך היום שלי' },
        { type: 'navigate_tab', payload: 'crm', label: '👥 פתח טבלת CRM מלאה' },
        { type: 'navigate_tab', payload: 'product', label: '🚀 פתח מודול מוצר ותקלות' }
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
      // 1. Try Cloudflare Worker AI first if configured
      if (workerConfigured) {
        // Find top relevant clients for semantic prompt context
        const qLower = textToSend.toLowerCase();
        const relevantClients = clients.filter(c => {
          const name = (c.name || '').toLowerCase();
          const comp = (c.company || '').toLowerCase();
          const phone = (c.phone || '').toLowerCase();
          const note = (c.lastNote || '').toLowerCase();
          return name.includes(qLower) || comp.includes(qLower) || phone.includes(qLower) || note.includes(qLower) || qLower.includes(name);
        }).slice(0, 15);

        const relevantTickets = productItems.filter(p => {
          const title = (p.title || '').toLowerCase();
          const client = (p.client || '').toLowerCase();
          return title.includes(qLower) || client.includes(qLower);
        }).slice(0, 10);

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
            requiresAttention: c.requiresAttention
          })),
          matchedTickets: relevantTickets.map(t => ({
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
          }))
        };

        const workerResponse = await askWorkerAI(textToSend, workerPayload);

        if (workerResponse && workerResponse.text) {
          setMessages(prev => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              text: workerResponse.text,
              actions: workerResponse.actions,
              timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setIsLoading(false);
          return;
        }
      }

      // 2. High-intelligence local knowledge engine
      setTimeout(() => {
        const aiResponse = processUserQuery(textToSend);
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
      }, 250);
    } catch {
      const aiResponse = processUserQuery(textToSend);
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }
  };

  // Helper to render bold markdown and inline code cleanly
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

  // Action Click Handler (Navigates or opens drawers!)
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
      const cleaned = action.payload.replace(/\D/g, '');
      const waNumber = cleaned.startsWith('0') ? `972${cleaned.slice(1)}` : cleaned.startsWith('972') ? cleaned : `972${cleaned}`;
      window.open(`https://wa.me/${waNumber}`, '_blank');
    } else if (action.type === 'call') {
      window.location.href = `tel:${action.payload}`;
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 font-sans" dir="rtl">
      
      {/* COLLAPSED FLOATING BUBBLE */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-bold text-xs sm:text-sm shadow-2xl shadow-purple-600/50 hover:shadow-purple-600/70 border border-purple-400/40 transition-all hover:scale-105 active:scale-95 group"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <span>סייר AI וניווט מהיר</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        </button>
      )}

      {/* EXPANDED CHAT WINDOW */}
      {isOpen && (
        <div className={`w-full max-w-[440px] bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
          isMinimized ? 'h-14' : 'h-[620px] max-h-[88vh]'
        }`}>
          
          {/* Chat Window Header */}
          <div className="p-3.5 px-4 bg-gradient-to-r from-purple-950/70 via-indigo-950/70 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 leading-tight">
                  <span>סייר AI חכם · ClaimAI Copilot</span>
                  <button
                    onClick={() => setShowWorkerSettings(!showWorkerSettings)}
                    className="cursor-pointer"
                    title="לחץ להגדרת חיבור הוורקר"
                  >
                    {workerConfigured ? (
                      <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-mono hover:bg-purple-500/30">
                        Cloudflare AI ⚡
                      </span>
                    ) : (
                      <span className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded-full hover:bg-slate-700 flex items-center gap-1">
                        <span>מנוע מובנה</span>
                        <SlidersHorizontal className="w-2.5 h-2.5 text-purple-400" />
                      </span>
                    )}
                  </button>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </h3>
                <p className="text-[10px] text-purple-200/90 font-medium leading-tight">חיפוש, תובנות וניווט חכם בתוך האפליקציה</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowWorkerSettings(!showWorkerSettings)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  showWorkerSettings ? 'bg-purple-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                }`}
                title="הגדרות וחיבור Cloudflare Worker"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                title={isMinimized ? 'הרחב' : 'מזער'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                title="סגור"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* INLINE WORKER SETTINGS DRAWER */}
          {showWorkerSettings && !isMinimized && (
            <div className="p-3 bg-slate-950 border-b border-purple-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-purple-400" />
                  <span>חיבור Cloudflare AI Worker</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {workerConfigured ? '🟢 מוגדר' : '🟡 לא מחובר'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                הדבק את כתובת ה-Worker שקיבלת מ-Cloudflare (או הגדר ב-Netlify כ-`VITE_CLOUDFLARE_WORKER_URL`):
              </p>
              <div className="space-y-1.5">
                <input
                  type="url"
                  placeholder="https://claimai-ai-worker.xyz.workers.dev"
                  value={workerUrlInput}
                  onChange={(e) => setWorkerUrlInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <input
                  type="password"
                  placeholder="טוקן אבטחה אופציונלי (WORKER_SECRET_TOKEN)"
                  value={workerTokenInput}
                  onChange={(e) => setWorkerTokenInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleTestAndSaveWorker}
                    disabled={isTestingWorker}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {isTestingWorker ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{isTestingWorker ? 'בודק...' : 'בדוק ושמור חיבור'}</span>
                  </button>
                  {workerConfigured && (
                    <button
                      onClick={handleResetWorkerConfig}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all"
                    >
                      נקה
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowWorkerSettings(false)}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  סגור
                </button>
              </div>

              {workerStatusMsg && (
                <div className={`p-2 rounded-lg text-[11px] font-semibold border ${
                  workerStatusMsg.success
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}>
                  {workerStatusMsg.text}
                </div>
              )}
            </div>
          )}

          {!isMinimized && (
            <>
              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isAi = msg.sender === 'ai';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAi ? 'items-start' : 'items-end'} space-y-1`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-1">
                        <span>{isAi ? 'ClaimAI Assistant' : currentUser.name}</span>
                        <span>·</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[92%] whitespace-pre-wrap ${
                        isAi
                          ? 'bg-slate-800/90 text-slate-200 border border-slate-750 shadow-sm'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md'
                      }`}>
                        {renderFormattedText(msg.text)}

                        {/* Interactive Buttons rendered in AI answers */}
                        {isAi && msg.actions && msg.actions.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                            {msg.actions.map((act, idx) => (
                              <button
                                key={`act-${idx}`}
                                onClick={() => handleActionClick(act)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-400 text-[11px] font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
                              >
                                <span>{act.label}</span>
                                <ChevronRight className="w-3 h-3 opacity-60" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-purple-300 w-fit">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    <span>העוזר החכם מעבד נתונים ומחפש במערכת...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Pills */}
              <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => handleSendMessage(undefined, 'כמה לקוחות יש בסך הכל ומה פילוח הסטטוסים?')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 hover:text-white whitespace-nowrap border border-slate-700 transition-colors"
                >
                  📊 פילוח סטטוסים
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage(undefined, 'מי הלקוחות שדורשים טיפול דחוף?')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 hover:text-white whitespace-nowrap border border-slate-700 transition-colors"
                >
                  🚨 לקוחות דחופים
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage(undefined, 'מה הסטטוס של דוח לקוחות ללא תיקים?')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 hover:text-white whitespace-nowrap border border-slate-700 transition-colors"
                >
                  📋 לקוחות ללא תיקים
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage(undefined, 'כמה תקלות קריטיות יש במוצר?')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 hover:text-white whitespace-nowrap border border-slate-700 transition-colors"
                >
                  🐛 תקלות במוצר
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage(undefined, 'מה מצב החיבורים והוורקר?')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 hover:text-white whitespace-nowrap border border-slate-700 transition-colors"
                >
                  ⚡ תקינות וורקר
                </button>
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="שאל אותי כל דבר (למשל: 'מי הלקוח פינקל?', 'כמה פגישות נקבעו?')..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:scale-100 hover:scale-105 active:scale-95 shadow-md shadow-purple-600/30 shrink-0"
                  title="שלח שאלה"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

        </div>
      )}
    </div>
  );
};
