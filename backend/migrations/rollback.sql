-- ============================================================
-- Rollback: 001_database_cleanup (reverse migration)
-- Run this ONLY if you need to undo 001_database_cleanup.sql
-- Date: 2026-06-22
-- ============================================================

-- ── Restore products columns ─────────────────────────────────
ALTER TABLE products
  ADD COLUMN dimensions        VARCHAR(100) COMMENT 'LxWxH in mm' AFTER height_cm,
  ADD COLUMN reserved_quantity INT UNSIGNED DEFAULT 0 AFTER stock_quantity,
  ADD COLUMN is_customisable   BOOLEAN DEFAULT FALSE AFTER low_stock_threshold;

-- ── Restore carts columns and index ──────────────────────────
ALTER TABLE carts
  ADD COLUMN session_id  VARCHAR(255) AFTER user_id,
  ADD COLUMN coupon_code VARCHAR(50)  AFTER notes,
  ADD COLUMN notes       TEXT         AFTER updated_at;
ALTER TABLE carts ADD INDEX idx_session (session_id);

-- ── Restore cart_items column ────────────────────────────────
ALTER TABLE cart_items
  ADD COLUMN customisation_data TEXT COMMENT 'JSON for custom wig/patch specs' AFTER advance_amount;

-- ── Restore addresses columns ────────────────────────────────
ALTER TABLE addresses
  ADD COLUMN latitude  DECIMAL(10,8) AFTER is_default,
  ADD COLUMN longitude DECIMAL(11,8) AFTER latitude;

-- ── Restore contact_queries columns ─────────────────────────
ALTER TABLE contact_queries
  ADD COLUMN ip_address VARCHAR(45)  AFTER message,
  ADD COLUMN user_agent VARCHAR(500) AFTER ip_address;

-- ── Restore orders columns ───────────────────────────────────
ALTER TABLE orders
  ADD COLUMN billing_address    TEXT    COMMENT 'JSON snapshot' AFTER shipping_address,
  ADD COLUMN has_custom_product BOOLEAN DEFAULT FALSE            AFTER coupon_code;

-- ── Restore categories column ────────────────────────────────
ALTER TABLE categories
  ADD COLUMN banner_url VARCHAR(500) AFTER icon;
