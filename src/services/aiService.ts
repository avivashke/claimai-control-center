import * as XLSX from 'xlsx';
import { CustomTable, CustomTableColumn, ColumnType, Client } from '../types';

export interface AIAnalysisResult {
  tableName: string;
  description: string;
  columns: CustomTableColumn[];
  rows: Record<string, any>[];
  suggestedCrmSyncCount: number;
}

// Known common translations and types for ClaimAI
const HEBREW_COLUMN_DICTIONARY: Record<string, { label: string; type: ColumnType }> = {
  id: { label: 'מזהה', type: 'string' },
  first_name: { label: 'שם פרטי', type: 'string' },
  firstname: { label: 'שם פרטי', type: 'string' },
  'first name': { label: 'שם פרטי', type: 'string' },
  last_name: { label: 'שם משפחה', type: 'string' },
  lastname: { label: 'שם משפחה', type: 'string' },
  'last name': { label: 'שם משפחה', type: 'string' },
  fullname: { label: 'שם מלא', type: 'string' },
  name: { label: 'שם', type: 'string' },
  email: { label: 'אימייל', type: 'email' },
  mail: { label: 'אימייל', type: 'email' },
  phone: { label: 'טלפון', type: 'phone' },
  company_phone: { label: 'טלפון חברה', type: 'phone' },
  'company phone': { label: 'טלפון חברה', type: 'phone' },
  company: { label: 'שם חברה / עסק', type: 'string' },
  company_name: { label: 'שם חברה / עסק', type: 'string' },
  'company name': { label: 'שם חברה / עסק', type: 'string' },
  case_count: { label: 'כמות תביעות', type: 'number' },
  casecount: { label: 'כמות תביעות', type: 'number' },
  'case count': { label: 'כמות תביעות במערכת', type: 'number' },
  plan: { label: 'מסלול', type: 'badge' },
  role: { label: 'תפקיד', type: 'string' },
  auth_method: { label: 'שיטת התחברות', type: 'string' },
  'auth method': { label: 'שיטת התחברות', type: 'string' },
  quota_used: { label: 'מכסה שנוצלה', type: 'number' },
  'quota used': { label: 'מכסה שנוצלה', type: 'number' },
  plan_quota: { label: 'מכסת מסלול', type: 'number' },
  'plan quota': { label: 'מכסת מסלול', type: 'number' },
  free_trial: { label: 'ניסיון חינם', type: 'badge' },
  'free trial': { label: 'ניסיון חינם', type: 'badge' },
  trial_days_left: { label: 'ימי ניסיון נותרים', type: 'number' },
  'trial days left': { label: 'ימי ניסיון נותרים', type: 'number' },
  created_at: { label: 'תאריך הצטרפות', type: 'date' },
  'created at': { label: 'תאריך הצטרפות', type: 'date' },
  createddate: { label: 'תאריך הצטרפות', type: 'date' },
  status: { label: 'סטטוס', type: 'badge' },
  notes: { label: 'הערות', type: 'string' }
};

// Parse Excel (xlsx, xls, csv) via SheetJS
export const parseExcelFile = async (file: File): Promise<{ headers: string[]; rows: Record<string, any>[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with headers
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        if (rawJson.length === 0) {
          resolve({ headers: [], rows: [] });
          return;
        }

        const headers = Object.keys(rawJson[0]);
        resolve({ headers, rows: rawJson });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

// Parse raw text or pasted JSON / CSV
export const parseRawText = (text: string): { headers: string[]; rows: Record<string, any>[] } => {
  const trimmed = text.trim();
  if (!trimmed) return { headers: [], rows: [] };

  // Try JSON first
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const headers = Object.keys(parsed[0]);
        return { headers, rows: parsed };
      }
    } catch {}
  }

  // Parse as CSV/TSV
  const lines = trimmed.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(',') ? ',' : ';';
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
    const rowObj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
};

// Infer column type from values
const inferColumnType = (key: string, sampleValues: any[]): ColumnType => {
  const lowerKey = key.toLowerCase().replace(/[_\s-]/g, '');
  if (lowerKey.includes('email') || lowerKey.includes('mail')) return 'email';
  if (lowerKey.includes('phone') || lowerKey.includes('tel') || lowerKey.includes('mobile')) return 'phone';
  if (lowerKey.includes('date') || lowerKey.includes('created') || lowerKey.includes('updated')) return 'date';
  if (lowerKey.includes('count') || lowerKey.includes('quota') || lowerKey.includes('days') || lowerKey.includes('num') || lowerKey.includes('claims')) return 'number';
  if (lowerKey.includes('plan') || lowerKey.includes('status') || lowerKey.includes('role') || lowerKey.includes('priority')) return 'badge';

  // Check sample values
  const nonEmpties = sampleValues.filter(v => v !== null && v !== undefined && v !== '');
  if (nonEmpties.length > 0) {
    if (nonEmpties.every(v => !isNaN(Number(v)))) return 'number';
    if (nonEmpties.every(v => typeof v === 'boolean' || v === 'true' || v === 'false' || v === 'כן' || v === 'לא')) return 'boolean';
    if (nonEmpties.some(v => String(v).includes('@'))) return 'email';
  }

  return 'string';
};

// Built-in Smart AI Parser (Works directly in browser without API keys)
export const processWithBuiltinAI = (
  headers: string[],
  rows: Record<string, any>[],
  prompt?: string,
  fileName?: string
): AIAnalysisResult => {
  // 1. Generate columns with Hebrew labels and inferred types
  const columns: CustomTableColumn[] = headers.map(header => {
    const normalizedKey = header.trim();
    const lookupKey = normalizedKey.toLowerCase();
    const dictionaryMatch = HEBREW_COLUMN_DICTIONARY[lookupKey];

    const safeKey = normalizedKey.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() || 'col';
    const sampleValues = rows.slice(0, 10).map(r => r[header]);

    if (dictionaryMatch) {
      return {
        key: safeKey,
        label: dictionaryMatch.label,
        type: dictionaryMatch.type
      };
    }

    return {
      key: safeKey,
      label: normalizedKey,
      type: inferColumnType(normalizedKey, sampleValues)
    };
  });

  // 2. Map row keys to safe keys
  const normalizedRows = rows.map((row, idx) => {
    const newRow: Record<string, any> = { id: row['ID'] || row['id'] || `row-${idx + 1}` };
    headers.forEach((h, colIdx) => {
      const colKey = columns[colIdx].key;
      let val = row[h];
      if (columns[colIdx].type === 'number') {
        const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
        val = isNaN(num) ? 0 : num;
      }
      newRow[colKey] = val;
    });
    return newRow;
  });

  // 3. Generate Table Name and Description
  let tableName = 'טבלת לקוחות חדשה';
  let description = 'נתונים שחולצו ועובדו על ידי מנוע ה-AI';

  const promptLower = (prompt || '').toLowerCase();
  const fileLower = (fileName || '').toLowerCase();

  if (fileLower.includes('users') || promptLower.includes('משתמש') || headers.some(h => h.toLowerCase().includes('case count'))) {
    tableName = 'משתמשי מערכת ופיילוט (Platform Users)';
    description = `ייבוא אוטומטי של ${rows.length} משתמשי פלטפורמת ClaimAI עם נתוני תיקים, ימי ניסיון ומסלולים`;
  } else if (fileLower.includes('client') || promptLower.includes('לקוח') || promptLower.includes('סוכנ')) {
    tableName = 'לקוחות וסוכנויות חדשות';
    description = `טבלה מעובדת עבור ${rows.length} לקוחות וסוכנויות ביטוח`;
  } else if (fileName) {
    const cleanName = fileName.replace(/\.[^/.]+$/, '');
    tableName = `טבלה מעובדת: ${cleanName}`;
    description = `נוצרה על בסיס הקובץ ${fileName} (${rows.length} שורות)`;
  }

  return {
    tableName,
    description,
    columns,
    rows: normalizedRows,
    suggestedCrmSyncCount: rows.filter(r => r['Email'] || r['email'] || r['Phone'] || r['Company Name']).length
  };
};

// Optional: Call Google Gemini API if user configured key
export const processWithGeminiAI = async (
  headers: string[],
  sampleRows: Record<string, any>[],
  apiKey: string,
  userPrompt?: string
): Promise<{ tableName: string; description: string; columns: CustomTableColumn[] }> => {
  const promptText = `
You are an expert AI data architect for ClaimAI, a claims automation platform in Israel.
Analyze these tabular columns and sample rows:
Columns: ${JSON.stringify(headers)}
Sample data (up to 3 rows): ${JSON.stringify(sampleRows.slice(0, 3))}
User Request: ${userPrompt || 'Extract into a clean Hebrew table for CRM/Product control'}

Respond ONLY with valid JSON:
{
  "tableName": "A short, professional Hebrew title for this table",
  "description": "A 1-sentence Hebrew description",
  "columns": [
    {
      "key": "safe_english_camel_key",
      "label": "Hebrew label for this column",
      "type": "string|number|date|email|phone|badge|boolean"
    }
  ]
}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(content);
  } catch (err) {
    console.warn('Gemini API call failed, falling back to built-in AI:', err);
    throw err;
  }
};

// Convert Custom Table Rows to CRM Client Leads
export const convertCustomRowsToCrmLeads = (
  rows: Record<string, any>[],
  columns: CustomTableColumn[],
  existingCrmLength: number
): Client[] => {
  return rows.map((row, idx) => {
    // Find matching fields
    const nameCol = columns.find(c => c.label.includes('שם') && !c.label.includes('חברה'));
    const companyCol = columns.find(c => c.label.includes('חברה') || c.label.includes('עסק'));
    const emailCol = columns.find(c => c.type === 'email');
    const phoneCol = columns.find(c => c.type === 'phone');
    const casesCol = columns.find(c => c.label.includes('תביעות') || c.key.includes('case'));
    const planCol = columns.find(c => c.label.includes('מסלול') || c.key.includes('plan'));

    const name = nameCol ? String(row[nameCol.key] || '') : '';
    const company = companyCol ? String(row[companyCol.key] || '') : (name || 'לקוח מפלטפורמה');
    const email = emailCol ? String(row[emailCol.key] || '') : '';
    const phone = phoneCol ? String(row[phoneCol.key] || '') : '';
    const cases = casesCol ? String(row[casesCol.key] || '') : '';
    const plan = planCol ? String(row[planCol.key] || '') : '';

    return {
      id: `L${existingCrmLength + idx + 1}`,
      name: name || company,
      company: company || name,
      businessType: 'סוכנות ביטוח',
      status: plan.toLowerCase().includes('trial') ? "1'st Follow-Up" : "1'st Lead",
      phone: phone || '',
      email: email || '',
      monthlyClaims: cases ? `${cases} תביעות` : '',
      createdDate: new Date().toISOString().slice(0, 10),
      lastNote: `ייבוא ממשתמשי מערכת ClaimAI (${plan || 'פיילוט'}) | כמות תביעות: ${cases || 0}`,
      requiresAttention: Number(cases) > 0 // If they already opened cases, they are active!
    };
  });
};
