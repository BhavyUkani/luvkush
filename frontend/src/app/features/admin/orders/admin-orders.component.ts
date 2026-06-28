import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { imageUrl } from '../../../shared/utils/image-url';

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  item_count?: number;
}

interface ShippingAddress {
  full_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
}

interface OrderDetail extends Order {
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  coupon_code: string | null;
  coupon_discount: number | null;
  special_instructions: string | null;
  shipping_address: string | ShippingAddress;
  user_phone: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  mrp: number;
  total_amount: number;
  primary_image: string | null;
  product_slug: string | null;
  sku?: string;
}

interface TrackingEvent {
  label: string;
  done: boolean;
  active: boolean;
  date?: string;
}

const ALL_STATUSES = [
  'pending','confirmed','processing','quality_check','shipped',
  'out_for_delivery','delivered','cancelled','refund_requested','refunded','returned'
];

@Component({
  selector: 'lk-admin-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Orders <span class="count">{{ total() }}</span></h1>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <input type="text" class="search-input" placeholder="Search by order # or customer..." [(ngModel)]="searchQ" (input)="onSearch()" />
        <select class="filter-select" [(ngModel)]="statusFilter" (change)="load()">
          <option value="">All Statuses</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ formatStatus(s) }}</option>
          }
        </select>
      </div>

      <!-- Bulk Actions Bar -->
      @if (selectedIds().size > 0) {
        <div class="bulk-bar">
          <span class="bulk-count">{{ selectedIds().size }} selected</span>
          <select class="bulk-select" [(ngModel)]="bulkAction">
            <option value="">Bulk Action...</option>
            <option value="confirm">Mark Confirmed</option>
            <option value="cancel">Mark Cancelled</option>
          </select>
          <button class="btn-bulk-apply" [disabled]="!bulkAction" (click)="applyBulk()">Apply</button>
          <button class="btn-bulk-clear" (click)="clearSelection()">✕ Clear</button>
        </div>
      }

      @if (loading()) {
        <div class="loading">Loading orders...</div>
      } @else if (error()) {
        <div class="error-msg">{{ error() }} <button (click)="load()">Retry</button></div>
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:36px">
                <input type="checkbox" class="cb" [checked]="allSelected()" (change)="toggleSelectAll()" />
              </th>
              <th>Order #</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (o of orders(); track o.id) {
              <tr [class.row-selected]="selectedIds().has(o.id)">
                <td>
                  <input type="checkbox" class="cb" [checked]="selectedIds().has(o.id)" (change)="toggleSelect(o.id)" />
                </td>
                <td><strong>{{ o.order_number }}</strong></td>
                <td>
                  <div class="cust-name">{{ o.first_name }} {{ o.last_name }}</div>
                  <div class="cust-email">{{ o.email }}</div>
                </td>
                <td>₹{{ o.total_amount | number:'1.0-0' }}</td>
                <td>
                  <span class="badge" [class]="'pay-' + o.payment_status">{{ o.payment_status }}</span>
                  <div class="muted-sm">{{ o.payment_method }}</div>
                </td>
                <td>
                  <select class="inline-select" [(ngModel)]="o.status" (change)="changeStatus(o)">
                    @for (s of statuses; track s) {
                      <option [value]="s">{{ formatStatus(s) }}</option>
                    }
                  </select>
                </td>
                <td class="muted">{{ o.created_at | date:'dd MMM, HH:mm' }}</td>
                <td>
                  <div class="action-btns">
                    <button class="btn-sm btn-view" (click)="viewDetail(o)">View</button>
                    @if (o.tracking_number) {
                      <button class="btn-sm btn-tracking" (click)="openTracking(o)">Tracking</button>
                    } @else {
                      <button class="btn-sm btn-book" (click)="openTracking(o)">Ship</button>
                    }
                  </div>
                </td>
              </tr>
            }
            @if (!orders().length) {
              <tr><td colspan="8" class="empty-cell">No orders found</td></tr>
            }
          </tbody>
        </table>

        @if (pages() > 1) {
          <div class="pagination">
            <button [disabled]="page() === 1" (click)="goPage(page() - 1)">← Prev</button>
            <span>Page {{ page() }} of {{ pages() }}</span>
            <button [disabled]="page() === pages()" (click)="goPage(page() + 1)">Next →</button>
          </div>
        }
      }
    </div>

    <!-- ═══════════════════════════════════════════════════
         ORDER DETAIL MODAL (P1 + P2)
    ═══════════════════════════════════════════════════ -->
    @if (detailOrder()) {
      <div class="modal-backdrop" (click)="closeDetail()">
        <div class="detail-modal" (click)="$event.stopPropagation()">

          <div class="modal-header">
            <div>
              <h2>Order {{ detailOrder()!.order_number }}</h2>
              <div class="header-meta">
                {{ detailOrder()!.created_at | date:'dd MMM yyyy, h:mm a' }} &nbsp;·&nbsp;
                <span class="status-chip" [class]="'sc-' + detailOrder()!.status">{{ formatStatus(detailOrder()!.status) }}</span>
              </div>
            </div>
            <button class="modal-close" (click)="closeDetail()">✕</button>
          </div>

          @if (loadingDetail()) {
            <div class="detail-loading">Loading order details...</div>
          } @else {
            <div class="detail-body">

              <!-- Row 1: Customer + Shipping side by side -->
              <div class="detail-row-2">
                <div class="detail-card">
                  <div class="dc-title">Customer</div>
                  <div class="dc-val fw">{{ detailOrder()!.first_name }} {{ detailOrder()!.last_name }}</div>
                  <div class="dc-val">{{ detailOrder()!.email }}</div>
                  <div class="dc-val">{{ detailOrder()!.user_phone || detailOrder()!.phone || '—' }}</div>
                </div>
                <div class="detail-card">
                  <div class="dc-title">Shipping Address</div>
                  @if (shippingAddr()) {
                    <div class="dc-val fw">{{ shippingAddr()!.full_name || (detailOrder()!.first_name + ' ' + detailOrder()!.last_name) }}</div>
                    <div class="dc-val">{{ shippingAddr()!.address_line1 }}{{ shippingAddr()!.address_line2 ? ', ' + shippingAddr()!.address_line2 : '' }}</div>
                    <div class="dc-val">{{ shippingAddr()!.city }}, {{ shippingAddr()!.state }} – {{ shippingAddr()!.pincode }}</div>
                    <div class="dc-val">{{ shippingAddr()!.phone || '—' }}</div>
                  } @else {
                    <div class="dc-val muted">Address not available</div>
                  }
                </div>
                <div class="detail-card">
                  <div class="dc-title">Payment</div>
                  <div class="dc-val fw">{{ formatPaymentMethod(detailOrder()!.payment_method) }}</div>
                  <span class="badge" [class]="'pay-' + detailOrder()!.payment_status">{{ detailOrder()!.payment_status }}</span>
                  @if (detailOrder()?.coupon_code) {
                    <div class="dc-val muted" style="margin-top:0.5rem">Coupon: {{ detailOrder()?.coupon_code }}</div>
                  }
                </div>
              </div>

              <!-- Products Table -->
              <div class="detail-card" style="margin-top:1rem">
                <div class="dc-title">Products</div>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th style="width:44px"></th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of detailOrder()?.items || []; track item.id) {
                      <tr>
                        <td>
                          @if (item.primary_image) {
                            <img [src]="imgUrl(item.primary_image)" class="item-thumb" [alt]="item.product_name" />
                          } @else {
                            <div class="item-thumb-empty"></div>
                          }
                        </td>
                        <td>
                          <div class="item-name">{{ item.product_name }}</div>
                          @if (item.variant_name) { <div class="item-variant">{{ item.variant_name }}</div> }
                        </td>
                        <td>{{ item.quantity }}</td>
                        <td>₹{{ item.unit_price | number:'1.0-0' }}</td>
                        <td class="fw">₹{{ item.total_amount | number:'1.0-0' }}</td>
                      </tr>
                    }
                    @if (!(detailOrder()?.items?.length)) {
                      <tr><td colspan="5" class="empty-cell">No items</td></tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Order Summary -->
              <div class="detail-row-2" style="margin-top:1rem">
                <div class="detail-card summary-card">
                  <div class="dc-title">Order Summary</div>
                  <div class="summary-row"><span>Subtotal</span><span>₹{{ detailOrder()?.subtotal | number:'1.0-0' }}</span></div>
                  @if ((detailOrder()?.discount_amount ?? 0) > 0) {
                    <div class="summary-row green"><span>Discount</span><span>–₹{{ detailOrder()?.discount_amount | number:'1.0-0' }}</span></div>
                  }
                  <div class="summary-row"><span>Shipping</span><span>{{ (detailOrder()?.shipping_amount ?? 0) > 0 ? '₹' + (detailOrder()?.shipping_amount | number:'1.0-0') : 'Free' }}</span></div>
                  <div class="summary-row"><span>Tax (GST)</span><span>₹{{ detailOrder()?.tax_amount | number:'1.0-0' }}</span></div>
                  <div class="summary-row total"><span>Grand Total</span><span>₹{{ detailOrder()!.total_amount | number:'1.0-0' }}</span></div>
                </div>

                <!-- Tracking status (if shipped) -->
                @if (detailOrder()!.tracking_number) {
                  <div class="detail-card">
                    <div class="dc-title">Shipment</div>
                    <div class="dc-val fw">AWB: {{ detailOrder()!.tracking_number }}</div>
                    @if (detailOrder()!.tracking_url) {
                      <a [href]="detailOrder()!.tracking_url" target="_blank" class="track-link">Track Package ↗</a>
                    }
                    <!-- Timeline -->
                    <div class="timeline" style="margin-top:1rem">
                      @for (ev of trackingTimeline(); track ev.label) {
                        <div class="tl-item" [class.tl-done]="ev.done" [class.tl-active]="ev.active">
                          <div class="tl-dot"></div>
                          <div class="tl-info">
                            <div class="tl-label">{{ ev.label }}</div>
                            @if (ev.date) { <div class="tl-date">{{ ev.date }}</div> }
                          </div>
                        </div>
                      }
                    </div>
                    @if (loadingTracking()) {
                      <div style="font-size:0.75rem;color:#888;margin-top:0.5rem">Fetching live status...</div>
                    }
                  </div>
                }
              </div>

              <!-- ── SHIPROCKET BOOKING CARD (P2) — shown when NOT shipped ── -->
              @if (!detailOrder()!.tracking_number) {
                <div class="detail-card shipment-card" style="margin-top:1rem">
                  <div class="dc-title" style="display:flex;align-items:center;gap:0.5rem">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B87333" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    Book Shipment via Shiprocket
                  </div>

                  <div class="ship-meta">
                    <span><strong>Pickup:</strong> Rajkot, Gujarat 360003</span>
                    <span><strong>Weight:</strong> 0.5 kg (default)</span>
                    <span><strong>Dims:</strong> 10×10×10 cm</span>
                    @if (shippingAddr()) {
                      <span><strong>Destination:</strong> {{ shippingAddr()!.pincode }}</span>
                    }
                  </div>

                  @if (loadingCouriers()) {
                    <div class="couriers-loading">
                      <span class="spinner-sm"></span> Fetching courier rates...
                    </div>
                  } @else if (couriersError()) {
                    <div class="error-msg">{{ couriersError() }}</div>
                  } @else if (couriers().length > 0) {
                    <div class="couriers-list">
                      @for (c of couriers(); track c.courier_company_id) {
                        <div class="courier-card" (click)="selectCourier(c)">
                          <div>
                            <div class="courier-name">{{ c.courier_name }}</div>
                            <div class="courier-meta">
                              <span>ETD: <strong>{{ c.etd }}</strong></span>
                              <span>★ {{ c.rating }}</span>
                              <span class="cod-tag" [class.cod-yes]="c.cod">{{ c.cod ? 'COD' : 'Prepaid' }}</span>
                            </div>
                          </div>
                          <div class="courier-right">
                            <div class="courier-rate">₹{{ c.rate }}</div>
                            <button class="btn-book-sm"
                              [disabled]="bookingCourierId() !== null"
                              (click)="bookShipment(c); $event.stopPropagation()">
                              {{ bookingCourierId() === c.courier_company_id ? 'Booking...' : 'Book' }}
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="muted" style="font-size:0.8rem;padding:0.5rem 0">No couriers available for this pincode.</div>
                  }

                  @if (bookSuccessMsg()) {
                    <div class="success-msg">✓ {{ bookSuccessMsg() }}</div>
                  }
                  @if (trackError()) {
                    <div class="error-msg" style="margin-top:0.75rem">{{ trackError() }}</div>
                  }
                </div>
              }

              <!-- Special instructions -->
              @if (detailOrder()?.special_instructions) {
                <div class="detail-card" style="margin-top:1rem">
                  <div class="dc-title">Special Instructions</div>
                  <div class="dc-val">{{ detailOrder()?.special_instructions }}</div>
                </div>
              }

            </div>
          }

          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeDetail()">Close</button>
            <button class="btn-secondary" (click)="openTracking(detailOrder()!)">Manual Tracking</button>
          </div>
        </div>
      </div>
    }

    <!-- ═══════════════════════════════════════════════════
         TRACKING MODAL (manual entry)
    ═══════════════════════════════════════════════════ -->
    @if (trackingOrder()) {
      <div class="modal-backdrop" (click)="closeTracking()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ trackingOrder()?.tracking_number ? 'Update Tracking' : 'Manual Tracking Entry' }} — {{ trackingOrder()!.order_number }}</h2>
            <button class="modal-close" (click)="closeTracking()">✕</button>
          </div>
          <div class="modal-body">
            @if (trackingOrder()?.tracking_number) {
              <div class="active-shipment-card">
                <div style="font-weight:700;color:#276749;font-size:0.875rem">✓ Active Shipment</div>
                <div class="dc-val">AWB: <strong>{{ trackingOrder()?.tracking_number }}</strong></div>
                @if (trackingOrder()?.tracking_url) {
                  <a [href]="trackingOrder()?.tracking_url" target="_blank" class="track-link">Track ↗</a>
                }
              </div>
            }
            <div class="field">
              <label>Tracking Number</label>
              <input type="text" [(ngModel)]="trackingNum" class="form-input" placeholder="e.g. DTDC1234567890" />
            </div>
            <div class="field" style="margin-top:1rem">
              <label>Tracking URL</label>
              <input type="text" [(ngModel)]="trackingUrl" class="form-input" placeholder="https://dtdc.com/track/..." />
            </div>
            @if (trackError()) { <div class="error-msg" style="margin-top:1rem">{{ trackError() }}</div> }
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeTracking()">Cancel</button>
            <button class="btn-primary" (click)="saveTracking()" [disabled]="trackSaving()">
              {{ trackSaving() ? 'Saving...' : 'Save Tracking' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Bulk confirm modal -->
    @if (showBulkConfirm()) {
      <div class="modal-backdrop" (click)="showBulkConfirm.set(false)">
        <div class="modal confirm-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Confirm Bulk Action</h2>
            <button class="modal-close" (click)="showBulkConfirm.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <p>Apply <strong>{{ bulkActionLabel() }}</strong> to <strong>{{ selectedIds().size }}</strong> orders?</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="showBulkConfirm.set(false)">Cancel</button>
            <button class="btn-primary" (click)="executeBulk()" [disabled]="bulkRunning()">
              {{ bulkRunning() ? 'Applying...' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1440px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.375rem; font-weight: 700; color: #1C1C1C; margin: 0; display: flex; align-items: center; gap: 0.5rem; letter-spacing: -0.01em; }
    .count { font-size: 0.8rem; font-weight: 500; color: #888; background: #F0F0F0; padding: 2px 8px; border-radius: 20px; }
    .filter-bar { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .search-input, .filter-select { padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #E8E8E8; border-radius: 6px; color: #333; font-size: 0.875rem; outline: none; transition: border-color 0.15s; }
    .search-input:focus, .filter-select:focus { border-color: #B87333; }
    .search-input { flex: 1; min-width: 200px; }
    .search-input::placeholder { color: #AAAAAA; }

    /* Bulk bar */
    .bulk-bar { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem; background: rgba(184,115,51,0.06); border: 1px solid rgba(184,115,51,0.2); border-radius: 6px; margin-bottom: 1rem; }
    .bulk-count { font-size: 0.8rem; font-weight: 600; color: #B87333; }
    .bulk-select { padding: 0.4rem 0.6rem; border: 1px solid #E8E8E8; border-radius: 4px; font-size: 0.8rem; outline: none; background: #fff; }
    .btn-bulk-apply { padding: 0.35rem 0.75rem; background: #B87333; color: #fff; border: none; border-radius: 4px; font-size: 0.8rem; cursor: pointer; }
    .btn-bulk-apply:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-bulk-clear { padding: 0.35rem 0.75rem; background: none; border: 1px solid #E8E8E8; color: #888; border-radius: 4px; font-size: 0.8rem; cursor: pointer; }

    .loading { color: #888; padding: 2rem; }
    .error-msg { color: #DC2626; padding: 0.75rem; background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.15); border-radius: 6px; margin-bottom: 1rem; font-size: 0.875rem; }
    .success-msg { color: #15803D; padding: 0.75rem; background: rgba(21,128,61,0.06); border: 1px solid rgba(21,128,61,0.2); border-radius: 6px; margin-top: 0.75rem; font-size: 0.875rem; font-weight: 600; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; background: #fff; border: 1px solid #E8E8E8; border-radius: 8px; overflow: hidden; }
    .data-table th { text-align: left; padding: 0.65rem 0.875rem; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #888; background: #FAFAFA; border-bottom: 1px solid #E8E8E8; }
    .data-table td { padding: 0.7rem 0.875rem; border-bottom: 1px solid #F0F0F0; color: #333; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #F7F8FA; }
    .row-selected td { background: rgba(184,115,51,0.05) !important; }
    .cb { width: 15px; height: 15px; cursor: pointer; accent-color: #B87333; }
    .cust-name { font-weight: 600; color: #1C1C1C; }
    .cust-email { font-size: 0.75rem; color: #888; margin-top: 2px; }
    .muted { color: #888; }
    .muted-sm { font-size: 0.7rem; color: #888; margin-top: 2px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 20px; font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; background: #F0F0F0; color: #888; }
    .pay-paid { background: rgba(21,128,61,0.09); color: #15803D; }
    .pay-pending { background: rgba(180,83,9,0.1); color: #B45309; }
    .pay-failed { background: rgba(220,38,38,0.09); color: #DC2626; }
    .inline-select { background: #fff; border: 1px solid #E8E8E8; border-radius: 4px; color: #333; font-size: 0.75rem; padding: 4px 6px; cursor: pointer; max-width: 170px; outline: none; }
    .inline-select:focus { border-color: #B87333; }
    .action-btns { display: flex; gap: 0.4rem; }
    .btn-sm { padding: 4px 10px; background: #F7F8FA; border: 1px solid #E8E8E8; color: #555; border-radius: 4px; font-size: 0.75rem; cursor: pointer; transition: background 0.15s; }
    .btn-sm:hover { background: #F0F0F0; }
    .btn-view { background: rgba(184,115,51,0.08); border-color: rgba(184,115,51,0.3); color: #B87333; }
    .btn-view:hover { background: rgba(184,115,51,0.15); }
    .btn-book { background: #B87333; color: #fff; border-color: #B87333; }
    .btn-book:hover { background: #9d5d22; border-color: #9d5d22; }
    .btn-tracking { background: #F7F8FA; border: 1px solid #E8E8E8; color: #555; }
    .btn-tracking:hover { background: #F0F0F0; }
    .btn-primary { padding: 0.5rem 1.25rem; background: #B87333; color: #fff; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { padding: 0.5rem 1.25rem; background: #fff; border: 1px solid #E8E8E8; color: #555; border-radius: 6px; font-size: 0.875rem; cursor: pointer; transition: background 0.15s; }
    .btn-secondary:hover { background: #F7F8FA; }
    .empty-cell { text-align: center; color: #AAAAAA; padding: 3rem; font-style: italic; }
    .pagination { display: flex; gap: 1rem; align-items: center; justify-content: center; margin-top: 1.5rem; font-size: 0.875rem; color: #888; }
    .pagination button { padding: 0.4rem 0.75rem; background: #fff; border: 1px solid #E8E8E8; color: #555; border-radius: 4px; cursor: pointer; font-size: 0.8rem; transition: background 0.15s; }
    .pagination button:hover { background: #F7F8FA; }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Modal shared */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .modal { background: #fff; border: 1px solid #E8E8E8; border-radius: 12px; width: 100%; max-width: 560px; box-shadow: 0 8px 40px rgba(0,0,0,0.12); }
    .confirm-modal { max-width: 440px; }
    .modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.25rem 1.5rem; border-bottom: 1px solid #E8E8E8; }
    .modal-header h2 { font-size: 1rem; font-weight: 700; color: #1C1C1C; margin: 0; }
    .modal-close { background: none; border: none; color: #888; font-size: 1rem; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: color 0.15s; flex-shrink: 0; }
    .modal-close:hover { color: #1C1C1C; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid #E8E8E8; }

    /* Order detail modal */
    .detail-modal {
      background: #fff; border: 1px solid #E8E8E8; border-radius: 12px;
      width: 100%; max-width: 900px; max-height: 92vh;
      display: flex; flex-direction: column;
      box-shadow: 0 8px 40px rgba(0,0,0,0.15);
    }
    .detail-loading { padding: 2rem; text-align: center; color: #888; }
    .header-meta { font-size: 0.78rem; color: #888; margin-top: 2px; display: flex; align-items: center; gap: 0.5rem; }
    .status-chip { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 0.68rem; font-weight: 600; text-transform: uppercase; background: #F0F0F0; color: #888; }
    .sc-pending { background: rgba(180,83,9,0.1); color: #B45309; }
    .sc-confirmed,.sc-processing,.sc-quality_check { background: rgba(37,99,235,0.08); color: #1D4ED8; }
    .sc-shipped,.sc-out_for_delivery { background: rgba(124,58,237,0.08); color: #6D28D9; }
    .sc-delivered { background: rgba(21,128,61,0.08); color: #15803D; }
    .sc-cancelled,.sc-returned { background: rgba(220,38,38,0.08); color: #DC2626; }
    .detail-body { padding: 1.25rem 1.5rem; overflow-y: auto; flex: 1; min-height: 0; }
    .detail-row-2 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }
    .detail-card { background: #FAFAFA; border: 1px solid #E8E8E8; border-radius: 8px; padding: 1rem; }
    .shipment-card { background: #fff; border-color: rgba(184,115,51,0.25); }
    .dc-title { font-size: 0.67rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #AAAAAA; margin-bottom: 0.5rem; }
    .dc-val { font-size: 0.8125rem; color: #4A5568; margin-top: 2px; }
    .fw { font-weight: 600; color: #1C1C1C !important; }

    /* Items table */
    .items-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; margin-top: 0.5rem; }
    .items-table th { text-align: left; padding: 0.4rem 0.5rem; font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #888; border-bottom: 1px solid #E8E8E8; }
    .items-table td { padding: 0.6rem 0.5rem; border-bottom: 1px solid #F0F0F0; vertical-align: middle; }
    .items-table tr:last-child td { border-bottom: none; }
    .item-thumb { width: 36px; height: 36px; object-fit: cover; border-radius: 4px; border: 1px solid #E8E8E8; }
    .item-thumb-empty { width: 36px; height: 36px; background: #F0F0F0; border-radius: 4px; }
    .item-name { font-weight: 600; color: #1C1C1C; }
    .item-variant { font-size: 0.75rem; color: #888; margin-top: 1px; }

    /* Summary */
    .summary-card { grid-column: 1; }
    .summary-row { display: flex; justify-content: space-between; padding: 0.35rem 0; font-size: 0.8125rem; color: #4A5568; border-bottom: 1px solid #F0F0F0; }
    .summary-row:last-child { border-bottom: none; }
    .summary-row.green { color: #15803D; }
    .summary-row.total { font-weight: 700; color: #1C1C1C; font-size: 0.9375rem; border-top: 1px solid #E8E8E8; padding-top: 0.5rem; margin-top: 0.25rem; border-bottom: none; }

    /* Track link */
    .track-link { font-size: 0.75rem; color: #B87333; font-weight: 600; text-decoration: underline; display: inline-block; margin-top: 0.25rem; }

    /* Timeline */
    .timeline { display: flex; flex-direction: column; gap: 0; }
    .tl-item { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.4rem 0; position: relative; }
    .tl-item:not(:last-child)::after { content: ''; position: absolute; left: 7px; top: 24px; bottom: -4px; width: 2px; background: #E8E8E8; }
    .tl-item.tl-done::after { background: #15803D; }
    .tl-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #E8E8E8; background: #fff; flex-shrink: 0; margin-top: 1px; }
    .tl-item.tl-done .tl-dot { background: #15803D; border-color: #15803D; }
    .tl-item.tl-active .tl-dot { background: #B87333; border-color: #B87333; box-shadow: 0 0 0 3px rgba(184,115,51,0.2); }
    .tl-label { font-size: 0.78rem; font-weight: 600; color: #888; }
    .tl-item.tl-done .tl-label, .tl-item.tl-active .tl-label { color: #1C1C1C; }
    .tl-date { font-size: 0.68rem; color: #AAAAAA; margin-top: 1px; }

    /* Shiprocket section */
    .ship-meta { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.78rem; color: #555; margin-bottom: 1rem; }
    .couriers-loading { font-size: 0.8rem; color: #888; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; }
    .couriers-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 220px; overflow-y: auto; }
    .courier-card { display: flex; align-items: center; justify-content: space-between; padding: 0.7rem 0.875rem; border: 1.5px solid #E8E8E8; border-radius: 6px; cursor: pointer; background: #FAFAFA; transition: border-color 0.15s; }
    .courier-card:hover { border-color: #B87333; background: #fff; }
    .courier-name { font-weight: 600; color: #1C1C1C; font-size: 0.875rem; }
    .courier-meta { font-size: 0.72rem; color: #888; margin-top: 2px; display: flex; gap: 0.75rem; align-items: center; }
    .cod-tag { padding: 1px 5px; border-radius: 3px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; background: rgba(220,38,38,0.08); color: #DC2626; }
    .cod-tag.cod-yes { background: rgba(21,128,61,0.08); color: #15803D; }
    .courier-right { text-align: right; }
    .courier-rate { font-weight: 700; color: #B87333; font-size: 0.9375rem; }
    .btn-book-sm { padding: 4px 10px; background: #B87333; color: #fff; border: none; border-radius: 4px; font-size: 0.72rem; font-weight: 600; cursor: pointer; margin-top: 0.25rem; }
    .btn-book-sm:hover:not(:disabled) { background: #9d5d22; }
    .btn-book-sm:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Active shipment card in manual tracking modal */
    .active-shipment-card { padding: 1rem; border: 1.5px solid #276749; border-radius: 8px; background: rgba(39,103,73,0.04); margin-bottom: 1.25rem; }

    /* Form */
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field label { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #888; }
    .form-input { padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #E8E8E8; border-radius: 6px; color: #1C1C1C; font-size: 0.875rem; outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.15s; }
    .form-input:focus { border-color: #B87333; box-shadow: 0 0 0 3px rgba(184,115,51,0.1); }
    .form-input::placeholder { color: #AAAAAA; }

    .spinner-sm { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(184,115,51,0.2); border-top-color: #B87333; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AdminOrdersComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly imgUrl = imageUrl;

  orders = signal<Order[]>([]);
  loading = signal(true);
  error = signal('');
  total = signal(0);
  page = signal(1);
  pages = signal(1);
  searchQ = '';
  statusFilter = '';
  private searchTimer: any;

  // Bulk actions
  selectedIds = signal<Set<number>>(new Set());
  bulkAction = '';
  showBulkConfirm = signal(false);
  bulkRunning = signal(false);

  // Order detail (P1)
  detailOrder = signal<OrderDetail | null>(null);
  loadingDetail = signal(false);

  // Tracking in detail modal (P2)
  loadingTracking = signal(false);
  shipmentTrackingData = signal<any>(null);

  // Tracking modal (manual)
  trackingOrder = signal<Order | null>(null);
  trackingNum = '';
  trackingUrl = '';
  trackSaving = signal(false);
  trackError = signal('');

  // Shiprocket in detail modal
  couriers = signal<any[]>([]);
  loadingCouriers = signal(false);
  couriersError = signal('');
  bookingCourierId = signal<number | null>(null);
  bookSuccessMsg = signal('');

  readonly statuses = ALL_STATUSES;

  readonly allSelected = computed(() => {
    const ids = this.orders().map(o => o.id);
    const sel = this.selectedIds();
    return ids.length > 0 && ids.every(id => sel.has(id));
  });

  readonly shippingAddr = computed<ShippingAddress | null>(() => {
    const d = this.detailOrder();
    if (!d) return null;
    try {
      const raw = d.shipping_address;
      return typeof raw === 'string' ? JSON.parse(raw) : (raw as ShippingAddress);
    } catch { return null; }
  });

  readonly trackingTimeline = computed<TrackingEvent[]>(() => {
    const d = this.detailOrder();
    const tracking = this.shipmentTrackingData();
    const status = d?.status ?? '';

    const steps = [
      'Shipment Created',
      'Pickup Scheduled',
      'Picked Up',
      'In Transit',
      'Out For Delivery',
      'Delivered'
    ];

    const statusMap: Record<string, number> = {
      'pending': -1, 'confirmed': -1, 'processing': -1,
      'shipped': 2,
      'out_for_delivery': 4,
      'delivered': 5
    };

    let currentStep = tracking?.tracking_data?.shipment_track?.[0]
      ? this.mapShiprocketStatus(tracking.tracking_data.shipment_track[0].current_status)
      : (statusMap[status] ?? (d?.tracking_number ? 0 : -1));

    return steps.map((label, i) => ({
      label,
      done: i < currentStep,
      active: i === currentStep,
      date: i === currentStep && tracking?.tracking_data?.shipment_track?.[0]?.updated_at
        ? new Date(tracking.tracking_data.shipment_track[0].updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : undefined
    }));
  });

  readonly bulkActionLabel = computed(() => {
    const map: Record<string, string> = { confirm: 'Mark Confirmed', cancel: 'Mark Cancelled' };
    return map[this.bulkAction] || this.bulkAction;
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const params: any = { page: this.page(), limit: 20 };
    if (this.searchQ.trim()) params['search'] = this.searchQ.trim();
    if (this.statusFilter) params['status'] = this.statusFilter;

    this.api.get<any>('/orders', params).subscribe({
      next: (res) => {
        this.orders.set(res.data || []);
        this.total.set(res.total || 0);
        this.pages.set(res.pages || 1);
        this.loading.set(false);
      },
      error: (err) => { this.error.set(err.userMessage || 'Failed to load orders'); this.loading.set(false); }
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 400);
  }

  goPage(n: number): void { this.page.set(n); this.load(); }

  formatStatus(s: string): string {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatPaymentMethod(m: string): string {
    const map: Record<string, string> = {
      cod: 'Cash on Delivery', razorpay: 'Online (Razorpay)',
      partial: 'Partial (Advance)', hybrid: 'Customer Choice'
    };
    return map[m] || m;
  }

  changeStatus(o: Order): void {
    this.api.patch<any>(`/orders/${o.id}/status`, { status: o.status }).subscribe({
      error: () => this.load()
    });
  }

  // Bulk actions
  toggleSelect(id: number): void {
    this.selectedIds.update(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.orders().map(o => o.id)));
    }
  }

  clearSelection(): void { this.selectedIds.set(new Set()); this.bulkAction = ''; }

  applyBulk(): void {
    if (!this.bulkAction || this.selectedIds().size === 0) return;
    this.showBulkConfirm.set(true);
  }

  executeBulk(): void {
    this.bulkRunning.set(true);
    const ids = [...this.selectedIds()];
    const statusMap: Record<string, string> = { confirm: 'confirmed', cancel: 'cancelled' };
    const newStatus = statusMap[this.bulkAction];
    if (!newStatus) { this.bulkRunning.set(false); return; }

    const reqs = ids.map(id => this.api.patch<any>(`/orders/${id}/status`, { status: newStatus }).toPromise().catch(() => null));
    Promise.all(reqs).then(() => {
      this.bulkRunning.set(false);
      this.showBulkConfirm.set(false);
      this.clearSelection();
      this.load();
    });
  }

  // Order detail (P1)
  viewDetail(o: Order): void {
    this.detailOrder.set(o as unknown as OrderDetail);
    this.loadingDetail.set(true);
    this.couriers.set([]);
    this.couriersError.set('');
    this.bookSuccessMsg.set('');
    this.shipmentTrackingData.set(null);

    this.api.get<any>(`/orders/${o.id}`).subscribe({
      next: (res) => {
        this.detailOrder.set(res.data);
        this.loadingDetail.set(false);
        if (!res.data.tracking_number) {
          this.loadCouriersForDetail(o.id);
        } else {
          this.fetchTrackingStatus(o.id);
        }
      },
      error: () => this.loadingDetail.set(false)
    });
  }

  closeDetail(): void {
    this.detailOrder.set(null);
    this.couriers.set([]);
    this.bookSuccessMsg.set('');
    this.trackError.set('');
  }

  // Shiprocket in detail modal
  loadCouriersForDetail(orderId: number): void {
    this.loadingCouriers.set(true);
    this.couriersError.set('');
    this.api.get<any>(`/orders/${orderId}/couriers`).subscribe({
      next: (res) => { this.couriers.set(res.data || []); this.loadingCouriers.set(false); },
      error: (err) => { this.couriersError.set(err.error?.message || 'Failed to load courier rates'); this.loadingCouriers.set(false); }
    });
  }

  fetchTrackingStatus(orderId: number): void {
    this.loadingTracking.set(true);
    this.api.get<any>(`/orders/${orderId}/shipment-tracking`).subscribe({
      next: (res) => { this.shipmentTrackingData.set(res.data); this.loadingTracking.set(false); },
      error: () => this.loadingTracking.set(false)
    });
  }

  selectCourier(c: any): void {
    const code = c.courier_name.toUpperCase().replace(/\s+/g, '');
    this.trackingNum = `SR-${code}-${Math.floor(1e9 + Math.random() * 9e9)}`;
    this.trackingUrl = `https://shiprocket.co/tracking/${this.trackingNum}`;
  }

  bookShipment(c: any): void {
    const d = this.detailOrder();
    if (!d) return;
    this.bookingCourierId.set(c.courier_company_id);
    this.trackError.set('');
    this.bookSuccessMsg.set('');

    this.api.post<any>(`/orders/${d.id}/book-shipment`, {
      courier_company_id: c.courier_company_id,
      courier_name: c.courier_name,
      rate: c.rate
    }).subscribe({
      next: (res) => {
        this.bookingCourierId.set(null);
        const awb = res.data?.tracking_number || '';
        this.bookSuccessMsg.set(`Shipment booked! AWB: ${awb}`);
        this.detailOrder.update(o => o ? { ...o, tracking_number: awb, tracking_url: res.data?.tracking_url || null, status: 'shipped' } : o);
        this.orders.update(list => list.map(o => o.id === d.id ? { ...o, tracking_number: awb, status: 'shipped' } : o));
        setTimeout(() => { this.couriers.set([]); this.fetchTrackingStatus(d.id); }, 1500);
      },
      error: (err) => { this.bookingCourierId.set(null); this.trackError.set(err.error?.message || 'Booking failed'); }
    });
  }

  // Manual tracking modal
  openTracking(o: Order): void {
    if (this.detailOrder()) this.closeDetail();
    this.trackingOrder.set(o);
    this.trackingNum = o.tracking_number || '';
    this.trackingUrl = o.tracking_url || '';
    this.trackError.set('');
  }

  closeTracking(): void { this.trackingOrder.set(null); }

  saveTracking(): void {
    const o = this.trackingOrder();
    if (!o) return;
    this.trackSaving.set(true);
    this.trackError.set('');
    this.api.patch<any>(`/orders/${o.id}/tracking`, { tracking_number: this.trackingNum, tracking_url: this.trackingUrl }).subscribe({
      next: () => {
        o.tracking_number = this.trackingNum;
        o.tracking_url = this.trackingUrl;
        this.trackSaving.set(false);
        this.trackingOrder.set(null);
        this.load();
      },
      error: (err) => { this.trackSaving.set(false); this.trackError.set(err.userMessage || 'Update failed'); }
    });
  }

  private mapShiprocketStatus(status: string): number {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) return 5;
    if (s.includes('out for delivery')) return 4;
    if (s.includes('in transit') || s.includes('transit')) return 3;
    if (s.includes('picked') || s.includes('pickup done')) return 2;
    if (s.includes('pickup scheduled')) return 1;
    return 0;
  }
}
