import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Route imports
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import orderRoutes from './routes/order.routes';
import userRoutes from './routes/user.routes';
import reviewRoutes from './routes/review.routes';
import cartRoutes from './routes/cart.routes';
import wishlistRoutes from './routes/wishlist.routes';
import couponRoutes from './routes/coupon.routes';
import hairSolutionRoutes from './routes/hair-solution.routes';
import hairSolutionAdminRoutes from './routes/hair-solution-admin.routes';
import blogRoutes from './routes/blog.routes';
import contactRoutes from './routes/contact.routes';
import adminRoutes from './routes/admin.routes';
import mediaRoutes from './routes/media.routes';
import seoRoutes from './routes/seo.routes';
import newsletterRoutes from './routes/newsletter.routes';
import paymentRoutes from './routes/payment.routes';

const app: Application = express();

// ── Security headers ─────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

// ── CORS ────────────────────────────────
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ── Compression ──────────────────────────
app.use(compression());

// ── Body parsing ─────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Request logging ──────────────────────
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message: string) => logger.http(message.trim()) }
  }));
}

// ── Global rate limiting ─────────────────
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again after some time.'
  }
});
app.use(`${config.apiPrefix}`, limiter);

// ── Static files ─────────────────────────
app.use('/uploads', express.static('uploads', {
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// ── Health check ─────────────────────────
app.get(`${config.apiPrefix}/health`, (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Luv Kush Natural API'
  });
});

// ── API Routes ───────────────────────────
const prefix = config.apiPrefix;

app.use(`${prefix}/auth`,          authRoutes);
app.use(`${prefix}/products`,      productRoutes);
app.use(`${prefix}/categories`,    categoryRoutes);
app.use(`${prefix}/orders`,        orderRoutes);
app.use(`${prefix}/users`,         userRoutes);
app.use(`${prefix}/account`,       userRoutes);
app.use(`${prefix}/reviews`,       reviewRoutes);
app.use(`${prefix}/cart`,          cartRoutes);
app.use(`${prefix}/wishlist`,      wishlistRoutes);
app.use(`${prefix}/coupons`,       couponRoutes);
app.use(`${prefix}/hair-solutions`, hairSolutionRoutes);
app.use(`${prefix}/admin/hair-solutions`, hairSolutionAdminRoutes);
app.use(`${prefix}/blog`,          blogRoutes);
app.use(`${prefix}/contact`,       contactRoutes);
app.use(`${prefix}/admin`,         adminRoutes);
app.use(`${prefix}/media`,         mediaRoutes);
app.use(`${prefix}/seo`,           seoRoutes);
app.use(`${prefix}/newsletter`,    newsletterRoutes);
app.use(`${prefix}/payment`,       paymentRoutes);

// ── Error handling ───────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
