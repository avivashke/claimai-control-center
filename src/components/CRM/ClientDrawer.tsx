import React, { useState } from 'react';
import { 
  X, 
  Building, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Save, 
  Sparkles, 
  Bug, 
  ExternalLink, 
  CheckCircle, 
  User, 
  Cpu, 
  MapPin,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Client, ProductItem } from '../../types';

interface ClientDrawerProps {
  client: Client | null;
  onClose: () => void;
  onSaveClient: (client: Client) => void;
  linkedTickets: ProductItem[];
  onOpenTicket: (ticket: ProductItem) => void;
  onNewTicketForClient: (client: Client) => void;
  canEdit?: boolean;
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

export const ClientDrawer: React.FC<ClientDrawerProps> = ({
  client,
  onClose,
  onSaveClient,
  linkedTickets,
  onOpenTicket,
  onNewTicketForClient,
  canEdit = true
}) => {
  if (!client) return null;

  const [formData, setFormData] = useState<Client>({ ...client });
  const [newNote, setNewNote] = useState('');
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  const formatWhatsAppNumber = (phone?: string) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) return `972${cleaned.substring(1)}`;
    if (cleaned.startsWith('972')) return cleaned;
    return `972${cleaned}`;
  };

  const waNumber = formatWhatsAppNumber(formData.phone);

  const handleSave = () => {
    let updatedNotes = formData.lastNote || '';
    if (newNote.trim()) {
      const now = new Date();
      const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const noteEntry = `${dateStr} | ${timeStr} | ${newNote.trim()}`;
      updatedNotes = updatedNotes ? `${noteEntry}\n---\n${updatedNotes}` : noteEntry;
    }

    const updated = {
      ...formData,
      lastNote: updatedNotes,
      updatedDate: new Date().toISOString().slice(0, 10),
      updatedBy: 'Aviv'
    };

    onSaveClient(updated);
    setFormData(updated);
    setNewNote('');
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-slate-900 border-r border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-left duration-200">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
              {client.id}
            </div>
            <div>
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
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit ? (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                <span>שמור שינויים</span>
              </button>
            ) : (
              <span className="px-2 py-1 rounded-lg bg-slate-850 border border-slate-750 text-[11px] text-purple-300 font-medium">
                צפייה בלבד
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Saved Alert Banner */}
        {isSavedAlert && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>הרשומה עודכנה בהצלחה בדאטה-בייס!</span>
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
              <label htmlFor="attn" className="text-xs text-slate-300 font-semibold cursor-pointer">
                סמן כ"דורש טיפול מיידי" (התראה בהיום שלי)
              </label>
            </div>
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
                onClick={() => onNewTicketForClient(formData)}
                className="px-2.5 py-1 rounded-md bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-[11px] font-semibold transition-all"
              >
                + פתח פנייה ללקוח זה
              </button>
            </div>

            {linkedTickets.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-400">
                אין עדיין תקלות או בקשות מוצר מקושרות ללקוח זה.
                <button
                  onClick={() => onNewTicketForClient(formData)}
                  className="block mx-auto mt-2 text-blue-400 hover:underline font-semibold"
                >
                  לחץ כאן כדי לרשום בקשת פיצ'ר או תקלה
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
                <textarea
                  rows={3}
                  placeholder="הוסף הערה או סיכום שיחה חדש... (יישמר עם חותמת תאריך ושעה)"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!newNote.trim()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs font-semibold transition-all"
                  >
                    הוסף הערה ליומן
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400">
                🔒 הרשאת צפייה בלבד – הוספת הערות שמורה לעורכים ומנהלים
              </div>
            )}

            {/* Existing Notes Display */}
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 max-h-60 overflow-y-auto">
              {formData.lastNote ? (
                formData.lastNote.split('\n---\n').map((noteChunk, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-750 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {noteChunk}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-2">אין היסטוריית הערות עדיין</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
