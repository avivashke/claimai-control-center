export type BusinessType = 
  | 'סוכנות ביטוח' 
  | 'מוסך' 
  | 'שמאי' 
  | 'עורך דין' 
  | 'חברת ניהול תביעות' 
  | 'חברת ביטוח' 
  | 'אחר';

export type LeadStatus = 
  | "1'st Lead" 
  | "1'st Follow-Up" 
  | "Meeting Scheduled" 
  | "Important" 
  | "Urgent" 
  | "Follow-Up" 
  | "Adoption Monitoring" 
  | "All-Good" 
  | "Irrelevant"
  | "ליד ראשוני מהמאנדיי";

export interface Client {
  id: string;
  name: string;
  company: string;
  businessType: string;
  status: string;
  subStatus?: string;
  assignedTo?: string;
  group?: string;
  temperature?: string;
  priority?: string;
  requiresAttention?: boolean;
  phone?: string;
  email?: string;
  teamContacts?: string;
  itContact?: string;
  location?: string;
  source?: string;
  monthlyClaims?: string;
  createdDate?: string;
  nextFollowUpDate?: string;
  lastContactDate?: string;
  statusSince?: string;
  lastNote?: string;
  generalNotes?: string;
  contactType?: string;
  updatedBy?: string;
  updatedDate?: string;
}

export type ProductItemCategory = 'bug' | 'roadmap';

export type ProductPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type ProductStatus = 
  | 'Backlog' 
  | 'Open' 
  | 'In Progress' 
  | 'QA / Review' 
  | 'Done' 
  | 'Overdue';

export interface ProductItem {
  id: string;
  category: ProductItemCategory;
  client: string;
  type: string; // 'Bug' | 'Feature' | 'Enhancement' | 'Performance'
  module: string;
  title: string;
  description: string;
  priority: ProductPriority;
  status: ProductStatus;
  owner: string;
  reportedBy: string;
  source: string;
  release: string;
  openedDate: string;
  targetDate: string;
  completedDate?: string;
  daysOpen: number;
  health: string;
  notes?: string;
}

export interface Contact {
  id?: number;
  clientId: string;
  clientName?: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  note?: string;
}

export interface ActivityLog {
  id?: number;
  clientId: string;
  clientName?: string;
  author: string;
  type: 'call' | 'meeting' | 'whatsapp' | 'email' | 'note' | 'status_change';
  details: string;
  timestamp: string;
}

export interface DatabaseConfig {
  mode: 'local' | 'supabase';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  isConnected?: boolean;
  lastSynced?: string;
}

// Custom Tables and AI Types
export type ColumnType = 'string' | 'number' | 'date' | 'email' | 'phone' | 'badge' | 'boolean';

export interface CustomTableColumn {
  key: string;
  label: string;
  type: ColumnType;
}

export interface CustomTable {
  id: string;
  name: string;
  description?: string;
  category?: string;
  columns: CustomTableColumn[];
  rows: Record<string, any>[];
  createdAt: string;
  updatedAt: string;
}

export interface AIConfig {
  provider: 'builtin' | 'gemini' | 'openai';
  apiKey?: string;
  model?: string;
}
