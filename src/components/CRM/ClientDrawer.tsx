import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Building, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Bug, 
  ExternalLink, 
  CheckCircle, 
  CheckCircle2,
  Check,
  Loader2,
  User, 
  Cpu, 
  MapPin,
  TrendingUp,
  FileText,
  Plus,
  Wrench,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Zap,
  RefreshCw,
  Send
} from 'lucide-react';
import { Client, ProductItem, AppUser, ProductPriority, ProductItemCategory } from '../../types';
import { getClientSmartAdvice, ClientEngagementAdvice } from '../../services/aiWorkerService';
import { formatLeadDate } from '../../services/googleSheetsBackupService';

interface ClientDrawerProps {
  client: Client | null;
  onClose: () => void;
  onSaveClient: (client: Client) => void;
  linkedTickets: ProductItem[];
  onOpenTicket: (ticket: ProductItem) => void;
  onNewTicketForClient?: (client: Client) => void;
  onAddTicket?: (ticket: ProductItem) => void;
  nextBugId?: string;
  nextRoadmapId?: string;
  canEdit?: boolean;
  canEditProduct?: boolean;
  currentUser?: AppUser;
}

const ALL_STATUSES = [
  "1'st Lead",
  "1'st Follow-Up",
  "Meeting Scheduled",
  "Important",
  "Urgent",
  "Follow-Up",
  "Adoption Monitoring",
  "All-Good",
  "Irrelevant"
];

const PRODUCT_MODULES = [
  'אינטגרציית באפי (Bafi Integration)',
  'פתיחת תביעה (Claim Creation)',
  'מודול מסמכים ודוא״ל (Documents & Email)',
  'ממשק משתמש ו-UX',
  'דוחות ואנליטיקה (Reports & Analytics)',
  'אבטחה והרשאות (Security & Auth)',
  'אוטומציות ו-AI Copilot',
  'כללי (General)'
];

export const ClientDrawer: React.FC<ClientDrawerProps> = ({
  client,
  onClose,
  onSaveClient,
  linkedTickets,
  onOpenTicket,
  onNewTicketForClient,
  onAddTicket,
  nextBugId = 'FX-044',
  nextRoadmapId = 'RM-008',
  canEdit = true,
  canEditProduct = true,
  currentUser
}) => {
  if (!client) return null;

  const [formData, setFormData] = useState<Client>({ ...client });
  const [newNote, setNewNote] = useState('');
  const [isSavedAlert, setIsSavedAlert] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Inline Ticket Creation State
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [ticketCategory, setTicketCategory] = useState<ProductItemCategory>('bug');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketModule, setTicketModule] = useState('אינטגרציית באפי (Bafi Integration)');
  const [ticketPriority, setTicketPriority] = useState<ProductPriority>('High');
  const [ticketTargetDate, setTicketTargetDate] = useState('');
  const [ticketSuccessMessage, setTicketSuccessMessage] = useState('');

  const [advice, setAdvice] = useState<ClientEngagementAdvice | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [isAdviceExpanded, setIsAdviceExpanded] = useState(true);

  const authorName = currentUser?.name || currentUser?.email?.split('@')[0] || 'משתמש מערכת';
  const prevClientIdRef = useRef(client?.id);
  const lastSavedDataRef = useRef<Client>({ ...client });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noteDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadAdvice = useCallback(async (clientData: Client) => {
    setIsLoadingAdvice(true);
    try {
      const res = await getClientSmartAdvice(clientData, linkedTickets);
      setAdvice(res);
    } catch (e) {
      console.warn('Failed to fetch AI advice:', e);
    } finally {
      setIsLoadingAdvice(false);
    }
  }, [linkedTickets]);

  useEffect(() => {
    if (client) {
      loadAdvice(client);
    }
  }, [client?.id]);

  // Sync client when switching to a different client
  useEffect(() => {
    if (client && client.id !== prevClientIdRef.current) {
      prevClientIdRef.current = client.id;
      setFormData({ ...client });
      lastSavedDataRef.current = { ...client };
      setNewNote('');
      setSaveStatus('saved');
    }
  }, [client?.id]);

  const formatWhatsAppNumber = (phone?: string) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) return `972${cleaned.substring(1)}`;
    if (cleaned.startsWith('972')) return cleaned;
    return `972${cleaned}`;
  };

  const waNumber = formatWhatsAppNumber(formData.phone);

  // Core saving function
  const performSave = useCallback((dataToSave: Client) => {
    if (!canEdit) return;
    const updated: Client = {
      ...dataToSave,
      name: dataToSave.name?.trim() || client.name,
      company: dataToSave.company?.trim() ?? client.company ?? '',
      updatedDate: new Date().toISOString().slice(0, 10),
      updatedBy: authorName
    };
    lastSavedDataRef.current = updated;
    onSaveClient(updated);
    setSaveStatus('saved');
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2000);
  }, [canEdit, client.name, authorName, onSaveClient]);

  // Debounced auto-save effect for form changes
  useEffect(() => {
    if (!canEdit) return;

    const current = formData;
    const prev = lastSavedDataRef.current;

    const hasChanges = (
      current.name !== prev.name ||
      current.company !== prev.company ||
      current.status !== prev.status ||
      current.businessType !== prev.businessType ||
      current.phone !== prev.phone ||
      current.email !== prev.email ||
      current.nextFollowUpDate !== prev.nextFollowUpDate ||
      current.teamContacts !== prev.teamContacts ||
      current.itContact !== prev.itContact ||
      current.location !== prev.location ||
      current.createdDate !== prev.createdDate ||
      current.monthlyClaims !== prev.monthlyClaims ||
      current.requiresAttention !== prev.requiresAttention ||
      current.generalNotes !== prev.generalNotes
    );

    if (hasChanges) {
      setSaveStatus('saving');
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        performSave(formData);
      }, 500);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData, canEdit, performSave]);

  // Direct note adding function
  const handleAddNoteDirect = (noteText?: string) => {
    if (noteDebounceTimerRef.current) {
      clearTimeout(noteDebounceTimerRef.current);
      noteDebounceTimerRef.current = null;
    }
    const text = (noteText !== undefined ? noteText : newNote).trim();
    if (!text || !canEdit) return;

    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const noteEntry = `${dateStr} | ${timeStr} | 👤 ${authorName} | ${text}`;
    const updatedNotes = formData.lastNote ? `${noteEntry}\n---\n${formData.lastNote}` : noteEntry;

    const updated = {
      ...formData,
      lastNote: updatedNotes,
      updatedDate: new Date().toISOString().slice(0, 10),
      updatedBy: authorName
    };

    setFormData(updated);
    setNewNote('');
    performSave(updated);
  };

  // Safe close drawer
  const handleSafeClose = () => {
    if (noteDebounceTimerRef.current) {
      clearTimeout(noteDebounceTimerRef.current);
      noteDebounceTimerRef.current = null;
    }
    setNewNote('');
    onClose();
  };

  const handleCreateTicketInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim()) return;

    const currentId = ticketCategory === 'bug' ? nextBugId : nextRoadmapId;

    const newTicket: ProductItem = {
      id: currentId,
      category: ticketCategory,
      client: formData.company || formData.name,
      type: ticketCategory === 'bug' ? 'Bug' : 'Feature',
      module: ticketModule || 'כללי',
      title: ticketTitle.trim(),
      description: ticketDescription.trim(),
      priority: ticketPriority,
      status: ticketCategory === 'bug' ? 'Open' : 'Backlog',
      owner: 'Dev Team',
      reportedBy: authorName,
      source: `כרטיס לקוח: ${formData.name}`,
      release: ticketCategory === 'bug' ? 'Next Sprint' : 'Q1 2027',
      openedDate: new Date().toISOString().slice(0, 10),
      targetDate: ticketTargetDate || '',
      daysOpen: 0,
      health: 'On track'
    };

    if (onAddTicket) {
      onAddTicket(newTicket);
    }

    // Record automatic activity note
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const catLabel = ticketCategory === 'bug' ? 'תקלה (Bug)' : 'בקשת פיתוח (Feature)';
    const noteEntry = `${dateStr} | ${timeStr} | 👤 ${authorName} | פניית מוצר חדשה [${currentId}]: ${ticketTitle.trim()} (${catLabel})`;
    const updatedNotes = formData.lastNote ? `${noteEntry}\n---\n${formData.lastNote}` : noteEntry;

    const updatedClient = {
      ...formData,
      lastNote: updatedNotes,
      updatedDate: new Date().toISOString().slice(0, 10),
      updatedBy: authorName
    };
    onSaveClient(updatedClient);
    setFormData(updatedClient);

    // Reset inline form
    setTicketTitle('');
    setTicketDescription('');
    setTicketTargetDate('');
    setIsAddingTicket(false);
    setTicketSuccessMessage(`פנייה ${currentId} נוצרה והושתלה בהצלחה בטבלת הפיתוחים והתיקונים וב-Google Sheets!`);
    setTimeout(() => setTicketSuccessMessage(''), 4500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleSafeClose();
        }
      }}
    >
      <div className="w-full max-w-2xl bg-slate-900 border-r border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-left duration-200">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
            <div 
              className="h-10 px-2.5 min-w-[40px] max-w-[120px] rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold font-mono text-xs shrink-0 truncate"
              title={client.id}
            >
              {client.id.length > 9 ? `${client.id.slice(0, 4)}...${client.id.slice(-3)}` : client.id}
            </div>
            <div className="flex-1 min-w-0">
              {canEdit ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="הזן שם לקוח..."
                      className="text-base font-bold text-white bg-slate-800/90 hover:bg-slate-800 focus:bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all w-full max-w-sm"
                      title="עריכת שם לקוח"
                    />
                    {formData.requiresAttention && (
                      <span className="shrink-0 px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                        דחוף
                      </span>
                    )}
                    {(formData.requiresAttention || formData.status === 'Urgent') && canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...formData,
                            requiresAttention: false,
                            status: formData.status === 'Urgent' ? 'Follow-Up' : formData.status,
                            updatedDate: new Date().toISOString().slice(0, 10),
                            updatedBy: authorName
                          };
                          setFormData(updated);
                          performSave(updated);
                        }}
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all shadow-sm hover:scale-[1.02]"
                        title="הורד משולחן הדחוף וסמן כטופל"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>הורד מדחוף</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      value={formData.company || ''}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="חברה / משרד (אופציונלי)"
                      className="text-xs text-slate-300 bg-slate-800/50 hover:bg-slate-800 focus:bg-slate-800 border border-slate-700/60 focus:border-blue-500 rounded px-2 py-0.5 focus:outline-none transition-all w-full max-w-xs"
                      title="עריכת שם חברה / משרד"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{formData.name || 'ללא שם'}</span>
                    {formData.requiresAttention && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                        דחוף
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formData.company || 'אין חברה רשומה'}</span>
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEditProduct && (
              <button
                type="button"
                onClick={() => setIsAddingTicket(!isAddingTicket)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold shadow-sm transition-all"
                title="הוספת בקשת פיתוח או דיווח תקלה ללקוח זה"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>+ בקשת פיתוח / תיקון</span>
              </button>
            )}
            {canEdit ? (
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs shadow-sm transition-all"
                title="כל השינויים נשמרים אוטומטית במערכת"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    <span className="text-blue-300 font-medium text-[11px]">שומר...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-medium text-[11px]">נשמר אוטומטית</span>
                  </>
                )}
              </div>
            ) : (
              <span className="px-2 py-1 rounded-lg bg-slate-850 border border-slate-750 text-[11px] text-purple-300 font-medium">
                צפייה בלבד
              </span>
            )}
            <button
              onClick={handleSafeClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              title="סגירת כרטיס לקוח"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Saved Alert Banner */}
        {isSavedAlert && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>כל השינויים נשמרים אוטומטית בדאטה-בייס וב-Google Sheets!</span>
          </div>
        )}

        {/* Drawer Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Quick Contact & Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {formData.phone ? (
              <a
                href={`tel:${formData.phone}`}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600/30 border border-slate-700 hover:border-blue-500 text-slate-200 text-xs font-semibold transition-all"
              >
                <Phone className="w-4 h-4 text-blue-400" />
                <span>חיוג טלפוני</span>
              </a>
            ) : (
              <button disabled className="py-2.5 rounded-xl bg-slate-800/40 text-slate-600 text-xs cursor-not-allowed">
                אין טלפון
              </button>
            )}

            {waNumber ? (
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>וואטסאפ מהיר</span>
              </a>
            ) : (
              <button disabled className="py-2.5 rounded-xl bg-slate-800/40 text-slate-600 text-xs cursor-not-allowed">
                אין וואטסאפ
              </button>
            )}

            {formData.email ? (
              <a
                href={`mailto:${formData.email}`}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-slate-200 text-xs font-semibold transition-all"
              >
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>שליחת מייל</span>
              </a>
            ) : (
              <button disabled className="py-2.5 rounded-xl bg-slate-800/40 text-slate-600 text-xs cursor-not-allowed">
                אין מייל
              </button>
            )}
          </div>

          {/* CRM Status & Core Info */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              פרטי לקוח ומצב משפך
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  שם הלקוח <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="הזן שם מלא..."
                  disabled={!canEdit}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold disabled:opacity-60"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  שם חברה / משרד
                </label>
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="שם חברה או משרד..."
                  disabled={!canEdit}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">סטטוס CRM</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">סוג עסק</label>
                <input
                  type="text"
                  value={formData.businessType || ''}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  placeholder="סוכנות ביטוח, מוסך, שמאי..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">טלפון</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">אימייל</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">מועד השארת פרטים</label>
                <input
                  type="text"
                  value={formatLeadDate(formData.createdDate || (formData.customFields as any)?.leadDate || '')}
                  onChange={(e) => setFormData({ ...formData, createdDate: e.target.value })}
                  placeholder="למשל: 4.1.2026"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">מיקום / כתובת</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="עיר, רחוב או אזור"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">מעקב / פגישה הבאה</label>
                <input
                  type="text"
                  value={formData.nextFollowUpDate || ''}
                  onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                  placeholder="תאריך או טקסט מעקב"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">אנשי צוות / פקידות</label>
                <input
                  type="text"
                  value={formData.teamContacts || ''}
                  onChange={(e) => setFormData({ ...formData, teamContacts: e.target.value })}
                  placeholder="שם + טלפון של פקידה / מזכירה"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">איש מחשוב (IT)</label>
                <input
                  type="text"
                  value={formData.itContact || ''}
                  onChange={(e) => setFormData({ ...formData, itContact: e.target.value })}
                  placeholder="שם וטלפון של איש מחשוב"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">נפח תביעות חודשי</label>
                <input
                  type="text"
                  value={formData.monthlyClaims || ''}
                  onChange={(e) => setFormData({ ...formData, monthlyClaims: e.target.value })}
                  placeholder="למשל: 50 תביעות/חודש"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="attn"
                checked={formData.requiresAttention || false}
                onChange={(e) => setFormData({ ...formData, requiresAttention: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-rose-500"
              />
              <label htmlFor="attn" className="text-xs text-slate-300 font-semibold cursor-pointer flex items-center gap-2">
                <span>סמן כ"דורש טיפול מיידי" (התראה בהיום שלי)</span>
                {formData.requiresAttention && (
                  <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                    פעיל בשולחן הדחוף
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* AI Customer Success & Engagement Advisor */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-blue-950/20 border border-purple-500/30 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <span>יועץ AI לניהול לקוח ואינגייג'מנט</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-semibold">
                      Groq LLaMA 3.3
                    </span>
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadAdvice(formData)}
                  disabled={isLoadingAdvice}
                  className="p-1 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs transition-all disabled:opacity-50"
                  title="רענן ניתוח AI"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAdvice ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdviceExpanded(!isAdviceExpanded)}
                  className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all"
                >
                  {isAdviceExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {isLoadingAdvice ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-purple-300 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                <span>מנתח היסטוריית הערות, זמני סטטוס ומדדי אינגייג'מנט...</span>
              </div>
            ) : advice && isAdviceExpanded ? (
              <div className="space-y-3 pt-1">
                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5">ציון אינגייג'מנט</span>
                    <span className={`text-base font-extrabold ${
                      advice.engagementScore >= 75 ? 'text-emerald-400' : advice.engagementScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {advice.engagementScore}/100
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5">סיכון נטישה</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${
                      advice.churnRisk === 'גבוה'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : advice.churnRisk === 'בינוני'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {advice.churnRisk}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5">סטטוס מומלץ</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (advice.recommendedNextStatus && advice.recommendedNextStatus !== formData.status) {
                          const updated = { ...formData, status: advice.recommendedNextStatus };
                          setFormData(updated);
                          performSave(updated);
                        }
                      }}
                      className="text-xs font-bold text-blue-300 hover:text-blue-200 underline decoration-dotted truncate block w-full text-center"
                      title="לחץ לעדכון סטטוס הלקוח"
                    >
                      {advice.recommendedNextStatus}
                    </button>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-purple-500/20 text-xs text-slate-200 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-purple-300 font-semibold mb-1 text-[11px]">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>תמצית אסטרטגית מניתוח ההערות:</span>
                  </div>
                  <p>{advice.executiveSummary}</p>
                  {advice.statusAnalysis && (
                    <p className="mt-1.5 text-[11px] text-slate-400 border-t border-slate-800/80 pt-1">
                      {advice.statusAnalysis}
                    </p>
                  )}
                </div>

                {/* Key Insights & Action Plan */}
                {advice.keyInsights && advice.keyInsights.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-300 block">💡 תובנות עיקריות מיומן הלקוח:</span>
                    <ul className="space-y-1 text-xs text-slate-300 pr-4 list-disc marker:text-purple-400">
                      {advice.keyInsights.map((insight, idx) => (
                        <li key={idx} className="leading-snug">{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Action Plan */}
                {advice.actionPlan && advice.actionPlan.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-300 block">⚡ תוכנית פעולה לקידום אינגייג'מנט:</span>
                    <div className="space-y-1.5">
                      {advice.actionPlan.map((act, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                            act.priority === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {act.priority}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-white block">{act.title}</span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">{act.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Personalized WhatsApp */}
                {advice.suggestedWhatsApp && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-300 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>נוסח וואטסאפ מותאם אישית:</span>
                      </span>
                      {waNumber && (
                        <a
                          href={`https://wa.me/${waNumber}?text=${encodeURIComponent(advice.suggestedWhatsApp)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] inline-flex items-center gap-1 shadow-sm transition-all"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>שלח עכשיו בוואטסאפ</span>
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 italic bg-slate-900/70 p-2 rounded border border-emerald-500/20">
                      "{advice.suggestedWhatsApp}"
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* LINKED PRODUCT & DELIVERY TICKETS */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/30 to-indigo-950/20 border border-blue-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  פניות מוצר, תקלות ופיצ'רים מקושרים ({linkedTickets.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingTicket(!isAddingTicket)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-semibold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingTicket ? 'סגור טופס' : '+ בקשה לפיתוח או תיקון'}</span>
              </button>
            </div>

            {/* Success Message Banner */}
            {ticketSuccessMessage && (
              <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{ticketSuccessMessage}</span>
              </div>
            )}

            {/* Inline Ticket Creation Form */}
            {isAddingTicket && (
              <form 
                onSubmit={handleCreateTicketInline}
                className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 shadow-xl space-y-3.5 animate-in slide-in-from-top-2 duration-150"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-white">פנייה חדשה עבור: <strong className="text-blue-300">{formData.company || formData.name}</strong></span>
                  </div>
                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {ticketCategory === 'bug' ? nextBugId : nextRoadmapId}
                  </span>
                </div>

                {/* Category Switcher: Bug Fix vs Feature Request */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTicketCategory('bug')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                      ticketCategory === 'bug'
                        ? 'bg-rose-600/30 text-rose-200 border-rose-500 shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Bug className="w-4 h-4 text-rose-400" />
                    <span>🐛 תיקון תקלה (Bug)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTicketCategory('roadmap')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                      ticketCategory === 'roadmap'
                        ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500 shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>🚀 בקשת פיתוח (Feature)</span>
                  </button>
                </div>

                {/* Ticket Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    כותרת הפנייה <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={ticketCategory === 'bug' ? 'למשל: שגיאה בייבוא פוליסות מקובץ באפי...' : 'למשל: הוספת תבנית מכתב אוטומטי למבוטח...'}
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Module, Priority, Target Date Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">מודול מוצר</label>
                    <select
                      value={ticketModule}
                      onChange={(e) => setTicketModule(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {PRODUCT_MODULES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">עדיפות</label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value as ProductPriority)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Urgent">דחוף / Urgent</option>
                      <option value="High">גבוהה / High</option>
                      <option value="Medium">בינונית / Medium</option>
                      <option value="Low">נמוכה / Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">יעד ביצוע (אופציונלי)</label>
                    <input
                      type="date"
                      value={ticketTargetDate}
                      onChange={(e) => setTicketTargetDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">תיאור מפורט של הפנייה</label>
                  <textarea
                    rows={2}
                    placeholder="פרטים נוספים, שלבים לשחזור או דרישות המשתמש..."
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingTicket(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-all"
                  >
                    ביטול
                  </button>

                  <button
                    type="submit"
                    disabled={!ticketTitle.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ השתל בטבלת הפיתוחים והתיקונים</span>
                  </button>
                </div>
              </form>
            )}

            {linkedTickets.length === 0 && !isAddingTicket ? (
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-400">
                אין עדיין תקלות או בקשות מוצר מקושרות ללקוח זה.
                <button
                  type="button"
                  onClick={() => setIsAddingTicket(true)}
                  className="block mx-auto mt-2 text-blue-400 hover:underline font-semibold"
                >
                  לחץ כאן כדי לרשום בקשת פיתוח או תקלה
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {linkedTickets.map(ticket => (
                  <div
                    key={ticket.id}
                    onClick={() => onOpenTicket(ticket)}
                    className="p-3 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-slate-700/80 hover:border-blue-500/50 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-400">{ticket.id}</span>
                        <span className="text-xs font-semibold text-white">{ticket.title}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ticket.category === 'bug' 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {ticket.category === 'bug' ? 'תקלה (Bug)' : 'פיצ׳ר (Roadmap)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>סטטוס: <strong className="text-slate-300">{ticket.status}</strong></span>
                      <span className="text-amber-400">עדיפות: {ticket.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes & Activity Timeline */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>יומן פעילות והערות</span>
            </h3>

            {/* Add Note Input */}
            {canEdit ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-0.5">
                  <span className="font-medium text-slate-300">הוספת הערה או סיכום שיחה</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300 text-[11px] font-semibold">
                    <User className="w-3 h-3 text-blue-400" />
                    <span>חתימה אוטומטית: <strong className="text-white font-bold">{authorName}</strong></span>
                  </span>
                </div>
                <textarea
                  rows={3}
                  placeholder="הקלד הערה או סיכום שיחה כאן... (שמירה ב-Enter או בלחיצה על כפתור שמירה)"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNoteDirect(newNote);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <span className="text-[11px] text-slate-400">
                    💡 <strong>Enter</strong> לשמירה · <strong>Shift+Enter</strong> לירידת שורה
                  </span>
                  <button
                    type="button"
                    disabled={!newNote.trim()}
                    onClick={() => handleAddNoteDirect(newNote)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>שמור הערה (Enter)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400">
                🔒 הרשאת צפייה בלבד – הוספת הערות שמורה לעורכים ומנהלים
              </div>
            )}

            {/* Existing Notes Display */}
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2.5 max-h-64 overflow-y-auto">
              {formData.lastNote ? (
                formData.lastNote.split('\n---\n').map((noteChunk, idx) => {
                  const parts = noteChunk.split(' | ');
                  const hasDate = parts.length >= 2 && parts[0].includes('/');
                  const hasAuthor = parts.length >= 4 || (parts.length >= 3 && parts[2].includes('👤'));

                  let dateInfo = '';
                  let authorBadge = '';
                  let content = noteChunk;

                  if (hasAuthor) {
                    dateInfo = `${parts[0]} ${parts[1]}`;
                    authorBadge = parts[2].replace('👤', '').trim();
                    content = parts.slice(3).join(' | ');
                  } else if (hasDate && parts.length >= 3) {
                    dateInfo = `${parts[0]} ${parts[1]}`;
                    content = parts.slice(2).join(' | ');
                  }

                  return (
                    <div key={idx} className="p-3 rounded-xl bg-slate-800/80 border border-slate-750 text-xs leading-relaxed space-y-1.5 shadow-sm">
                      {(dateInfo || authorBadge) && (
                        <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-700/60">
                          {authorBadge ? (
                            <span className="inline-flex items-center gap-1 font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                              <User className="w-3 h-3 text-blue-400" />
                              <span>{authorBadge}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">ייבוא מ-Google Sheets</span>
                          )}
                          {dateInfo && (
                            <span className="font-mono text-slate-400 text-[10px]">{dateInfo}</span>
                          )}
                        </div>
                      )}
                      <p className="text-slate-200 whitespace-pre-wrap">{content}</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 text-center py-2">אין היסטוריית הערות עדיין</p>
              )}
              {formData.generalNotes && (
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs leading-relaxed space-y-1 shadow-sm mt-2">
                  <div className="flex items-center justify-between text-[11px] pb-1 border-b border-purple-800/30 text-purple-300 font-semibold">
                    <span>📝 הערות כלליות / מידע נוסף</span>
                  </div>
                  <p className="text-slate-300 whitespace-pre-wrap text-[11px]">{formData.generalNotes}</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
