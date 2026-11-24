import React, { useState } from 'react';
import { X, Sparkles, Bug, Compass, Building2 } from 'lucide-react';
import { ProductItem, ProductItemCategory, ProductPriority, ProductStatus, Client } from '../../types';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTicket: (ticket: ProductItem) => void;
  clients: Client[];
  defaultClient?: string;
  nextBugId: string;
  nextRoadmapId: string;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onAddTicket,
  clients,
  defaultClient,
  nextBugId,
  nextRoadmapId
}) => {
  if (!isOpen) return null;

  const [category, setCategory] = useState<ProductItemCategory>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState(defaultClient || 'ClaimAI (Internal)');
  const [module, setModule] = useState('');
  const [priority, setPriority] = useState<ProductPriority>('High');
  const [status, setStatus] = useState<ProductStatus>('Open');
  const [targetDate, setTargetDate] = useState('');
  const [release, setRelease] = useState('');

  const currentId = category === 'bug' ? nextBugId : nextRoadmapId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTicket: ProductItem = {
      id: currentId,
      category,
      client: client || 'ClaimAI (Internal)',
      type: category === 'bug' ? 'Bug' : 'Feature',
      module: module || 'General',
      title: title.trim(),
      description: description.trim(),
      priority,
      status: category === 'bug' ? status : (status === 'Open' ? 'Backlog' : status),
      owner: 'Dev Team',
      reportedBy: 'Aviv Ashkenazi',
      source: 'ClaimAI Web Portal',
      release: release || (category === 'bug' ? 'Next Sprint' : 'Q1 2027'),
      openedDate: new Date().toISOString().slice(0, 10),
      targetDate: targetDate || '',
      daysOpen: 0,
      health: 'On track'
    };

    onAddTicket(newTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              category === 'bug'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              {category === 'bug' ? <Bug className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {category === 'bug' ? 'דיווח על תקלה / באג (Fix)' : 'הוספת דרישת מוצר (Roadmap)'}
              </h2>
              <span className="text-xs text-slate-400 font-mono">מזהה פנייה: {currentId}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Selector */}
        <div className="grid grid-cols-2 p-3 gap-2 bg-slate-900 border-b border-slate-800">
          <button
            type="button"
            onClick={() => {
              setCategory('bug');
              setStatus('Open');
              setPriority('High');
            }}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              category === 'bug'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Bug className="w-4 h-4" />
            <span>תקלה במערכת (Bug / Fix)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategory('roadmap');
              setStatus('Backlog');
              setPriority('Medium');
            }}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              category === 'roadmap'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>בקשת פיצ'ר (Roadmap)</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">כותרת הפנייה *</label>
            <input
              type="text"
              required
              placeholder="כותרת תמציתית של התקלה או הפיצ'ר..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">תיאור מלא וצעדים לשחזור / דרישות</label>
            <textarea
              rows={3}
              placeholder="פירוט התקלה, השפעה, צעדים לשחזור..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">לקוח משויך</label>
              <input
                type="text"
                list="client-suggestions"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="בחר לקוח או הקלד"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <datalist id="client-suggestions">
                <option value="ClaimAI (Internal)">ClaimAI (Internal)</option>
                <option value="Finkel Agency">Finkel Agency</option>
                <option value="Jamal Dabbah">Jamal Dabbah</option>
                <option value="Racheli Asraf">Racheli Asraf</option>
                <option value="Randa">Randa</option>
                <option value="Shlomik kedem">Shlomik kedem</option>
                {clients.slice(0, 20).map(c => (
                  <option key={c.id} value={c.company || c.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">מודול במערכת</label>
              <input
                type="text"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                placeholder="תביעות, מיילים, סינון..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">עדיפות</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProductPriority)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Critical">Critical (קריטי)</option>
                <option value="High">High (גבוה)</option>
                <option value="Medium">Medium (בינוני)</option>
                <option value="Low">Low (נמוך)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">גרסת שחרור / יעד</label>
              <input
                type="text"
                value={release}
                onChange={(e) => setRelease(e.target.value)}
                placeholder="Next Sprint / Q1 2027"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              צור משימה
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
