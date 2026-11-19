import React, { useState } from 'react';
import { 
  X, 
  Bug, 
  Compass, 
  Save, 
  Building2, 
  User, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { ProductItem, ProductStatus, ProductPriority, Client, AppUser } from '../../types';

interface TicketDrawerProps {
  ticket: ProductItem | null;
  onClose: () => void;
  onSaveTicket: (ticket: ProductItem) => void;
  clients: Client[];
  onOpenClientProfile: (client: Client) => void;
  currentUser?: AppUser;
}

const PRIORITY_OPTIONS: ProductPriority[] = ['Critical', 'High', 'Medium', 'Low'];
const STATUS_OPTIONS: ProductStatus[] = ['Backlog', 'Open', 'In Progress', 'QA / Review', 'Done', 'Overdue'];

export const TicketDrawer: React.FC<TicketDrawerProps> = ({
  ticket,
  onClose,
  onSaveTicket,
  clients,
  onOpenClientProfile,
  currentUser
}) => {
  if (!ticket) return null;

  const [formData, setFormData] = useState<ProductItem>({ ...ticket });
  const [newNote, setNewNote] = useState('');
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  const authorName = currentUser?.name || currentUser?.email?.split('@')[0] || 'משתמש מערכת';

  // Find matching CRM client if any
  const matchedClient = clients.find(c => 
    (c.company && ticket.client && c.company.toLowerCase().includes(ticket.client.toLowerCase())) ||
    (c.name && ticket.client && c.name.toLowerCase().includes(ticket.client.toLowerCase())) ||
    (ticket.client && ticket.client.toLowerCase().includes(c.company?.toLowerCase() || '---'))
  );

  const handleSave = () => {
    let updatedNotes = formData.notes || '';
    if (newNote.trim()) {
      const now = new Date();
      const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const noteEntry = `${dateStr} | ${timeStr} | 👤 ${authorName} | ${newNote.trim()}`;
      updatedNotes = updatedNotes ? `${noteEntry}\n---\n${updatedNotes}` : noteEntry;
    }

    const updated = {
      ...formData,
      notes: updatedNotes
    };

    onSaveTicket(updated);
    setFormData(updated);
    setNewNote('');
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl bg-slate-900 border-r border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-left duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
              formData.category === 'bug'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              {formData.category === 'bug' ? <Bug className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-400">{formData.id}</span>
                <span className="text-xs uppercase font-bold text-slate-400">· {formData.type}</span>
              </div>
              <h2 className="text-base font-bold text-white line-clamp-1">{formData.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>שמור</span>
            </button>
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
            <span>הפריט עודכן בהצלחה!</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Matched Client Card */}
          {matchedClient && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border border-blue-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400 block">לקוח מקושר ב-CRM</span>
                <div className="font-bold text-white text-xs mt-0.5">{matchedClient.name} ({matchedClient.company})</div>
                <span className="text-[11px] text-slate-400">סטטוס: {matchedClient.status}</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenClientProfile(matchedClient);
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <span>פרופיל 360</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Core Fields */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              פרטי המשימה והגדרות
            </h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1">כותרת</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">תיאור מלא / דרישה</label>
              <textarea
                rows={4}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">סטטוס מסירה</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">עדיפות</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as ProductPriority })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {PRIORITY_OPTIONS.map(pr => (
                    <option key={pr} value={pr}>{pr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">לקוח משויך</label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">מודול במערכת</label>
                <input
                  type="text"
                  value={formData.module || ''}
                  onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                  placeholder="למשל: תביעות, מיילים, כיסוי ביטוחי..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">גרסת שחרור (Release)</label>
                <input
                  type="text"
                  value={formData.release || ''}
                  onChange={(e) => setFormData({ ...formData, release: e.target.value })}
                  placeholder="Q1 2027 / Next Sprint"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">תאריך יעד</label>
                <input
                  type="text"
                  value={formData.targetDate || ''}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Notes History */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                יומן עדכונים והערות
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300 text-[11px] font-semibold">
                <User className="w-3 h-3 text-blue-400" />
                <span>נכתב ע״י: <strong className="text-white font-bold">{authorName}</strong></span>
              </span>
            </div>

            <div className="space-y-2">
              <textarea
                rows={2}
                placeholder={`הוסף הערת התקדמות או תיעוד בדיקה... (נרשם אוטומטית ע״י: ${authorName})`}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!newNote.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
                >
                  הוסף הערה חתומה
                </button>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 max-h-52 overflow-y-auto">
              {formData.notes ? (
                formData.notes.split('\n---\n').map((chunk, idx) => {
                  const parts = chunk.split(' | ');
                  const hasDate = parts.length >= 2 && parts[0].includes('/');
                  const hasAuthor = parts.length >= 4 || (parts.length >= 3 && parts[2].includes('👤'));

                  let dateInfo = '';
                  let authorBadge = '';
                  let content = chunk;

                  if (hasAuthor) {
                    dateInfo = `${parts[0]} ${parts[1]}`;
                    authorBadge = parts[2].replace('👤', '').trim();
                    content = parts.slice(3).join(' | ');
                  } else if (hasDate && parts.length >= 3) {
                    dateInfo = `${parts[0]} ${parts[1]}`;
                    content = parts.slice(2).join(' | ');
                  }

                  return (
                    <div key={idx} className="p-3 rounded-xl bg-slate-800/80 border border-slate-750 text-xs text-slate-300 space-y-1.5 shadow-sm">
                      {(dateInfo || authorBadge) && (
                        <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-700/60">
                          {authorBadge ? (
                            <span className="inline-flex items-center gap-1 font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                              <User className="w-3 h-3 text-blue-400" />
                              <span>{authorBadge}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">עדכון מערכת</span>
                          )}
                          {dateInfo && (
                            <span className="font-mono text-slate-400 text-[10px]">{dateInfo}</span>
                          )}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{content}</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 text-center py-2">אין הערות רשומות עדיין</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
