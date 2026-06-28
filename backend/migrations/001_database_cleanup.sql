-- ============================================================
-- Migration: 001_database_cleanup
-- Description: Remove unused columns identified in dependency audit.
--              All removed columns have ZERO references in backend
--              or frontend code. See rollback.sql to reverse.
-- Date: 2026-06-22
-- ============================================================

-- ── products: remove planned-but-unused columns ─────────────
ALTER TABLE products
  DROP COLUMN dimensions,
  DROP COLUMN reserved_quantity,
  DROP COLUMN is_customisable;

-- ── carts: remove guest-cart and coupon columns (never used) ─
-- Must drop index before dropping the column
ALTER TABLE carts DROP INDEX idx_session;
ALTER TABLE carts
  DROP COLUMN session_id,
  DROP COLUMN coupon_code,
  DROP COLUMN notes;

-- ── cart_items: remove customisation placeholder ─────────────
ALTER TABLE cart_items DROP COLUMN customisation_data;

-- ── addresses: remove geo columns (never written or read) ────
ALTER TABLE addresses
  DROP COLUMN latitude,
  DROP COLUMN longitude;

-- ── contact_queries: remove tracking columns ─────────────────
ALTER TABLE contact_queries
  DROP COLUMN ip_address,
  DROP COLUMN user_agent;

-- ── orders: remove unused snapshot/flag columns ──────────────
ALTER TABLE orders
  DROP COLUMN billing_address,
  DROP COLUMN has_custom_product;

-- ── categories: remove unused media columns ──────────────────
--   NOTE: icon and parent_id are USED in code — NOT removed.
ALTER TABLE categories DROP COLUMN banner_url;

-- ============================================================
-- COLUMNS KEPT (used in code or wired for future feature):
--   products.view_count         — incremented on product view
--   products.wishlist_count     — wired in wishlist toggle
--   products.low_stock_threshold — admin editable threshold
--   categories.icon             — used in category service CRUD
--   categories.parent_id        — hierarchical categories
--   activity_logs (table)       — logging implemented in code
-- TABLES KEPT (backend routes registered):
--   blog_posts, blog_categories — API exists at /api/v1/blog
-- ============================================================
