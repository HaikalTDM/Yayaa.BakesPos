-- ============================================================
-- Yayaa.Bakes Micro-POS — Supabase Schema v2
-- Multi-Tenant · Production Ready
-- ============================================================
-- Run this entire script in Supabase SQL Editor.
-- 1. Creates all tables, indexes, RLS, and functions.
-- 2. Inserts your first store and seed products.
-- 3. Check the stores table for your STORE_ID UUID.
-- ============================================================

-- EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. STORES (multi-tenant root)
-- ==========================================
CREATE TABLE IF NOT EXISTS stores (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  slug       TEXT        UNIQUE NOT NULL,
  pin_hash   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Insert first store
INSERT INTO stores (name, slug)
VALUES ('Yayaa.Bakes', 'yayaa-bakes')
ON CONFLICT (slug) DO NOTHING;

-- ==========================================
-- 2. PRODUCTS
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id   UUID          NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name       TEXT          NOT NULL,
  price      DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock      INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url  TEXT,
  category   TEXT          DEFAULT 'Dessert',
  created_at TIMESTAMPTZ   DEFAULT NOW(),
  updated_at TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_store    ON products (store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (store_id, category);

-- updated_at trigger
CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

-- ==========================================
-- 3. SALES
-- ==========================================
CREATE TABLE IF NOT EXISTS sales (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id       UUID          NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  total          DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  payment_method TEXT          NOT NULL CHECK (payment_method IN ('cash', 'duitnow')),
  status         TEXT          NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'cancelled')),
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_store    ON sales (store_id);
CREATE INDEX IF NOT EXISTS idx_sales_date     ON sales (store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status   ON sales (store_id, status);

-- ==========================================
-- 4. SALE ITEMS
-- ==========================================
CREATE TABLE IF NOT EXISTS sale_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id       UUID           NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id    UUID           NOT NULL REFERENCES products(id),
  quantity      INTEGER        NOT NULL CHECK (quantity > 0),
  price_at_sale DECIMAL(10,2)  NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale    ON sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items (product_id);

-- ==========================================
-- 5. INVENTORY LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS inventory_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id      UUID        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id    UUID        NOT NULL REFERENCES products(id),
  change_amount INTEGER     NOT NULL,
  reason        TEXT        NOT NULL CHECK (reason IN ('sale', 'wasted', 'freebie', 'restock')),
  sale_id       UUID        REFERENCES sales(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_logs_store    ON inventory_logs (store_id);
CREATE INDEX IF NOT EXISTS idx_inv_logs_product  ON inventory_logs (product_id);
CREATE INDEX IF NOT EXISTS idx_inv_logs_date     ON inventory_logs (store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inv_logs_reason   ON inventory_logs (store_id, reason);

-- ==========================================
-- 6. SESSION MODALS
-- ==========================================
CREATE TABLE IF NOT EXISTS session_modals (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id   UUID          NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  amount     DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  note       TEXT          DEFAULT '',
  created_at TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modals_store ON session_modals (store_id);
CREATE INDEX IF NOT EXISTS idx_modals_date  ON session_modals (store_id, created_at);

-- ==========================================
-- 7. RPC: set_store_id (RLS session)
-- ==========================================
CREATE OR REPLACE FUNCTION set_store_id(p_store_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_store_id', p_store_id::text, false);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 8. RLS POLICIES
-- ==========================================
ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_modals  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_products"       ON products;
DROP POLICY IF EXISTS "store_sales"          ON sales;
DROP POLICY IF EXISTS "store_sale_items"     ON sale_items;
DROP POLICY IF EXISTS "store_inventory_logs" ON inventory_logs;
DROP POLICY IF EXISTS "store_session_modals" ON session_modals;

CREATE POLICY "store_products"       ON products       FOR ALL USING (store_id = current_setting('app.current_store_id')::uuid);
CREATE POLICY "store_sales"          ON sales          FOR ALL USING (store_id = current_setting('app.current_store_id')::uuid);
CREATE POLICY "store_inventory_logs" ON inventory_logs FOR ALL USING (store_id = current_setting('app.current_store_id')::uuid);
CREATE POLICY "store_session_modals" ON session_modals FOR ALL USING (store_id = current_setting('app.current_store_id')::uuid);

CREATE POLICY "store_sale_items" ON sale_items FOR ALL
  USING (sale_id IN (SELECT id FROM sales WHERE store_id = current_setting('app.current_store_id')::uuid));

-- ==========================================
-- 9. RPC: Safe stock deduction
-- ==========================================
CREATE OR REPLACE FUNCTION deduct_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = stock - p_quantity, updated_at = NOW()
  WHERE id = p_product_id AND stock >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 10. RPC: PIN hash management (cross-device sync)
-- ==========================================
CREATE OR REPLACE FUNCTION set_store_pin(p_hash TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE stores SET pin_hash = p_hash
  WHERE id = current_setting('app.current_store_id')::uuid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_store_pin()
RETURNS TEXT AS $$
  SELECT pin_hash FROM stores WHERE id = current_setting('app.current_store_id')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION clear_store_pin()
RETURNS VOID AS $$
BEGIN
  UPDATE stores SET pin_hash = NULL
  WHERE id = current_setting('app.current_store_id')::uuid;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 11. SEED PRODUCTS
-- ==========================================
INSERT INTO products (store_id, name, price, stock, category)
SELECT
  s.id,
  p.name,
  p.price,
  p.stock,
  p.category
FROM stores s
CROSS JOIN (
  VALUES
    ('Tiramisu',                  15.00, 12, 'Sweet Treats'),
    ('Mix Cheese Tart',            8.00, 20, 'Sweet Treats'),
    ('Mini Biscoff Cheesecake',    3.00, 24, 'Sweet Treats'),
    ('Sea Salt Chocolate Chip',    8.00, 18, 'Soft Cookies'),
    ('White Chocolate Matcha',     7.00, 16, 'Soft Cookies'),
    ('Marshmallow Red Velvet',     7.00, 14, 'Soft Cookies')
) AS p(name, price, stock, category)
WHERE s.slug = 'yayaa-bakes'
AND NOT EXISTS (
  SELECT 1 FROM products WHERE store_id = s.id AND name = p.name
);

-- ==========================================
-- ✅ DONE — COPY YOUR STORE ID BELOW
-- ==========================================
SELECT id, name, price, stock, category FROM products ORDER BY category, name;

SELECT 'COPY THIS UUID → NEXT_PUBLIC_STORE_ID' AS instruction, id AS store_id FROM stores WHERE slug = 'yayaa-bakes';
