-- ClaimAI Unified Control Center Database Schema
-- Compatible with Supabase, PostgreSQL, Neon, Netlify DB

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clients & Leads Table
CREATE TABLE IF NOT EXISTS crm_clients (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255),
    company VARCHAR(255),
    business_type VARCHAR(100),
    status VARCHAR(100) DEFAULT '1'st Lead',
    sub_status VARCHAR(100),
    assigned_to VARCHAR(100),
    group_name VARCHAR(100),
    temperature VARCHAR(50),
    priority VARCHAR(50),
    requires_attention BOOLEAN DEFAULT FALSE,
    phone VARCHAR(100),
    email VARCHAR(255),
    team_contacts TEXT,
    it_contact TEXT,
    location VARCHAR(255),
    source VARCHAR(100),
    monthly_claims VARCHAR(100),
    created_date DATE,
    next_follow_up_date DATE,
    last_contact_date DATE,
    status_since DATE,
    last_note TEXT,
    general_notes TEXT,
    contact_type VARCHAR(100),
    updated_by VARCHAR(100),
    updated_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_clients_status ON crm_clients(status);
CREATE INDEX IF NOT EXISTS idx_crm_clients_company ON crm_clients(company);
CREATE INDEX IF NOT EXISTS idx_crm_clients_phone ON crm_clients(phone);

-- 2. Client Additional Contacts Table
CREATE TABLE IF NOT EXISTS crm_contacts (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(64) REFERENCES crm_clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    phone VARCHAR(100),
    email VARCHAR(255),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_client ON crm_contacts(client_id);

-- 3. Activity & Notes Log
CREATE TABLE IF NOT EXISTS crm_activities (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(64) REFERENCES crm_clients(id) ON DELETE CASCADE,
    author VARCHAR(100) DEFAULT 'Aviv',
    activity_type VARCHAR(50) DEFAULT 'note', -- 'call', 'meeting', 'whatsapp', 'note', 'status_change'
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_client ON crm_activities(client_id);

-- 4. Product & Delivery Control (Fixes, Bugs & Roadmap)
CREATE TABLE IF NOT EXISTS product_items (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'bug' or 'roadmap'
    client VARCHAR(255) DEFAULT 'ClaimAI (Internal)',
    type VARCHAR(100) NOT NULL, -- 'Bug', 'Feature', 'Enhancement', 'Performance'
    module VARCHAR(255),
    title TEXT NOT NULL,
    description TEXT,
    priority VARCHAR(50) DEFAULT 'Medium', -- 'Critical', 'High', 'Medium', 'Low'
    status VARCHAR(50) DEFAULT 'Open', -- 'Backlog', 'Open', 'In Progress', 'QA / Review', 'Done', 'Overdue'
    owner VARCHAR(100) DEFAULT 'Dev Team',
    reported_by VARCHAR(100) DEFAULT 'Aviv Ashkenazi',
    source VARCHAR(255),
    release VARCHAR(100),
    opened_date DATE,
    target_date DATE,
    completed_date DATE,
    days_open INT DEFAULT 0,
    health VARCHAR(50) DEFAULT 'On track',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_items_cat_status ON product_items(category, status);
CREATE INDEX IF NOT EXISTS idx_product_items_client ON product_items(client);
CREATE INDEX IF NOT EXISTS idx_product_items_priority ON product_items(priority);

-- Enable Row Level Security (RLS)
ALTER TABLE crm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_items ENABLE ROW LEVEL SECURITY;

-- Allow public/authenticated read & write for authorized app use
CREATE POLICY "Allow all for crm_clients" ON crm_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for crm_contacts" ON crm_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for crm_activities" ON crm_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for product_items" ON product_items FOR ALL USING (true) WITH CHECK (true);

-- 5. Dynamic Custom Tables (created via Generative AI Studio)
CREATE TABLE IF NOT EXISTS custom_tables (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    columns JSONB NOT NULL,
    rows JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE custom_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for custom_tables" ON custom_tables FOR ALL USING (true) WITH CHECK (true);

-- 6. User Portals, Roles & Permissions (Google Auth)
CREATE TABLE IF NOT EXISTS app_users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer', -- 'admin', 'editor', 'viewer'
    permissions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for app_users" ON app_users FOR ALL USING (true) WITH CHECK (true);
