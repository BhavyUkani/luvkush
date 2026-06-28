-- ================================================================
-- LUV KUSH NATURAL — Complete MySQL Schema
-- Ayurvedic Beauty & Hair Care E-Commerce Platform
-- Aligned with Current Backend Codebase
-- ================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE DATABASE IF NOT EXISTS luvkush_natural
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE luvkush_natural;

-- ================================================================
-- 1. ROLES & PERMISSIONS
-- ================================================================

CREATE TABLE roles (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (name, display_name, description) VALUES
  ('super_admin', 'Super Administrator', 'Full system access'),
  ('admin', 'Administrator', 'Store management access'),
  ('manager', 'Manager', 'Limited management access'),
  ('customer', 'Customer', 'Regular customer');

CREATE TABLE permissions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  module      VARCHAR(50) NOT NULL,
  action      VARCHAR(50) NOT NULL,
  description TEXT,
  INDEX idx_module (module),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  role_id       INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id)       REFERENCES roles(id)       ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ================================================================
-- 2. USERS
-- ================================================================

CREATE TABLE users (
  id                          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name                  VARCHAR(100) NOT NULL,
  last_name                   VARCHAR(100),
  email                       VARCHAR(255) NOT NULL UNIQUE,
  phone                       VARCHAR(20),
  password_hash               VARCHAR(255) NOT NULL,
  role                        ENUM('super_admin','admin','manager','customer') NOT NULL DEFAULT 'customer',
  status                      ENUM('pending','active','suspended','deleted') NOT NULL DEFAULT 'pending',
  avatar_url                  VARCHAR(500),
  date_of_birth               DATE,
  gender                      ENUM('male','female','other','prefer_not_to_say'),
  email_verified_at           TIMESTAMP NULL,
  email_verification_token    VARCHAR(255),
  reset_password_token        VARCHAR(255),
  reset_password_expires      TIMESTAMP NULL,
  last_login_at               TIMESTAMP NULL,
  failed_login_attempts       TINYINT UNSIGNED DEFAULT 0,
  account_locked_until        TIMESTAMP NULL,
  newsletter_subscribed       BOOLEAN DEFAULT FALSE,
  ayurvedic_prakriti          ENUM('vata','pitta','kapha','vata_pitta','pitta_kapha','vata_kapha','tridosha'),
  hair_concern                SET('hairfall','dandruff','dryness','oiliness','grey','thinning','damage','growth'),
  created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email         (email),
  INDEX idx_phone         (phone),
  INDEX idx_role          (role),
  INDEX idx_status        (status),
  INDEX idx_created_at    (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refresh_tokens (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  token       VARCHAR(500) NOT NULL UNIQUE,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token      (token(255)),
  INDEX idx_user_id    (user_id),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 3. CATEGORIES
-- ================================================================

CREATE TABLE categories (
  id                SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id         SMALLINT UNSIGNED,
  name              VARCHAR(150) NOT NULL,
  slug              VARCHAR(200) NOT NULL UNIQUE,
  description       TEXT,
  image_url         VARCHAR(500),
  banner_url        VARCHAR(500),
  icon              VARCHAR(100),
  display_order     TINYINT UNSIGNED DEFAULT 0,
  is_featured       BOOLEAN DEFAULT FALSE,
  status            ENUM('active','inactive') DEFAULT 'active',
  meta_title        VARCHAR(200),
  meta_description  VARCHAR(500),
  meta_keywords     VARCHAR(500),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_slug      (slug),
  INDEX idx_parent    (parent_id),
  INDEX idx_status    (status),
  INDEX idx_featured  (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed categories
INSERT INTO categories (name, slug, description, display_order, is_featured, status) VALUES
  ('Hair Care',        'hair-care',        'Ayurvedic hair nourishment and treatment products', 1, TRUE, 'active'),
  ('Skin Care',        'skin-care',        'Natural and herbal skin care formulations',          2, TRUE, 'active'),
  ('Wellness',         'wellness',         'Holistic wellness and inner health products',         3, TRUE, 'active'),
  ('Hair Solutions',   'hair-solutions',   'Hair wigs, patches and restoration services',        4, TRUE, 'active'),
  ('Gift Sets',        'gift-sets',        'Curated luxury Ayurvedic gift collections',          5, FALSE, 'active');

-- Sub-categories
INSERT INTO categories (parent_id, name, slug, display_order, status) VALUES
  (1, 'Hair Oils',       'hair-care-oils',       1, 'active'),
  (1, 'Hair Masks',      'hair-care-masks',       2, 'active'),
  (1, 'Scalp Serums',    'hair-care-serums',      3, 'active'),
  (1, 'Hair Shampoo',    'hair-care-shampoo',     4, 'active'),
  (2, 'Face Serums',     'skin-care-serums',      1, 'active'),
  (2, 'Body Butter',     'skin-care-body',        2, 'active'),
  (2, 'Face Masks',      'skin-care-masks',       3, 'active'),
  (3, 'Herbal Teas',     'wellness-teas',         1, 'active'),
  (3, 'Supplements',     'wellness-supplements',  2, 'active'),
  (4, "Men's Wigs",      'hair-solutions-mens',   1, 'active'),
  (4, "Ladies' Wigs",    'hair-solutions-ladies', 2, 'active'),
  (4, 'Hair Patches',    'hair-solutions-patches',3, 'active'),
  (4, 'Restoration',     'hair-solutions-restore',4, 'active');

-- ================================================================
-- 4. INGREDIENTS
-- ================================================================

CREATE TABLE ingredients (
  id              SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL UNIQUE,
  sanskrit_name   VARCHAR(100),
  description     TEXT,
  benefits        TEXT,
  ayurvedic_use   TEXT,
  image_url       VARCHAR(500),
  is_featured     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ingredients (name, sanskrit_name, description, is_featured) VALUES
  ('Amla',         'आमलकी',    'Indian Gooseberry — crown jewel of Ayurvedic hair care', TRUE),
  ('Bhringraj',    'भृंगराज',  'King of Hair — legendary hair growth stimulant', TRUE),
  ('Neem',         'निम्ब',    'Village pharmacy — antibacterial scalp purifier', TRUE),
  ('Hibiscus',     'जपापुष्प',  'Flower of beauty — natural conditioner and growth stimulant', TRUE),
  ('Tulsi',        'तुलसी',    'Sacred basil — adaptogenic scalp balancer', TRUE),
  ('Saffron',      'केसर',     'Sacred saffron — luxurious skin brightener', TRUE),
  ('Sandalwood',   'चन्दन',    'Divine wood — cooling and purifying', FALSE),
  ('Ashwagandha',  'अश्वगन्धा', 'Adaptogenic root — stress reduction and hair health', FALSE),
  ('Brahmi',       'ब्राह्मी',  'Brain herb — promotes hair growth through scalp nourishment', FALSE),
  ('Kumkumadi',    'कुमकुमादि', 'Saffron-based facial elixir formula', FALSE);

-- ================================================================
-- 5. PRODUCTS
-- ================================================================

CREATE TABLE products (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id         SMALLINT UNSIGNED NOT NULL,
  name                VARCHAR(300) NOT NULL,
  slug                VARCHAR(350) NOT NULL UNIQUE,
  sku                 VARCHAR(100) UNIQUE,
  subtitle            VARCHAR(300),
  description         LONGTEXT,
  short_description   TEXT,
  how_to_use          TEXT,
  benefits            TEXT,
  ingredients_list    TEXT,
  tags                TEXT,
  badges              TEXT COMMENT 'JSON array of badge strings',
  price               DECIMAL(10,2) NOT NULL,
  mrp                 DECIMAL(10,2) NOT NULL,
  cost_price          DECIMAL(10,2),
  tax_rate            DECIMAL(5,2) DEFAULT 18.00 COMMENT 'GST percentage',
  weight              DECIMAL(8,3) COMMENT 'Weight in grams',
  dimensions          VARCHAR(100) COMMENT 'LxWxH in mm',
  length_cm           DECIMAL(8,2),
  width_cm            DECIMAL(8,2),
  height_cm           DECIMAL(8,2),
  payment_mode        VARCHAR(50) DEFAULT 'full_cod',
  advance_amount      DECIMAL(10,2),
  stock_quantity      INT UNSIGNED DEFAULT 0,
  reserved_quantity   INT UNSIGNED DEFAULT 0,
  low_stock_threshold INT UNSIGNED DEFAULT 10,
  primary_image       VARCHAR(500),
  images              TEXT COMMENT 'JSON array of image URLs',
  video_url           VARCHAR(500),
  is_featured         BOOLEAN DEFAULT FALSE,
  is_bestseller       BOOLEAN DEFAULT FALSE,
  is_new              BOOLEAN DEFAULT FALSE,
  is_customisable     BOOLEAN DEFAULT FALSE,
  status              ENUM('active','draft','archived','out_of_stock') DEFAULT 'draft',
  rating_avg          DECIMAL(3,2) DEFAULT 0.00,
  rating_count        INT UNSIGNED DEFAULT 0,
  sales_count         INT UNSIGNED DEFAULT 0,
  view_count          INT UNSIGNED DEFAULT 0,
  wishlist_count      INT UNSIGNED DEFAULT 0,
  seo_title           VARCHAR(200),
  seo_description     VARCHAR(500),
  seo_keywords        VARCHAR(500),
  canonical_url       VARCHAR(500),
  created_by          BIGINT UNSIGNED,
  updated_by          BIGINT UNSIGNED,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (category_id)  REFERENCES categories(id),
  FOREIGN KEY (created_by)   REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by)   REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_slug        (slug),
  INDEX idx_sku         (sku),
  INDEX idx_category    (category_id),
  INDEX idx_status      (status),
  INDEX idx_featured    (is_featured),
  INDEX idx_price       (price),
  INDEX idx_rating      (rating_avg DESC),
  INDEX idx_sales       (sales_count DESC),
  FULLTEXT idx_search   (name, description, tags, ingredients_list)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_variants (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id      BIGINT UNSIGNED NOT NULL,
  name            VARCHAR(100) NOT NULL COMMENT 'e.g. "100ml", "200ml", "Curly", "Straight"',
  value           VARCHAR(100) NOT NULL,
  sku             VARCHAR(100) UNIQUE,
  price_modifier  DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Added to base price',
  stock_quantity  INT UNSIGNED DEFAULT 0,
  status          ENUM('active','inactive') DEFAULT 'active',
  display_order   TINYINT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id),
  INDEX idx_status  (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_ingredients (
  product_id    BIGINT UNSIGNED NOT NULL,
  ingredient_id SMALLINT UNSIGNED NOT NULL,
  percentage    VARCHAR(20),
  benefit_note  TEXT,
  display_order TINYINT DEFAULT 0,
  PRIMARY KEY (product_id, ingredient_id),
  FOREIGN KEY (product_id)    REFERENCES products(id)     ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- ================================================================
-- 6. HAIR SOLUTIONS
-- ================================================================

CREATE TABLE hair_solutions (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id       SMALLINT UNSIGNED,
  name              VARCHAR(300) NOT NULL,
  slug              VARCHAR(350) NOT NULL UNIQUE,
  description       LONGTEXT,
  short_description TEXT,
  base_price        DECIMAL(10,2) NOT NULL,
  mrp               DECIMAL(10,2),
  gender            VARCHAR(50),
  size_info         VARCHAR(255),
  colour_info       VARCHAR(255),
  how_to_use        TEXT,
  type              ENUM('wig','patch') NOT NULL DEFAULT 'wig',
  hair_type         ENUM('straight','wavy','curly','kinky'),
  cap_construction  ENUM('full_lace','lace_front','monofilament','polyurethane','hybrid'),
  hair_source       ENUM('100_remy','european','indian_remy','synthetic'),
  density           ENUM('light','medium','heavy','extra_heavy'),
  available_lengths VARCHAR(200) COMMENT 'JSON array of lengths in inches',
  available_colors  TEXT COMMENT 'JSON array of color options',
  maintenance_level ENUM('low','medium','high'),
  is_customisable   BOOLEAN DEFAULT TRUE,
  turnaround_days   TINYINT UNSIGNED DEFAULT 7,
  images            TEXT COMMENT 'JSON array',
  primary_image     VARCHAR(500),
  is_featured       BOOLEAN DEFAULT FALSE,
  status            ENUM('active','draft','archived') DEFAULT 'draft',
  seo_title         VARCHAR(200),
  seo_description   VARCHAR(500),
  product_id        BIGINT UNSIGNED,
  payment_mode      ENUM('full_cod','full_online','partial','hybrid') NOT NULL DEFAULT 'full_cod',
  advance_amount    DECIMAL(10,2) DEFAULT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id)  REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_slug      (slug),
  INDEX idx_category  (category_id),
  INDEX idx_status    (status),
  INDEX idx_featured  (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 7. INVENTORY
-- ================================================================

CREATE TABLE inventory_logs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id    BIGINT UNSIGNED,
  variant_id    BIGINT UNSIGNED,
  action        ENUM('restock','sale','return','adjustment','damaged','reserved','released') NOT NULL,
  quantity_change INT NOT NULL COMMENT 'Positive = add, Negative = remove',
  quantity_before INT NOT NULL,
  quantity_after  INT NOT NULL,
  reference_type  VARCHAR(50) COMMENT 'order, manual, return, etc.',
  reference_id    BIGINT UNSIGNED,
  note          TEXT,
  performed_by  BIGINT UNSIGNED,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id)   REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (performed_by) REFERENCES users(id)    ON DELETE SET NULL,
  INDEX idx_product    (product_id),
  INDEX idx_action     (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 8. ADDRESSES
-- ================================================================

CREATE TABLE addresses (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  label         VARCHAR(50) DEFAULT 'Home',
  recipient_name VARCHAR(200) NOT NULL,
  phone         VARCHAR(20) NOT NULL,
  address_line1 VARCHAR(300) NOT NULL,
  address_line2 VARCHAR(300),
  city          VARCHAR(100) NOT NULL,
  state         VARCHAR(100) NOT NULL,
  pincode       VARCHAR(10) NOT NULL,
  country       VARCHAR(100) NOT NULL DEFAULT 'India',
  landmark      VARCHAR(200),
  is_default    BOOLEAN DEFAULT FALSE,
  latitude      DECIMAL(10,8),
  longitude     DECIMAL(11,8),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user    (user_id),
  INDEX idx_pincode (pincode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 9. CART
-- ================================================================

CREATE TABLE carts (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  session_id  VARCHAR(255),
  coupon_code VARCHAR(50),
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user    (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cart_items (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cart_id         BIGINT UNSIGNED NOT NULL,
  product_id      BIGINT UNSIGNED NOT NULL,
  variant_id      BIGINT UNSIGNED,
  variant_id_key  BIGINT UNSIGNED GENERATED ALWAYS AS (COALESCE(variant_id, 0)) STORED,
  quantity        SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  unit_price      DECIMAL(10,2) NOT NULL,
  customisation_data TEXT COMMENT 'JSON for custom wig/patch specs',
  added_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (cart_id)    REFERENCES carts(id)            ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)         ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
  UNIQUE KEY uk_cart_product_variant (cart_id, product_id, variant_id_key),
  INDEX idx_cart    (cart_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 10. COUPONS
-- ================================================================

CREATE TABLE coupons (
  id                  MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code                VARCHAR(50) NOT NULL UNIQUE,
  description         VARCHAR(300),
  discount_type       ENUM('percentage','fixed','free_shipping') NOT NULL,
  discount_value      DECIMAL(10,2) NOT NULL,
  min_order_amount    DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  usage_limit         INT UNSIGNED,
  usage_count         INT UNSIGNED DEFAULT 0,
  usage_per_user      TINYINT UNSIGNED DEFAULT 1,
  valid_from          TIMESTAMP NULL,
  valid_until         TIMESTAMP NULL,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Fallbacks for backward compatibility
  type                VARCHAR(50) GENERATED ALWAYS AS (discount_type) STORED,
  value               DECIMAL(10,2) GENERATED ALWAYS AS (discount_value) STORED,
  max_discount        DECIMAL(10,2) GENERATED ALWAYS AS (max_discount_amount) STORED,
  used_count          INT UNSIGNED GENERATED ALWAYS AS (usage_count) STORED,
  per_user_limit      TINYINT UNSIGNED GENERATED ALWAYS AS (usage_per_user) STORED,

  INDEX idx_code       (code),
  INDEX idx_active     (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE coupon_usage (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  coupon_id   MEDIUMINT UNSIGNED NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  order_id    BIGINT UNSIGNED,
  used_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (coupon_id) REFERENCES coupons(id)  ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_coupon (coupon_id),
  INDEX idx_user   (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 11. ORDERS
-- ================================================================

CREATE TABLE orders (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number          VARCHAR(30) NOT NULL UNIQUE,
  user_id               BIGINT UNSIGNED NOT NULL,
  status                ENUM('pending','confirmed','processing','quality_check','shipped','out_for_delivery','delivered','cancelled','refund_requested','refunded','returned') NOT NULL DEFAULT 'pending',
  payment_status        ENUM('pending','paid','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
  payment_method        ENUM('razorpay','cod','upi','card','netbanking','wallet'),
  razorpay_order_id     VARCHAR(100),
  razorpay_payment_id   VARCHAR(100),
  razorpay_signature    VARCHAR(300),

  -- Pricing
  subtotal              DECIMAL(10,2) NOT NULL,
  discount_amount       DECIMAL(10,2) DEFAULT 0.00,
  coupon_code           VARCHAR(50),
  coupon_discount       DECIMAL(10,2) DEFAULT 0.00,
  shipping_amount       DECIMAL(10,2) DEFAULT 0.00,
  tax_amount            DECIMAL(10,2) DEFAULT 0.00,
  total_amount          DECIMAL(10,2) NOT NULL,
  advance_paid_amount   DECIMAL(10,2) DEFAULT NULL,

  -- Addresses (snapshot at time of order)
  shipping_address      TEXT NOT NULL COMMENT 'JSON snapshot',
  billing_address       TEXT COMMENT 'JSON snapshot',

  -- Delivery
  shipping_method       VARCHAR(100),
  tracking_number       VARCHAR(200),
  tracking_url          VARCHAR(500),
  estimated_delivery    DATE,
  delivered_at          TIMESTAMP NULL,

  -- Custom flags / options
  has_custom_product    BOOLEAN DEFAULT FALSE,
  special_instructions  TEXT,

  -- Cancellation / Refund
  cancelled_by          BIGINT UNSIGNED,
  cancellation_reason   TEXT,
  cancelled_at          TIMESTAMP NULL,
  refund_amount         DECIMAL(10,2),
  refunded_at           TIMESTAMP NULL,

  -- Timestamps
  confirmed_at          TIMESTAMP NULL,
  shipped_at            TIMESTAMP NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)       REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (cancelled_by)  REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_order_number (order_number),
  INDEX idx_user         (user_id),
  INDEX idx_status       (status),
  INDEX idx_payment      (payment_status),
  INDEX idx_created_at   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id              BIGINT UNSIGNED NOT NULL,
  product_id            BIGINT UNSIGNED,
  variant_id            BIGINT UNSIGNED,
  product_name          VARCHAR(300) NOT NULL COMMENT 'Snapshot at time of order',
  variant_name          VARCHAR(100),
  sku                   VARCHAR(100),
  quantity              SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  unit_price            DECIMAL(10,2) NOT NULL,
  mrp                   DECIMAL(10,2) NOT NULL,
  total_amount          DECIMAL(10,2) NOT NULL,
  primary_image         VARCHAR(500),
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (order_id)         REFERENCES orders(id)           ON DELETE CASCADE,
  FOREIGN KEY (product_id)       REFERENCES products(id)         ON DELETE SET NULL,
  FOREIGN KEY (variant_id)       REFERENCES product_variants(id) ON DELETE SET NULL,
  INDEX idx_order   (order_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_status_history (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    BIGINT UNSIGNED NOT NULL,
  status      VARCHAR(50) NOT NULL,
  note        TEXT,
  changed_by  BIGINT UNSIGNED,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)  ON DELETE SET NULL,
  INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 12. REVIEWS & TESTIMONIALS
-- ================================================================

CREATE TABLE reviews (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id        BIGINT UNSIGNED NOT NULL,
  user_id           BIGINT UNSIGNED NOT NULL,
  order_id          BIGINT UNSIGNED,
  rating            TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title             VARCHAR(200),
  body              TEXT NOT NULL,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count     INT UNSIGNED DEFAULT 0,
  helpful_votes     INT UNSIGNED DEFAULT 0, -- Kept for backward compatibility
  status            ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE SET NULL,
  UNIQUE KEY uk_user_product (user_id, product_id),
  INDEX idx_product (product_id),
  INDEX idx_status  (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE testimonials (
  id            MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  location      VARCHAR(200),
  avatar_url    VARCHAR(500),
  rating        TINYINT UNSIGNED DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  product_used  VARCHAR(200),
  duration_used VARCHAR(100),
  quote         TEXT NOT NULL,
  is_featured   BOOLEAN DEFAULT FALSE,
  display_order TINYINT DEFAULT 0,
  status        ENUM('active','inactive') DEFAULT 'active',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 13. WISHLIST
-- ================================================================

CREATE TABLE wishlists (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  product_id  BIGINT UNSIGNED NOT NULL,
  added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_product (user_id, product_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 14. BLOG / JOURNAL
-- ================================================================

CREATE TABLE blog_categories (
  id          SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  slug        VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO blog_categories (name, slug) VALUES
  ('Ayurvedic Wisdom', 'ayurvedic-wisdom'),
  ('Hair Care Tips',    'hair-care-tips'),
  ('Ingredient Stories','ingredient-stories'),
  ('Customer Journeys', 'customer-journeys'),
  ('Wellness',          'wellness');

CREATE TABLE blog_posts (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id       SMALLINT UNSIGNED,
  author_id         BIGINT UNSIGNED,
  title             VARCHAR(300) NOT NULL,
  slug              VARCHAR(350) NOT NULL UNIQUE,
  excerpt           TEXT,
  content           LONGTEXT NOT NULL,
  cover_image       VARCHAR(500),
  reading_time_mins TINYINT UNSIGNED DEFAULT 5,
  tags              TEXT,
  status            ENUM('draft','published','archived') DEFAULT 'draft',
  view_count        INT UNSIGNED DEFAULT 0,
  published_at      TIMESTAMP NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (author_id)   REFERENCES users(id)           ON DELETE SET NULL,
  INDEX idx_slug        (slug),
  INDEX idx_status      (status),
  FULLTEXT idx_search   (title, excerpt, content, tags)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 15. NEWSLETTER SUBSCRIBERS
-- ================================================================

CREATE TABLE newsletter_subscribers (
  id            MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  status        ENUM('active','unsubscribed') DEFAULT 'active',
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP NULL,

  INDEX idx_email  (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 16. CONTACT QUERIES
-- ================================================================

CREATE TABLE contact_queries (
  id          MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(20),
  subject     VARCHAR(200),
  message     TEXT NOT NULL,
  query_type  ENUM('general','hair_solution_enquiry','product_query','complaint','return','other') DEFAULT 'general',
  status      ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
  source      VARCHAR(50) DEFAULT 'website',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_status  (status),
  INDEX idx_type    (query_type),
  INDEX idx_email   (email),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 17. ACTIVITY LOGS
-- ================================================================

CREATE TABLE activity_logs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED,
  action        VARCHAR(200) NOT NULL,
  module        VARCHAR(100),
  reference_type VARCHAR(100),
  reference_id  BIGINT UNSIGNED,
  old_values    TEXT COMMENT 'JSON',
  new_values    TEXT COMMENT 'JSON',
  ip_address    VARCHAR(45),
  user_agent    VARCHAR(500),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user       (user_id),
  INDEX idx_action     (action),
  INDEX idx_module     (module),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 18. SETTINGS
-- ================================================================

CREATE TABLE settings (
  id          MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key`       VARCHAR(200) NOT NULL UNIQUE,
  value       TEXT,
  type        ENUM('string','integer','boolean','json','text') DEFAULT 'string',
  group_name  VARCHAR(100) DEFAULT 'general',
  label       VARCHAR(200),
  description TEXT,
  is_public   BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_key   (`key`),
  INDEX idx_group (group_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default settings
INSERT INTO settings (`key`, value, type, group_name, label, is_public) VALUES
  ('store_name',                'Luv Kush Natural',                 'string',  'general',  'Store Name',                 TRUE),
  ('store_tagline',             'Ancient Ayurvedic Luxury',         'string',  'general',  'Store Tagline',              TRUE),
  ('store_email',               'contact@luvkushnatural.com',       'string',  'general',  'Contact Email',              TRUE),
  ('store_phone',               '+91 99999 99999',                  'string',  'general',  'Contact Phone',              TRUE),
  ('store_address',             'India',                            'text',    'general',  'Store Address',              TRUE),
  ('free_shipping_above',       '999',                              'integer', 'shipping', 'Free Shipping Threshold',    TRUE),
  ('default_shipping_rate',     '99',                               'integer', 'shipping', 'Default Shipping Rate',      TRUE),
  ('gst_number',                '',                                 'string',  'tax',      'GST Number',                 FALSE),
  ('razorpay_enabled',          'true',                             'boolean', 'payment',  'Razorpay Enabled',           FALSE),
  ('cod_enabled',               'true',                             'boolean', 'payment',  'COD Enabled',                TRUE),
  ('max_cod_amount',            '5000',                             'integer', 'payment',  'Max COD Amount',             TRUE),
  ('review_auto_approve',       'false',                            'boolean', 'reviews',  'Auto-approve Reviews',       FALSE),
  ('meta_title_suffix',         '| Luv Kush Natural',              'string',  'seo',      'Meta Title Suffix',          FALSE),
  ('og_image_default',          '/assets/images/og-cover.jpg',     'string',  'seo',      'Default OG Image',           FALSE);

-- ================================================================
-- VIEWS FOR COMMON QUERIES
-- ================================================================

CREATE OR REPLACE VIEW v_products_summary AS
SELECT
  p.id, p.name, p.slug, p.sku, p.price, p.mrp,
  p.stock_quantity, p.status, p.is_featured, p.is_bestseller, p.is_new,
  p.rating_avg, p.rating_count, p.sales_count, p.view_count,
  p.primary_image, p.created_at,
  c.name AS category_name, c.slug AS category_slug,
  ROUND((1 - p.price / p.mrp) * 100) AS discount_pct
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

CREATE OR REPLACE VIEW v_orders_summary AS
SELECT
  o.id, o.order_number, o.status, o.payment_status,
  o.total_amount, o.created_at,
  u.first_name, u.last_name, u.email, u.phone,
  COUNT(oi.id) AS item_count
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- ================================================================
-- SEED: ADMIN USER
-- password = Admin@123  (bcrypt 12 rounds)
-- ================================================================

INSERT INTO users (
  first_name, last_name, email, password_hash, role, status,
  email_verified_at, created_at
) VALUES (
  'Luv Kush', 'Admin',
  'admin@luvkushnatural.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/ZNbxf5e',
  'super_admin', 'active', NOW(), NOW()
);

-- ================================================================
-- SEED: PRODUCTS (20 real Ayurvedic products)
-- ================================================================

INSERT INTO products (
  category_id, name, slug, sku, subtitle, description, short_description,
  how_to_use, ingredients_list, tags, badges,
  price, mrp, tax_rate, weight,
  stock_quantity, low_stock_threshold,
  is_featured, is_bestseller, is_new, status,
  rating_avg, rating_count, sales_count
) VALUES

-- 1. Bhringraj Hair Oil (HERO PRODUCT)
(6, 'Bhringraj Miracle Hair Oil',
 'bhringraj-miracle-hair-oil', 'LKN-HO-001',
 'The King of Hair — Ancient Root to Modern Ritual',
 'Formulated from cold-pressed Bhringraj — the crown jewel of Ayurvedic hair science — this transformative oil penetrates deep into the scalp to reverse hair thinning, stimulate dormant follicles, and restore your hair to its natural vitality. Blended with 11 sacred Ayurvedic herbs in a base of pure sesame and coconut oil, each drop carries centuries of botanical wisdom. Clinical trials show 85% reduction in hair fall within 12 weeks of consistent use.',
 'Ancient Bhringraj oil with 11 Ayurvedic herbs. Reduces hair fall by 85% in 12 weeks.',
 'Warm 2-3 tablespoons between palms. Apply to scalp with gentle circular massage for 5 minutes. Work through lengths to ends. Leave for minimum 2 hours or overnight for best results. Wash with Ayurvedic shampoo. Use 2-3 times per week.',
 'Bhringraj (Eclipta prostrata) extract, Cold-pressed sesame oil, Virgin coconut oil, Amla (Indian gooseberry) extract, Brahmi (Bacopa monnieri), Neem (Azadirachta indica) leaf extract, Hibiscus rosa-sinensis, Tulsi (Holy basil), Fenugreek seed extract, Black seed oil, Vitamin E, Natural fragrance',
 'bhringraj,hair growth,hair fall,ayurvedic hair oil,hair oil,best seller',
 '["Bestseller","85% Less Hair Fall","3000+ Reviews"]',
 599.00, 899.00, 18.00, 100.00,
 250, 20,
 TRUE, TRUE, FALSE, 'active',
 4.8, 3241, 1580),

-- 2. Bhringraj Hair Oil 200ml
(6, 'Bhringraj Miracle Hair Oil 200ml',
 'bhringraj-miracle-hair-oil-200ml', 'LKN-HO-002',
 'The King of Hair — Value Size',
 'Our flagship Bhringraj oil in the 200ml value size. The same potent formula with cold-pressed Bhringraj and 11 Ayurvedic herbs — now with more product for your consistent daily ritual. Ideal for families or those committed to a complete Ayurvedic hair care routine. Free from mineral oil, silicones, and synthetic fragrance.',
 'Double value Bhringraj oil — 11 Ayurvedic herbs, clinically proven 85% less hair fall.',
 'Warm 2-3 tablespoons between palms. Apply to scalp with gentle circular massage. Leave 2 hours or overnight. Wash with Ayurvedic shampoo. Use 2-3 times weekly.',
 'Bhringraj extract, Cold-pressed sesame oil, Virgin coconut oil, Amla extract, Brahmi, Neem leaf extract, Hibiscus, Tulsi, Fenugreek, Black seed oil, Vitamin E',
 'bhringraj,hair growth,hair fall,value size,ayurvedic oil',
 '["Best Value","11 Herbs"]',
 999.00, 1499.00, 18.00, 200.00,
 180, 15,
 FALSE, TRUE, FALSE, 'active',
 4.8, 1200, 890),

-- 3. Amla & Hibiscus Growth Oil
(6, 'Amla & Hibiscus Radiance Oil',
 'amla-hibiscus-radiance-oil', 'LKN-HO-003',
 'The Sacred Duo — Vitamin C & Natural Shine',
 'A divine union of Amla — the richest natural source of Vitamin C — and Hibiscus, the flower of the gods. Amla fortifies each hair strand from root to tip while preventing premature greying and restoring your hair''s natural luster. Hibiscus petals provide deep conditioning, seal split ends, and add a glossy luminescence that rivals luxury serums. This golden oil is the secret ritual of Indian women for centuries.',
 'Amla + Hibiscus oil rich in Vitamin C. Prevents greying, adds natural shine.',
 'Take desired amount and massage into scalp and hair. Leave for 1-2 hours. Wash off with Ayurvedic shampoo. Use 2-3 times per week for best results.',
 'Amla (Phyllanthus emblica) extract, Hibiscus rosa-sinensis flower extract, Cold-pressed coconut oil, Sesame oil, Sunflower oil, Castor oil, Vitamin C, Vitamin E, Natural hibiscus fragrance',
 'amla,hibiscus,hair shine,anti-grey,vitamin c,growth oil',
 '["Anti-Greying","Adds Shine"]',
 499.00, 749.00, 18.00, 100.00,
 320, 25,
 TRUE, FALSE, FALSE, 'active',
 4.6, 1843, 980),

-- 4. Neem & Tulsi Scalp Serum
(8, 'Neem & Tulsi Scalp Purifier Serum',
 'neem-tulsi-scalp-purifier-serum', 'LKN-SS-001',
 'The Sacred Shield — Antibacterial Scalp Therapy',
 'Formulated for those battling dandruff, scalp infections, or excessive oiliness, this concentrated serum delivers the full antibacterial power of Neem and antiseptic properties of Tulsi directly to your scalp. The lightweight, non-greasy formula absorbs instantly and creates a hostile environment for the microorganisms that cause dandruff and itching. Safe for daily use. Visible results within 2 weeks.',
 'Neem + Tulsi serum that eliminates dandruff and purifies scalp within 2 weeks.',
 'Apply 10-15 drops directly to scalp sections. Massage gently. Do not rinse. Use daily or every alternate day. Works best when applied to slightly damp scalp.',
 'Neem (Azadirachta indica) leaf extract, Tulsi (Ocimum sanctum) extract, Tea tree essential oil, Aloe vera extract, Salicylic acid (from willow bark), Zinc PCA, Panthenol, Hyaluronic acid, Glycerin',
 'dandruff,scalp,neem,tulsi,scalp serum,anti-dandruff',
 '["Dandruff Control","Doctor Recommended"]',
 799.00, 1199.00, 18.00, 50.00,
 190, 15,
 TRUE, FALSE, TRUE, 'active',
 4.7, 921, 445),

-- 5. Brahmi Scalp Growth Serum
(8, 'Brahmi Scalp Activation Serum',
 'brahmi-scalp-activation-serum', 'LKN-SS-002',
 'The Sacred Mind-Hair Connection',
 'Brahmi — the ancient herb of intelligence — holds a profound secret: the same compounds that enhance cognitive function also revive dormant hair follicles. This concentrated serum combines Brahmi extract with Redensyl (clinically proven to reactivate hair stem cells) and Anagain (pea sprout extract shown to shift the hair growth cycle). Apply directly to areas of thinning for visible density improvement within 90 days.',
 'Brahmi + Redensyl serum for visible hair density increase in 90 days.',
 'Part hair in areas of concern. Apply 8-10 drops with dropper directly to scalp. Massage with fingertips for 2 minutes. Use morning and night. Do not wash off.',
 'Brahmi (Bacopa monnieri) extract, Redensyl, Anagain (pea sprout extract), Caffeine, Bhringraj extract, Amla extract, Biotin, Niacinamide, Zinc, Hyaluronic acid, Glycerin',
 'brahmi,hair density,hair growth serum,thinning hair,hair regrowth',
 '["Clinical Formula","90-Day Results"]',
 899.00, 1399.00, 18.00, 50.00,
 140, 10,
 FALSE, FALSE, TRUE, 'active',
 4.5, 487, 223),

-- 6. Ayurvedic Hair Mask
(7, 'Bhringraj Deep Conditioning Hair Mask',
 'bhringraj-deep-conditioning-hair-mask', 'LKN-HM-001',
 'Repair, Restore & Revive — Weekly Treatment',
 'An intensive weekly treatment mask powered by Bhringraj, Amla, and a blend of 8 nourishing Ayurvedic botanicals. This rich, creamy mask works deep into the hair cortex to repair damage caused by heat, chemical treatment, and environmental stress. Proteins strengthen each strand while natural oils restore lost moisture. One use leaves hair visibly smoother, shinier, and dramatically easier to manage.',
 'Weekly Bhringraj hair mask with 8 Ayurvedic herbs. Repairs damage, adds intense shine.',
 'Apply generously from mid-lengths to ends on clean, towel-dried hair. Avoid scalp. Leave for 20-30 minutes. For deeper conditioning, cover with a warm towel. Rinse thoroughly. Use once a week.',
 'Bhringraj extract, Amla extract, Shea butter, Coconut milk, Egg protein, Rice protein, Hibiscus extract, Brahmi, Neem extract, Argan oil, Glycerin, Panthenol',
 'hair mask,conditioning,repair,damaged hair,bhringraj mask,weekly treatment',
 '["Deep Repair","Protein Rich"]',
 449.00, 699.00, 18.00, 200.00,
 270, 20,
 FALSE, TRUE, FALSE, 'active',
 4.7, 1562, 780),

-- 7. Kasturi Hair Mask
(7, 'Kashmiri Saffron & Sandalwood Hair Mask',
 'kashmiri-saffron-sandalwood-hair-mask', 'LKN-HM-002',
 'Royal Hair Treatment — For Dull & Damaged Hair',
 'Inspired by the beauty rituals of Kashmiri royalty, this luxurious hair mask combines the golden power of genuine Kashmiri saffron with cooling sandalwood to transform dull, damaged hair into silky, fragrant perfection. Saffron''s antioxidant compounds protect from free radical damage while sandalwood''s natural oils provide deep moisturisation and an intoxicating, lasting fragrance. A truly indulgent ritual.',
 'Luxury saffron + sandalwood hair mask. Transforms dull hair to silky perfection.',
 'Apply to washed, towel-dried hair. Focus on mid-lengths and ends. Leave 30-45 minutes. Rinse well. Use twice a week for best results.',
 'Kashmiri saffron extract, Sandalwood (Chandan) oil, Shea butter, Argan oil, Hibiscus extract, Rose water, Aloe vera, Glycerin, Panthenol, Natural fragrance',
 'saffron,sandalwood,luxury hair mask,royal treatment,shine',
 '["Luxury Formula","Real Saffron"]',
 649.00, 999.00, 18.00, 200.00,
 160, 15,
 FALSE, FALSE, TRUE, 'active',
 4.6, 334, 167),

-- 8. Bhringraj Shampoo
(9, 'Bhringraj Ayurvedic Hair Shampoo',
 'bhringraj-ayurvedic-hair-shampoo', 'LKN-SH-001',
 'Sulphate-Free Daily Cleanse',
 'A gentle, sulphate-free shampoo formulated for daily use, powered by Bhringraj, Amla, Reetha (soapnut), and Shikakai — the traditional Ayurvedic cleansers that have been used in India for centuries. Unlike harsh commercial shampoos that strip the scalp of its natural oils, this formula cleanses gently while strengthening hair, reducing fall, and leaving a healthy, balanced scalp. Free from SLS, SLES, parabens, and artificial fragrance.',
 'Sulphate-free Bhringraj shampoo with Reetha & Shikakai. For all hair types.',
 'Wet hair thoroughly. Apply a small amount, lather gently. Massage scalp for 2-3 minutes. Rinse thoroughly. Use daily or as needed. Follow with Bhringraj conditioner for best results.',
 'Bhringraj extract, Amla extract, Reetha (Sapindus mukorossi), Shikakai (Acacia concinna), Neem extract, Aloe vera, Panthenol, Glycerin, Citric acid',
 'shampoo,sulphate-free,bhringraj shampoo,anti-hairfall shampoo,daily shampoo',
 '["Sulphate-Free","Daily Use"]',
 349.00, 499.00, 18.00, 200.00,
 400, 30,
 FALSE, TRUE, FALSE, 'active',
 4.5, 2103, 1250),

-- 9. Bhringraj Shampoo 400ml value
(9, 'Bhringraj Ayurvedic Hair Shampoo 400ml',
 'bhringraj-ayurvedic-hair-shampoo-400ml', 'LKN-SH-002',
 'Sulphate-Free Daily Cleanse — Value Size',
 'Our bestselling Bhringraj shampoo in the 400ml value size — perfect for families and regular users. The same sulphate-free, Ayurvedic formula with Bhringraj, Reetha, Shikakai, and Amla. Double the product, double the savings.',
 'Sulphate-free Bhringraj shampoo 400ml. Best value for daily Ayurvedic cleansing.',
 'Wet hair. Apply, lather, massage 2-3 minutes. Rinse. Safe for daily use.',
 'Bhringraj extract, Amla extract, Reetha, Shikakai, Neem extract, Aloe vera, Panthenol, Glycerin',
 'shampoo,sulphate-free,value size,400ml,daily',
 '["Best Value","400ml"]',
 599.00, 899.00, 18.00, 400.00,
 280, 25,
 FALSE, FALSE, FALSE, 'active',
 4.5, 890, 560),

-- 10. Kumkumadi Face Serum
(10, 'Kumkumadi Elixir Face Serum',
 'kumkumadi-elixir-face-serum', 'LKN-FS-001',
 'Liquid Gold — Ancient Saffron Face Ritual',
 'Kumkumadi Tailam is one of Ayurveda''s most precious formulations, prescribed for centuries for its extraordinary ability to illuminate and transform the complexion. Our interpretation combines 24 Ayurvedic botanicals — anchored by genuine Kashmiri saffron — in a base of cold-pressed oils. Regular use visibly fades pigmentation, evens skin tone, reduces the appearance of fine lines, and bestows the famous Ayurvedic glow. The fragrance alone is a sensory ritual.',
 '24-herb saffron face serum for visible glow, even skin tone, and fine line reduction.',
 'After cleansing and toning, apply 4-5 drops to face and neck. Gently press into skin. Use morning and evening. Follow with moisturiser in the morning and SPF. Results visible in 4-6 weeks.',
 'Kashmiri saffron (Crocus sativus), Sandalwood oil, Rose oil, Vetiver, Lotus extract, Licorice (brightening), Manjistha, Turmeric (curcumin), Almond oil, Sesame oil, Vitamin C, Vitamin E',
 'face serum,kumkumadi,saffron serum,glow,brightening,pigmentation',
 '["24 Botanicals","Real Saffron"]',
 1299.00, 1999.00, 18.00, 30.00,
 120, 10,
 TRUE, TRUE, FALSE, 'active',
 4.9, 876, 445),

-- 11. Sandalwood Body Butter
(11, 'Chandan Sandalwood Body Butter',
 'chandan-sandalwood-body-butter', 'LKN-BB-001',
 'Royal Body Moisturiser — Deeply Nourishing',
 'An opulent body butter inspired by the royal beauty traditions of Rajasthan, where sandalwood was the foundation of all skincare. Rich, silky, and deeply moisturising — this formula absorbs beautifully without greasiness, leaving skin soft, smooth, and fragranced with the divine, calming scent of genuine sandalwood. Whipped shea butter, mango butter, and coconut oil provide lasting hydration for up to 12 hours.',
 'Sandalwood body butter with shea and mango butter. 12-hour hydration, divine fragrance.',
 'After bathing, apply generously to dry skin and massage in circular motions until absorbed. Focus on dry areas — elbows, knees, heels. Use daily for best results.',
 'Shea butter (Butyrospermum parkii), Mango butter, Coconut oil, Sandalwood (Chandan) essential oil, Almond oil, Vitamin E, Beeswax, Glycerin, Natural sandalwood fragrance',
 'body butter,sandalwood,moisturiser,body care,chandan,dry skin',
 '["12-Hour Hydration","Vegan Formula"]',
 699.00, 999.00, 18.00, 100.00,
 200, 15,
 FALSE, FALSE, FALSE, 'active',
 4.7, 543, 280),

-- 12. Face Mask Multani Mitti
(12, 'Multani Mitti & Rose Deep Clean Face Mask',
 'multani-mitti-rose-deep-clean-face-mask', 'LKN-FM-001',
 'Earth''s Purifier — Instant Glow Treatment',
 'Multani Mitti (Fuller''s Earth) has been used in Indian beauty rituals for over 2,000 years for its extraordinary ability to absorb excess oil, draw out impurities, and visibly tighten pores. Blended with rose water, sandalwood powder, and turmeric in this clay mask, it delivers an instant glow and deeply clean skin in just 15 minutes. Suitable for all skin types; perfect for oily and combination skin.',
 'Multani Mitti clay mask with rose water. Deep pore cleansing + instant glow in 15 minutes.',
 'Mix 1-2 tablespoons with rose water or plain water to a smooth paste. Apply evenly to clean face and neck. Leave for 15-20 minutes. Rinse with cool water. Use 1-2 times per week.',
 'Multani Mitti (Fuller''s Earth), Rose petal powder, Sandalwood powder, Turmeric (curcumin), Kaolin clay, Rose water extract, Neem powder, Aloe vera powder',
 'face mask,multani mitti,clay mask,pore cleaning,glow mask',
 '["Instant Glow","2000-Year Ritual"]',
 299.00, 449.00, 18.00, 100.00,
 350, 25,
 FALSE, FALSE, FALSE, 'active',
 4.4, 1245, 670),

-- 13. Ashwagandha Hair Supplement
(14, 'Ashwagandha & Biotin Hair Growth Supplement',
 'ashwagandha-biotin-hair-growth-supplement', 'LKN-WS-001',
 'Inner Nourishment for Outer Radiance',
 'True hair health begins from within. These holistic capsules combine Ayurveda''s most powerful adaptogen — Ashwagandha — with clinically-proven biotin, zinc, and Bhringraj extract for comprehensive, inside-out hair support. Ashwagandha reduces cortisol (the stress hormone that triggers hair fall), while biotin and zinc support keratin production. Each bottle contains a 60-day supply.',
 'Ashwagandha + Biotin supplement for hair growth from within. 60-day supply.',
 'Take 2 capsules daily with water after meals. Best taken in the morning. Use consistently for minimum 90 days for best results. Store in a cool, dry place.',
 'Ashwagandha root extract (KSM-66®), Biotin 10,000mcg, Zinc, Bhringraj extract, Amla extract, Iron, Folic acid, Vitamin D3, Selenium',
 'supplement,biotin,ashwagandha,hair growth supplement,vitamins,inner hair',
 '["90-Day Supply","KSM-66 Ashwagandha"]',
 1499.00, 1999.00, 18.00, 150.00,
 95, 10,
 FALSE, FALSE, TRUE, 'active',
 4.6, 398, 180),

-- 14. Herbal Tea
(13, 'Tulsi Brahmi Stress Relief Herbal Tea',
 'tulsi-brahmi-stress-relief-herbal-tea', 'LKN-WT-001',
 'The Sacred Sip — Calm Mind, Strong Hair',
 'Stress is one of the leading causes of hair fall. This expertly crafted Ayurvedic herbal tea blend combines Tulsi (the Queen of Herbs), Brahmi, Ashwagandha, and Licorice root to gently calm the nervous system, reduce cortisol, and support the hair growth cycle from within. Caffeine-free and gentle enough for daily use. A mindful ritual that nourishes both mind and hair.',
 'Ayurvedic herbal tea with Tulsi + Brahmi. Reduces stress-related hair fall. Caffeine-free.',
 'Add one teaspoon (2g) to 200ml of hot water (not boiling). Steep for 5-7 minutes. Strain and enjoy. Add honey to taste. Best enjoyed morning and evening. Caffeine-free — safe at any time.',
 'Tulsi (Holy basil) leaves, Brahmi (Bacopa monnieri), Ashwagandha root, Licorice root, Hibiscus petals, Chamomile, Peppermint, Rose petals',
 'herbal tea,tulsi,brahmi,stress,wellness,caffeine-free,hair tea',
 '["Caffeine-Free","Stress Relief"]',
 299.00, 449.00, 18.00, 50.00,
 300, 20,
 FALSE, FALSE, FALSE, 'active',
 4.5, 234, 125),

-- 15. Hair Gift Set
(5, 'The Ayurvedic Hair Ritual Gift Set',
 'ayurvedic-hair-ritual-gift-set', 'LKN-GS-001',
 'The Complete Hair Transformation — Luxury Gifting',
 'Curated for the ultimate Ayurvedic hair experience, this luxuriously packaged gift set contains our three bestselling hair heroes: the Bhringraj Miracle Hair Oil (100ml), Bhringraj Deep Conditioning Hair Mask (200g), and Bhringraj Ayurvedic Shampoo (200ml). Presented in a handcrafted premium box with a personalized note card. The perfect gift for someone you love — or yourself.',
 'Gift set: Bhringraj Oil + Hair Mask + Shampoo in premium handcrafted box.',
 'Each product comes with individual usage instructions. Best gifted with a note card from our website at checkout.',
 'Contains: Bhringraj Miracle Hair Oil 100ml, Bhringraj Deep Conditioning Hair Mask 200g, Bhringraj Ayurvedic Shampoo 200ml',
 'gift set,gift,hair care set,luxury gift,ayurvedic gift,combo',
 '["Gift Ready","Save 20%","Premium Box"]',
 1199.00, 1499.00, 18.00, 550.00,
 80, 10,
 TRUE, FALSE, FALSE, 'active',
 4.9, 312, 145),

-- 16. Anti-Hairfall Kit
(5, 'Anti-Hairfall Complete Ritual Kit',
 'anti-hairfall-complete-ritual-kit', 'LKN-GS-002',
 'The 30-Day Transformation — Stop Hair Fall',
 'Everything you need to stop hair fall in 30 days: our Bhringraj Hair Oil, Neem & Tulsi Scalp Serum, and Bhringraj Shampoo — the complete three-step routine clinically designed to address the three root causes of hair fall: weak roots, scalp imbalance, and harsh cleansing. This kit also includes a free Ayurvedic hair care guide and a personalized hair assessment.',
 '3-step anti-hairfall kit. Oil + Scalp Serum + Shampoo for complete hair fall treatment.',
 'Follow each product''s individual usage instructions. For best results: Use shampoo 3 times per week. Apply scalp serum daily. Oil hair 2-3 times per week.',
 'Contains: Bhringraj Hair Oil 100ml, Neem & Tulsi Scalp Serum 50ml, Bhringraj Shampoo 200ml',
 'anti-hairfall,hair fall kit,combo,complete ritual,gift',
 '["Complete Ritual","Save ₹350","Hair Guide Included"]',
 1299.00, 1649.00, 18.00, 400.00,
 65, 10,
 FALSE, FALSE, TRUE, 'active',
 4.8, 198, 90),

-- 17. Men's Full Wig
(4, 'Men''s Premium Remy Human Hair Wig',
 'mens-premium-remy-human-hair-wig', 'LKN-WIG-001',
 'Undetectable Natural Hairline — Made To Order',
 'Crafted from 100% Indian Remy human hair — the finest grade available — where every strand''s cuticle is preserved in its natural direction for unparalleled realism and manageability. Each hairline is meticulously hand-knotted on a breathable full-lace base, creating a hairline so natural it defies detection. Completely customisable: match your exact hair colour, density, wave pattern, and cap size. Made-to-order in 7-10 business days.',
 'Men''s full wig in 100% Indian Remy hair. Hand-knotted lace. Fully customisable.',
 'Apply wig adhesive or tape to clean, dry skin. Press wig lace firmly against hairline. Blend with styling products as needed. Remove with medical-grade adhesive remover. For detailed fitting guide, refer to the included instruction booklet or schedule a video consultation.',
 '100% Indian Remy human hair, Breathable full-lace base, Medical-grade hypoallergenic adhesive strips (included)',
 'mens wig,hair wig,full wig,remy hair,hair loss solution,natural hairline,custom wig',
 '["100% Remy Hair","Hand-Knotted","Made To Order"]',
 15999.00, 19999.00, 18.00, 180.00,
 50, 5,
 TRUE, FALSE, FALSE, 'active',
 4.9, 145, 67),

-- 18. Ladies' Lace Front Wig
(4, 'Ladies'' Luxury Lace Front Wig',
 'ladies-luxury-lace-front-wig', 'LKN-WIG-002',
 'The Invisible Hairline — For Women',
 'Our most popular ladies'' wig, featuring a transparent Swiss lace front that blends seamlessly with any skin tone for a completely undetectable hairline. Crafted from 100% Indian Remy human hair, this wig can be styled, coloured, and treated just like your own hair — blow dried, curled, or straightened. The cap is lightweight and breathable for all-day comfort. Available in straight, wavy, or curly textures.',
 'Ladies'' lace front wig in 100% Remy hair. Invisible hairline, fully stylable.',
 'Measure head circumference and select correct cap size. Apply lace front adhesive or tape. Position and press firmly. Style as desired. For detailed fitting and care guide, visit our website or book a consultation.',
 '100% Indian Remy human hair, Transparent Swiss lace front, Velvet ear tabs, Adjustable straps, Medical-grade adhesive',
 'ladies wig,womens wig,lace front wig,human hair wig,hair loss women,natural wig',
 '["Swiss Lace","100% Human Hair","Heat Stylable"]',
 22999.00, 27999.00, 18.00, 200.00,
 40, 5,
 TRUE, FALSE, FALSE, 'active',
 4.8, 98, 45),

-- 19. Crown Hair Patch
(4, 'Crown Hair Patch — Thinning Crown Solution',
 'crown-hair-patch-thinning-solution', 'LKN-PATCH-001',
 'Instant Crown Coverage — Undetectable',
 'Designed specifically for crown and top-of-head thinning — the most common area of hair loss in both men and women. This ultra-thin polyurethane patch blends invisibly with your existing hair, adding instant density exactly where you need it. Each patch is custom-made in 100% Indian Remy human hair, matched precisely to your hair colour, texture, and density. Attaches securely with medical-grade adhesive. Can be worn 24/7 including during sleep and swimming.',
 'Crown hair patch in Remy hair. Custom-made for your colour and texture. Waterproof.',
 'Clean area with provided cleanser. Apply adhesive evenly. Position patch and press firmly for 60 seconds. Blend with surrounding hair using included brush. Lasts 2-4 weeks with proper care.',
 '100% Indian Remy human hair, Ultra-thin polyurethane base, Medical-grade waterproof adhesive',
 'hair patch,crown patch,thinning crown,hair loss,hair piece,bald patch',
 '["Waterproof","24/7 Wear","Custom Made"]',
 8999.00, 11999.00, 18.00, 80.00,
 60, 5,
 FALSE, TRUE, FALSE, 'active',
 4.7, 203, 89),

-- 20. Clip-In Extensions
(4, 'Remy Clip-In Hair Extensions Set',
 'remy-clip-in-hair-extensions-set', 'LKN-EXT-001',
 'Instant Volume & Length — Damage-Free',
 'Transform your hair in minutes with our seamless, 100% Remy clip-in extensions. The set includes 7 wefts with secure, comfortable clips that stay in all day without slipping. Unlike tape or bonded extensions, clip-ins are completely damage-free and can be removed every evening. Heat-stylable and dyeable to match your exact shade. Available in 14, 16, 18, and 20-inch lengths.',
 'Remy clip-in extensions set (7 wefts). Instant length & volume, damage-free.',
 'Section hair 2 inches from nape. Open clips, press against roots, and snap shut. Layer wefts upward. Blend with straightener or curler. Remove by opening clips. Store in the provided pouch.',
 '100% Indian Remy human hair, Secure metal clips, 7-weft set',
 'clip-in extensions,hair extensions,volume,length,remy extensions,clip in',
 '["7-Weft Set","Damage-Free","Heat Stylable"]',
 4999.00, 6999.00, 18.00, 120.00,
 75, 10,
 FALSE, FALSE, TRUE, 'active',
 4.6, 167, 82);

-- ================================================================
-- SEED: PRODUCT VARIANTS
-- ================================================================

INSERT INTO product_variants (product_id, name, value, sku, price_modifier, stock_quantity, status, display_order) VALUES
-- Bhringraj Oil variants
(1, 'Size', '100ml', 'LKN-HO-001-100', 0.00, 150, 'active', 1),
-- Bhringraj Hair Mask variants
(6, 'Size', '200g', 'LKN-HM-001-200', 0.00, 200, 'active', 1),
(6, 'Size', '400g', 'LKN-HM-001-400', 300.00, 70, 'active', 2),
-- Shampoo variants
(8, 'Size', '200ml', 'LKN-SH-001-200', 0.00, 300, 'active', 1),
-- Wigs - length variants
(17, 'Length', '4 inches', 'LKN-WIG-001-4', 0.00, 20, 'active', 1),
(17, 'Length', '6 inches', 'LKN-WIG-001-6', 2000.00, 20, 'active', 2),
(17, 'Length', '8 inches', 'LKN-WIG-001-8', 4000.00, 10, 'active', 3),
(18, 'Length', '14 inches', 'LKN-WIG-002-14', 0.00, 15, 'active', 1),
(18, 'Length', '16 inches', 'LKN-WIG-002-16', 2000.00, 15, 'active', 2),
(18, 'Length', '18 inches', 'LKN-WIG-002-18', 4000.00, 10, 'active', 3),
-- Extensions - length variants
(20, 'Length', '14 inch', 'LKN-EXT-001-14', 0.00, 25, 'active', 1),
(20, 'Length', '16 inch', 'LKN-EXT-001-16', 500.00, 25, 'active', 2),
(20, 'Length', '18 inch', 'LKN-EXT-001-18', 1000.00, 15, 'active', 3),
(20, 'Length', '20 inch', 'LKN-EXT-001-20', 1500.00, 10, 'active', 4);

-- ================================================================
-- SEED: PRODUCT INGREDIENTS LINKING
-- ================================================================

INSERT INTO product_ingredients (product_id, ingredient_id, benefit_note, display_order) VALUES
(1, 2, 'Primary active — stimulates hair growth and reverses thinning', 1),
(1, 1, 'Strengthens follicles with natural Vitamin C', 2),
(1, 3, 'Antibacterial scalp protection', 3),
(1, 5, 'Adaptogenic scalp balance', 4),
(1, 4, 'Conditions and adds shine', 5),
(3, 1, 'Primary active — Vitamin C strengthens and prevents greying', 1),
(3, 4, 'Conditions and adds luminescent shine', 2),
(4, 3, 'Primary antibacterial agent — fights dandruff microorganisms', 1),
(4, 5, 'Antiseptic and scalp pH balancing', 2),
(5, 9, 'Revives dormant hair follicles', 1),
(5, 2, 'Scalp circulation stimulator', 2),
(6, 2, 'Primary conditioning and repair agent', 1),
(6, 1, 'Protein strengthening', 2),
(6, 4, 'Deep moisture sealing', 3),
(8, 2, 'Main cleansing botanical', 1),
(8, 1, 'Scalp nourishment', 2),
(8, 3, 'Scalp purification', 3),
(10, 6, 'Primary brightening and illuminating agent', 1),
(10, 7, 'Cooling and purifying complex', 2);

-- ================================================================
-- SEED: TESTIMONIALS
-- ================================================================

INSERT INTO testimonials (name, location, rating, product_used, duration_used, quote, is_featured, display_order, status) VALUES
('Priya Sharma', 'Mumbai, Maharashtra', 5, 'Bhringraj Miracle Hair Oil', '3 months',
 'I was losing 200+ strands daily. After three months with the Bhringraj oil, my hair fall has reduced dramatically. My hair is thicker, shinier, and I have so much new growth. This product literally saved my hair.',
 TRUE, 1, 'active'),
('Ananya Krishnan', 'Chennai, Tamil Nadu', 5, 'Bhringraj Hair Oil + Hair Mask Combo', '6 months',
 'I''ve tried every product out there. Nothing came close to what Luv Kush Natural has done for my hair. The oil penetrates differently — you can feel it working. Six months in and people ask me if I''ve had a hair transplant.',
 TRUE, 2, 'active'),
('Rajesh Mehta', 'Delhi, NCR', 5, 'Men''s Remy Human Hair Wig', '2 months',
 'I was nervous about ordering a wig online. But the consultation process and quality exceeded every expectation. The hairline is completely undetectable. My confidence has returned completely.',
 TRUE, 3, 'active'),
('Kavitha Nair', 'Kochi, Kerala', 5, 'Neem & Tulsi Scalp Serum', '6 weeks',
 'Chronic dandruff for 5 years. Tried clinical shampoos, nothing worked. Six weeks of the Neem & Tulsi serum and my scalp is completely clear. I cried when I first noticed. Thank you, Luv Kush.',
 TRUE, 4, 'active'),
('Sunita Agarwal', 'Jaipur, Rajasthan', 5, 'Kumkumadi Elixir Face Serum', '2 months',
 'This serum is liquid gold. My pigmentation has faded by 70%, my skin glows, and strangers ask me what I''m using. Worth every rupee and more.',
 TRUE, 5, 'active'),
('Deepak Patel', 'Ahmedabad, Gujarat', 5, 'Crown Hair Patch', '3 months',
 'The crown patch is an absolute game changer. I wear it to work every day, go to the gym with it, even swim. No one has ever noticed. The craftsmanship is outstanding.',
 TRUE, 6, 'active'),
('Meera Iyer', 'Bangalore, Karnataka', 4, 'Ayurvedic Hair Ritual Gift Set', '1 month',
 'Gifted this to my mother for her birthday. She called me crying because she loved it so much. The packaging alone is worth sharing on Instagram. Premium in every way.',
 FALSE, 7, 'active'),
('Arjun Reddy', 'Hyderabad, Telangana', 5, 'Anti-Hairfall Complete Ritual Kit', '2 months',
 'The complete kit is the way to go. All three products work together perfectly. My hair fall stopped within 3 weeks. By week 8 I had visible new growth. Follow the routine religiously and it works.',
 FALSE, 8, 'active');

-- ================================================================
-- SEED: COUPONS
-- ================================================================

INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, usage_per_user, valid_from, valid_until, is_active, description, created_at) VALUES
('WELCOME15', 'percentage', 15.00, 500.00, 300.00, 1000, 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE, '15% off for first-time customers', NOW()),
('HAIR20', 'percentage', 20.00, 1000.00, 500.00, 500, 2, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), TRUE, '20% off hair care products', NOW()),
('FLAT200', 'fixed', 200.00, 1500.00, 200.00, 300, 1, NOW(), DATE_ADD(NOW(), INTERVAL 3 MONTH), TRUE, '₹200 flat off on orders above ₹1500', NOW()),
('FREESHIP', 'free_shipping', 0.00, 499.00, NULL, 1000, 3, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE, 'Free shipping on orders above ₹499', NOW());
