import { Client, ProductItem, Contact, CustomTable, AppUser } from '../types';
import { db, saveMultipleClients } from './db';

// Convert array of objects to standard CSV string with UTF-8 BOM
export const arrayToCSV = (data: Record<string, any>[], explicitHeaders?: string[]): string => {
  if (!data || data.length === 0) return '';
  const headers = explicitHeaders || Object.keys(data[0]);
  
  const headerLine = headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',');
  const rowLines = data.map(item => {
    return headers.map(h => {
      let val = item[h];
      if (val === undefined || val === null) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  return '\uFEFF' + [headerLine, ...rowLines].join('\n');
};

// Trigger browser download of CSV file
export const downloadCSVFile = (csvContent: string, fileName: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Generate Full Combined Database CSV Snapshot
export const generateFullDatabaseCSV = async (): Promise<string> => {
  const [clients, productItems, contacts, customTables, users] = await Promise.all([
    db.clients.toArray(),
    db.productItems.toArray(),
    db.contacts.toArray(),
    db.customTables.toArray(),
    db.users.toArray()
  ]);

  const timestamp = new Date().toISOString();
  let combined = `\uFEFF=== CLAIMAI CONTROL CENTER FULL DATABASE BACKUP CSV SNAPSHOT ===\n`;
  combined += `=== EXPORTED AT: ${timestamp} ===\n\n`;

  combined += `=== TABLE: crm_clients (${clients.length} records) ===\n`;
  combined += arrayToCSV(clients).replace(/^\uFEFF/, '') + '\n\n';

  combined += `=== TABLE: product_items (${productItems.length} records) ===\n`;
  combined += arrayToCSV(productItems).replace(/^\uFEFF/, '') + '\n\n';

  combined += `=== TABLE: contacts (${contacts.length} records) ===\n`;
  combined += arrayToCSV(contacts).replace(/^\uFEFF/, '') + '\n\n';

  combined += `=== TABLE: custom_tables (${customTables.length} records) ===\n`;
  combined += arrayToCSV(customTables).replace(/^\uFEFF/, '') + '\n\n';

  combined += `=== TABLE: users (${users.length} records) ===\n`;
  combined += arrayToCSV(users).replace(/^\uFEFF/, '') + '\n\n';

  // Also save timestamp in localStorage as proof of recent snapshot
  localStorage.setItem('claimai_last_csv_backup', timestamp);
  localStorage.setItem('claimai_csv_clients_count', String(clients.length));

  return combined;
};

// Download Full Database CSV
export const downloadFullDatabaseCSV = async () => {
  const dateStr = new Date().toISOString().slice(0, 10);
  const csv = await generateFullDatabaseCSV();
  downloadCSVFile(csv, `claimai_full_database_backup_${dateStr}.csv`);
};

// Parse CSV content into object array
export const parseCSVString = (csvText: string): Record<string, any>[] => {
  const clean = csvText.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];

  const lines = clean.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV line splitter respecting quoted commas
    const rowValues: string[] = [];
    let insideQuotes = false;
    let currentVal = '';

    for (let charIndex = 0; charIndex < lines[i].length; charIndex++) {
      const c = lines[i][charIndex];
      if (c === '"') {
        if (insideQuotes && lines[i][charIndex + 1] === '"') {
          currentVal += '"';
          charIndex++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (c === ',' && !insideQuotes) {
        rowValues.push(currentVal);
        currentVal = '';
      } else {
        currentVal += c;
      }
    }
    rowValues.push(currentVal);

    const obj: Record<string, any> = {};
    headers.forEach((h, colIdx) => {
      let val = rowValues[colIdx] ? rowValues[colIdx].trim() : '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      obj[h] = val;
    });
    rows.push(obj);
  }

  return rows;
};

// Emergency fallback loader from static /backup_csv/ files
export const restoreFromInternalStaticCSV = async (): Promise<{
  clientsRestored: number;
  productsRestored: number;
}> => {
  try {
    const clientsRes = await fetch('/backup_csv/crm_clients.csv');
    let clientsRestored = 0;
    if (clientsRes.ok) {
      const text = await clientsRes.text();
      const parsedClients = parseCSVString(text) as Client[];
      if (parsedClients.length > 0) {
        await db.clients.clear();
        await db.clients.bulkAdd(parsedClients);
        clientsRestored = parsedClients.length;
      }
    }

    const prodRes = await fetch('/backup_csv/product_items.csv');
    let productsRestored = 0;
    if (prodRes.ok) {
      const text = await prodRes.text();
      const parsedProds = parseCSVString(text) as ProductItem[];
      if (parsedProds.length > 0) {
        await db.productItems.clear();
        await db.productItems.bulkAdd(parsedProds);
        productsRestored = parsedProds.length;
      }
    }

    return { clientsRestored, productsRestored };
  } catch (err) {
    console.error('Failed to restore from static CSV:', err);
    throw err;
  }
};
