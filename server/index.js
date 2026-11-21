const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Resolve paths relative to the project root (parent of server/)
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(PROJECT_ROOT, 'claimai-local.sqlite');

// Open SQLite DB (create if missing)
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Seed data path (client source of truth JSON files)
const SEED_DIR = path.join(PROJECT_ROOT, 'src', 'data');

function readSeed(filename) {
  try {
    return JSON.parse(fs.readFileSync(path.join(SEED_DIR, filename), 'utf8'));
  } catch (e) {
    console.warn(`Could not load seed ${filename}:`, e.message);
    return [];
  }
}

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT,
    company TEXT,
    businessType TEXT,
    status TEXT,
    subStatus TEXT,
    assignedTo TEXT,
    group TEXT,
    temperature TEXT,
    priority TEXT,
    requiresAttention INTEGER DEFAULT 0,
    phone TEXT,
    email TEXT,
    teamContacts TEXT,
    itContact TEXT,
    location TEXT,
    source TEXT,
    monthlyClaims TEXT,
    createdDate TEXT,
    nextFollowUpDate TEXT,
    lastContactDate TEXT,
    statusSince TEXT,
    lastNote TEXT,
    generalNotes TEXT,
    contactType TEXT,
    updatedBy TEXT,
    updatedDate TEXT
  );

  CREATE TABLE IF NOT EXISTS productItems (
    id TEXT PRIMARY KEY,
    category TEXT,
    client TEXT,
    type TEXT,
    module TEXT,
    title TEXT,
    description TEXT,
    priority TEXT,
    status TEXT,
    owner TEXT,
    reportedBy TEXT,
    source TEXT,
    release TEXT,
    openedDate TEXT,
    targetDate TEXT,
    completedDate TEXT,
    daysOpen INTEGER DEFAULT 0,
    health TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS customTables (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    category TEXT,
    columns TEXT,
    rows TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    role TEXT,
    permissions TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT,
    lastLogin TEXT,
    assignedClients TEXT
  );
`);

// Seed if empty
function count(table) {
  const row = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get();
  return row.c;
}

function seedIfEmpty() {
  if (count('clients') === 0) {
    const clients = readSeed('seedClients.json');
    const insert = db.prepare(`INSERT OR IGNORE INTO clients (
      id, name, company, businessType, status, subStatus, assignedTo, "group", temperature, priority,
      requiresAttention, phone, email, teamContacts, itContact, location, source, monthlyClaims,
      createdDate, nextFollowUpDate, lastContactDate, statusSince, lastNote, generalNotes, contactType, updatedBy, updatedDate
    ) VALUES (
      @id, @name, @company, @businessType, @status, @subStatus, @assignedTo, @group, @temperature, @priority,
      @requiresAttention, @phone, @email, @teamContacts, @itContact, @location, @source, @monthlyClaims,
      @createdDate, @nextFollowUpDate, @lastContactDate, @statusSince, @lastNote, @generalNotes, @contactType, @updatedBy, @updatedDate
    )`);
    const tx = db.transaction((rows) => rows.forEach(r => insert.run({
      ...r,
      group: r.group || '',
      requiresAttention: r.requiresAttention ? 1 : 0
    })));
    tx(clients);
    console.log(`Seeded ${clients.length} clients into SQLite`);
  }
  if (count('productItems') === 0) {
    const items = readSeed('seedProductItems.json');
    const insert = db.prepare(`INSERT OR IGNORE INTO productItems (
      id, category, client, type, module, title, description, priority, status, owner, reportedBy,
      source, release, openedDate, targetDate, completedDate, daysOpen, health, notes
    ) VALUES (
      @id, @category, @client, @type, @module, @title, @description, @priority, @status, @owner, @reportedBy,
      @source, @release, @openedDate, @targetDate, @completedDate, @daysOpen, @health, @notes
    )`);
    const tx = db.transaction((rows) => rows.forEach(r => insert.run({
      id: r.id, category: r.category, client: r.client, type: r.type, module: r.module,
      title: r.title, description: r.description, priority: r.priority, status: r.status,
      owner: r.owner, reportedBy: r.reportedBy, source: r.source, release: r.release,
      openedDate: r.openedDate, targetDate: r.targetDate, completedDate: r.completedDate || null,
      daysOpen: r.daysOpen || 0, health: r.health || '', notes: r.notes || ''
    })));
    tx(items);
    console.log(`Seeded ${items.length} product items into SQLite`);
  }
  if (count('customTables') === 0) {
    const tables = readSeed('seedCustomTables.json');
    const insert = db.prepare(`INSERT OR IGNORE INTO customTables (
      id, name, description, category, columns, rows, createdAt, updatedAt
    ) VALUES (@id, @name, @description, @category, @columns, @rows, @createdAt, @updatedAt)`);
    const tx = db.transaction((rows) => rows.forEach(r => insert.run({
      ...r,
      columns: JSON.stringify(r.columns || []),
      rows: JSON.stringify(r.rows || [])
    })));
    tx(tables);
    console.log(`Seeded ${tables.length} custom tables into SQLite`);
  }
  if (count('users') === 0) {
    const users = readSeed('seedUsers.json');
    const insert = db.prepare(`INSERT OR IGNORE INTO users (
      id, email, name, role, permissions, isActive, createdAt, lastLogin, assignedClients
    ) VALUES (@id, @email, @name, @role, @permissions, @isActive, @createdAt, @lastLogin, @assignedClients)`);
    const tx = db.transaction((rows) => rows.forEach(r => insert.run({
      ...r,
      permissions: JSON.stringify(r.permissions || {}),
      isActive: r.isActive ? 1 : 0,
      assignedClients: r.assignedClients ? JSON.stringify(r.assignedClients) : ''
    })));
    tx(users);
    console.log(`Seeded ${users.length} users into SQLite`);
  }
}

seedIfEmpty();

// ---------- Helpers ----------
const toBool = (v) => v === 1 || v === true || v === 'true';

function mapClientRow(r) {
  return {
    id: r.id,
    name: r.name,
    company: r.company,
    businessType: r.businessType,
    status: r.status,
    subStatus: r.subStatus,
    assignedTo: r.assignedTo,
    group: r.group,
    temperature: r.temperature,
    priority: r.priority,
    requiresAttention: toBool(r.requiresAttention),
    phone: r.phone,
    email: r.email,
    teamContacts: r.teamContacts,
    itContact: r.itContact,
    location: r.location,
    source: r.source,
    monthlyClaims: r.monthlyClaims,
    createdDate: r.createdDate,
    nextFollowUpDate: r.nextFollowUpDate,
    lastContactDate: r.lastContactDate,
    statusSince: r.statusSince,
    lastNote: r.lastNote,
    generalNotes: r.generalNotes,
    contactType: r.contactType,
    updatedBy: r.updatedBy,
    updatedDate: r.updatedDate
  };
}

// ---------- Clients ----------
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'claimai-sqlite-server', db: DB_PATH });
});

app.get('/api/clients', (_req, res) => {
  const rows = db.prepare('SELECT * FROM clients ORDER BY createdDate DESC').all();
  res.json(rows.map(mapClientRow));
});

app.put('/api/clients/:id', (req, res) => {
  const c = req.body;
  const now = new Date().toISOString().slice(0, 10);
  const upsert = db.prepare(`INSERT INTO clients (
    id, name, company, businessType, status, subStatus, assignedTo, "group", temperature, priority,
    requiresAttention, phone, email, teamContacts, itContact, location, source, monthlyClaims,
    createdDate, nextFollowUpDate, lastContactDate, statusSince, lastNote, generalNotes, contactType, updatedBy, updatedDate
  ) VALUES (
    @id, @name, @company, @businessType, @status, @subStatus, @assignedTo, @group, @temperature, @priority,
    @requiresAttention, @phone, @email, @teamContacts, @itContact, @location, @source, @monthlyClaims,
    @createdDate, @nextFollowUpDate, @lastContactDate, @statusSince, @lastNote, @generalNotes, @contactType, @updatedBy, @updatedDate
  )
  ON CONFLICT(id) DO UPDATE SET
    name=excluded.name, company=excluded.company, businessType=excluded.businessType, status=excluded.status,
    subStatus=excluded.subStatus, assignedTo=excluded.assignedTo, "group"=excluded."group", temperature=excluded.temperature,
    priority=excluded.priority, requiresAttention=excluded.requiresAttention, phone=excluded.phone,
    email=excluded.email, teamContacts=excluded.teamContacts, itContact=excluded.itContact,
    location=excluded.location, source=excluded.source, monthlyClaims=excluded.monthlyClaims,
    nextFollowUpDate=excluded.nextFollowUpDate, lastContactDate=excluded.lastContactDate,
    statusSince=excluded.statusSince, lastNote=excluded.lastNote, generalNotes=excluded.generalNotes,
    contactType=excluded.contactType, updatedBy=excluded.updatedBy, updatedDate=excluded.updatedDate`);
  upsert.run({
    ...c,
    id: req.params.id,
    requiresAttention: c.requiresAttention ? 1 : 0,
    updatedDate: c.updatedDate || now
  });
  res.json({ ok: true });
});

app.delete('/api/clients/:id', (req, res) => {
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Product Items ----------
app.get('/api/product-items', (_req, res) => {
  const rows = db.prepare('SELECT * FROM productItems ORDER BY openedDate DESC').all();
  res.json(rows.map(r => ({
    ...r,
    completedDate: r.completedDate || undefined,
    notes: r.notes || undefined
  })));
});

app.put('/api/product-items/:id', (req, res) => {
  const t = req.body;
  const upsert = db.prepare(`INSERT INTO productItems (
    id, category, client, type, module, title, description, priority, status, owner, reportedBy,
    source, release, openedDate, targetDate, completedDate, daysOpen, health, notes
  ) VALUES (
    @id, @category, @client, @type, @module, @title, @description, @priority, @status, @owner, @reportedBy,
    @source, @release, @openedDate, @targetDate, @completedDate, @daysOpen, @health, @notes
  )
  ON CONFLICT(id) DO UPDATE SET
    category=excluded.category, client=excluded.client, type=excluded.type, module=excluded.module,
    title=excluded.title, description=excluded.description, priority=excluded.priority, status=excluded.status,
    owner=excluded.owner, reportedBy=excluded.reportedBy, source=excluded.source, release=excluded.release,
    openedDate=excluded.openedDate, targetDate=excluded.targetDate, completedDate=excluded.completedDate,
    daysOpen=excluded.daysOpen, health=excluded.health, notes=excluded.notes`);
  upsert.run({
    id: req.params.id,
    ...t,
    completedDate: t.completedDate || null,
    notes: t.notes || ''
  });
  res.json({ ok: true });
});

// ---------- Custom Tables ----------
app.get('/api/custom-tables', (_req, res) => {
  const rows = db.prepare('SELECT * FROM customTables ORDER BY createdAt DESC').all();
  res.json(rows.map(r => ({
    ...r,
    columns: JSON.parse(r.columns || '[]'),
    rows: JSON.parse(r.rows || '[]')
  })));
});

app.put('/api/custom-tables/:id', (req, res) => {
  const t = req.body;
  const upsert = db.prepare(`INSERT INTO customTables (
    id, name, description, category, columns, rows, createdAt, updatedAt
  ) VALUES (@id, @name, @description, @category, @columns, @rows, @createdAt, @updatedAt)
  ON CONFLICT(id) DO UPDATE SET
    name=excluded.name, description=excluded.description, category=excluded.category,
    columns=excluded.columns, rows=excluded.rows, updatedAt=excluded.updatedAt`);
  upsert.run({
    id: req.params.id,
    ...t,
    columns: JSON.stringify(t.columns || []),
    rows: JSON.stringify(t.rows || []),
    updatedAt: new Date().toISOString()
  });
  res.json({ ok: true });
});

app.delete('/api/custom-tables/:id', (req, res) => {
  db.prepare('DELETE FROM customTables WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Users ----------
app.get('/api/users', (_req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY createdAt DESC').all();
  res.json(rows.map(r => ({
    ...r,
    permissions: JSON.parse(r.permissions || '{}'),
    isActive: toBool(r.isActive),
    assignedClients: r.assignedClients ? JSON.parse(r.assignedClients) : undefined
  })));
});

app.put('/api/users/:id', (req, res) => {
  const u = req.body;
  const upsert = db.prepare(`INSERT INTO users (
    id, email, name, role, permissions, isActive, createdAt, lastLogin, assignedClients
  ) VALUES (@id, @email, @name, @role, @permissions, @isActive, @createdAt, @lastLogin, @assignedClients)
  ON CONFLICT(id) DO UPDATE SET
    email=excluded.email, name=excluded.name, role=excluded.role, permissions=excluded.permissions,
    isActive=excluded.isActive, lastLogin=excluded.lastLogin, assignedClients=excluded.assignedClients`);
  upsert.run({
    id: req.params.id,
    ...u,
    permissions: JSON.stringify(u.permissions || {}),
    isActive: u.isActive ? 1 : 0,
    assignedClients: u.assignedClients ? JSON.stringify(u.assignedClients) : ''
  });
  res.json({ ok: true });
});

app.delete('/api/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Seed / reset ----------
app.post('/api/reset', (_req, res) => {
  db.exec('DELETE FROM clients; DELETE FROM productItems; DELETE FROM customTables; DELETE FROM users;');
  seedIfEmpty();
  res.json({ ok: true, message: 'Resetted to seed data' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ClaimAI SQLite server listening on http://0.0.0.0:${PORT}`);
  console.log(`SQLite database file: ${DB_PATH}`);
});
