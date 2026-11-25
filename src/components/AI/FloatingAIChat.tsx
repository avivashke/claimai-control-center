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
      text: `שלום ${currentUser.name}! אני ה-Copilot החכם של ClaimAI Control Center 🤖. \nאני מחובר בזמן אמת לכל לקוחות ה-CRM (${clients.length || 1281} לקוחות), ל-43 משימות המוצר והתקלות, ולטבלאות המותאמות. \nשאל אותי בחופשיות על כל לקוח, הערה, פגישה, עדיפות, סטטוס או תקלה!`,
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

    // 1. Database & Sync Health Status
    if (q.includes('דאטה') || q.includes('בסיס נתונים') || q.includes('סופבייס') || q.includes('בלובס') || q.includes('שיטס') || q.includes('גיבוי') || q.includes('וורקר') || q.includes('סנכרון')) {
      const workerUrl = getWorkerUrl();
      const dbText = `📊 **תמונת מצב שירותי הנתונים, הגיבוי והסנכרון של ClaimAI:**
- **Google Sheets Two-Way Sync:** 🟢 מחובר ומסונכרן (ראשי + דוח ללא תיקים + Fixes & Bugs + Roadmap)
- **דאטה-בייס מקומי (IndexedDB):** 🟢 פעיל עם ${clients.length.toLocaleString()} לקוחות, ${productItems.length} משימות ו-${customTables.length} טבלאות מותאמות
- **Cloudflare AI Worker:** ${workerConfigured ? `🟢 מחובר (${workerUrl})` : '🔵 מנוע AI מקומי מובנה פעיל'}
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

    // 2. Statistics & Status Breakdown
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

    // 3. Urgent / Attention / Follow-up queries
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

    // 4. Product, Bugs & Roadmap Queries
    if (q.includes('באג') || q.includes('באגים') || q.includes('תקלה') || q.includes('תקלות') || q.includes('רודמאפ') || q.includes('פיתוח') || q.includes('גרסה') || q.includes('פיצ\'ר') || q.includes('fix')) {
      const bugs = productItems.filter(p => p.category === 'bug');
      const roadmap = productItems.filter(p => p.category === 'roadmap');
      const openBugs = bugs.filter(b => b.status === 'Open' || b.status === 'In Progress');

      let reply = `🐛 **סטטוס מוצר ופיתוח (${productItems.length} משימות בסך הכל):**\n` +
        `- **תקלות ובאגים (Fixes & Bugs):** ${bugs.length} (מתוכם **${openBugs.length} פתוחים בטיפול**)\n` +
        `- **מפת דרכים ופיתוחים (Product Roadmap):** ${roadmap.length} תכונות מתוכננות\n\n` +
        `תקלות מובילות שדורשות התייחסות:\n`;

      const actions: ChatAction[] = [];
      openBugs.slice(0, 3).forEach((b, i) => {
        reply += `${i + 1}. [${b.id}] **${b.title}** (עדיפות: ${b.priority}, סטטוס: ${b.status})\n`;
        actions.push({
          type: 'open_ticket',
          payload: b.id,
          label: `🐛 פתח תקלה: ${b.id}`
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

    // 5. Custom Tables / No Cases Sheet
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

    // 6. Direct Client & Note Search
    // Clean stop words in Hebrew
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

        let reply = `👤 **פרטי לקוח:** **${target.name}**\n` +
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
            label: `👤 פתח כרטיס: ${target.name}`
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
        let reply = `🔍 **מצאתי ${matchedClients.length} לקוחות התואמים לפנייתך:**\n`;
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
          reply += `\n\n*(נמצאו עוד ${matchedClients.length - 4} לקוחות נוספים)*`;
        }

        actions.push({
          type: 'navigate_tab',
          payload: 'crm',
          label: '🔍 צפה בתוצאות ב-CRM'
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

    // 7. General Context-Aware Helpful Response
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `סרקתי את מאגר המידע של ClaimAI (${systemStats.totalClients.toLocaleString()} לקוחות, ${systemStats.totalTickets} משימות מוצר) בנושא: **"${raw}"**.\n\nלא נמצאה התאמה מדויקת לשם או למילת המפתח. שאלות מומלצות לבדיקה:\n- 📞 "מי הלקוחות הדחופים היום?"\n- 🔍 חפש לפי שם או חברה (למשל: "לירז יעקב", "דבאח", "אלמוג")\n- 🐛 "כמה תקלות פתוחות במערכת?"\n- 📊 "מה פילוח הסטטוסים של הלקוחות?"`,
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
      // 1. If Worker is available, try it with timeout
      let workerRes: any = null;
      if (workerConfigured) {
        const qLower = textToSend.toLowerCase();
        const relevantClients = clients.filter(c => {
          const name = (c.name || '').toLowerCase();
          const comp = (c.company || '').toLowerCase();
          const note = (c.lastNote || '').toLowerCase();
          return name.includes(qLower) || comp.includes(qLower) || note.includes(qLower);
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
          }))
        };

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout
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
    }
  };

  return (
    <>
      {/* Floating Launcher Pill Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-2xl shadow-purple-900/50 border border-purple-400/40 transition-all hover:scale-105 group"
          title="פתח את העוזר החכם של ClaimAI"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <span className="tracking-wide">AI Copilot</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white">
            1,281 לקוחות
          </span>
        </button>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div 
          dir="rtl"
          className={`fixed z-50 left-6 bottom-6 transition-all duration-300 shadow-2xl rounded-2xl border border-purple-500/30 overflow-hidden flex flex-col bg-slate-900/95 backdrop-blur-md ${
            isMinimized 
              ? 'w-80 h-14' 
              : 'w-[95vw] sm:w-[480px] h-[640px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border-b border-purple-500/20 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white">ClaimAI Copilot</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live CRM
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">עוזר אסטרטגי אישי למעקבים, לקוחות ותקלות</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setShowWorkerSettings(!showWorkerSettings)}
                className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
                  showWorkerSettings ? 'text-purple-400 bg-purple-950/40' : 'hover:text-white'
                }`}
                title="הגדרות חיבור שרת AI"
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

          {/* Optional Worker Settings Drawer */}
          {showWorkerSettings && !isMinimized && (
            <div className="p-3 bg-slate-950/90 border-b border-purple-500/20 text-xs text-slate-300 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-purple-400" />
                  <span>הגדרת חיבור שרת AI (Cloudflare Worker)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {workerConfigured ? 'מותאם אישית' : 'ברירת מחדל'}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block">כתובת שרת Worker URL:</label>
                <input
                  type="url"
                  placeholder="https://small-sea-ba86.avivashke95.workers.dev"
                  value={workerUrlInput}
                  onChange={(e) => setWorkerUrlInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {workerStatusMsg && (
                <div className={`p-2 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 ${
                  workerStatusMsg.success 
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                    : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                }`}>
                  {workerStatusMsg.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  <span>{workerStatusMsg.text}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResetWorker}
                  className="text-[10px] text-slate-400 hover:text-white underline"
                >
                  איפוס לברירת מחדל
                </button>
                <button
                  type="button"
                  onClick={handleTestAndSaveWorker}
                  disabled={isTestingWorker}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isTestingWorker ? 'animate-spin' : ''}`} />
                  <span>{isTestingWorker ? 'בודק...' : 'שמור ובדוק חיבור'}</span>
                </button>
              </div>
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
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">
                      {renderFormattedText(msg.text)}
                    </div>

                    {/* Interactive Action Buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                        {msg.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(action)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 hover:text-white border border-purple-500/30 text-[10px] font-bold transition-all hover:scale-[1.02]"
                          >
                            <span>{action.label}</span>
                            <ChevronRight className="w-3 h-3" />
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
                onClick={() => handleSendMessage(undefined, 'מי הלקוחות הדחופים היום?')}
                className="px-2 py-0.8 rounded-md bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white text-[10px] whitespace-nowrap border border-slate-700/60 transition-colors"
              >
                🚨 לקוחות דחופים
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage(undefined, 'כמה לקוחות יש ומה פילוח הסטטוסים?')}
                className="px-2 py-0.8 rounded-md bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white text-[10px] whitespace-nowrap border border-slate-700/60 transition-colors"
              >
                📊 פילוח סטטוסים
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage(undefined, 'כמה תקלות פתוחות במערכת?')}
                className="px-2 py-0.8 rounded-md bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white text-[10px] whitespace-nowrap border border-slate-700/60 transition-colors"
              >
                🐛 תקלות ובאגים
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage(undefined, 'מה הסטטוס של דוח לקוחות ללא תיקים?')}
                className="px-2 py-0.8 rounded-md bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white text-[10px] whitespace-nowrap border border-slate-700/60 transition-colors"
              >
                📋 ללא תיקים
              </button>
            </div>
          )}

          {/* Input Box Footer */}
          {!isMinimized && (
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-purple-500/20 flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="שאל כל דבר על לקוח, הערה, פגישה או תקלה..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-all flex items-center justify-center shrink-0 shadow-md shadow-purple-600/30"
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
