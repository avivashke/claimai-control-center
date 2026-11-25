import { Client, ProductItem, CustomTable } from '../types';
import { db } from './db';

export const CRM_SPREADSHEET_ID = '16qi8qhHFtlaoxgtda2fvv9bd3WmGU168-RlEwtfP8NM';
export const CRM_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${CRM_SPREADSHEET_ID}/edit?usp=drivesdk`;

export const PRODUCT_SPREADSHEET_ID = '1Jn8jbwlhukd9jsP8nrLbW8ggtljYVZd_5WYqaZkL5x4';
export const PRODUCT_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${PRODUCT_SPREADSHEET_ID}/edit?usp=drivesdk`;

const WEBHOOK_STORAGE_KEY = 'claimai_google_sheets_webhook_url';
const LAST_SYNC_STORAGE_KEY = 'claimai_last_sheets_sync';
const LAST_PULL_STORAGE_KEY = 'claimai_last_sheets_pull';

export const getSheetsWebhookUrl = (): string => {
  return localStorage.getItem(WEBHOOK_STORAGE_KEY) || (import.meta as any).env?.VITE_GOOGLE_SHEETS_WEBHOOK_URL || '';
};

export const setSheetsWebhookUrl = (url: string) => {
  localStorage.setItem(WEBHOOK_STORAGE_KEY, url.trim());
};

export const getLastSheetsSyncTime = (): string | null => {
  return localStorage.getItem(LAST_SYNC_STORAGE_KEY);
};

export const getLastSheetsPullTime = (): string | null => {
  return localStorage.getItem(LAST_PULL_STORAGE_KEY);
};

// Exact column headers matching Claimai_CRM spreadsheet - Sheet 'ראשי'
export const CRM_EXACT_HEADERS = [
  'ID',
  'שם איש קשר',
  'חברה / עסק',
  'סוג עסק',
  'סטטוס',
  'סטטוס משני',
  'אחראי',
  'קבוצה',
  'טמפרטורה',
  'עדיפות',
  'דורש טיפול',
  'טלפון',
  'אימייל',
  'אנשי צוות (שם + טלפון)',
  'מחשוב (שם + טלפון)',
  'מיקום',
  'מקור הגעה',
  'תביעות בחודש',
  'תאריך כניסה',
  'מעקב / פגישה הבאה',
  'מגע אחרון',
  'ימים ממגע',
  'בסטטוס מאז',
  'ימים בסטטוס',
  'הערה אחרונה',
  '➕ הערה חדשה',
  'סוג מגע',
  'מידע מהרשת (אוטו׳)',
  'סוג שזוהה (אוטו׳)',
  'הערות כלליות',
  'עודכן ע"י',
  'עודכן בתאריך',
  'הערות מדוח לאייל (אוטו׳)'
];

// Map a Client object to exact array matching Claimai_CRM row (ראשי)
export const mapClientToCrmSheetRow = (c: Client): (string | number | boolean)[] => {
  return [
    c.id || '',
    c.name || '',
    c.company || '',
    c.businessType || '',
    c.status || '',
    c.subStatus || '',
    c.assignedTo || '',
    c.group || '',
    c.temperature || '',
    c.priority || '',
    c.requiresAttention ? 'כן' : '',
    c.phone || '',
    c.email || '',
    c.teamContacts || '',
    c.itContact || '',
    c.location || '',
    c.source || '',
    c.monthlyClaims || '',
    c.createdDate || '',
    c.nextFollowUpDate || '',
    c.lastContactDate || '',
    '', // ימים ממגע (מחושב בגוגל שיטס)
    c.statusSince || '',
    '', // ימים בסטטוס (מחושב בגוגל שיטס)
    c.lastNote || '',
    '', // ➕ הערה חדשה
    c.contactType || '',
    '', // מידע מהרשת
    '', // סוג שזוהה
    c.generalNotes || '',
    c.updatedBy || 'Control Center',
    c.updatedDate || new Date().toISOString().slice(0, 10),
    c.customFields?.notesForEyal || ''
  ];
};

// Map a row array from 'ראשי' back to a Client object
export const mapSheetRowToClient = (row: any[]): Client | null => {
  if (!row || !row[0]) return null;
  const id = String(row[0]).trim();
  if (!id || id.toLowerCase() === 'id') return null;

  const requiresAttentionRaw = String(row[10] || '').trim();
  const requiresAttention = requiresAttentionRaw.toLowerCase() === 'כן' || 
    requiresAttentionRaw.toLowerCase() === 'true' || 
    requiresAttentionRaw.includes('דחוף') ||
    requiresAttentionRaw.includes('ימים');

  return {
    id,
    name: String(row[1] || '').trim(),
    company: String(row[2] || '').trim(),
    businessType: String(row[3] || '').trim(),
    status: String(row[4] || '1\'st Lead').trim(),
    subStatus: String(row[5] || '').trim(),
    assignedTo: String(row[6] || '').trim(),
    group: String(row[7] || '').trim(),
    temperature: String(row[8] || '').trim(),
    priority: String(row[9] || '5').trim(),
    requiresAttention,
    phone: String(row[11] || '').trim(),
    email: String(row[12] || '').trim(),
    teamContacts: String(row[13] || '').trim(),
    itContact: String(row[14] || '').trim(),
    location: String(row[15] || '').trim(),
    source: String(row[16] || '').trim(),
    monthlyClaims: String(row[17] || '').trim(),
    createdDate: String(row[18] || '').trim(),
    nextFollowUpDate: String(row[19] || '').trim(),
    lastContactDate: String(row[20] || '').trim(),
    statusSince: String(row[22] || '').trim(),
    lastNote: String(row[24] || '').trim(),
    contactType: String(row[26] || '').trim(),
    generalNotes: String(row[29] || '').trim(),
    updatedBy: String(row[30] || 'Google Sheets').trim(),
    updatedDate: String(row[31] || new Date().toISOString().slice(0, 10)).trim(),
    customFields: {
      notesForEyal: String(row[32] || '').trim()
    }
  };
};

// Map a row from 'דוח לקוחות ללא תיקים'
export const mapNoCasesRowToRecord = (row: any[]): Record<string, any> | null => {
  if (!row || !row[0]) return null;
  const id = String(row[0]).trim();
  if (!id || id.toLowerCase() === 'id' || id === 'מזהה משתמש') return null;

  const firstName = String(row[1] || '').trim();
  const lastName = String(row[2] || '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  return {
    id,
    fullName: fullName || String(row[1] || '').trim(),
    email: String(row[3] || '').trim(),
    companyName: String(row[13] || '').trim(),
    companyPhone: String(row[14] || '').trim(),
    caseCount: Number(row[6]) || 0,
    plan: String(row[7] || 'Free Trial').trim(),
    role: String(row[5] || 'משתמש').trim(),
    authMethod: String(row[4] || 'local').trim(),
    trialDaysLeft: Number(row[8]) || 0,
    notes: String(row[15] || '').trim(),
    createdAt: String(row[16] || '').trim()
  };
};

export const mapRecordToNoCasesRow = (r: Record<string, any>): any[] => {
  const parts = String(r.fullName || '').trim().split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';

  return [
    r.id || '',
    firstName,
    lastName,
    r.email || '',
    r.authMethod || 'local',
    r.role || 'משתמש',
    String(r.caseCount ?? 0),
    r.plan || 'Free Trial',
    String(r.trialDaysLeft ?? 0),
    '0',
    '0.00%',
    'Yes',
    '0',
    r.companyName || '',
    r.companyPhone || '',
    r.notes || '',
    r.createdAt || '1.1.2026'
  ];
};

// Map Product Item to Row (Fixes & Bugs or Product Roadmap)
export const mapProductItemToSheetRow = (item: ProductItem): any[] => {
  return [
    item.id,
    item.client || '',
    item.type || (item.category === 'bug' ? 'Bug' : 'Feature'),
    item.module || '',
    item.title || '',
    item.description || '',
    item.priority || 'Medium',
    item.status || 'Open',
    item.owner || 'Dev Team',
    item.reportedBy || '',
    item.source || '',
    item.release || '',
    item.openedDate || '',
    item.targetDate || '',
    item.completedDate || '',
    String(item.daysOpen || 0),
    item.health || '🟢 On track',
    new Date().toLocaleDateString('he-IL'),
    'Control Center'
  ];
};

// Map Sheet Row to Product Item
export const mapSheetRowToProductItem = (row: any[], defaultCategory: 'bug' | 'roadmap'): ProductItem | null => {
  if (!row || !row[0]) return null;
  const id = String(row[0]).trim();
  if (!id || id.toLowerCase() === 'id' || id.includes('FIXES') || id.includes('ROADMAP')) return null;

  const category = (id.startsWith('FX') || defaultCategory === 'bug') ? 'bug' : 'roadmap';

  return {
    id,
    category,
    client: String(row[1] || '').trim(),
    type: String(row[2] || (category === 'bug' ? 'Bug' : 'Feature')).trim(),
    module: String(row[3] || '').trim(),
    title: String(row[4] || '').trim(),
    description: String(row[5] || '').trim(),
    priority: (String(row[6] || 'Medium').trim() as any),
    status: (String(row[7] || 'Open').trim() as any),
    owner: String(row[8] || '').trim(),
    reportedBy: String(row[9] || '').trim(),
    source: String(row[10] || '').trim(),
    release: String(row[11] || '').trim(),
    openedDate: String(row[12] || '').trim(),
    targetDate: String(row[13] || '').trim(),
    completedDate: String(row[14] || '').trim(),
    daysOpen: Number(row[15]) || 0,
    health: (String(row[16] || '🟢 On track').trim() as any),
    notes: String(row[17] || '').trim()
  };
};

// Generate CSV for Claimai_CRM
export const generateCrmSheetCSV = (clients: Client[]): string => {
  const headerLine = CRM_EXACT_HEADERS.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
  const rowLines = clients.map(c => {
    const row = mapClientToCrmSheetRow(c);
    return row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',');
  });

  return '\uFEFF' + [headerLine, ...rowLines].join('\n');
};

// Generate CSV for CLAIMAI | Product & Delivery Control
export const generateProductSheetCSV = (items: ProductItem[]): string => {
  const headers = [
    'מזהה',
    'קטגוריה',
    'לקוח',
    'סוג',
    'מודול',
    'כותרת',
    'תיאור',
    'עדיפות',
    'סטטוס',
    'אחראי',
    'דווח ע"י',
    'מקור',
    'גרסה',
    'תאריך פתיחה',
    'תאריך יעד',
    'תאריך סיום',
    'ימים פתוח',
    'בריאות',
    'הערות'
  ];

  const headerLine = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
  const rowLines = items.map(item => [
    item.id,
    item.category === 'bug' ? 'תקלה / באג' : 'רודמאפ',
    item.client || '',
    item.type || '',
    item.module || '',
    item.title || '',
    item.description || '',
    item.priority || '',
    item.status || '',
    item.owner || '',
    item.reportedBy || '',
    item.source || '',
    item.release || '',
    item.openedDate || '',
    item.targetDate || '',
    item.completedDate || '',
    String(item.daysOpen || 0),
    item.health || '',
    item.notes || ''
  ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','));

  return '\uFEFF' + [headerLine, ...rowLines].join('\n');
};

// Trigger download in browser
export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Push to Google Sheets (Webhook)
export const syncToGoogleSheetsWebhook = async (customUrl?: string): Promise<{ success: boolean; message: string; rowsPushed?: number }> => {
  const webhookUrl = customUrl || getSheetsWebhookUrl();
  if (!webhookUrl) {
    return {
      success: false,
      message: 'לא הוגדר URL של Webhook עבור Google Sheets. הזן את כתובת ה-Apps Script בהגדרות.'
    };
  }

  try {
    const [clients, productItems, customTables] = await Promise.all([
      db.clients.toArray(),
      db.productItems.toArray(),
      db.customTables.toArray()
    ]);

    const noCasesTable = customTables.find(t => t.id === 'table-no-cases');
    const noCasesRows = noCasesTable ? noCasesTable.rows.map(mapRecordToNoCasesRow) : [];

    const bugs = productItems.filter(p => p.category === 'bug').map(mapProductItemToSheetRow);
    const roadmap = productItems.filter(p => p.category === 'roadmap').map(mapProductItemToSheetRow);

    const payload = {
      action: 'push_all',
      timestamp: new Date().toISOString(),
      crmSpreadsheetId: CRM_SPREADSHEET_ID,
      productSpreadsheetId: PRODUCT_SPREADSHEET_ID,
      clientsCount: clients.length,
      productCount: productItems.length,
      noCasesCount: noCasesRows.length,
      clients: clients.map(mapClientToCrmSheetRow),
      noCasesRows: noCasesRows,
      bugs: bugs,
      roadmap: roadmap,
      productItems
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // Text/plain avoids CORS preflight blocks
      },
      body: JSON.stringify(payload)
    });

    const now = new Date().toISOString();
    localStorage.setItem(LAST_SYNC_STORAGE_KEY, now);

    return {
      success: true,
      message: `סנכרון מלא לגוגל שיטס נשלח בהצלחה! (${clients.length} לקוחות ב'ראשי', ${noCasesRows.length} ב'דוח ללא תיקים', ו-${productItems.length} פיתוחים/באגים).`,
      rowsPushed: clients.length + noCasesRows.length + productItems.length
    };
  } catch (err: any) {
    console.error('Google Sheets sync error:', err);
    return {
      success: false,
      message: `שגיאה בשליחת הסנכרון לגוגל שיטס: ${err.message || err}`
    };
  }
};

// Pull from Google Sheets (Two-Way Sync)
export const pullFromGoogleSheetsWebhook = async (customUrl?: string): Promise<{
  success: boolean;
  message: string;
  clientsUpdated?: number;
  noCasesUpdated?: number;
  productsUpdated?: number;
}> => {
  const webhookUrl = customUrl || getSheetsWebhookUrl();
  if (!webhookUrl) {
    return {
      success: false,
      message: 'לא הוגדר URL של Webhook עבור Google Sheets.'
    };
  }

  try {
    const fetchUrl = `${webhookUrl}?action=pull_all&t=${Date.now()}`;
    const res = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    let clientsUpdated = 0;
    let noCasesUpdated = 0;
    let productsUpdated = 0;

    // 1. Process 'ראשי' sheet rows
    if (data.clients && Array.isArray(data.clients) && data.clients.length > 0) {
      const incomingClients: Client[] = [];
      for (const row of data.clients) {
        const client = mapSheetRowToClient(row);
        if (client) {
          incomingClients.push(client);
        }
      }

      if (incomingClients.length > 0) {
        await db.clients.bulkPut(incomingClients);
        clientsUpdated = incomingClients.length;
      }
    }

    // 2. Process 'דוח לקוחות ללא תיקים' sheet rows
    if (data.noCases && Array.isArray(data.noCases) && data.noCases.length > 0) {
      const incomingRows: Record<string, any>[] = [];
      for (const row of data.noCases) {
        const rec = mapNoCasesRowToRecord(row);
        if (rec) {
          incomingRows.push(rec);
        }
      }

      if (incomingRows.length > 0) {
        let existingTable = await db.customTables.get('table-no-cases');
        if (existingTable) {
          existingTable.rows = incomingRows;
          existingTable.updatedAt = new Date().toISOString();
          await db.customTables.put(existingTable);
        } else {
          await db.customTables.put({
            id: 'table-no-cases',
            name: 'דוח לקוחות ללא תיקים',
            description: 'דוח לקוחות ומשתמשים רשומים במערכת ClaimAI ללא תיקים פעילים או בבדיקה',
            category: 'users',
            columns: [
              { key: 'id', label: 'מזהה משתמש', type: 'string' },
              { key: 'fullName', label: 'שם מלא', type: 'string' },
              { key: 'email', label: 'אימייל', type: 'email' },
              { key: 'companyName', label: 'שם חברה / עסק', type: 'string' },
              { key: 'companyPhone', label: 'טלפון חברה', type: 'phone' },
              { key: 'caseCount', label: 'תביעות במערכת', type: 'number' },
              { key: 'plan', label: 'מסלול', type: 'badge' },
              { key: 'role', label: 'תפקיד', type: 'string' },
              { key: 'authMethod', label: 'שיטת התחברות', type: 'string' },
              { key: 'trialDaysLeft', label: 'ימי ניסיון שנותרו', type: 'number' },
              { key: 'notes', label: 'סטטוס / הערות מעקב', type: 'string' },
              { key: 'createdAt', label: 'תאריך הצטרפות', type: 'date' }
            ],
            rows: incomingRows,
            createdAt: '2026-11-19',
            updatedAt: new Date().toISOString()
          });
        }
        noCasesUpdated = incomingRows.length;
      }
    }

    // 3. Process Product Items (Fixes & Bugs + Product Roadmap)
    const incomingProducts: ProductItem[] = [];
    if (data.bugs && Array.isArray(data.bugs)) {
      for (const row of data.bugs) {
        const item = mapSheetRowToProductItem(row, 'bug');
        if (item) incomingProducts.push(item);
      }
    }
    if (data.roadmap && Array.isArray(data.roadmap)) {
      for (const row of data.roadmap) {
        const item = mapSheetRowToProductItem(row, 'roadmap');
        if (item) incomingProducts.push(item);
      }
    }
    if (incomingProducts.length > 0) {
      await db.productItems.bulkPut(incomingProducts);
      productsUpdated = incomingProducts.length;
    }

    const now = new Date().toISOString();
    localStorage.setItem(LAST_PULL_STORAGE_KEY, now);

    return {
      success: true,
      message: `סנכרון משיכה הצליח! עודכנו ${clientsUpdated} לקוחות ב'ראשי', ${noCasesUpdated} ב'דוח ללא תיקים' ו-${productsUpdated} פיתוחים/באגים.`,
      clientsUpdated,
      noCasesUpdated,
      productsUpdated
    };
  } catch (err: any) {
    console.error('Google Sheets pull error:', err);
    return {
      success: false,
      message: `שגיאה במשיכת נתונים מגוגל שיטס: ${err.message || err}`
    };
  }
};

// Background debounced auto-sync (Push on edit)
let autoSyncTimer: any = null;
export const triggerGoogleSheetsAutoSync = (delayMs: number = 3000) => {
  const webhookUrl = getSheetsWebhookUrl();
  if (!webhookUrl) return; // Silent if no webhook configured

  if (autoSyncTimer) {
    clearTimeout(autoSyncTimer);
  }

  autoSyncTimer = setTimeout(async () => {
    try {
      await syncToGoogleSheetsWebhook();
    } catch (e) {
      console.warn('Auto-sync to Google Sheets failed in background:', e);
    }
  }, delayMs);
};

// Combined Apps Script Add-on Code (Preserves all existing logic & adds doGet/doPost)
export const GOOGLE_APPS_SCRIPT_WEBHOOK_EXTENSION = `
/* ===================================================================
 * תוסף סנכרון דו-כיווני חי למערכת ClaimAI Control Center (Web App API)
 * מתווסף בתחתית Code.gs בלי לפגוע בשום פונקציה קיימת של ה-CRM!
 * =================================================================== */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. קריאת גליון "ראשי"
    var mainSheet = ss.getSheetByName(CFG.MAIN) || ss.getSheetByName("ראשי") || ss.getActiveSheet();
    var lastRowMain = mainSheet.getLastRow();
    var lastColMain = mainSheet.getLastColumn();
    var clients = [];
    if (lastRowMain >= 2 && lastColMain >= 1) {
      clients = mainSheet.getRange(2, 1, lastRowMain - 1, lastColMain).getValues();
    }
    
    // 2. קריאת גליון "דוח לקוחות ללא תיקים"
    var noCasesSheet = ss.getSheetByName("דוח לקוחות ללא תיקים");
    var noCases = [];
    if (noCasesSheet) {
      var lastRowNoCases = noCasesSheet.getLastRow();
      var lastColNoCases = noCasesSheet.getLastColumn();
      if (lastRowNoCases >= 1 && lastColNoCases >= 1) {
        noCases = noCasesSheet.getRange(1, 1, lastRowNoCases, lastColNoCases).getValues();
      }
    }

    // 3. קריאת באגים ופיתוחים מגליון המוצר
    var bugs = [];
    var roadmap = [];
    var prodSheetId = "1Jn8jbwlhukd9jsP8nrLbW8ggtljYVZd_5WYqaZkL5x4";
    try {
      var prodSs = SpreadsheetApp.openById(prodSheetId);
      var bugSheet = prodSs.getSheetByName("Fixes & Bugs");
      if (bugSheet && bugSheet.getLastRow() >= 3) {
        bugs = bugSheet.getRange(3, 1, bugSheet.getLastRow() - 2, 19).getValues();
      }
      var rmSheet = prodSs.getSheetByName("Product Roadmap");
      if (rmSheet && rmSheet.getLastRow() >= 3) {
        roadmap = rmSheet.getRange(3, 1, rmSheet.getLastRow() - 2, 19).getValues();
      }
    } catch (pe) {
      console.warn("Product sheet read skipped in doGet:", pe);
    }
    
    var response = {
      status: "success",
      timestamp: new Date().toISOString(),
      clientsCount: clients.length,
      noCasesCount: noCases.length,
      bugsCount: bugs.length,
      roadmapCount: roadmap.length,
      clients: clients,
      noCases: noCases,
      bugs: bugs,
      roadmap: roadmap
    };
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var updatedClients = 0;
    var updatedNoCases = 0;
    var updatedBugs = 0;
    var updatedRoadmap = 0;

    // 1. עדכון גליון "ראשי"
    if (data.clients && data.clients.length > 0) {
      var sheet = ss.getSheetByName(CFG.MAIN) || ss.getSheetByName("ראשי") || ss.getActiveSheet();
      var rows = data.clients;
      var numCols = rows[0].length;
      sheet.getRange(2, 1, rows.length, numCols).setValues(rows);
      updatedClients = rows.length;
      try { recompute_(sheet); } catch (re) {}
    }

    // 2. עדכון גליון "דוח לקוחות ללא תיקים"
    if (data.noCasesRows && data.noCasesRows.length > 0) {
      var noCasesSheet = ss.getSheetByName("דוח לקוחות ללא תיקים");
      if (!noCasesSheet) {
        noCasesSheet = ss.insertSheet("דוח לקוחות ללא תיקים");
      }
      var ncRows = data.noCasesRows;
      var ncCols = ncRows[0].length;
      noCasesSheet.getRange(1, 1, ncRows.length, ncCols).setValues(ncRows);
      updatedNoCases = ncRows.length;
    }

    // 3. עדכון גליון באגים ופיתוחים
    var prodSheetId = data.productSpreadsheetId || "1Jn8jbwlhukd9jsP8nrLbW8ggtljYVZd_5WYqaZkL5x4";
    try {
      var prodSs = SpreadsheetApp.openById(prodSheetId);
      if (data.bugs && data.bugs.length > 0) {
        var bugSheet = prodSs.getSheetByName("Fixes & Bugs");
        if (bugSheet) {
          bugSheet.getRange(3, 1, data.bugs.length, data.bugs[0].length).setValues(data.bugs);
          updatedBugs = data.bugs.length;
        }
      }
      if (data.roadmap && data.roadmap.length > 0) {
        var rmSheet = prodSs.getSheetByName("Product Roadmap");
        if (rmSheet) {
          rmSheet.getRange(3, 1, data.roadmap.length, data.roadmap[0].length).setValues(data.roadmap);
          updatedRoadmap = data.roadmap.length;
        }
      }
    } catch (pe) {
      console.warn("Product sheet write skipped in doPost:", pe);
    }

    // 4. תיעוד ביומן פעילות הקיים
    try {
      appendLog_([new Date(), "Control Center API", "api@claimai.co.il", "", "", "סנכרון דו-כיווני", "Web App Webhook", "", "", 
        "עודכנו " + updatedClients + " לקוחות, " + updatedNoCases + " ללא תיקים, " + (updatedBugs + updatedRoadmap) + " משימות מוצר"]);
    } catch (le) {
      console.warn("Log write skipped:", le);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "סנכרון דו-כיווני עודכן בהצלחה!",
      timestamp: new Date().toISOString(),
      updatedClients: updatedClients,
      updatedNoCases: updatedNoCases,
      updatedBugs: updatedBugs,
      updatedRoadmap: updatedRoadmap
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
