const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(PROJECT_ROOT, 'claimai-local.sqlite');
const SEED_DIR = path.join(PROJECT_ROOT, 'src', 'data');

// ========================================================
// SQLite via node:sqlite (built into Node 24, no compilation)
// ========================================================
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY, name TEXT, company TEXT, businessType TEXT, status TEXT, subStatus TEXT,
    assignedTo TEXT, "group" TEXT, temperature TEXT, priority TEXT, requiresAttention INTEGER DEFAULT 0,
    phone TEXT, email TEXT, teamContacts TEXT, itContact TEXT, location TEXT, source TEXT,
    monthlyClaims TEXT, createdDate TEXT, nextFollowUpDate TEXT, lastContactDate TEXT, statusSince TEXT,
    lastNote TEXT, generalNotes TEXT, contactType TEXT, updatedBy TEXT, updatedDate TEXT
  );
  CREATE TABLE IF NOT EXISTS productItems (
    id TEXT PRIMARY KEY, category TEXT, client TEXT, type TEXT, module TEXT, title TEXT,
    description TEXT, priority TEXT, status TEXT, owner TEXT, reportedBy TEXT, source TEXT,
    release TEXT, openedDate TEXT, targetDate TEXT, completedDate TEXT, daysOpen INTEGER DEFAULT 0,
    health TEXT, notes TEXT
  );
  CREATE TABLE IF NOT EXISTS customTables (
    id TEXT PRIMARY KEY, name TEXT, description TEXT, category TEXT, columns TEXT, rows TEXT,
    createdAt TEXT, updatedAt TEXT
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT, name TEXT, role TEXT, permissions TEXT, isActive INTEGER DEFAULT 1,
    createdAt TEXT, lastLogin TEXT, assignedClients TEXT
  );
  CREATE TABLE IF NOT EXISTS auth_codes (
    id TEXT PRIMARY KEY, phone TEXT, email TEXT, code TEXT, type TEXT, createdAt INTEGER, expiresAt INTEGER
  );
`);

function toBool(v) { return v === 1 || v === true || v === 'true'; }

function readSeed(filename) {
  try { return JSON.parse(fs.readFileSync(path.join(SEED_DIR, filename), 'utf8')); } catch (e) { return []; }
}

function seedIfEmpty() {
  const count = (table) => db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get({}).c;
  if (count('clients') === 0) {
    const clients = readSeed('seedClients.json');
    const stmt = db.prepare(`INSERT OR IGNORE INTO clients (
      id, name, company, businessType, status, subStatus, assignedTo, "group", temperature, priority,
      requiresAttention, phone, email, teamContacts, itContact, location, source, monthlyClaims,
      createdDate, nextFollowUpDate, lastContactDate, statusSince, lastNote, generalNotes, contactType, updatedBy, updatedDate
    ) VALUES (
      @id, @name, @company, @businessType, @status, @subStatus, @assignedTo, @group, @temperature, @priority,
      @requiresAttention, @phone, @email, @teamContacts, @itContact, @location, @source, @monthlyClaims,
      @createdDate, @nextFollowUpDate, @lastContactDate, @statusSince, @lastNote, @generalNotes, @contactType, @updatedBy, @updatedDate
    )`);
    clients.forEach(r => stmt.run({
      id: r.id, name: r.name, company: r.company, businessType: r.businessType, status: r.status,
      subStatus: r.subStatus, assignedTo: r.assignedTo, group: r.group || '',
      temperature: r.temperature, priority: r.priority,
      requiresAttention: r.requiresAttention ? 1 : 0,
      phone: r.phone, email: r.email, teamContacts: r.teamContacts, itContact: r.itContact,
      location: r.location, source: r.source, monthlyClaims: r.monthlyClaims,
      createdDate: r.createdDate, nextFollowUpDate: r.nextFollowUpDate,
      lastContactDate: r.lastContactDate, statusSince: r.statusSince,
      lastNote: r.lastNote, generalNotes: r.generalNotes, contactType: r.contactType,
      updatedBy: r.updatedBy, updatedDate: r.updatedDate
    }));
    console.log(`Seeded ${clients.length} clients into SQLite`);
  }
  if (count('productItems') === 0) {
    const items = readSeed('seedProductItems.json');
    const stmt = db.prepare(`INSERT OR IGNORE INTO productItems (
      id, category, client, type, module, title, description, priority, status, owner, reportedBy,
      source, release, openedDate, targetDate, completedDate, daysOpen, health, notes
    ) VALUES (
      @id, @category, @client, @type, @module, @title, @description, @priority, @status, @owner, @reportedBy,
      @source, @release, @openedDate, @targetDate, @completedDate, @daysOpen, @health, @notes
    )`);
    items.forEach(r => stmt.run({
      id: r.id, category: r.category, client: r.client, type: r.type, module: r.module,
      title: r.title, description: r.description, priority: r.priority, status: r.status,
      owner: r.owner, reportedBy: r.reportedBy, source: r.source, release: r.release,
      openedDate: r.openedDate, targetDate: r.targetDate, completedDate: r.completedDate || null,
      daysOpen: r.daysOpen || 0, health: r.health || '', notes: r.notes || ''
    }));
    console.log(`Seeded ${items.length} product items into SQLite`);
  }
  if (count('customTables') === 0) {
    const tables = readSeed('seedCustomTables.json');
    const stmt = db.prepare(`INSERT OR IGNORE INTO customTables (
      id, name, description, category, columns, rows, createdAt, updatedAt
    ) VALUES (
      @id, @name, @description, @category, @columns, @rows, @createdAt, @updatedAt
    )`);
    tables.forEach(r => stmt.run({
      id: r.id, name: r.name, description: r.description, category: r.category,
      columns: JSON.stringify(r.columns || []), rows: JSON.stringify(r.rows || []),
      createdAt: r.createdAt, updatedAt: r.updatedAt
    }));
    console.log(`Seeded ${tables.length} custom tables into SQLite`);
  }
  if (count('users') === 0) {
    const users = readSeed('seedUsers.json');
    const stmt = db.prepare(`INSERT OR IGNORE INTO users (
      id, email, name, role, permissions, isActive, createdAt, lastLogin, assignedClients
    ) VALUES (
      @id, @email, @name, @role, @permissions, @isActive, @createdAt, @lastLogin, @assignedClients
    )`);
    users.forEach(r => stmt.run({
      id: r.id, email: r.email, name: r.name, role: r.role,
      permissions: JSON.stringify(r.permissions || {}), isActive: r.isActive ? 1 : 0,
      createdAt: r.createdAt, lastLogin: r.lastLogin || null,
      assignedClients: r.assignedClients ? JSON.stringify(r.assignedClients) : ''
    }));
    console.log(`Seeded ${users.length} users into SQLite`);
  }
}

seedIfEmpty();

// ========================================================
// WhatsApp client (sends verification codes from user's number)
// ========================================================
let whatsappClient = null;
let whatsappReady = false;
let whatsappQr = null;

function initWhatsApp() {
  whatsappClient = new Client({
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  whatsappClient.on('qr', (qr) => {
    whatsappQr = qr;
    console.log('\n=== WHATSAPP QR CODE ===');
    qrcode.generate(qr, { small: true });
    console.log('Scan this QR code with WhatsApp on your phone (+972586735953)\n');
  });

  whatsappClient.on('ready', () => {
    whatsappReady = true;
    whatsappQr = null;
    console.log('WhatsApp client is ready. Sending from authenticated number.');
  });

  whatsappClient.on('auth_failure', (msg) => {
    console.error('WhatsApp auth failure:', msg);
  });

  whatsappClient.on('disconnected', (reason) => {
    whatsappReady = false;
    console.log('WhatsApp client disconnected:', reason);
  });

  whatsappClient.initialize();
}

const WHATSAPP_SENDER_PHONE = '+972586735953';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function storeAuthCodeDb(identifier, code, type, phone = null, email = null) {
  const now = Date.now();
  const id = `code-${identifier}-${type}-${now}`;
  db.prepare(`DELETE FROM auth_codes WHERE (phone = @id OR email = @id) AND type = @type`).run({ id: identifier, type });
  db.prepare(`INSERT INTO auth_codes (id, phone, email, code, type, createdAt, expiresAt) VALUES (@id, @phone, @email, @code, @type, @createdAt, @expiresAt)`)
    .run({ id, phone: phone || null, email: email || null, code, type, createdAt: now, expiresAt: now + CODE_TTL_MS });
}

function verifyAuthCodeDb(identifier, code, type) {
  const now = Date.now();
  const row = db.prepare(
    `SELECT * FROM auth_codes WHERE (phone = @id OR email = @id) AND code = @code AND type = @type AND expiresAt > @now`
  ).get({ id: identifier, code, type, now });
  if (!row) return false;
  // Consume the code
  db.prepare(`DELETE FROM auth_codes WHERE (phone = @id OR email = @id) AND code = @code AND type = @type`)
    .run({ id: identifier, code, type });
  return true;
}

async function sendWhatsAppMessage(toPhone, text) {
  if (!whatsappReady || !whatsappClient) {
    throw new Error('WhatsApp client not ready. Scan QR code first.');
  }
  const cleaned = toPhone.replace(/\D/g, '');
  const chatId = `${cleaned}@c.us`;
  await whatsappClient.sendMessage(chatId, text);
}

// ========================================================
// Email transporter (nodemailer)
// ========================================================
let emailTransporter = null;

function initEmailTransporter() {
  const host = process.env.SMTP_HOST || '';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.SMTP_FROM || 'ClaimAI Control Center <noreply@claimai.com>';

  if (host && user && pass) {
    emailTransporter = nodemailer.createTransport({
      host, port, secure: port === 465, auth: { user, pass }
    });
    console.log('Email transporter configured via SMTP');
  } else {
    nodemailer.createTestAccount().then(acc => {
      emailTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email', port: 587, secure: false,
        auth: { user: acc.user, pass: acc.pass }
      });
      console.log('Email transporter using Ethereal test account (dev mode).');
      console.log(`Ethereal SMTP user: ${acc.user}, pass: ${acc.pass}`);
    }).catch(err => {
      console.warn('Failed to create Ethereal test account:', err.message);
    });
  }
}

async function sendEmailCode(toEmail, code, type) {
  if (!emailTransporter) {
    throw new Error('Email transporter not initialized');
  }
  const from = process.env.SMTP_FROM || 'ClaimAI Control Center <noreply@claimai.com>';
  const subject = type === 'reset' ? 'קוד איפוס סיסמה - ClaimAI' : 'קוד אימות כניסה - ClaimAI';
  const text = `קוד האימות שלך ל-ClaimAI: ${code}\nהקוד תקף ל-10 דקות.`;
  const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background: #0b0f19; color: #f1f5f9; padding: 24px; border-radius: 12px;">
      <h2 style="color: #3b82f6; margin-bottom: 16px;">ClaimAI - קוד אימות</h2>
      <p style="font-size: 16px; margin-bottom: 20px;">קוד האימות שלך הוא:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; background: #1e293b; padding: 16px; border-radius: 8px; display: inline-block; margin-bottom: 20px;">
        ${code}
      </div>
      <p style="font-size: 14px; color: #94a3b8;">הקוד תקף ל־10 דקות.</p>
      <p style="font-size: 12px; color: #64748b;">אם לא בקשת קוד זה, ניתן להתעלם מהודעה זו.</p>
    </div>
  `;
  const info = await emailTransporter.sendMail({ from, to: toEmail, subject, text, html });
  console.log(`Email sent: ${info.messageId}`);
  return info;
}

function mapClientRow(r) {
  return {
    id: r.id, name: r.name, company: r.company, businessType: r.businessType, status: r.status,
    subStatus: r.subStatus, assignedTo: r.assignedTo, group: r.group, temperature: r.temperature,
    priority: r.priority, requiresAttention: toBool(r.requiresAttention), phone: r.phone,
    email: r.email, teamContacts: r.teamContacts, itContact: r.itContact, location: r.location,
    source: r.source, monthlyClaims: r.monthlyClaims, createdDate: r.createdDate,
    nextFollowUpDate: r.nextFollowUpDate, lastContactDate: r.lastContactDate, statusSince: r.statusSince,
    lastNote: r.lastNote, generalNotes: r.generalNotes, contactType: r.contactType,
    updatedBy: r.updatedBy, updatedDate: r.updatedDate
  };
}

// ========================================================
// Health
// ========================================================
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'claimai-sqlite-server', db: DB_PATH, whatsappReady });
});

app.get('/api/whatsapp/qr', (_req, res) => {
  res.json({ qr: whatsappQr, ready: whatsappReady });
});

// ========================================================
// Auth code endpoints
// ========================================================
app.post('/api/auth/send-code', async (req, res) => {
  const { phone, code, type } = req.body;
  if (!phone || !code || !type) {
    return res.status(400).json({ success: false, message: 'חסרים פרמטרים: phone, code, type' });
  }
  try {
    storeAuthCodeDb(phone, code, type, phone, null);
    const message = `קוד אימות ClaimAI: ${code}\nהקוד תקף ל-10 דקות.`;
    try {
      await sendWhatsAppMessage(phone, message);
      res.json({ success: true, message: `קוד אימות נשלח בוואטסאפ ל-${phone}` });
    } catch (err) {
      res.json({ success: true, code, message: `הוואטסאפ לא זמין כרגע. הקוד הוא: ${code} (שמור לשימוש ידני). שגיאה: ${err.message}` });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/send-email-code', async (req, res) => {
  const { email, code, type } = req.body;
  if (!email || !code || !type) {
    return res.status(400).json({ success: false, message: 'חסרים פרמטרים: email, code, type' });
  }
  try {
    storeAuthCodeDb(email, code, type, null, email);
    try {
      await sendEmailCode(email, code, type);
      res.json({ success: true, message: `קוד אימות נשלח באימייל ל-${email}` });
    } catch (err) {
      res.json({ success: true, code, message: `שליחת האימייל נכשלה. הקוד הוא: ${code} (שמור לשימוש ידני). שגיאה: ${err.message}` });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/verify-code', (req, res) => {
  const { phone, email, code, type } = req.body;
  const identifier = phone || email;
  if (!identifier || !code || !type) {
    return res.status(400).json({ success: false, message: 'חסרים פרמטרים: phone/email, code, type' });
  }
  const ok = verifyAuthCodeDb(identifier, code, type);
  res.json({ success: ok, message: ok ? 'הקוד תקף' : 'הקוד שגוי או פג תוקפו' });
});

// ========================================================
// Clients
// ========================================================
app.get('/api/clients', (_req, res) => {
  const rows = db.prepare('SELECT * FROM clients ORDER BY createdDate DESC').all();
  res.json(rows.map(mapClientRow));
});

app.put('/api/clients/:id', (req, res) => {
  const c = req.body;
  const now = new Date().toISOString().slice(0, 10);
  const stmt = db.prepare(`INSERT INTO clients (
    id, name, company, businessType, status, subStatus, assignedTo, "group", temperature, priority,
    requiresAttention, phone, email, teamContacts, itContact, location, source, monthlyClaims,
    createdDate, nextFollowUpDate, lastContactDate, statusSince, lastNote, generalNotes, contactType, updatedBy, updatedDate
  ) VALUES (
    @id, @name, @company, @businessType, @status, @subStatus, @assignedTo, @group, @temperature, @priority,
    @requiresAttention, @phone, @email, @teamContacts, @itContact, @location, @source, @monthlyClaims,
    @createdDate, @nextFollowUpDate, @lastContactDate, @statusSince, @lastNote, @generalNotes, @contactType, @updatedBy, @updatedDate
  )
  ON CONFLICT(id) DO UPDATE SET
    name=@name, company=@company, businessType=@businessType, status=@status,
    subStatus=@subStatus, assignedTo=@assignedTo, "group"=@group, temperature=@temperature,
    priority=@priority, requiresAttention=@requiresAttention, phone=@phone,
    email=@email, teamContacts=@teamContacts, itContact=@itContact,
    location=@location, source=@source, monthlyClaims=@monthlyClaims,
    nextFollowUpDate=@nextFollowUpDate, lastContactDate=@lastContactDate,
    statusSince=@statusSince, lastNote=@lastNote, generalNotes=@generalNotes,
    contactType=@contactType, updatedBy=@updatedBy, updatedDate=@updatedDate`);
  stmt.run({
    ...c, id: req.params.id, requiresAttention: c.requiresAttention ? 1 : 0, updatedDate: c.updatedDate || now
  });
  res.json({ ok: true });
});

app.delete('/api/clients/:id', (req, res) => {
  db.prepare('DELETE FROM clients WHERE id = @id').run({ id: req.params.id });
  res.json({ ok: true });
});

// ========================================================
// Product Items
// ========================================================
app.get('/api/product-items', (_req, res) => {
  const rows = db.prepare('SELECT * FROM productItems ORDER BY openedDate DESC').all();
  res.json(rows.map(r => ({ ...r, completedDate: r.completedDate || undefined, notes: r.notes || undefined })));
});

app.put('/api/product-items/:id', (req, res) => {
  const t = req.body;
  const stmt = db.prepare(`INSERT INTO productItems (
    id, category, client, type, module, title, description, priority, status, owner, reportedBy,
    source, release, openedDate, targetDate, completedDate, daysOpen, health, notes
  ) VALUES (
    @id, @category, @client, @type, @module, @title, @description, @priority, @status, @owner, @reportedBy,
    @source, @release, @openedDate, @targetDate, @completedDate, @daysOpen, @health, @notes
  )
  ON CONFLICT(id) DO UPDATE SET
    category=@category, client=@client, type=@type, module=@module,
    title=@title, description=@description, priority=@priority, status=@status,
    owner=@owner, reportedBy=@reportedBy, source=@source, release=@release,
    openedDate=@openedDate, targetDate=@targetDate, completedDate=@completedDate,
    daysOpen=@daysOpen, health=@health, notes=@notes`);
  stmt.run({
    id: req.params.id, ...t, completedDate: t.completedDate || null, notes: t.notes || ''
  });
  res.json({ ok: true });
});

// ========================================================
// Custom Tables
// ========================================================
app.get('/api/custom-tables', (_req, res) => {
  const rows = db.prepare('SELECT * FROM customTables ORDER BY createdAt DESC').all();
  res.json(rows.map(r => ({ ...r, columns: JSON.parse(r.columns || '[]'), rows: JSON.parse(r.rows || '[]') })));
});

app.put('/api/custom-tables/:id', (req, res) => {
  const t = req.body;
  const stmt = db.prepare(`INSERT INTO customTables (
    id, name, description, category, columns, rows, createdAt, updatedAt
  ) VALUES (
    @id, @name, @description, @category, @columns, @rows, @createdAt, @updatedAt
  )
  ON CONFLICT(id) DO UPDATE SET
    name=@name, description=@description, category=@category,
    columns=@columns, rows=@rows, updatedAt=@updatedAt`);
  stmt.run({
    id: req.params.id, ...t,
    columns: JSON.stringify(t.columns || []), rows: JSON.stringify(t.rows || []),
    updatedAt: new Date().toISOString()
  });
  res.json({ ok: true });
});

app.delete('/api/custom-tables/:id', (req, res) => {
  db.prepare('DELETE FROM customTables WHERE id = @id').run({ id: req.params.id });
  res.json({ ok: true });
});

// ========================================================
// Users
// ========================================================
app.get('/api/users', (_req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY createdAt DESC').all();
  res.json(rows.map(r => ({
    ...r, permissions: JSON.parse(r.permissions || '{}'),
    isActive: toBool(r.isActive),
    assignedClients: r.assignedClients ? JSON.parse(r.assignedClients) : undefined
  })));
});

app.put('/api/users/:id', (req, res) => {
  const u = req.body;
  const stmt = db.prepare(`INSERT INTO users (
    id, email, name, role, permissions, isActive, createdAt, lastLogin, assignedClients
  ) VALUES (
    @id, @email, @name, @role, @permissions, @isActive, @createdAt, @lastLogin, @assignedClients
  )
  ON CONFLICT(id) DO UPDATE SET
    email=@email, name=@name, role=@role, permissions=@permissions,
    isActive=@isActive, lastLogin=@lastLogin, assignedClients=@assignedClients`);
  stmt.run({
    id: req.params.id, ...u,
    permissions: JSON.stringify(u.permissions || {}),
    isActive: u.isActive ? 1 : 0,
    assignedClients: u.assignedClients ? JSON.stringify(u.assignedClients) : ''
  });
  res.json({ ok: true });
});

app.delete('/api/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = @id').run({ id: req.params.id });
  res.json({ ok: true });
});

// ========================================================
// Seed / reset
// ========================================================
app.post('/api/reset', (_req, res) => {
  db.exec('DELETE FROM clients; DELETE FROM productItems; DELETE FROM customTables; DELETE FROM users; DELETE FROM auth_codes;');
  seedIfEmpty();
  res.json({ ok: true, message: 'Resetted to seed data' });
});

// ========================================================
// Start
// ========================================================
initWhatsApp();
initEmailTransporter();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ClaimAI SQLite server listening on http://0.0.0.0:${PORT}`);
  console.log(`SQLite database file: ${DB_PATH}`);
});
