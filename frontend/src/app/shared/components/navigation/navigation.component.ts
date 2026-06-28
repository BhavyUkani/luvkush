import {
  Component, OnInit, OnDestroy, HostListener,
  ChangeDetectionStrategy, inject, PLATFORM_ID, signal
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  path: string;
  queryParams?: Record<string, string>;
  children?: NavItem[];
}

@Component({
  selector: 'lk-navigation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  readonly cartService = inject(CartService);
  readonly auth = inject(AuthService);

  isScrolled     = signal(false);
  isMobileOpen   = signal(false);
  activeDropdown = signal<string | null>(null);
  showUserMenu   = signal(false);
  searchOpen     = signal(false);
  searchQuery    = '';

  readonly announcementMessages = [
    'Free delivery on orders above ₹499',
    '100% Ayurvedic & Natural Ingredients',
    'Use code NATURAL10 for 10% off your first order',
  ];
  announcementIndex = signal(0);
  private announcementTimer: ReturnType<typeof setInterval> | null = null;

  readonly navItems: NavItem[] = [
    { label: 'Home', path: '/' },
    {
      label: 'Shop',
      path: '/shop',
      children: [
        { label: 'All Products', path: '/shop' },
        { label: 'Hair Care',    path: '/shop', queryParams: { category: 'hair-care' } },
        { label: 'Hair Wigs',    path: '/shop', queryParams: { category: 'hair-wig' } },
        { label: 'Hair Patches', path: '/shop', queryParams: { category: 'hair-patch' } },
        { label: 'Best Sellers', path: '/shop', queryParams: { sort: 'sales_count' } },
        { label: 'New Arrivals', path: '/shop', queryParams: { sort: 'created_at' } },
      ]
    },
    { label: 'About',   path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  toggleSearch(): void {
    this.searchOpen.update(v => !v);
    if (this.searchOpen() && isPlatformBrowser(this.platformId)) {
      setTimeout(() => (document.querySelector('.nav__search-input') as HTMLInputElement)?.focus(), 50);
    }
  }

  closeSearch(): void {
    this.searchOpen.set(false);
    this.searchQuery = '';
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isScrolled.set(window.scrollY > 60);
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.announcementTimer = setInterval(() => {
        this.announcementIndex.update(i => (i + 1) % this.announcementMessages.length);
      }, 4000);
    }
  }

  ngOnDestroy(): void {
    if (this.announcementTimer) clearInterval(this.announcementTimer);
  }

  toggleMobile(): void {
    this.isMobileOpen.update(v => !v);
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = this.isMobileOpen() ? 'hidden' : '';
    }
  }

  openDropdown(label: string): void {
    this.activeDropdown.set(label);
  }

  closeDropdown(): void {
    this.activeDropdown.set(null);
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
  }

  logout(): void {
    this.auth.logout();
    this.showUserMenu.set(false);
    this.router.navigate(['/']);
  }
}
