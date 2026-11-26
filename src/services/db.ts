import Dexie, { Table } from 'dexie';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Client, ProductItem, Contact, ActivityLog, CustomTable, AppUser } from '../types';
import seedClientsData from '../data/seedClients.json';
import seedProductItemsData from '../data/seedProductItems.json';
import seedContactsData from '../data/seedContacts.json';
import seedCustomTablesData from '../data/seedCustomTables.json';
import seedUsersData from '../data/seedUsers.json';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const USE_LOCAL_API = import.meta.env.VITE_USE_LOCAL_API === 'true';

async function apiRequest(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return res;
}

class ClaimAIDatabase extends Dexie {
  clients!: Table<Client, string>;
  productItems!: Table<ProductItem, string>;
  contacts!: Table<Contact, number>;
  activities!: Table<ActivityLog, number>;
  customTables!: Table<CustomTable, string>;
  users!: Table<AppUser, string>;

  constructor() {
    super('ClaimAIControlDB');
    this.version(3).stores({
      clients: 'id, name, company, businessType, status, priority, requiresAttention, phone, email, nextFollowUpDate',
      productItems: 'id, category, client, type, priority, status, release, module',
      contacts: '++id, clientId, name, phone, email',
      activities: '++id, clientId, author, type, timestamp',
      customTables: 'id, name, category, createdAt',
      users: 'id, email, name, role, isActive'
    });
  }
}

export const db = new ClaimAIDatabase();

// Supabase client instance (initialized if credentials provided)
let supabase: SupabaseClient | null = null;

export const getSupabaseConfig = () => {
  const url = localStorage.getItem('claimai_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem('claimai_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, key, isConfigured: Boolean(url && key) };
};

export const initSupabase = (url: string, key: string) => {
  if (url && key) {
    try {
      supabase = createClient(url, key);
      localStorage.setItem('claimai_supabase_url', url);
      localStorage.setItem('claimai_supabase_anon_key', key);
      return true;
    } catch (e) {
      console.error('Failed to init Supabase client', e);
      return false;
    }
  }
  return false;
};

// Initialize Supabase from storage if available
const currentCfg = getSupabaseConfig();
if (currentCfg.isConfigured) {
  try {
    supabase = createClient(currentCfg.url, currentCfg.key);
  } catch (err) {
    console.warn('Initial Supabase connect skipped', err);
  }
}

export const checkSupabaseHealth = async (): Promise<{ isConnected: boolean; message: string; latency?: number }> => {
  const cfg = getSupabaseConfig();
  if (!cfg.isConfigured) {
    return { isConnected: false, message: 'Supabase לא הוגדר (חסר URL או Anon Key)' };
  }
  const start = performance.now();
  try {
    const url = cfg.url.trim().replace(/\/$/, '');
    const res = await fetch(`${url}/rest/v1/crm_clients?select=count&limit=1`, {
      method: 'GET',
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`
      }
    });
    const latency = Math.round(performance.now() - start);
    if (res.ok || res.status === 404) {
      return { isConnected: true, message: 'Supabase פעיל ומגיב בהצלחה!', latency };
    }
    if (res.status === 401) {
      return { isConnected: false, message: 'שגיאת הזדהות (401 - Anon Key אינו תואם)' };
    }
    return { isConnected: false, message: `קוד שגיאה מהשרת: ${res.status}` };
  } catch (err: any) {
    return { isConnected: false, message: `שגיאת רשת/חיבור: ${err.message || err}` };
  }
};

// Database initialization & seeding
export const CURRENT_DATA_VERSION = '2026-11-26-v6-new-leads-sync';
const DELETED_CUSTOM_TABLES_KEY = 'claimai_deleted_custom_tables';

export const getDeletedCustomTableIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_CUSTOM_TABLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const markCustomTableAsDeleted = (tableId: string): void => {
  if (typeof window === 'undefined') return;
  const deleted = getDeletedCustomTableIds();
  if (!deleted.includes(tableId)) {
    deleted.push(tableId);
    try {
      localStorage.setItem(DELETED_CUSTOM_TABLES_KEY, JSON.stringify(deleted));
    } catch (e) {
      console.warn('Failed to save deleted table id to localStorage:', e);
    }
  }
};

export const initDatabase = async (): Promise<{ clientsCount: number; productCount: number; tablesCount: number; usersCount: number }> => {
  if (USE_LOCAL_API) {
    try {
      await apiRequest('/api/reset');
      const [clients, products, tables, users] = await Promise.all([
        apiRequest('/api/clients').then(r => r.json()),
        apiRequest('/api/product-items').then(r => r.json()),
        apiRequest('/api/custom-tables').then(r => r.json()),
        apiRequest('/api/users').then(r => r.json())
      ]);
      return {
        clientsCount: clients.length,
        productCount: products.length,
        tablesCount: tables.length,
        usersCount: users.length
      };
    } catch (err) {
      console.warn('Local API init failed, falling back to IndexedDB', err);
    }
  }
  try {
    const deletedTableIds = getDeletedCustomTableIds();
    const currentVersion = localStorage.getItem('claimai_data_version');
    if (currentVersion !== CURRENT_DATA_VERSION) {
      console.log('Syncing database with new data version:', CURRENT_DATA_VERSION);
      await db.clients.clear();
      await db.clients.bulkAdd(seedClientsData as Client[]);
      for (const t of seedCustomTablesData as CustomTable[]) {
        if (!deletedTableIds.includes(t.id) && t.id !== 'table-users-export') {
          await db.customTables.put(t);
        }
      }
      if (deletedTableIds.includes('table-users-export')) {
        await db.customTables.delete('table-users-export');
      }
      await db.users.clear();
      await db.users.bulkAdd(seedUsersData as AppUser[]);
      localStorage.setItem('claimai_data_version', CURRENT_DATA_VERSION);
    }

    const clientsCount = await db.clients.count();
    const productCount = await db.productItems.count();
    const tablesCount = await db.customTables.count();
    const usersCount = await db.users.count();

    if (clientsCount === 0) {
      console.log('Seeding initial CRM clients into IndexedDB...');
      await db.clients.bulkAdd(seedClientsData as Client[]);
    }

    if (productCount === 0) {
      console.log('Seeding initial Product Items into IndexedDB...');
      await db.productItems.bulkAdd(seedProductItemsData as ProductItem[]);
    }

    const contactsCount = await db.contacts.count();
    if (contactsCount === 0) {
      await db.contacts.bulkAdd(seedContactsData as Contact[]);
    }

    if (tablesCount === 0) {
      console.log('Seeding initial Custom Tables into IndexedDB...');
      const seedTables = (seedCustomTablesData as CustomTable[]).filter(
        t => !deletedTableIds.includes(t.id) && t.id !== 'table-users-export'
      );
      if (seedTables.length > 0) {
        await db.customTables.bulkAdd(seedTables);
      }
    }

    if (usersCount === 0) {
      console.log('Seeding initial App Users into IndexedDB...');
      await db.users.bulkAdd(seedUsersData as AppUser[]);
    }

    const finalClients = await db.clients.count();
    const finalProduct = await db.productItems.count();
    const finalTables = await db.customTables.count();
    const finalUsers = await db.users.count();
    return { 
      clientsCount: finalClients, 
      productCount: finalProduct, 
      tablesCount: finalTables,
      usersCount: finalUsers 
    };
  } catch (err) {
    console.error('Error during DB init/seed:', err);
    return { clientsCount: seedClientsData.length, productCount: seedProductItemsData.length, tablesCount: 1, usersCount: seedUsersData.length };
  }
};

// Data operations for CRM Clients
export const getClients = async (): Promise<Client[]> => {
  if (USE_LOCAL_API) {
    try {
      const res = await apiRequest('/api/clients');
      return await res.json();
    } catch (e) {
      console.error('Failed to get clients from local API, falling back to IndexedDB', e);
    }
  }
  try {
    const currentVersion = localStorage.getItem('claimai_data_version');
    if (currentVersion !== CURRENT_DATA_VERSION) {
      await initDatabase();
      return await db.clients.toArray();
    }
    const list = await db.clients.toArray();
    if (list.length === 0) {
      await initDatabase();
      return await db.clients.toArray();
    }
    return list;
  } catch (e) {
    console.error('Failed to get clients from IndexedDB, falling back to seed data', e);
    return seedClientsData as Client[];
  }
};

export const saveClient = async (client: Client): Promise<void> => {
  if (USE_LOCAL_API) {
    try {
      await apiRequest(`/api/clients/${client.id}`, { method: 'PUT', body: JSON.stringify(client) });
      return;
    } catch (e) {
      console.warn('Local API saveClient failed, falling back to IndexedDB', e);
    }
  }
  await db.clients.put(client);
  if (supabase) {
    try {
      await supabase.from('crm_clients').upsert({
        id: client.id,
        name: client.name,
        company: client.company,
        business_type: client.businessType,
        status: client.status,
        sub_status: client.subStatus,
        assigned_to: client.assignedTo,
        phone: client.phone,
        email: client.email,
        requires_attention: client.requiresAttention,
        next_follow_up_date: client.nextFollowUpDate,
        last_note: client.lastNote,
        general_notes: client.generalNotes
      });
    } catch (e) {
      console.warn('Supabase client sync skipped/failed:', e);
    }
  }
};

export const saveMultipleClients = async (clients: Client[]): Promise<void> => {
  if (USE_LOCAL_API) {
    try {
      await Promise.all(clients.map(c =>
        apiRequest(`/api/clients/${c.id}`, { method: 'PUT', body: JSON.stringify(c) })
      ));
      return;
    } catch (e) {
      console.warn('Local API saveMultipleClients failed, falling back to IndexedDB', e);
    }
  }
  await db.clients.bulkPut(clients);
};

export const deleteClient = async (id: string): Promise<void> => {
  if (USE_LOCAL_API) {
    try {
      await apiRequest(`/api/clients/${id}`, { method: 'DELETE' });
      return;
    } catch (e) {
      console.warn('Local API deleteClient failed, falling back to IndexedDB', e);
    }
  }
  await db.clients.delete(id);
  if (supabase) {
    try {
      await supabase.from('crm_clients').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }
};

// Data operations for Product Items
export const getProductItems = async (): Promise<ProductItem[]> => {
  if (USE_LOCAL_API) {
    try {
      const res = await apiRequest('/api/product-items');
      return await res.json();
    } catch (e) {
      console.error('Failed to get product items from local API, falling back to IndexedDB', e);
    }
  }
  try {
    const list = await db.productItems.toArray();
    if (list.length === 0) {
      await initDatabase();
      return await db.productItems.toArray();
    }
    return list;
  } catch (e) {
    console.error('Failed to get product items', e);
    return seedProductItemsData as ProductItem[];
  }
};

export const saveProductItem = async (item: ProductItem): Promise<void> => {
  if (USE_LOCAL_API) {
    try {
      await apiRequest(`/api/product-items/${item.id}`, { method: 'PUT', body: JSON.stringify(item) });
      return;
    } catch (e) {
      console.warn('Local API saveProductItem failed, falling back to IndexedDB', e);
    }
  }
  await db.productItems.put(item);
  if (supabase) {
    try {
      await supabase.from('product_items').upsert({
        id: item.id,
        category: item.category,
        client: item.client,
        type: item.type,
        module: item.module,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: item.status,
        owner: item.owner,
        reported_by: item.reportedBy,
        target_date: item.targetDate,
        notes: item.notes
      });
    } catch (e) {
      console.warn('Supabase product item sync skipped/failed:', e);
    }
  }
};

export const deleteProductItem = async (id: string): Promise<void> => {
  if (USE_LOCAL_API) {
    try {
      await apiRequest(`/api/product-items/${id}`, { method: 'DELETE' });
      return;
    } catch (e) {
      console.warn('Local API deleteProductItem failed, falling back to IndexedDB', e);
    }
  }
  await db.productItems.delete(id);
  if (supabase) {
    try {
      await supabase.from('product_items').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }
};

// Custom Dynamic Tables Operations
export const getCustomTables = async (): Promise<CustomTable[]> => {
  const deletedTableIds = getDeletedCustomTableIds();
  if (USE_LOCAL_API) {
    try {
      const res = await apiRequest('/api/custom-tables');
      const list = await res.json();
      return (list || []).filter((t: any) => !deletedTableIds.includes(t.id));
    } catch (e) {
      console.error('Failed to get custom tables from local API, falling back to IndexedDB', e);
    }
  }
  try {
    const rawList = await db.customTables.toArray();
    
    // Purge any tables that were marked as deleted
    for (const deletedId of deletedTableIds) {
      if (rawList.some(t => t.id === deletedId)) {
        await db.customTables.delete(deletedId);
      }
    }

    const list = rawList.filter(t => !deletedTableIds.includes(t.id));
    if (list.length === 0) {
      await initDatabase();
      const rechecked = await db.customTables.toArray();
      return rechecked.filter(t => !deletedTableIds.includes(t.id));
    }

    // Ensure only essential primary sheet tables (like table-no-cases) are present if NOT deleted
    const noCasesSeed = (seedCustomTablesData as CustomTable[]).find(t => t.id === 'table-no-cases');
    if (noCasesSeed && !deletedTableIds.includes('table-no-cases') && !list.some(t => t.id === 'table-no-cases')) {
      await db.customTables.put(noCasesSeed);
      list.push(noCasesSeed);
    }

    return list;
  } catch (e) {
    console.error('Failed to get custom tables', e);
    return (seedCustomTablesData as CustomTable[]).filter(t => !deletedTableIds.includes(t.id) && t.id !== 'table-users-export');
  }
};

export const saveCustomTable = async (table: CustomTable): Promise<void> => {
  if (USE_LOCAL_API) {
    try {
      await apiRequest(`/api/custom-tables/${table.id}`, { method: 'PUT', body: JSON.stringify(table) });
      return;
    } catch (e) {
      console.warn('Local API saveCustomTable failed, falling back to IndexedDB', e);
    }
  }
  await db.customTables.put(table);
  if (supabase) {
    try {
      await supabase.from('custom_tables').upsert({
        id: table.id,
        name: table.name,
        description: table.description,
        category: table.category,
        columns: JSON.stringify(table.columns),
        rows: JSON.stringify(table.rows),
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Supabase custom table sync skipped:', e);
    }
  }
};

export const deleteCustomTable = async (tableId: string): Promise<void> => {
  markCustomTableAsDeleted(tableId);
  if (USE_LOCAL_API) {
    try {
      await apiRequest(`/api/custom-tables/${tableId}`, { method: 'DELETE' });
      return;
    } catch (e) {
      console.warn('Local API deleteCustomTable failed, falling back to IndexedDB', e);
    }
  }
  await db.customTables.delete(tableId);
  if (supabase) {
    try {
      await supabase.from('custom_tables').delete().eq('id', tableId);
    } catch (e) {
      console.warn('Supabase delete table failed:', e);
    }
  }
};

// Users & Permissions Management Operations
export const getAppUsers = async (): Promise<AppUser[]> => {
  if (USE_LOCAL_API) {
    try {
      const res = await apiRequest('/api/users');
      return await res.json();
    } catch (e) {
      console.error('Failed to get app users from local API, falling back to IndexedDB', e);
    }
  }
  try {
    const list = await db.users.toArray();
    if (list.length === 0) {
      await initDatabase();
      return await db.users.toArray();
    }
    // Self-healing: ensure user-eyal has email eyal@claimi.co.il
    for (const u of list) {
      if ((u.id === 'user-eyal' || u.name.includes('אייל')) && u.email !== 'eyal@claimi.co.il') {
        u.email = 'eyal@claimi.co.il';
        await db.users.put(u);
      }
    }
    return list;
  } catch (e) {
    console.error('Failed to get app users', e);
    return seedUsersData as AppUser[];
  }
};

export const saveAppUser = async (user: AppUser): Promise<void> => {
  if (USE_LOCAL_API) {
    try {
      await apiRequest(`/api/users/${user.id}`, { method: 'PUT', body: JSON.stringify(user) });
      return;
    } catch (e) {
      console.warn('Local API saveAppUser failed, falling back to IndexedDB', e);
    }
  }
  await db.users.put(user);
  if (supabase) {
    try {
      await supabase.from('app_users').upsert({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: JSON.stringify(user.permissions),
        is_active: user.isActive,
        last_login: user.lastLogin
      });
    } catch (e) {
      console.warn('Supabase user sync skipped:', e);
    }
  }
};

export const deleteAppUser = async (userId: string): Promise<void> => {
  if (USE_LOCAL_API) {
    try {
      await apiRequest(`/api/users/${userId}`, { method: 'DELETE' });
      return;
    } catch (e) {
      console.warn('Local API deleteAppUser failed, falling back to IndexedDB', e);
    }
  }
  await db.users.delete(userId);
  if (supabase) {
    try {
      await supabase.from('app_users').delete().eq('id', userId);
    } catch (e) {
      console.warn('Supabase delete user failed:', e);
    }
  }
};

export const findUserByEmail = async (email: string): Promise<AppUser | undefined> => {
  const clean = email.trim().toLowerCase();
  const found = await db.users.where('email').equalsIgnoreCase(clean).first();
  if (found) return found;
  if (clean === 'eyal@claimi.co.il' || clean === 'eyal@claimai.com' || clean.includes('eyal')) {
    const eyalUser = await db.users.get('user-eyal');
    if (eyalUser) return eyalUser;
  }
  return undefined;
};

// Contacts
export const getContactsForClient = async (clientId: string): Promise<Contact[]> => {
  try {
    return await db.contacts.where('clientId').equals(clientId).toArray();
  } catch {
    return [];
  }
};

export const addContact = async (contact: Contact): Promise<number> => {
  return (await db.contacts.add(contact)) as number;
};

// Activity log
export const getActivitiesForClient = async (clientId: string): Promise<ActivityLog[]> => {
  try {
    return await db.activities.where('clientId').equals(clientId).reverse().sortBy('timestamp');
  } catch {
    return [];
  }
};

export const addActivity = async (activity: ActivityLog): Promise<number> => {
  return (await db.activities.add(activity)) as number;
};

// Re-seed from original spreadsheets
export const resetToSeedData = async (): Promise<void> => {
  await db.clients.clear();
  await db.productItems.clear();
  await db.contacts.clear();
  await db.activities.clear();
  await db.customTables.clear();
  await db.users.clear();
  await db.clients.bulkAdd(seedClientsData as Client[]);
  await db.productItems.bulkAdd(seedProductItemsData as ProductItem[]);
  await db.contacts.bulkAdd(seedContactsData as Contact[]);
  await db.customTables.bulkAdd(seedCustomTablesData as CustomTable[]);
  await db.users.bulkAdd(seedUsersData as AppUser[]);
};

// Export all data as JSON
export const exportFullDatabaseJSON = async (): Promise<string> => {
  const clients = await db.clients.toArray();
  const productItems = await db.productItems.toArray();
  const contacts = await db.contacts.toArray();
  const activities = await db.activities.toArray();
  const customTables = await db.customTables.toArray();
  const users = await db.users.toArray();

  const bundle = {
    exportedAt: new Date().toISOString(),
    version: '1.3.0',
    clients,
    productItems,
    contacts,
    activities,
    customTables,
    users
  };

  return JSON.stringify(bundle, null, 2);
};

export { downloadFullDatabaseCSV, generateFullDatabaseCSV, restoreFromInternalStaticCSV } from './csvBackupService';
