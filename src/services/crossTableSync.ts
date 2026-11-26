import { Client, CustomTable, CustomTableColumn } from '../types';

export interface FieldMatch {
  tableColKey: string;
  tableColLabel: string;
  clientField: keyof Client;
  clientFieldLabel: string;
  tableValue: any;
  clientValue: any;
  hasDifference: boolean;
}

export interface RowClientMatch {
  rowId: string;
  row: Record<string, any>;
  client: Client;
  matchType: 'email' | 'phone' | 'id' | 'name';
  matchValue: string;
  fieldMatches: FieldMatch[];
  hasDiffs: boolean;
}

export interface SyncResult {
  updatedTable: CustomTable;
  updatedClients: Client[];
  syncedMatchesCount: number;
  updatedFieldsCount: number;
  details: Array<{
    name: string;
    clientId: string;
    updatedFields: string[];
  }>;
}

// Normalize phone for robust Israeli & international comparisons
export const normalizePhone = (phone?: string): string => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('972')) {
    return '0' + digits.substring(3);
  }
  return digits;
};

// Normalize email
export const normalizeEmail = (email?: string): string => {
  if (!email) return '';
  return String(email).trim().toLowerCase();
};

// Normalize names / companies
export const normalizeName = (name?: string): string => {
  if (!name) return '';
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[״"׳'.,_-]/g, '')
    .replace(/\s+/g, ' ');
};

// Known field mappings from table column keys/labels to Client properties
const FIELD_MAPPING_RULES: Array<{
  clientField: keyof Client;
  clientFieldLabel: string;
  matches: (colKey: string, colLabel: string) => boolean;
}> = [
  {
    clientField: 'name',
    clientFieldLabel: 'שם איש קשר',
    matches: (k, l) => {
      const lowerK = k.toLowerCase();
      const lowerL = l.toLowerCase();
      return (
        lowerK === 'name' ||
        lowerK === 'fullname' ||
        lowerK === 'full_name' ||
        lowerK === 'client_name' ||
        lowerL === 'שם' ||
        lowerL === 'שם מלא' ||
        lowerL === 'שם לקוח' ||
        lowerL === 'איש קשר'
      );
    }
  },
  {
    clientField: 'phone',
    clientFieldLabel: 'טלפון',
    matches: (k, l) => {
      const lowerK = k.toLowerCase();
      const lowerL = l.toLowerCase();
      return (
        lowerK.includes('phone') ||
        lowerK.includes('mobile') ||
        lowerK.includes('tel') ||
        lowerL.includes('טלפון') ||
        lowerL.includes('נייד')
      );
    }
  },
  {
    clientField: 'company',
    clientFieldLabel: 'שם חברה / סוכנות',
    matches: (k, l) => {
      const lowerK = k.toLowerCase();
      const lowerL = l.toLowerCase();
      if (
        lowerK.includes('phone') || 
        lowerK.includes('mobile') || 
        lowerK.includes('tel') || 
        lowerK.includes('mail') || 
        lowerL.includes('טלפון') || 
        lowerL.includes('מייל')
      ) {
        return false;
      }
      return (
        lowerK.includes('company') ||
        lowerK.includes('agency') ||
        lowerL.includes('חברה') ||
        lowerL.includes('סוכנות') ||
        lowerL.includes('עסק')
      );
    }
  },
  {
    clientField: 'email',
    clientFieldLabel: 'אימייל',
    matches: (k, l) => {
      const lowerK = k.toLowerCase();
      const lowerL = l.toLowerCase();
      return (
        lowerK.includes('email') ||
        lowerK.includes('mail') ||
        lowerL.includes('אימייל') ||
        lowerL.includes('מייל') ||
        lowerL.includes('דוא"ל')
      );
    }
  },
  {
    clientField: 'businessType',
    clientFieldLabel: 'סוג עסק',
    matches: (k, l) => {
      const lowerK = k.toLowerCase();
      const lowerL = l.toLowerCase();
      return (
        lowerK.includes('business') ||
        lowerK.includes('type') ||
        lowerL.includes('סוג עסק') ||
        lowerL.includes('תחום')
      );
    }
  },
  {
    clientField: 'status',
    clientFieldLabel: 'סטטוס CRM',
    matches: (k, l) => {
      const lowerK = k.toLowerCase();
      const lowerL = l.toLowerCase();
      return (
        lowerK === 'status' ||
        lowerK.includes('crm_status') ||
        lowerL === 'סטטוס' ||
        lowerL.includes('סטטוס crm')
      );
    }
  },
  {
    clientField: 'monthlyClaims',
    clientFieldLabel: 'כמות תביעות / תיקים',
    matches: (k, l) => {
      const lowerK = k.toLowerCase();
      const lowerL = l.toLowerCase();
      return (
        lowerK.includes('case') ||
        lowerK.includes('claim') ||
        lowerL.includes('תביעות') ||
        lowerL.includes('תיקים')
      );
    }
  },
  {
    clientField: 'lastNote',
    clientFieldLabel: 'הערה אחרונה / הערות',
    matches: (k, l) => {
      const lowerK = k.toLowerCase();
      const lowerL = l.toLowerCase();
      return (
        lowerK.includes('note') ||
        lowerK.includes('comment') ||
        lowerL.includes('הערה') ||
        lowerL.includes('הערות')
      );
    }
  },
  {
    clientField: 'location',
    clientFieldLabel: 'כתובת / עיר',
    matches: (k, l) => {
      const lowerK = k.toLowerCase();
      const lowerL = l.toLowerCase();
      return (
        lowerK.includes('city') ||
        lowerK.includes('address') ||
        lowerK.includes('location') ||
        lowerL.includes('עיר') ||
        lowerL.includes('כתובת') ||
        lowerL.includes('מיקום')
      );
    }
  }
];

// Helper to determine mapped field for a column
export const getMappedClientField = (
  colKey: string,
  colLabel: string
): { clientField: keyof Client; clientFieldLabel: string } | null => {
  for (const rule of FIELD_MAPPING_RULES) {
    if (rule.matches(colKey, colLabel)) {
      return {
        clientField: rule.clientField,
        clientFieldLabel: rule.clientFieldLabel
      };
    }
  }
  return null;
};

// Check if a row in a custom table matches an existing client
export const findRowClientMatch = (
  row: Record<string, any>,
  columns: CustomTableColumn[],
  clients: Client[]
): RowClientMatch | null => {
  if (!row || !clients || clients.length === 0) return null;

  // Extract phone, email, name, id from row
  let rowPhone = '';
  let rowEmail = '';
  let rowName = '';
  let rowCompany = '';
  let rowId = String(row.id || '');

  columns.forEach(col => {
    const val = row[col.key];
    if (val === undefined || val === null || val === '') return;
    const strVal = String(val);

    if (col.type === 'phone' || col.key.toLowerCase().includes('phone') || col.label.includes('טלפון')) {
      if (!rowPhone) rowPhone = normalizePhone(strVal);
    }
    if (col.type === 'email' || col.key.toLowerCase().includes('mail') || col.label.includes('אימייל') || col.label.includes('מייל')) {
      if (!rowEmail) rowEmail = normalizeEmail(strVal);
    }
    if (col.label.includes('חברה') || col.key.toLowerCase().includes('company')) {
      if (!rowCompany) rowCompany = normalizeName(strVal);
    }
    if (col.label.includes('שם') && !col.label.includes('חברה')) {
      if (!rowName) rowName = normalizeName(strVal);
    }
  });

  // Also check direct object keys if standard columns weren't matched
  if (!rowPhone && (row.phone || row.company_phone)) {
    rowPhone = normalizePhone(row.phone || row.company_phone);
  }
  if (!rowEmail && (row.email || row.mail)) {
    rowEmail = normalizeEmail(row.email || row.mail);
  }
  if (!rowName && (row.name || row.fullName || row.first_name)) {
    rowName = normalizeName(row.name || row.fullName || `${row.first_name || ''} ${row.last_name || ''}`);
  }
  if (!rowCompany && (row.company || row.company_name)) {
    rowCompany = normalizeName(row.company || row.company_name);
  }

  // 1. Match by Email (highest confidence)
  if (rowEmail) {
    const matched = clients.find(c => c.email && normalizeEmail(c.email) === rowEmail);
    if (matched) {
      return buildRowClientMatch(row, columns, matched, 'email', rowEmail);
    }
  }

  // 2. Match by Phone
  if (rowPhone && rowPhone.length >= 7) {
    const matched = clients.find(c => {
      if (!c.phone) return false;
      const cPhone = normalizePhone(c.phone);
      return cPhone === rowPhone || (cPhone.length >= 7 && rowPhone.length >= 7 && (cPhone.endsWith(rowPhone.slice(-7)) || rowPhone.endsWith(cPhone.slice(-7))));
    });
    if (matched) {
      return buildRowClientMatch(row, columns, matched, 'phone', rowPhone);
    }
  }

  // 3. Match by ID
  if (rowId && !rowId.startsWith('row-')) {
    const matched = clients.find(c => c.id === rowId);
    if (matched) {
      return buildRowClientMatch(row, columns, matched, 'id', rowId);
    }
  }

  // 4. Match by Exact Company or Name
  if (rowCompany && rowCompany.length > 2) {
    const matched = clients.find(c => {
      const cComp = normalizeName(c.company);
      const cName = normalizeName(c.name);
      return cComp === rowCompany || cName === rowCompany;
    });
    if (matched) {
      return buildRowClientMatch(row, columns, matched, 'name', rowCompany);
    }
  }

  if (rowName && rowName.length > 2) {
    const matched = clients.find(c => {
      const cName = normalizeName(c.name);
      const cComp = normalizeName(c.company);
      return cName === rowName || cComp === rowName;
    });
    if (matched) {
      return buildRowClientMatch(row, columns, matched, 'name', rowName);
    }
  }

  return null;
};

// Build the detailed match information including field-by-field differences
const buildRowClientMatch = (
  row: Record<string, any>,
  columns: CustomTableColumn[],
  client: Client,
  matchType: 'email' | 'phone' | 'id' | 'name',
  matchValue: string
): RowClientMatch => {
  const fieldMatches: FieldMatch[] = [];

  columns.forEach(col => {
    const mapping = getMappedClientField(col.key, col.label);
    if (!mapping) return;

    const tableVal = row[col.key];
    const clientVal = client[mapping.clientField];

    const strTable = tableVal !== undefined && tableVal !== null ? String(tableVal).trim() : '';
    const strClient = clientVal !== undefined && clientVal !== null ? String(clientVal).trim() : '';

    const hasDiff = strTable !== '' && strClient !== '' && strTable !== strClient;
    const isOneMissing = (strTable !== '' && strClient === '') || (strTable === '' && strClient !== '');

    fieldMatches.push({
      tableColKey: col.key,
      tableColLabel: col.label,
      clientField: mapping.clientField,
      clientFieldLabel: mapping.clientFieldLabel,
      tableValue: tableVal,
      clientValue: clientVal,
      hasDifference: hasDiff || isOneMissing
    });
  });

  const hasDiffs = fieldMatches.some(f => f.hasDifference);

  return {
    rowId: row.id,
    row,
    client,
    matchType,
    matchValue,
    fieldMatches,
    hasDiffs
  };
};

// 1. Update the Main CRM Client using fields from the Custom Table row
export const updateClientFromRow = (
  client: Client,
  row: Record<string, any>,
  columns: CustomTableColumn[]
): Client => {
  const updated: Client = { ...client };

  columns.forEach(col => {
    const mapping = getMappedClientField(col.key, col.label);
    if (!mapping) return;

    const val = row[col.key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      // Handle special fields
      if (mapping.clientField === 'monthlyClaims') {
        const num = String(val).replace(/[^0-9]/g, '');
        (updated as any)[mapping.clientField] = num ? `${num} תביעות` : String(val);
      } else {
        (updated as any)[mapping.clientField] = String(val);
      }
    }
  });

  updated.updatedDate = new Date().toISOString().slice(0, 10);
  return updated;
};

// 2. Reverse Update: Update the Custom Table row using fields from the Main CRM Client
export const updateRowFromClient = (
  row: Record<string, any>,
  client: Client,
  columns: CustomTableColumn[]
): Record<string, any> => {
  const updated: Record<string, any> = { ...row };

  columns.forEach(col => {
    const mapping = getMappedClientField(col.key, col.label);
    if (!mapping) return;

    const clientVal = client[mapping.clientField];
    if (clientVal !== undefined && clientVal !== null && String(clientVal).trim() !== '') {
      if (col.type === 'number') {
        const num = parseFloat(String(clientVal).replace(/[^0-9.-]/g, ''));
        updated[col.key] = isNaN(num) ? 0 : num;
      } else {
        updated[col.key] = clientVal;
      }
    }
  });

  return updated;
};

// 3. Create a full Client object from a Custom Table row
export const createClientFromRow = (
  row: Record<string, any>,
  columns: CustomTableColumn[],
  tableName?: string
): Client => {
  let name = '';
  let company = '';
  let phone = '';
  let email = '';
  let businessType = '';
  let status = "1'st Lead";
  let notes = '';
  let lastContact = '';
  const customFields: Record<string, any> = {};

  columns.forEach(col => {
    const val = row[col.key];
    if (val === undefined || val === null || val === '') return;
    const strVal = String(val).trim();
    if (!strVal) return;

    const mapping = getMappedClientField(col.key, col.label);
    if (mapping) {
      if (mapping.clientField === 'name') name = strVal;
      else if (mapping.clientField === 'company') company = strVal;
      else if (mapping.clientField === 'phone') phone = strVal;
      else if (mapping.clientField === 'email') email = strVal;
      else if (mapping.clientField === 'businessType') businessType = strVal;
      else if (mapping.clientField === 'status') status = strVal;
      else if (mapping.clientField === 'lastNote') notes = strVal;
      else if (mapping.clientField === 'lastContactDate') lastContact = strVal;
      else customFields[col.label || col.key] = strVal;
    } else {
      if (col.type === 'phone' || col.label.includes('טלפון')) {
        if (!phone) phone = strVal;
      } else if (col.type === 'email' || col.label.includes('אימייל') || col.label.includes('מייל')) {
        if (!email) email = strVal;
      } else if (col.label.includes('חברה')) {
        if (!company) company = strVal;
      } else if (col.label.includes('שם') && !col.label.includes('חברה')) {
        if (!name) name = strVal;
      } else if (col.label.includes('סוג עסק') || col.label.includes('תחום')) {
        if (!businessType) businessType = strVal;
      } else {
        customFields[col.label || col.key] = strVal;
      }
    }
  });

  // Fallbacks from raw row keys if columns didn't catch them
  if (!name) name = row.fullName || row.name || row['שם מלא'] || row['שם איש קשר'] || company || 'לקוח מטבלה';
  if (!company) company = row.companyName || row.company_name || row.company || row['חברה / עסק'] || row['חברה'] || name;
  if (!phone) phone = row.companyPhone || row.company_phone || row.phone || row['טלפון'] || row['טלפון חברה'] || row.mobile || '';
  if (!email) email = row.email || row.mail || row['אימייל'] || '';

  const today = new Date().toISOString().slice(0, 10);

  return {
    id: row.id || `client-row-${Date.now()}`,
    name,
    company: company || name,
    phone,
    email,
    businessType: businessType || (tableName ? `מטבלת ${tableName}` : 'לקוח כללי'),
    status: status || "1'st Lead",
    priority: '3',
    createdDate: row.created || row.createdDate || today,
    lastContactDate: lastContact || today,
    statusSince: today,
    updatedDate: today,
    lastNote: notes || (tableName ? `מקור: ${tableName}` : undefined),
    customFields
  };
};

// 3. Execute Seamless Automatic Sync across all matching records between table and CRM clients
export const executeSeamlessSync = (
  table: CustomTable,
  clients: Client[]
): SyncResult => {
  const updatedClientsMap = new Map<string, Client>(clients.map(c => [c.id, { ...c }]));
  const updatedRows = [...table.rows];

  let syncedMatchesCount = 0;
  let updatedFieldsCount = 0;
  const details: Array<{ name: string; clientId: string; updatedFields: string[] }> = [];

  updatedRows.forEach((row, idx) => {
    const match = findRowClientMatch(row, table.columns, Array.from(updatedClientsMap.values()));
    if (!match) return;

    syncedMatchesCount++;
    const currentClient = updatedClientsMap.get(match.client.id) || match.client;
    const clientFieldsChanged: string[] = [];

    // Sync matching fields seamlessly
    table.columns.forEach(col => {
      const mapping = getMappedClientField(col.key, col.label);
      if (!mapping) return;

      const rowVal = row[col.key];
      const clientVal = currentClient[mapping.clientField];

      const rowStr = rowVal !== undefined && rowVal !== null ? String(rowVal).trim() : '';
      const clientStr = clientVal !== undefined && clientVal !== null ? String(clientVal).trim() : '';

      // If row has value and client is empty or different, update client
      if (rowStr && (!clientStr || (rowStr !== clientStr && mapping.clientField !== 'status'))) {
        if (mapping.clientField === 'monthlyClaims') {
          const num = rowStr.replace(/[^0-9]/g, '');
          (currentClient as any)[mapping.clientField] = num ? `${num} תביעות` : rowStr;
        } else {
          (currentClient as any)[mapping.clientField] = rowStr;
        }
        clientFieldsChanged.push(mapping.clientFieldLabel);
        updatedFieldsCount++;
      }
      // If client has value (like updated CRM status or business type) and row is empty, update row
      else if (clientStr && !rowStr) {
        if (col.type === 'number') {
          const num = parseFloat(clientStr.replace(/[^0-9.-]/g, ''));
          row[col.key] = isNaN(num) ? 0 : num;
        } else {
          row[col.key] = clientStr;
        }
        clientFieldsChanged.push(col.label);
        updatedFieldsCount++;
      }
    });

    if (clientFieldsChanged.length > 0) {
      currentClient.updatedDate = new Date().toISOString().slice(0, 10);
      updatedClientsMap.set(currentClient.id, currentClient);
      updatedRows[idx] = { ...row };
      details.push({
        name: currentClient.name || currentClient.company,
        clientId: currentClient.id,
        updatedFields: clientFieldsChanged
      });
    }
  });

  const updatedTable: CustomTable = {
    ...table,
    rows: updatedRows,
    updatedAt: new Date().toISOString().slice(0, 10)
  };

  return {
    updatedTable,
    updatedClients: Array.from(updatedClientsMap.values()),
    syncedMatchesCount,
    updatedFieldsCount,
    details
  };
};
