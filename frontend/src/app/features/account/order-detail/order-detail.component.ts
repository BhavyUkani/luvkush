import { Component, OnInit, inject, signal, ChangeDetectionStrategy, PLATFORM_ID } from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { RouterLink, ActivatedRoute } from "@angular/router";
import { ApiService } from "../../../core/services/api.service";
import { AccountNavComponent } from "../account-nav/account-nav.component";
import { imageUrl } from "../../../shared/utils/image-url";

@Component({
  selector: "lk-order-detail",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, AccountNavComponent],
  templateUrl: "./order-detail.component.html",
  styleUrls: ["./order-detail.component.scss"]
})
export class OrderDetailComponent implements OnInit {
  private readonly api        = inject(ApiService);
  private readonly route      = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  order   = signal<any>(null);
  loading = signal(true);
  error   = signal('');
  readonly imgUrl = imageUrl;

  readonly STEPS = ["Order Placed", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

  ngOnInit(): void {
    const id = this.route.snapshot.params["id"];
    this.api.get(`/orders/my/${id}`).subscribe({
      next: (res: any) => {
        const o = res.data;
        // Parse shipping_address if it's a JSON string
        if (o && typeof o.shipping_address === 'string') {
          try { o.shipping_address = JSON.parse(o.shipping_address); } catch { /* keep as-is */ }
        }
        this.order.set(o);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Order not found');
        this.loading.set(false);
      }
    });
  }

  stepIndex(status: string): number {
    const map: Record<string, number> = {
      pending: 0, confirmed: 1, processing: 1, quality_check: 2, shipped: 2, out_for_delivery: 3, delivered: 4
    };
    return map[status] ?? 0;
  }

  downloadInvoice(): void {
    const o = this.order();
    if (!o || !isPlatformBrowser(this.platformId)) return;
    const w = window.open('', '_blank');
    if (w) { w.document.write(this.buildInvoiceHtml(o)); w.document.close(); }
  }

  private buildInvoiceHtml(o: any): string {
    const addr = o.shipping_address || {};
    const addrStr = [addr.full_name, addr.address_line1, addr.address_line2,
      `${addr.city || ''}, ${addr.state || ''} ${addr.pincode || ''}`, addr.country]
      .filter(Boolean).join('<br>');

    const rows = (o.items ?? []).map((item: any) => `
      <tr>
        <td>${item.product_name || '—'}</td>
        <td>${item.variant_name || '—'}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">₹${Number(item.unit_price).toFixed(2)}</td>
        <td style="text-align:right">₹${Number(item.total_amount).toFixed(2)}</td>
      </tr>`).join('');

    const fmt = (v: any) => `₹${Number(v || 0).toFixed(2)}`;
    const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
    const pmLabel = o.payment_method === 'cod' ? 'Cash on Delivery' : (o.payment_method || '—').toUpperCase();

    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Invoice — ${o.order_number}</title>
<style>
  *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:32px;color:#333;max-width:800px;margin:0 auto;font-size:13px}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #6B3A2A;padding-bottom:16px;margin-bottom:20px}
  .brand{font-size:22px;font-weight:700;color:#6B3A2A}.sub{color:#888;font-size:12px;line-height:1.7}
  .inv-label{font-size:18px;font-weight:700;color:#6B3A2A;text-align:right}.inv-meta{text-align:right;line-height:1.9}
  .cols{display:flex;gap:20px;margin-bottom:20px}.col{flex:1}
  .col-title{font-size:11px;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:4px;letter-spacing:.05em}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th{background:#6B3A2A;color:#fff;padding:9px 10px;text-align:left;font-size:12px}
  td{padding:9px 10px;border-bottom:1px solid #eee;font-size:12px}
  tr:last-child td{border-bottom:none}
  .tot{margin-top:16px;text-align:right}.tot table{width:auto;margin-left:auto}
  .tot td{padding:4px 12px}.tot .grand td{font-weight:700;font-size:14px;background:#f9f5f3;padding:8px 12px}
  .footer{margin-top:32px;border-top:1px solid #eee;padding-top:12px;font-size:11px;color:#999;text-align:center}
  .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;background:#e8f5e9;color:#2e7d32;font-weight:700}
  @media print{body{padding:16px}.no-print{display:none}}
</style></head><body>
<div class="hdr">
  <div>
    <div class="brand">Luv Kush Natural</div>
    <div class="sub">Premium Ayurvedic Beauty &amp; Hair Care<br>info@luvkushnatural.com · www.luvkushnatural.com</div>
  </div>
  <div>
    <div class="inv-label">TAX INVOICE</div>
    <div class="inv-meta">
      <strong>Order #${o.order_number}</strong><br>
      Date: ${fmtDate(o.created_at)}<br>
      Status: <span class="badge">${(o.status || '').toUpperCase()}</span>
    </div>
  </div>
</div>
<div class="cols">
  <div class="col"><div class="col-title">Bill To</div>
    <strong>${o.first_name || ''} ${o.last_name || ''}</strong><br>${o.email || ''}<br>${o.user_phone || ''}</div>
  <div class="col"><div class="col-title">Ship To</div>${addrStr}</div>
  <div class="col"><div class="col-title">Payment</div>
    Method: ${pmLabel}<br>Status: ${(o.payment_status || '').toUpperCase()}
    ${o.razorpay_payment_id ? `<br>Txn: ${o.razorpay_payment_id}` : ''}
    ${o.paid_at ? `<br>Paid: ${fmtDate(o.paid_at)}` : ''}</div>
</div>
<table>
  <thead><tr><th>Product</th><th>Variant</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="tot"><table>
  <tr><td>Subtotal</td><td style="text-align:right">${fmt(o.subtotal)}</td></tr>
  ${Number(o.discount_amount) > 0 ? `<tr><td>Discount</td><td style="text-align:right;color:#2e7d32">−${fmt(o.discount_amount)}</td></tr>` : ''}
  <tr><td>Shipping</td><td style="text-align:right">${Number(o.shipping_amount) === 0 ? 'FREE' : fmt(o.shipping_amount)}</td></tr>
  <tr><td>Tax (GST)</td><td style="text-align:right">${fmt(o.tax_amount)}</td></tr>
  <tr class="grand"><td><strong>Grand Total</strong></td><td style="text-align:right"><strong>${fmt(o.total_amount)}</strong></td></tr>
  ${o.advance_paid_amount ? `<tr><td>Advance Paid</td><td style="text-align:right">${fmt(o.advance_paid_amount)}</td></tr>
  <tr><td>Balance Due on Delivery</td><td style="text-align:right">${fmt(Number(o.total_amount) - Number(o.advance_paid_amount))}</td></tr>` : ''}
</table></div>
<div class="footer">Thank you for shopping with Luv Kush Natural. For queries contact info@luvkushnatural.com<br>
This is a computer-generated invoice and does not require a physical signature.</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`;
  }
}