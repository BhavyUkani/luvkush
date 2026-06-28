import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // ── Public ───────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Luv Kush Natural — Ayurvedic Hair Care & Beauty'
  },

  // ── Auth ─────────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Sign In — Luv Kush Natural'
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    title: 'Create Account — Luv Kush Natural'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Forgot Password — Luv Kush Natural'
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    title: 'Reset Password — Luv Kush Natural'
  },

  // ── Shop ─────────────────────────────────────────────────────
  {
    path: 'shop',
    loadComponent: () => import('./features/products/collection/collection.component').then(m => m.CollectionComponent),
    title: 'Shop All Products — Luv Kush Natural'
  },
  {
    path: 'category/:slug',
    loadComponent: () => import('./features/products/collection/collection.component').then(m => m.CollectionComponent)
  },
  {
    path: 'products/:slug',
    loadComponent: () => import('./features/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('./features/products/search/search.component').then(m => m.SearchComponent),
    title: 'Search — Luv Kush Natural'
  },

  // ── Hair Solutions ───────────────────────────────────────────
  {
    path: 'hair-wigs',
    loadComponent: () => import('./features/hair-solutions/wigs/wigs-collection.component').then(m => m.WigsCollectionComponent),
    title: 'Hair Wigs Collection — Luv Kush Natural'
  },
  {
    path: 'hair-wigs/:slug',
    loadComponent: () => import('./features/hair-solutions/detail/hair-solution-detail.component').then(m => m.HairSolutionDetailComponent),
  },
  {
    path: 'hair-patches',
    loadComponent: () => import('./features/hair-solutions/patches/patches-collection.component').then(m => m.PatchesCollectionComponent),
    title: 'Hair Patches Collection — Luv Kush Natural'
  },
  {
    path: 'hair-patches/:slug',
    loadComponent: () => import('./features/hair-solutions/detail/hair-solution-detail.component').then(m => m.HairSolutionDetailComponent),
  },

  // ── Cart & Checkout ──────────────────────────────────────────
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent),
    title: 'Your Cart — Luv Kush Natural'
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
    title: 'Checkout — Luv Kush Natural',
    canActivate: [authGuard]
  },

  // ── Account (protected) ───────────────────────────────────────
  {
    path: 'account',
    loadChildren: () => import('./features/account/account.routes').then(m => m.accountRoutes),
    canActivate: [authGuard]
  },

  // ── Admin (protected) ────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes)
  },

  // ── Static & Info ─────────────────────────────────────────────
  {
    path: 'about',
    loadComponent: () => import('./features/static/about/about.component').then(m => m.AboutComponent),
    title: 'About Us — Luv Kush Natural'
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/static/contact/contact.component').then(m => m.ContactComponent),
    title: 'Contact Us — Luv Kush Natural'
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./features/static/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
    title: 'Privacy Policy — Luv Kush Natural'
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/static/terms/terms.component').then(m => m.TermsComponent),
    title: 'Terms & Conditions — Luv Kush Natural'
  },
  {
    path: 'refund-policy',
    loadComponent: () => import('./features/static/refund-policy/refund-policy.component').then(m => m.RefundPolicyComponent),
    title: 'Refund Policy — Luv Kush Natural'
  },
  {
    path: 'shipping-policy',
    loadComponent: () => import('./features/static/shipping-policy/shipping-policy.component').then(m => m.ShippingPolicyComponent),
    title: 'Shipping Policy — Luv Kush Natural'
  },

  // ── Error Pages ───────────────────────────────────────────────
  {
    path: '403',
    loadComponent: () => import('./shared/components/error-pages/forbidden/forbidden.component').then(m => m.ForbiddenComponent),
    title: '403 Forbidden — Luv Kush Natural'
  },
  {
    path: '500',
    loadComponent: () => import('./shared/components/error-pages/server-error/server-error.component').then(m => m.ServerErrorComponent),
    title: '500 Server Error — Luv Kush Natural'
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: '404 Not Found — Luv Kush Natural'
  }
];
