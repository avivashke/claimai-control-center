import React, { useState, useEffect, useMemo } from 'react';
import { Header, TabType } from './components/Header';
import { Overview } from './components/Overview';
import { ClientTable } from './components/CRM/ClientTable';
import { MyDay } from './components/CRM/MyDay';
import { ClientDrawer } from './components/CRM/ClientDrawer';
import { NewClientModal } from './components/CRM/NewClientModal';
import { ProductHub } from './components/Product/ProductHub';
import { TicketDrawer } from './components/Product/TicketDrawer';
import { NewTicketModal } from './components/Product/NewTicketModal';
import { DatabaseSettings } from './components/DatabaseSettings';
import { 
  initDatabase, 
  getClients, 
  saveClient, 
  getProductItems, 
  saveProductItem 
} from './services/db';
import { Client, ProductItem, ProductStatus } from './types';
import { ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [clients, setClients] = useState<Client[]>([]);
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Drawers
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<ProductItem | null>(null);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketDefaultClient, setNewTicketDefaultClient] = useState('');

  // Initial Load
  const loadData = async () => {
    setIsLoading(true);
    await initDatabase();
    const fetchedClients = await getClients();
    const fetchedProducts = await getProductItems();
    setClients(fetchedClients);
    setProductItems(fetchedProducts);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers for CRM Clients
  const handleUpdateClientStatus = async (clientId: string, newStatus: string) => {
    const target = clients.find(c => c.id === clientId);
    if (!target) return;
    const updated = { 
      ...target, 
      status: newStatus, 
      statusSince: new Date().toISOString().slice(0, 10),
      updatedDate: new Date().toISOString().slice(0, 10)
    };
    await saveClient(updated);
    setClients(prev => prev.map(c => c.id === clientId ? updated : c));
    if (selectedClient?.id === clientId) {
      setSelectedClient(updated);
    }
  };

  const handleSaveClient = async (updatedClient: Client) => {
    await saveClient(updatedClient);
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    setSelectedClient(updatedClient);
  };

  const handleAddClient = async (newClient: Client) => {
    await saveClient(newClient);
    setClients(prev => [newClient, ...prev]);
    setSelectedClient(newClient);
  };

  // Handlers for Product Items
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: ProductStatus) => {
    const target = productItems.find(p => p.id === ticketId);
    if (!target) return;
    const updated = { 
      ...target, 
      status: newStatus,
      completedDate: newStatus === 'Done' ? new Date().toISOString().slice(0, 10) : target.completedDate
    };
    await saveProductItem(updated);
    setProductItems(prev => prev.map(p => p.id === ticketId ? updated : p));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(updated);
    }
  };

  const handleSaveTicket = async (updatedTicket: ProductItem) => {
    await saveProductItem(updatedTicket);
    setProductItems(prev => prev.map(p => p.id === updatedTicket.id ? updatedTicket : p));
    setSelectedTicket(updatedTicket);
  };

  const handleAddTicket = async (newTicket: ProductItem) => {
    await saveProductItem(newTicket);
    setProductItems(prev => [newTicket, ...prev]);
    setSelectedTicket(newTicket);
  };

  const handleOpenNewTicketForClient = (client: Client) => {
    setNewTicketDefaultClient(client.company || client.name);
    setIsNewTicketOpen(true);
  };

  // Calculate Next IDs
  const nextClientId = useMemo(() => {
    return `L${clients.length + 1}`;
  }, [clients]);

  const nextBugId = useMemo(() => {
    const bugs = productItems.filter(p => p.category === 'bug');
    const maxNum = bugs.reduce((max, b) => {
      const match = b.id.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 0;
      return num > max ? num : max;
    }, 0);
    return `FX-${(maxNum + 1).toString().padStart(3, '0')}`;
  }, [productItems]);

  const nextRoadmapId = useMemo(() => {
    const rm = productItems.filter(p => p.category === 'roadmap');
    const maxNum = rm.reduce((max, r) => {
      const match = r.id.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 0;
      return num > max ? num : max;
    }, 0);
    return `RM-${(maxNum + 1).toString().padStart(3, '0')}`;
  }, [productItems]);

  // Find linked tickets for a given client
  const getLinkedTicketsForClient = (client: Client | null): ProductItem[] => {
    if (!client) return [];
    return productItems.filter(ticket => {
      if (!ticket.client) return false;
      const clientName = (client.name || '').toLowerCase();
      const clientCompany = (client.company || '').toLowerCase();
      const ticketClient = ticket.client.toLowerCase();
      return (
        (clientCompany && ticketClient.includes(clientCompany)) ||
        (clientName && ticketClient.includes(clientName)) ||
        (clientCompany && clientCompany.includes(ticketClient)) ||
        (clientName && clientName.includes(ticketClient))
      );
    });
  };

  const attentionCount = useMemo(() => {
    return clients.filter(c => c.requiresAttention || c.status === 'Urgent').length;
  }, [clients]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
      
      {/* Top Sticky Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewClient={() => setIsNewClientOpen(true)}
        onNewTicket={() => {
          setNewTicketDefaultClient('');
          setIsNewTicketOpen(true);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        clientsCount={clients.length}
        productCount={productItems.length}
        attentionCount={attentionCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-400">טוען נתונים מהמאגר המקומי...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <Overview
                clients={clients}
                productItems={productItems}
                onNavigateToTab={setActiveTab}
                onSelectClient={setSelectedClient}
                onSelectTicket={setSelectedTicket}
              />
            )}

            {activeTab === 'crm' && (
              <ClientTable
                clients={clients}
                onSelectClient={setSelectedClient}
                onUpdateClientStatus={handleUpdateClientStatus}
                searchFilter={searchQuery}
              />
            )}

            {activeTab === 'myday' && (
              <MyDay
                clients={clients}
                onSelectClient={setSelectedClient}
                onUpdateClientStatus={handleUpdateClientStatus}
              />
            )}

            {activeTab === 'product' && (
              <ProductHub
                productItems={productItems}
                onSelectTicket={setSelectedTicket}
                onUpdateTicketStatus={handleUpdateTicketStatus}
                onNewTicket={() => {
                  setNewTicketDefaultClient('');
                  setIsNewTicketOpen(true);
                }}
                searchFilter={searchQuery}
              />
            )}

            {activeTab === 'database' && (
              <DatabaseSettings
                clientsCount={clients.length}
                productCount={productItems.length}
                onRefreshData={loadData}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">ClaimAI Control Center</span>
            <span>·</span>
            <span>מוכן להעלאה ב-Netlify</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px]">
              <CheckCircle2 className="w-3 h-3" />
              Build Ready
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('database')}
              className="hover:text-blue-400 transition-colors"
            >
              הגדרות מסד נתונים
            </button>
            <span>·</span>
            <span className="font-mono text-slate-500">v1.0.0</span>
          </div>
        </div>
      </footer>

      {/* Drawers and Modals */}
      <ClientDrawer
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onSaveClient={handleSaveClient}
        linkedTickets={getLinkedTicketsForClient(selectedClient)}
        onOpenTicket={(ticket) => setSelectedTicket(ticket)}
        onNewTicketForClient={handleOpenNewTicketForClient}
      />

      <TicketDrawer
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onSaveTicket={handleSaveTicket}
        clients={clients}
        onOpenClientProfile={(c) => setSelectedClient(c)}
      />

      <NewClientModal
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
        onAddClient={handleAddClient}
        nextId={nextClientId}
      />

      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        onAddTicket={handleAddTicket}
        clients={clients}
        defaultClient={newTicketDefaultClient}
        nextBugId={nextBugId}
        nextRoadmapId={nextRoadmapId}
      />

    </div>
  );
};

export default App;
