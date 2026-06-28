import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lk-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();

  readonly footerLinks = [
    {
      heading: 'Shop',
      links: [
        { label: 'All Products', path: '/shop' },
        { label: 'Hair Oils', path: '/category/hair-oil' },
        { label: 'Hair Wigs', path: '/category/hair-wig' },
        { label: 'Hair Patches', path: '/category/hair-patch' },
      ]
    },
    {
      heading: 'Account',
      links: [
        { label: 'My Orders', path: '/account/orders' },
        { label: 'Wishlist', path: '/account/wishlist' },
        { label: 'Saved Addresses', path: '/account/addresses' },
        { label: 'Profile Settings', path: '/account/profile' },
      ]
    },
    {
      heading: 'Company',
      links: [
        { label: 'About Us', path: '/about' },
        { label: 'Contact Us', path: '/contact' },
        { label: 'Privacy Policy', path: '/privacy-policy' },
        { label: 'Terms & Conditions', path: '/terms' },
      ]
    },
    {
      heading: 'Support',
      links: [
        { label: 'Track Order', path: '/account/orders' },
        { label: 'Refund Policy', path: '/refund-policy' },
        { label: 'Shipping Policy', path: '/shipping-policy' },
        { label: 'Search', path: '/search' },
      ]
    }
  ];
}
