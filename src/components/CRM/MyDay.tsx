import React from 'react';
import { 
  CalendarClock, 
  AlertCircle, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Building, 
  ChevronLeft,
  Calendar,
  Flame,
  UserCheck
} from 'lucide-react';
import { Client } from '../../types';

interface MyDayProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
  onUpdateClientStatus: (clientId: string, newStatus: string) => void;
}

export const MyDay: React.FC<MyDayProps> = ({
  clients,
  onSelectClient,
  onUpdateClientStatus
}) => {
  // Urgent items
  const urgentClients = clients.filter(c => c.requiresAttention || c.status === 'Urgent');
  
  // Scheduled meetings
  const meetingClients = clients.filter(c => c.status === 'Meeting Scheduled');
  
  // Important status
  const importantClients = clients.filter(c => c.status === 'Important');

  // Follow-ups
  const followUpClients = clients.filter(c => c.status === "1'st Follow-Up" || c.status === 'Follow-Up').slice(0, 15);

  const formatWhatsAppNumber = (phone?: string) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) return `972${cleaned.substring(1)}`;
    if (cleaned.startsWith('972')) return cleaned;
    return `972${cleaned}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2 border border-amber-400/30">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>מרכז עבודה יומי ממוקד · היום שלי</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            לידים, פגישות ומעקבים הדורשים התייחסות
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            עבודה ממוקדת על הפניות הדחופות ביותר, פגישות שנקבעו וחריגות מזמני מענה.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center min-w-[90px]">
            <span className="text-[10px] text-rose-300 font-bold block uppercase">דחוף</span>
            <span className="text-xl font-extrabold text-white">{urgentClients.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center min-w-[90px]">
            <span className="text-[10px] text-blue-300 font-bold block uppercase">פגישות</span>
            <span className="text-xl font-extrabold text-white">{meetingClients.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center min-w-[90px]">
            <span className="text-[10px] text-pink-300 font-bold block uppercase">חשוב</span>
            <span className="text-xl font-extrabold text-white">{importantClients.length}</span>
          </div>
        </div>
      </div>

      {/* Grid of Focus Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Urgent / Attention Needed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-rose-500/30">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>דורש טיפול מיידי ({urgentClients.length})</span>
            </h2>
            <span className="text-[11px] text-rose-400 font-semibold">עדיפות עליונה</span>
          </div>

          {urgentClients.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
              כל הכבוד! אין לידים דחופים הממתינים למענה
            </div>
          ) : (
            urgentClients.map(client => {
              const wa = formatWhatsAppNumber(client.phone);
              return (
                <div
                  key={client.id}
                  onClick={() => onSelectClient(client)}
                  className="p-4 rounded-xl bg-slate-850 hover:bg-slate-800 border border-rose-500/40 hover:border-rose-400 cursor-pointer transition-all shadow-md space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-400">{client.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      דחוף
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                      {client.name || 'ללא שם'}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3 text-slate-500" />
                      <span>{client.company || 'אין חברה רשומה'}</span>
                    </p>
                  </div>

                  {client.lastNote && (
                    <div className="text-xs bg-slate-900/60 p-2 rounded-lg border border-slate-800 space-y-1">
                      {client.lastNote.includes('👤') && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                          {client.lastNote.match(/👤\s*([^|\n]+)/)?.[0] || '👤 הערה חתומה'}
                        </span>
                      )}
                      <p className="text-slate-300 line-clamp-2">
                        {client.lastNote.replace(/^[0-9/:\s|]+👤[^|]+\|\s*/, '')}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      {client.phone && (
                        <a
                          href={`tel:${client.phone}`}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-400 flex items-center justify-center border border-slate-700"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {wa && (
                        <a
                          href={`https://wa.me/${wa}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 flex items-center justify-center border border-emerald-500/30"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClient(client);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      טפל עכשיו ←
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Column 2: Scheduled Meetings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-blue-500/30">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>פגישות שנקבעו ({meetingClients.length})</span>
            </h2>
            <span className="text-[11px] text-blue-400 font-semibold">בשלב מתקדם</span>
          </div>

          {meetingClients.slice(0, 10).map(client => {
            const wa = formatWhatsAppNumber(client.phone);
            return (
              <div
                key={client.id}
                onClick={() => onSelectClient(client)}
                className="p-4 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 cursor-pointer transition-all shadow-md space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">{client.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Meeting Scheduled
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                    {client.name || 'ללא שם'}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Building className="w-3 h-3 text-slate-500" />
                    <span>{client.company || 'אין חברה רשומה'}</span>
                  </p>
                </div>

                {client.lastNote && (
                  <div className="text-xs bg-slate-900/60 p-2 rounded-lg border border-slate-800 space-y-1">
                    {client.lastNote.includes('👤') && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                        {client.lastNote.match(/👤\s*([^|\n]+)/)?.[0] || '👤 הערה חתומה'}
                      </span>
                    )}
                    <p className="text-slate-300 line-clamp-2">
                      {client.lastNote.replace(/^[0-9/:\s|]+👤[^|]+\|\s*/, '')}
                    </p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-400 flex items-center justify-center border border-slate-700"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {wa && (
                      <a
                        href={`https://wa.me/${wa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 flex items-center justify-center border border-emerald-500/30"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClient(client);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    פרטי פגישה ←
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Column 3: Important / Follow-ups */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-pink-500/30">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-pink-400" />
              <span>לקוחות חשובים ומעקבים ({importantClients.length + followUpClients.length})</span>
            </h2>
            <span className="text-[11px] text-pink-400 font-semibold">לשמירת קשר</span>
          </div>

          {[...importantClients, ...followUpClients].slice(0, 10).map(client => {
            const wa = formatWhatsAppNumber(client.phone);
            return (
              <div
                key={client.id}
                onClick={() => onSelectClient(client)}
                className="p-4 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 hover:border-pink-500/50 cursor-pointer transition-all shadow-md space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">{client.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    {client.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                    {client.name || 'ללא שם'}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Building className="w-3 h-3 text-slate-500" />
                    <span>{client.company || 'אין חברה רשומה'}</span>
                  </p>
                </div>

                {client.lastNote && (
                  <div className="text-xs bg-slate-900/60 p-2 rounded-lg border border-slate-800 space-y-1">
                    {client.lastNote.includes('👤') && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                        {client.lastNote.match(/👤\s*([^|\n]+)/)?.[0] || '👤 הערה חתומה'}
                      </span>
                    )}
                    <p className="text-slate-300 line-clamp-2">
                      {client.lastNote.replace(/^[0-9/:\s|]+👤[^|]+\|\s*/, '')}
                    </p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-400 flex items-center justify-center border border-slate-700"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {wa && (
                      <a
                        href={`https://wa.me/${wa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 flex items-center justify-center border border-emerald-500/30"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClient(client);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    פרופיל ←
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
