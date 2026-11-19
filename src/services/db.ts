import Dexie, { Table } from 'dexie';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Client, ProductItem, Contact, ActivityLog, CustomTable, AppUser } from '../types';
import seedClientsData from '../data/seedClients.json';
import seedProductItemsData from '../data/seedProductItems.json';
import seedContactsData from '../data/seedContacts.json';
import seedCustomTablesData from '../data/seedCustomTables.json';
import seedUsersData from '../data/seedUsers.json';

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
export const initDatabase = async (): Promise<{ clientsCount: number; productCount: number; tablesCount: number; usersCount: number }> => {
  try {
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
      await db.customTables.bulkAdd(seedCustomTablesData as CustomTable[]);
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
  try {
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
  await db.clients.bulkPut(clients);
};

export const deleteClient = async (id: string): Promise<void> => {
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
  try {
    const list = await db.customTables.toArray();
    if (list.length === 0) {
      await initDatabase();
      return await db.customTables.toArray();
    }
    return list;
  } catch (e) {
    console.error('Failed to get custom tables', e);
    return seedCustomTablesData as CustomTable[];
  }
};

export const saveCustomTable = async (table: CustomTable): Promise<void> => {
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
  try {
    const list = await db.users.toArray();
    if (list.length === 0) {
      await initDatabase();
      return await db.users.toArray();
    }
    return list;
  } catch (e) {
    console.error('Failed to get app users', e);
    return seedUsersData as AppUser[];
  }
};

export const saveAppUser = async (user: AppUser): Promise<void> => {
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
  return await db.users.where('email').equalsIgnoreCase(email.trim()).first();
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
