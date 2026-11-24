import React from 'react';
import { 
  Users, 
  Bug, 
  Compass, 
  CalendarClock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  Clock, 
  ShieldAlert,
  ChevronLeft,
  Building2,
  ExternalLink
} from 'lucide-react';
import { Client, ProductItem } from '../types';

interface OverviewProps {
  clients: Client[];
  productItems: ProductItem[];
  onNavigateToTab: (tab: 'crm' | 'product' | 'myday') => void;
  onSelectClient: (client: Client) => void;
  onSelectTicket: (ticket: ProductItem) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  clients,
  productItems,
  onNavigateToTab,
  onSelectClient,
  onSelectTicket
}) => {
  // CRM statistics
  const totalClients = clients.length;
  const attentionClients = clients.filter(c => c.requiresAttention || c.status === 'Urgent' || c.priority === 'High');
  const meetingsScheduled = clients.filter(c => c.status === 'Meeting Scheduled');
  const followUpLeads = clients.filter(c => c.status === "1'st Follow-Up" || c.status === 'Follow-Up');
  const initialLeads = clients.filter(c => c.status === "1'st Lead" || c.status === 'ליד ראשוני מהמאנדיי');

  // Product statistics
  const bugs = productItems.filter(p => p.category === 'bug');
  const roadmap = productItems.filter(p => p.category === 'roadmap');
  const criticalBugs = bugs.filter(b => b.priority === 'Critical' || b.priority === 'High');
  const inProgressItems = productItems.filter(p => p.status === 'In Progress' || p.status === 'QA / Review');

  // Client delivery breakdown
  const clientWorkload: { [key: string]: { total: number; fixes: number; roadmap: number } } = {};
  productItems.forEach(item => {
    const clientName = item.client || 'ClaimAI (Internal)';
    if (!clientWorkload[clientName]) {
      clientWorkload[clientName] = { total: 0, fixes: 0, roadmap: 0 };
    }
    clientWorkload[clientName].total += 1;
    if (item.category === 'bug') {
      clientWorkload[clientName].fixes += 1;
    } else {
      clientWorkload[clientName].roadmap += 1;
    }
  });

  const sortedClientsWorkload = Object.entries(clientWorkload).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl overview-hero-banner p-6 shadow-xl border">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold mb-2 hero-badge">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              מערכת חיה ומסונכרנת · ClaimAI Control Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold hero-title tracking-tight">
              לוח שליטה אחוד ללקוחות, ביצועים ומפת מוצר
            </h1>
            <p className="text-sm mt-1 max-w-2xl hero-subtitle leading-relaxed">
              מרכז בקרה אחד לניהול מאגר של <strong className="hero-strong">{totalClients.toLocaleString()} לקוחות ולידים</strong>, לצד ניטור ומעקב מלא אחר <strong className="hero-strong">{productItems.length} משימות פיתוח, תקלות ופיצ'רים</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToTab('myday')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <CalendarClock className="w-4 h-4 text-slate-950" />
              <span>פתח את "היום שלי"</span>
            </button>
            <button
              onClick={() => onNavigateToTab('product')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl hero-secondary-btn text-sm font-semibold transition-all cursor-pointer"
            >
              <Bug className="w-4 h-4 text-rose-400" />
              <span>תקלות ופיתוח ({productItems.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card 1: Clients */}
        <div 
          onClick={() => onNavigateToTab('crm')}
          className="cursor-pointer group p-5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 transition-all shadow-lg hover:shadow-blue-500/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">מאגר CRM</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">{totalClients.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 mt-1 font-medium">
              <span>{initialLeads.length} לידים פתוחים</span>
              <span>·</span>
              <span>{meetingsScheduled.length} פגישות</span>
            </div>
          </div>
        </div>

        {/* Card 2: Attention Needed */}
        <div 
          onClick={() => onNavigateToTab('myday')}
          className="cursor-pointer group p-5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-rose-500/50 transition-all shadow-lg hover:shadow-rose-500/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">דורשים טיפול / דחוף</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-rose-400">{attentionClients.length}</div>
            <div className="text-xs text-slate-400 mt-1">
              לידים בעדיפות גבוהה / חריגת SLA
            </div>
          </div>
        </div>

        {/* Card 3: Open Fixes & Bugs */}
        <div 
          onClick={() => onNavigateToTab('product')}
          className="cursor-pointer group p-5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 transition-all shadow-lg hover:shadow-amber-500/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">תקלות ובאגים (Fixes)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Bug className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">{bugs.length}</div>
            <div className="text-xs text-amber-400 mt-1 font-medium">
              {criticalBugs.length} קריטיים / בעדיפות גבוהה
            </div>
          </div>
        </div>

        {/* Card 4: Roadmap Items */}
        <div 
          onClick={() => onNavigateToTab('product')}
          className="cursor-pointer group p-5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 transition-all shadow-lg hover:shadow-emerald-500/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">מפת דרכים (Roadmap)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">{roadmap.length}</div>
            <div className="text-xs text-emerald-400 mt-1 font-medium">
              33 פיצ'רים מתוכננים בבקלוג
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Client Workload vs Critical Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Client Workload & Delivery Progress */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-800/40 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <span>חלוקת עומס משימות לפי לקוח (Workload & Progress)</span>
              </h2>
              <p className="text-xs text-slate-400">
                מעקב אחר פניות, באגים ודרישות פיתוח פתוחות של סוכנויות ולקוחות
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('product')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <span>הכל במודול מוצר</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-700/80 text-xs text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">לקוח / סוכנות</th>
                  <th className="py-2.5 px-3">סה״כ פריטים</th>
                  <th className="py-2.5 px-3 text-amber-400">תקלות (Fixes)</th>
                  <th className="py-2.5 px-3 text-emerald-400">פיצ'רים (Roadmap)</th>
                  <th className="py-2.5 px-3">סטטוס מסירה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedClientsWorkload.map(([clientName, stats]) => (
                  <tr key={clientName} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">
                        {clientName.slice(0, 2)}
                      </div>
                      <span>{clientName}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-200">
                      {stats.total}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${
                        stats.fixes > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-500'
                      }`}>
                        {stats.fixes}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {stats.roadmap}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full w-[15%]"></div>
                        </div>
                        <span className="text-[11px] text-slate-400">בתהליך</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Urgent Attention & Critical Tickets */}
        <div className="rounded-2xl bg-slate-800/40 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>תקלות קריטיות בטיפול</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {criticalBugs.length} קריטיים
            </span>
          </div>

          <div className="space-y-3">
            {criticalBugs.slice(0, 4).map((ticket) => (
              <div 
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className="cursor-pointer p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/70 hover:border-rose-500/40 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-blue-400">{ticket.id}</span>
                    <span className="text-xs text-slate-400">· {ticket.client}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {ticket.priority}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white line-clamp-1">
                  {ticket.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {ticket.description}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>מודול: {ticket.module || 'כללי'}</span>
                  <span className="text-amber-400 font-medium">יעד: {ticket.targetDate || 'הספרינט הקרוב'}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateToTab('product')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all text-center block"
          >
            צפה בכל {productItems.length} המשימות והתקלות ←
          </button>
        </div>

      </div>

      {/* Leads Pipeline Snapshot */}
      <div className="rounded-2xl bg-slate-800/40 border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>תמונת מצב משפך הלקוחות (CRM Pipeline)</span>
            </h2>
            <p className="text-xs text-slate-400">חלוקת הלידים והלקוחות לפי שלבי המשפך</p>
          </div>
          <button
            onClick={() => onNavigateToTab('crm')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <span>פתח טבלת CRM מלאה</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <span className="text-[11px] text-purple-300 font-semibold block">1'st Lead</span>
            <span className="text-xl font-extrabold text-white mt-1 block">
              {clients.filter(c => c.status === "1'st Lead").length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-[11px] text-amber-300 font-semibold block">Follow-Up</span>
            <span className="text-xl font-extrabold text-white mt-1 block">
              {clients.filter(c => c.status === "1'st Follow-Up" || c.status === "Follow-Up").length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <span className="text-[11px] text-blue-300 font-semibold block">פגישות שנקבעו</span>
            <span className="text-xl font-extrabold text-white mt-1 block">
              {clients.filter(c => c.status === "Meeting Scheduled").length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center">
            <span className="text-[11px] text-pink-300 font-semibold block">חשוב / Important</span>
            <span className="text-xl font-extrabold text-white mt-1 block">
              {clients.filter(c => c.status === "Important").length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
            <span className="text-[11px] text-cyan-300 font-semibold block">במעקב אימוץ</span>
            <span className="text-xl font-extrabold text-white mt-1 block">
              {clients.filter(c => c.status === "Adoption Monitoring").length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-[11px] text-emerald-300 font-semibold block">לקוחות פעילים</span>
            <span className="text-xl font-extrabold text-white mt-1 block">
              {clients.filter(c => c.status === "All-Good").length}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
