import React, { useState } from 'react';
import { X, UserPlus, Building, Phone, Mail, FileText } from 'lucide-react';
import { Client } from '../../types';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (client: Client) => void;
  nextId: string;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  onAddClient,
  nextId
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<Partial<Client>>({
    id: nextId,
    name: '',
    company: '',
    businessType: 'סוכנות ביטוח',
    status: "1'st Lead",
    phone: '',
    email: '',
    monthlyClaims: '',
    lastNote: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() && !formData.company?.trim()) {
      alert('נא להזין שם איש קשר או שם חברה');
      return;
    }

    const newClient: Client = {
      id: formData.id || nextId,
      name: formData.name || '',
      company: formData.company || formData.name || '',
      businessType: formData.businessType || 'סוכנות ביטוח',
      status: formData.status || "1'st Lead",
      phone: formData.phone || '',
      email: formData.email || '',
      monthlyClaims: formData.monthlyClaims || '',
      createdDate: new Date().toISOString().slice(0, 10),
      lastNote: formData.lastNote ? `${new Date().toLocaleDateString('he-IL')} | ${formData.lastNote}` : ''
    };

    onAddClient(newClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">הוספת ליד / לקוח חדש</h2>
              <span className="text-xs text-slate-400 font-mono">מזהה: {nextId}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">שם איש קשר *</label>
              <input
                type="text"
                required
                placeholder="למשל: יוסף כהן"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">שם עסק / חברה</label>
              <input
                type="text"
                placeholder="סוכנות כהן ביטוחים"
                value={formData.company || ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">סוג עסק</label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="סוכנות ביטוח">סוכנות ביטוח</option>
                <option value="מוסך">מוסך</option>
                <option value="שמאי">שמאי</option>
                <option value="עורך דין">עורך דין</option>
                <option value="חברת ניהול תביעות">חברת ניהול תביעות</option>
                <option value="אחר">אחר</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">סטטוס התחלתי</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="1'st Lead">1'st Lead (ליד חדש)</option>
                <option value="1'st Follow-Up">1'st Follow-Up</option>
                <option value="Meeting Scheduled">Meeting Scheduled</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">טלפון</label>
              <input
                type="text"
                placeholder="050-0000000"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">אימייל</label>
              <input
                type="email"
                placeholder="agent@example.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">הערה ראשונית / מקור הליד</label>
            <textarea
              rows={2}
              placeholder="פרטי שיחה ראשונה או סיבת פנייה..."
              value={formData.lastNote || ''}
              onChange={(e) => setFormData({ ...formData, lastNote: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
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
              הוסף למאגר
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
