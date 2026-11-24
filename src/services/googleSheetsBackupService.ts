import { Client, ProductItem } from '../types';
import { db } from './db';

export const CRM_SPREADSHEET_ID = '16qi8qhHFtlaoxgtda2fvv9bd3WmGU168-RlEwtfP8NM';
export const CRM_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${CRM_SPREADSHEET_ID}/edit?usp=drivesdk`;

export const PRODUCT_SPREADSHEET_ID = '1Jn8jbwlhukd9jsP8nrLbW8ggtljYVZd_5WYqaZkL5x4';
export const PRODUCT_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${PRODUCT_SPREADSHEET_ID}/edit?usp=drivesdk`;

const WEBHOOK_STORAGE_KEY = 'claimai_google_sheets_webhook_url';
const LAST_SYNC_STORAGE_KEY = 'claimai_last_sheets_sync';

export const getSheetsWebhookUrl = (): string => {
  return localStorage.getItem(WEBHOOK_STORAGE_KEY) || (import.meta as any).env?.VITE_GOOGLE_SHEETS_WEBHOOK_URL || '';
};

export const setSheetsWebhookUrl = (url: string) => {
  localStorage.setItem(WEBHOOK_STORAGE_KEY, url.trim());
};

export const getLastSheetsSyncTime = (): string | null => {
  return localStorage.getItem(LAST_SYNC_STORAGE_KEY);
};

// Exact column headers matching Claimai_CRM spreadsheet
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

// Map a Client object to exact array matching Claimai_CRM row
export const mapClientToCrmSheetRow = (c: Client): string[] => {
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
    '', // ימים ממגע
    c.statusSince || '',
    '', // ימים בסטטוס
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

// Sync payload to Webhook (Google Apps Script)
export const syncToGoogleSheetsWebhook = async (customUrl?: string): Promise<{ success: boolean; message: string }> => {
  const webhookUrl = customUrl || getSheetsWebhookUrl();
  if (!webhookUrl) {
    return {
      success: false,
      message: 'לא הוגדר URL של Webhook עבור Google Sheets. הזן את כתובת ה-Apps Script בהגדרות.'
    };
  }

  try {
    const [clients, productItems] = await Promise.all([
      db.clients.toArray(),
      db.productItems.toArray()
    ]);

    const payload = {
      action: 'full_backup',
      timestamp: new Date().toISOString(),
      crmSpreadsheetId: CRM_SPREADSHEET_ID,
      productSpreadsheetId: PRODUCT_SPREADSHEET_ID,
      clientsCount: clients.length,
      productCount: productItems.length,
      clients: clients.map(mapClientToCrmSheetRow),
      productItems
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // Text/plain avoids CORS preflight blocks in Google Apps Script
      },
      body: JSON.stringify(payload)
    });

    const now = new Date().toISOString();
    localStorage.setItem(LAST_SYNC_STORAGE_KEY, now);

    return {
      success: true,
      message: `הסנכרון לגוגל שיטס נשלח בהצלחה (${clients.length} לקוחות ו-${productItems.length} משימות)!`
    };
  } catch (err: any) {
    console.error('Google Sheets sync error:', err);
    return {
      success: false,
      message: `שגיאה בשליחת הסנכרון לגוגל שיטס: ${err.message || err}`
    };
  }
};

// Background debounced auto-sync
let autoSyncTimer: any = null;
export const triggerGoogleSheetsAutoSync = (delayMs: number = 5000) => {
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

// Google Apps Script template code
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ClaimAI Control Center - Google Sheets Live Backup Webhook
 * הוסף סקריפט זה ב-Extensions > Apps Script בגליון Google Sheets שלך
 * ופרוס כ-Web App (Deploy > New Deployment > Web app > Anyone has access).
 */
function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. גיבוי לקוחות CRM
    if (data.clients && data.clients.length > 0) {
      var sheet = ss.getSheetByName("ראשי") || ss.getSheetByName("לקוחות") || ss.getActiveSheet();
      
      // כתיבת שורות הלקוחות (החל משורה 2)
      var rows = data.clients;
      if (rows.length > 0) {
        var numCols = rows[0].length;
        sheet.getRange(2, 1, rows.length, numCols).setValues(rows);
      }
    }

    // תיעוד חותמת זמן של הגיבוי האחרון
    var logSheet = ss.getSheetByName("יומן_גיבויים");
    if (!logSheet) {
      logSheet = ss.insertSheet("יומן_גיבויים");
      logSheet.appendRow(["תאריך ושעה", "פעולה", "כמות לקוחות", "כמות משימות"]);
    }
    logSheet.appendRow([new Date(), data.action || "backup", data.clientsCount || 0, data.productCount || 0]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "גיבוי הושלם בהצלחה!",
      timestamp: new Date().toISOString(),
      updatedRows: data.clients ? data.clients.length : 0
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
