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
import { CustomTableView } from './components/CustomTables/CustomTableView';
import { AITableStudio } from './components/AITableStudio/AITableStudio';
import { AdminPortal } from './components/Admin/AdminPortal';
import { GoogleLoginModal } from './components/Auth/GoogleLoginModal';
import { DatabaseSettings } from './components/DatabaseSettings';
import { FloatingAIChat } from './components/AI/FloatingAIChat';
import { 
  initDatabase, 
  getClients, 
  saveClient, 
  saveMultipleClients,
  getProductItems, 
  saveProductItem,
  getCustomTables,
  saveCustomTable,
  deleteCustomTable,
  getAppUsers,
  saveAppUser,
  deleteAppUser,
  checkSupabaseHealth
} from './services/db';
import { testNetlifyBlobs } from './services/blobsService';
import { 
  getCurrentUser, 
  setCurrentUser, 
  loginWithGoogleEmail, 
  logoutUser, 
  hasPermission 
} from './services/authService';
import { Client, ProductItem, ProductStatus, CustomTable, AppUser, AppTheme } from './types';
import { ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('claimai_theme') as AppTheme) || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('claimai_theme', theme);
  }, [theme]);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [clients, setClients] = useState<Client[]>([]);
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [customTables, setCustomTables] = useState<CustomTable[]>([]);
  const [selectedCustomTableId, setSelectedCustomTableId] = useState<string>('');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUserState] = useState<AppUser>(getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cloud Database & Netlify Blobs Status
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [blobsConnected, setBlobsConnected] = useState<boolean | null>(null);

  const checkConnectionStatuses = async () => {
    try {
      const supa = await checkSupabaseHealth();
      setSupabaseConnected(supa.isConnected);
    } catch {
      setSupabaseConnected(false);
    }

    try {
      const blob = await testNetlifyBlobs();
      setBlobsConnected(blob.isAvailable);
    } catch {
      setBlobsConnected(false);
    }
  };

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Drawers
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<ProductItem | null>(null);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketDefaultClient, setNewTicketDefaultClient] = useState('');

  // Initial Load - clients first for fast CRM tab open, rest in background
  const loadData = async () => {
    setIsLoading(true);
    // Load clients immediately without waiting for initDatabase (fast CRM open)
    const fetchedClients = await getClients();
    setClients(fetchedClients);
    setIsLoading(false);
    // Initialize DB and load remaining data in background (non-blocking)
    initDatabase().then(() => {
      Promise.all([
        getProductItems(),
        getCustomTables(),
        getAppUsers()
      ]).then(([fetchedProducts, fetchedTables, fetchedUsers]) => {
        setProductItems(fetchedProducts);
        setCustomTables(fetchedTables);
        setUsers(fetchedUsers);
        if (fetchedTables.length > 0) {
          setSelectedCustomTableId(fetchedTables[0].id);
        }
        checkConnectionStatuses();
      });
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Permissions helpers
  const canEditCrm = currentUser.role === 'admin' || currentUser.permissions.canEditCrm;
  const canEditProduct = currentUser.role === 'admin' || currentUser.permissions.canEditProduct;
  const canEditTables = currentUser.role === 'admin' || currentUser.permissions.canEditTables;
  const canManageUsers = currentUser.role === 'admin' || currentUser.permissions.canManageUsers;

  // Handlers for Users & Auth
  const handleLogin = async (email: string, name?: string) => {
    // Local auth already sets currentUser in localStorage via localLogin
    const user = getCurrentUser();
    setCurrentUserState(user);
    const updatedUsers = await getAppUsers();
    setUsers(updatedUsers);
    setIsLoginModalOpen(false);
  };

  const handleSwitchUser = (user: AppUser) => {
    setCurrentUser(user);
    setCurrentUserState(user);
  };

  const handleLogout = () => {
    logoutUser();
    setIsLoginModalOpen(true);
  };

  const handleSaveUser = async (user: AppUser) => {
    await saveAppUser(user);
    setUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      if (exists) return prev.map(u => u.id === user.id ? user : u);
      return [user, ...prev];
    });
    if (currentUser.id === user.id) {
      setCurrentUserState(user);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteAppUser(userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Handlers for CRM Clients
  const handleUpdateClientStatus = async (clientId: string, newStatus: string) => {
    if (!canEditCrm) return;
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

  const handleUpdateClientBusinessType = async (clientId: string, newBusinessType: string) => {
    if (!canEditCrm) return;
    const target = clients.find(c => c.id === clientId);
    if (!target) return;
    const updated = { 
      ...target, 
      businessType: newBusinessType,
      updatedDate: new Date().toISOString().slice(0, 10)
    };
    await saveClient(updated);
    setClients(prev => prev.map(c => c.id === clientId ? updated : c));
    if (selectedClient?.id === clientId) {
      setSelectedClient(updated);
    }
  };

  const handleSaveClient = async (updatedClient: Client) => {
    if (!canEditCrm) return;
    await saveClient(updatedClient);
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    setSelectedClient(updatedClient);
  };

  const handleAddClient = async (newClient: Client) => {
    if (!canEditCrm) return;
    await saveClient(newClient);
    setClients(prev => [newClient, ...prev]);
    setSelectedClient(newClient);
  };

  const handleSyncCustomRowsToCrm = async (newLeads: Client[]) => {
    if (!canEditCrm) return;
    await saveMultipleClients(newLeads);
    setClients(prev => [...newLeads, ...prev]);
  };

  // Handlers for Product Items
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: ProductStatus) => {
    if (!canEditProduct) return;
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
    if (!canEditProduct) return;
    await saveProductItem(updatedTicket);
    setProductItems(prev => prev.map(p => p.id === updatedTicket.id ? updatedTicket : p));
    setSelectedTicket(updatedTicket);
  };

  const handleAddTicket = async (newTicket: ProductItem) => {
    if (!canEditProduct) return;
    await saveProductItem(newTicket);
    setProductItems(prev => [newTicket, ...prev]);
    setSelectedTicket(newTicket);
  };

  const handleOpenNewTicketForClient = (client: Client) => {
    if (!canEditProduct) return;
    setNewTicketDefaultClient(client.company || client.name);
    setIsNewTicketOpen(true);
  };

  // Handlers for Custom Tables
  const handleTableCreated = async (newTable: CustomTable) => {
    if (!canEditTables) return;
    await saveCustomTable(newTable);
    setCustomTables(prev => [newTable, ...prev]);
    setSelectedCustomTableId(newTable.id);
    setActiveTab('custom_tables');
  };

  const handleUpdateTable = async (updatedTable: CustomTable) => {
    if (!canEditTables) return;
    await saveCustomTable(updatedTable);
    setCustomTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!canEditTables) return;
    await deleteCustomTable(tableId);
    setCustomTables(prev => prev.filter(t => t.id !== tableId));
    if (selectedCustomTableId === tableId) {
      const remaining = customTables.filter(t => t.id !== tableId);
      if (remaining.length > 0) {
        setSelectedCustomTableId(remaining[0].id);
      }
    }
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
        onOpenAiStudio={() => setActiveTab('ai_studio')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        clientsCount={clients.length}
        productCount={productItems.length}
        customTablesCount={customTables.length}
        attentionCount={attentionCount}
        currentUser={currentUser}
        onOpenSwitchUser={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        supabaseConnected={supabaseConnected}
        blobsConnected={blobsConnected}
        theme={theme}
        onThemeChange={setTheme}
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
                onNavigateToTab={(tab) => {
                  if (tab === 'crm') setActiveTab('crm');
                  else if (tab === 'product') setActiveTab('product');
                  else if (tab === 'myday') setActiveTab('myday');
                }}
                onSelectClient={setSelectedClient}
                onSelectTicket={setSelectedTicket}
              />
            )}

            {activeTab === 'crm' && (
              <ClientTable
                clients={clients}
                onSelectClient={setSelectedClient}
                onUpdateClientStatus={handleUpdateClientStatus}
                onUpdateClientBusinessType={handleUpdateClientBusinessType}
                searchFilter={searchQuery}
                canEdit={canEditCrm}
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
                canEdit={canEditProduct}
              />
            )}

            {activeTab === 'custom_tables' && (
              <CustomTableView
                tables={customTables}
                selectedTableId={selectedCustomTableId}
                onSelectTable={setSelectedCustomTableId}
                onOpenAiStudio={() => setActiveTab('ai_studio')}
                onUpdateTable={handleUpdateTable}
                onDeleteTable={handleDeleteTable}
                canEdit={canEditTables}
              />
            )}

            {activeTab === 'ai_studio' && (
              <AITableStudio
                onTableCreated={handleTableCreated}
                onSyncToCrm={handleSyncCustomRowsToCrm}
                existingCrmLength={clients.length}
              />
            )}

            {activeTab === 'admin' && canManageUsers && (
              <AdminPortal
                users={users}
                currentUser={currentUser}
                onSaveUser={handleSaveUser}
                onDeleteUser={handleDeleteUser}
                onSwitchUser={handleSwitchUser}
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
            <span>פורטלים מותאמים עם Google Auth</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px]">
              <CheckCircle2 className="w-3 h-3" />
              Build Ready
            </span>
          </div>

          <div className="flex items-center gap-4">
            {canManageUsers && (
              <button
                onClick={() => setActiveTab('admin')}
                className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
              >
                פורטל אדמין
              </button>
            )}
            <span>·</span>
            <button
              onClick={() => setActiveTab('database')}
              className="hover:text-blue-400 transition-colors"
            >
              הגדרות מסד נתונים
            </button>
            <span>·</span>
            <span className="font-mono text-slate-500">v1.3.0</span>
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
        canEdit={canEditCrm}
        currentUser={currentUser}
      />

      <TicketDrawer
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onSaveTicket={handleSaveTicket}
        clients={clients}
        onOpenClientProfile={(c) => setSelectedClient(c)}
        currentUser={currentUser}
      />

      {canEditCrm && (
        <NewClientModal
          isOpen={isNewClientOpen}
          onClose={() => setIsNewClientOpen(false)}
          onAddClient={handleAddClient}
          nextId={nextClientId}
          currentUser={currentUser}
        />
      )}

      {canEditProduct && (
        <NewTicketModal
          isOpen={isNewTicketOpen}
          onClose={() => setIsNewTicketOpen(false)}
          onAddTicket={handleAddTicket}
          clients={clients}
          defaultClient={newTicketDefaultClient}
          nextBugId={nextBugId}
          nextRoadmapId={nextRoadmapId}
        />
      )}

      <GoogleLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
        availableUsers={users}
      />

      {/* Floating AI Copilot & Data Navigator */}
      <FloatingAIChat
        clients={clients}
        productItems={productItems}
        customTables={customTables}
        currentUser={currentUser}
        onSelectClient={(c) => setSelectedClient(c)}
        onSelectTicket={(t) => setSelectedTicket(t)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        supabaseConnected={Boolean(supabaseConnected)}
        blobsConnected={Boolean(blobsConnected)}
      />

    </div>
  );
};

export default App;
