# Luv Kush Natural — Premium Ayurvedic E-Commerce Platform

> Ancient Ayurvedic Wisdom. Modern Hair & Beauty Care.

A fully custom, premium-quality Ayurvedic beauty and hair care e-commerce platform built with Angular 20+, Node.js, and MySQL.

---

## Project Structure

```
luvkush/
├── frontend/          Angular 20+ SSR application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          Services (GSAP, Smooth Scroll, SEO, Cart)
│   │   │   ├── shared/        Navigation, Footer, shared components
│   │   │   └── features/      Page components
│   │   │       ├── home/      Full homepage with all sections
│   │   │       ├── products/  Product listing & detail
│   │   │       ├── admin/     Premium admin panel
│   │   │       └── ...
│   │   └── styles/            Design system (SCSS)
│   └── package.json
├── backend/           Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   └── package.json
└── database/
    └── schema.sql    Complete production MySQL schema
```

---

## Technology Stack

### Frontend
- **Angular 20+** — Standalone components, Signals, SSR
- **GSAP 3** — All animations, scroll triggers, parallax
- **Lenis** — Premium smooth scrolling
- **SCSS** — Custom design system with variables and mixins
- **TypeScript** — Strict mode

### Backend
- **Node.js + Express** — REST API
- **TypeScript** — Strict mode
- **MySQL 2** — Production database with connection pooling
- **JWT** — Access + Refresh token authentication
- **Helmet + Rate Limiting** — Security
- **Sharp** — Image processing (WebP conversion)
- **Nodemailer** — Transactional emails
- **Winston** — Structured logging

### Database
- **MySQL 8+** — 21 production-ready tables
- Full indexing, foreign keys, views
- Supports: Users, Products, Orders, Hair Solutions, Reviews, Blog, Coupons, SEO, Media

---

## Setup

### Prerequisites
- Node.js 20+
- MySQL 8.0+
- npm 9+

### 1. Database Setup
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm start
```

### 4. Production Build
```bash
# Frontend
cd frontend && npm run build:ssr

# Backend
cd backend && npm run build && npm start
```

---

## Design System

### Color Palette
| Token | Color | Hex |
|-------|-------|-----|
| Sandalwood | Deep Brown | `#6B3A2A` |
| Herbal Green | Warm Green | `#3D5A47` |
| Copper | Aged Copper | `#B87333` |
| Ivory | Cream | `#F8F4ED` |
| Gold | Muted Gold | `#C9A84C` |

### Typography
- **Display/Headings**: Cormorant Garamond, Playfair Display, Cinzel
- **Body/UI**: Manrope, Inter

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/products` | List products (paginated, filtered) |
| GET | `/api/v1/products/:slug` | Product detail |
| GET | `/api/v1/products/featured` | Featured products |
| POST | `/api/v1/orders` | Create order |
| GET | `/api/v1/orders/:id` | Order detail |
| GET | `/api/v1/blog` | Blog posts |
| POST | `/api/v1/contact` | Contact query |

---

## Admin Panel

Access at `/admin` — Premium dark theme dashboard featuring:
- Sales analytics with Canvas charts
- Order management with status tracking
- Product & inventory management
- Hair solution (wig/patch) management
- Customer management
- Review moderation
- Blog CMS
- Coupon management
- SEO metadata management
- Media library
- Activity logs
- Settings

---

## SEO Features
- Angular SSR for full server-side rendering
- Dynamic meta tags per page
- Open Graph & Twitter Cards
- Schema.org structured data (Product, Organization, BreadcrumbList)
- Sitemap ready
- Canonical URLs
- Core Web Vitals optimized (lazy loading, WebP images, font preloading)

---

*Crafted with reverence for ancient Ayurvedic wisdom.*
