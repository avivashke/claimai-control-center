import Dexie, { Table } from 'dexie';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Client, ProductItem, Contact, ActivityLog } from '../types';
import seedClientsData from '../data/seedClients.json';
import seedProductItemsData from '../data/seedProductItems.json';
import seedContactsData from '../data/seedContacts.json';

class ClaimAIDatabase extends Dexie {
  clients!: Table<Client, string>;
  productItems!: Table<ProductItem, string>;
  contacts!: Table<Contact, number>;
  activities!: Table<ActivityLog, number>;

  constructor() {
    super('ClaimAIControlDB');
    this.version(1).stores({
      clients: 'id, name, company, businessType, status, priority, requiresAttention, phone, email, nextFollowUpDate',
      productItems: 'id, category, client, type, priority, status, release, module',
      contacts: '++id, clientId, name, phone, email',
      activities: '++id, clientId, author, type, timestamp'
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

// Database initialization & seeding
export const initDatabase = async (): Promise<{ clientsCount: number; productCount: number }> => {
  try {
    const clientsCount = await db.clients.count();
    const productCount = await db.productItems.count();

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

    const finalClients = await db.clients.count();
    const finalProduct = await db.productItems.count();
    return { clientsCount: finalClients, productCount: finalProduct };
  } catch (err) {
    console.error('Error during DB init/seed:', err);
    return { clientsCount: seedClientsData.length, productCount: seedProductItemsData.length };
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
  await db.clients.bulkAdd(seedClientsData as Client[]);
  await db.productItems.bulkAdd(seedProductItemsData as ProductItem[]);
  await db.contacts.bulkAdd(seedContactsData as Contact[]);
};

// Export all data as JSON
export const exportFullDatabaseJSON = async (): Promise<string> => {
  const clients = await db.clients.toArray();
  const productItems = await db.productItems.toArray();
  const contacts = await db.contacts.toArray();
  const activities = await db.activities.toArray();

  const bundle = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    clients,
    productItems,
    contacts,
    activities
  };

  return JSON.stringify(bundle, null, 2);
};
