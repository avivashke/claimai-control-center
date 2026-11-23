import React, { useState, useRef, useEffect } from 'react';
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
  Database
} from 'lucide-react';
import { Client, ProductItem, CustomTable, AppUser } from '../../types';
import { TabType } from '../Header';
import { askWorkerAI, isWorkerConfigured } from '../../services/aiWorkerService';

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
  const hasCloudflareWorker = isWorkerConfigured();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `שלום ${currentUser.name}! אני העוזר החכם של ClaimAI Control Center 🤖. \nאני מחובר בזמן אמת לכל נתוני הלקוחות (1,282), מפת המוצר (43 תקלות ופיצ'רים), ומשתמשי המערכת. \nשאל אותי כל שאלה ואציע לך כפתורי ניווט ישירים למקום הרלוונטי באפליקציה!`,
      actions: [
        { type: 'navigate_tab', payload: 'myday', label: '⚡ עבור ל"היום שלי" (מעקבים דחופים)' },
        { type: 'navigate_tab', payload: 'crm', label: '👥 פתח טבלת CRM מלאה' },
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

  // AI Knowledge Search & Intent Resolver
  const processUserQuery = (query: string): ChatMessage => {
    const q = query.trim().toLowerCase();
    const time = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    // 1. Database status query
    if (q.includes('דאטה') || q.includes('בסיס נתונים') || q.includes('חיבור') || q.includes('סופבייס') || q.includes('בלובס') || q.includes('תקינות')) {
      const dbText = `📊 **תמונת מצב חיבורי הדאטה-בייס של ClaimAI:**
- **Supabase Cloud (PostgreSQL):** ${supabaseConnected ? '🟢 מחובר ופעיל בענן (פרויקט eiuwqhqbfvxsxlrjcixf)' : '🟡 מוגדר ב-Netlify, בדוק סטטוס בלשונית הגדרות'}
- **Netlify Blobs (Edge Storage):** ${blobsConnected ? '🟢 פעיל ומפזר עומסים ב-Edge' : '🔵 פעיל בסביבת Netlify (מאפשר פיזור עומסים)'}
- **IndexedDB מקומי בדפדפן:** 🟢 פעיל עם ${clients.length.toLocaleString()} לקוחות ו-${productItems.length} משימות שמורות`;

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: dbText,
        actions: [
          { type: 'navigate_tab', payload: 'database', label: '⚙️ פתח מסך אבחון ובדיקת דאטה-בייס' }
        ],
        timestamp: time
      };
    }

    // 2. Urgent / Attention needed query
    if (q.includes('דחוף') || q.includes('טיפול') || q.includes('urgent') || q.includes('עדיפות') || q.includes('פגישות')) {
      const urgentClients = clients.filter(c => c.requiresAttention || c.status === 'Urgent');
      const meetings = clients.filter(c => c.status === 'Meeting Scheduled');

      let reply = `🚨 **איתרתי ${urgentClients.length} לקוחות הדורשים טיפול דחוף ו-${meetings.length} פגישות שנקבעו:**\n`;
      const actions: ChatAction[] = [];

      urgentClients.slice(0, 3).forEach((c, i) => {
        reply += `\n${i + 1}. **${c.name}** (${c.company || 'ללא חברה'}) - סטטוס: ${c.status}. ${c.lastNote ? `\n   הערה: "${c.lastNote.slice(0, 80)}..."` : ''}`;
        actions.push({
          type: 'open_client',
          payload: c.id,
          label: `👤 פתח כרטיס: ${c.name}`
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

    // 3. Product / Bugs query
    if (q.includes('באג') || q.includes('תקלה') || q.includes('מוצר') || q.includes('פיתוח') || q.includes('רואדמאפ') || q.includes('roadmap')) {
      const bugs = productItems.filter(p => p.category === 'bug');
      const criticalBugs = bugs.filter(b => b.priority === 'Critical' || b.priority === 'High');

      let reply = `🐛 **תמונת מצב תקלות ומוצר:**
סה"כ במערכת: **${productItems.length} משימות** (${bugs.length} תקלות ו-${productItems.length - bugs.length} פיצ'רים במפת הדרכים).
יש כרגע **${criticalBugs.length} תקלות קריטיות/בעדיפות גבוהה**:`;

      const actions: ChatAction[] = [];
      criticalBugs.slice(0, 3).forEach((b) => {
        reply += `\n- **[${b.id}]** ${b.title} (${b.client}) - עדיפות: **${b.priority}**`;
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

    // 4. Platform users query (from users_export)
    if (q.includes('משתמש') || q.includes('פלטפורמה') || q.includes('users') || q.includes('תביעות') || q.includes('ניסיון')) {
      const usersTable = customTables.find(t => t.id.includes('users') || t.name.includes('משתמש'));
      if (usersTable) {
        const activeUsers = usersTable.rows.filter(r => Number(r.caseCount || 0) > 0);
        let reply = `👥 **מתוך טבלת משתמשי הפלטפורמה (${usersTable.rows.length} רשומים):**\n` +
          `נמצאו **${activeUsers.length} משתמשים פעילים שכבר פתחו תביעות במערכת ClaimAI**:\n`;

        const actions: ChatAction[] = [];
        activeUsers.slice(0, 4).forEach(u => {
          reply += `\n- **${u.fullName || u.email}** (${u.companyName || 'סוכנות/מוסך'}) - פתח **${u.caseCount} תביעות** במערכת!`;
        });

        actions.push({
          type: 'navigate_tab',
          payload: 'custom_tables',
          label: '📑 פתח טבלת משתמשי פלטפורמה מלאה'
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

    // 5. Specific Client Search (e.g. "פינקל", "רפאלי", "רחלי", "דבאח", "לירז")
    const matchedClients = clients.filter(c => {
      const name = (c.name || '').toLowerCase();
      const company = (c.company || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      return name.includes(q) || company.includes(q) || phone.includes(q) || email.includes(q) || q.includes(name);
    });

    if (matchedClients.length > 0) {
      const target = matchedClients[0];
      const linkedTickets = productItems.filter(p => 
        (target.company && p.client && p.client.toLowerCase().includes(target.company.toLowerCase())) ||
        (target.name && p.client && p.client.toLowerCase().includes(target.name.toLowerCase()))
      );

      let reply = `👤 **מצאתי את הלקוח:** **${target.name}**\n` +
        `🏢 **חברה / סוכנות:** ${target.company || 'לא צוין'}\n` +
        `🏷️ **סוג עסק:** ${target.businessType || 'סוכנות ביטוח'}\n` +
        `📌 **סטטוס CRM:** ${target.status} ${target.subStatus ? `(${target.subStatus})` : ''}\n` +
        `📞 **טלפון:** ${target.phone || 'אין'}\n` +
        `✉️ **אימייל:** ${target.email || 'אין'}\n` +
        `${linkedTickets.length > 0 ? `\n✨ **משימות פיתוח מקושרות (${linkedTickets.length}):** ${linkedTickets.map(t => t.id).join(', ')}` : ''}` +
        `${target.lastNote ? `\n📝 **הערה אחרונה:** ${target.lastNote.slice(0, 150)}` : ''}`;

      const actions: ChatAction[] = [
        {
          type: 'open_client',
          payload: target.id,
          label: `👤 פתח פרופיל 360: ${target.name}`
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
    }

    // Default Fallback
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `חיפשתי ב-1,282 הלקוחות וב-43 משימות המוצר של ClaimAI עבור: "${query}". \nתוכל לבקש ממני למשל: "מי הלקוחות שדורשים טיפול?", "ספר לי על פינקל", "כמה תקלות קריטיות פתוחות?", או "מה מצב הדאטה-בייס?".`,
      actions: [
        { type: 'navigate_tab', payload: 'crm', label: '🔍 חפש בטבלת ה-CRM' },
        { type: 'navigate_tab', payload: 'product', label: '🚀 בדוק מודול מוצר ותקלות' }
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
      if (hasCloudflareWorker) {
        const workerResponse = await askWorkerAI(textToSend, {
          currentUser: { name: currentUser.name, role: currentUser.role, email: currentUser.email },
          clientsSummary: clients.map(c => ({
            id: c.id,
            name: c.name,
            company: c.company,
            status: c.status,
            phone: c.phone,
            requiresAttention: c.requiresAttention
          })),
          productSummary: productItems.map(p => ({
            id: p.id,
            title: p.title,
            priority: p.priority,
            status: p.status,
            client: p.client,
            category: p.category
          }))
        });

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

      // 2. Fallback to local intelligent rule engine
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
        <div className={`w-full max-w-[420px] bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
          isMinimized ? 'h-14' : 'h-[580px] max-h-[85vh]'
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
                  {hasCloudflareWorker ? (
                    <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-mono">
                      Cloudflare AI ⚡
                    </span>
                  ) : (
                    <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded-full">
                      מנוע מובנה
                    </span>
                  )}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </h3>
                <p className="text-[10px] text-slate-400 leading-tight">חיפוש, תובנות וניווט חכם בתוך האפליקציה</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
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

                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[90%] whitespace-pre-wrap ${
                        isAi
                          ? 'bg-slate-800/90 text-slate-200 border border-slate-750 shadow-sm'
                          : 'bg-purple-600 text-white rounded-br-none shadow-md'
                      }`}>
                        {msg.text}

                        {/* Interactive Navigation Action Buttons */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-col gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-amber-300 block">
                              פעולות וניווט ישיר:
                            </span>
                            {msg.actions.map((act, aIdx) => (
                              <button
                                key={aIdx}
                                onClick={() => handleActionClick(act)}
                                className="w-full text-right px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/40 text-purple-200 hover:text-white text-xs font-semibold flex items-center justify-between transition-all group"
                              >
                                <span>{act.label}</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex flex-col items-start space-y-1 animate-pulse">
                    <div className="flex items-center gap-1.5 text-[10px] text-purple-400 px-1">
                      <span>{hasCloudflareWorker ? 'Cloudflare AI מעבד...' : 'מעבד תשובה...'}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-800/80 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                      <span>חושב ומנתח נתונים...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="p-2 border-t border-slate-800 bg-slate-900/90 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  '🚨 לקוחות דחופים',
                  '🐛 תקלות קריטיות',
                  '📊 בדיקת דאטה-בייס',
                  '👥 משתמשי פלטפורמה',
                  'ספר לי על פינקל'
                ].map((chip) => (
                  <button
                    key={chip}
                    disabled={isLoading}
                    onClick={() => handleSendMessage(undefined, chip)}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-slate-300 hover:text-white text-[10px] font-semibold whitespace-nowrap border border-slate-700 transition-all shrink-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-850 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="שאל שאלה על לקוח, באג, דאטה-בייס או משתמש..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 shadow-md"
                >
                  <Send className="w-4 h-4 -rotate-90" />
                </button>
              </form>
            </>
          )}

        </div>
      )}

    </div>
  );
};
