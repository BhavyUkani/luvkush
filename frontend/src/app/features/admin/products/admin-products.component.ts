import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { imageUrl } from '../../../shared/utils/image-url';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  mrp: number;
  stock_quantity: number;
  status: string;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  primary_image: string | null;
  images: string | null;
  category_name: string;
  category_id: number;
  subtitle: string | null;
  short_description: string | null;
  description: string | null;
  benefits: string | null;
  how_to_use: string | null;
  ingredients_list: string | null;
  badges: string | null;
  tags: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  weight: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  payment_mode: string;
  advance_amount: number | null;
  cost_price: number | null;
  created_at: string;
}

interface Category { id: number; name: string; slug: string; }

const EXCLUDED_CATEGORY_SLUGS = ['hair-wigs', 'hair-patches'];

const EMPTY_FORM = () => ({
  name: '', subtitle: '', category_id: '',
  price: '', mrp: '', cost_price: '', stock_quantity: '',
  short_description: '', description: '',
  benefits: '', how_to_use: '',
  ingredients_list: '', badges: '', tags: '',
  seo_title: '', seo_description: '', seo_keywords: '',
  weight: '', length_cm: '', width_cm: '', height_cm: '',
  payment_mode: 'full_cod', advance_amount: '',
  status: 'active',
  is_featured: false, is_bestseller: false, is_new: false
});

interface ImgSlot { id: number; existingUrl: string | null; file: File | null; preview: string; }
const emptySlots = (): ImgSlot[] => Array.from({ length: 5 }, (_, i) => ({ id: i, existingUrl: null, file: null, preview: '' }));

type ProductTab = 'general' | 'description' | 'images' | 'inventory' | 'physical' | 'payment' | 'seo';

@Component({
  selector: 'lk-admin-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Products <span class="count">{{ total() }}</span></h1>
        <button class="btn-primary" (click)="openCreate()">+ Add Product</button>
      </div>

      <div class="filter-bar">
        <input type="text" class="search-input" placeholder="Search by name or SKU..." [(ngModel)]="searchQ" (input)="onSearch()" />
        <select class="filter-select" [(ngModel)]="statusFilter" (change)="load()">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <!-- Bulk Actions Bar -->
      @if (selectedIds().size > 0) {
        <div class="bulk-bar">
          <span class="bulk-count">{{ selectedIds().size }} selected</span>
          <select class="bulk-select" [(ngModel)]="bulkAction">
            <option value="">Bulk Action...</option>
            <option value="active">Activate Selected</option>
            <option value="draft">Deactivate Selected</option>
            <option value="delete">Delete Selected</option>
          </select>
          <button class="btn-bulk-apply" [disabled]="!bulkAction" (click)="applyBulk()">Apply</button>
          <button class="btn-bulk-clear" (click)="clearSelection()">✕ Clear</button>
        </div>
      }

      @if (loading()) {
        <div class="loading">Loading products...</div>
      } @else if (error()) {
        <div class="error-msg">{{ error() }} <button (click)="load()">Retry</button></div>
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:36px">
                <input type="checkbox" class="cb" [checked]="allSelected()" (change)="toggleSelectAll()" />
              </th>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (p of products(); track p.id) {
              <tr [class.row-selected]="selectedIds().has(p.id)">
                <td><input type="checkbox" class="cb" [checked]="selectedIds().has(p.id)" (change)="toggleSelect(p.id)" /></td>
                <td>
                  @if (p.primary_image) {
                    <img [src]="imgUrl(p.primary_image)" class="thumb" [alt]="p.name" />
                  } @else {
                    <div class="thumb-empty"></div>
                  }
                </td>
                <td>
                  <div class="product-name">{{ p.name }}</div>
                  @if (p.subtitle) { <div class="product-sub">{{ p.subtitle }}</div> }
                  <div class="product-sku">{{ p.sku }}</div>
                </td>
                <td class="muted">{{ p.category_name || '—' }}</td>
                <td>
                  <div>₹{{ p.price | number:'1.0-0' }}</div>
                  @if (p.mrp > p.price) { <div class="mrp">₹{{ p.mrp | number:'1.0-0' }}</div> }
                </td>
                <td [class.stock-low]="p.stock_quantity > 0 && p.stock_quantity <= 5"
                    [class.stock-out]="p.stock_quantity === 0">
                  {{ p.stock_quantity }}
                </td>
                <td>
                  <select class="inline-select" [(ngModel)]="p.status" (change)="changeStatus(p)">
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </td>
                <td>
                  <input type="checkbox" [checked]="p.is_featured" (change)="toggleFeatured(p)" class="cb" />
                </td>
                <td>
                  <div class="action-btns">
                    <button class="btn-edit" (click)="openEdit(p)">Edit</button>
                    <button class="btn-delete" (click)="confirmDelete(p)">Delete</button>
                  </div>
                </td>
              </tr>
            }
            @if (!products().length) {
              <tr><td colspan="9" class="empty-cell">No products found</td></tr>
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

    <!-- ═══════════════════ CREATE / EDIT MODAL ═══════════════════ -->
    @if (showForm()) {
      <div class="modal-backdrop" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">

          <!-- Sticky Header -->
          <div class="modal-header">
            <h2>{{ editingId() ? 'Edit Product' : 'Add Product' }}</h2>
            <button class="modal-close" (click)="closeForm()">✕</button>
          </div>

          <!-- Sticky Tabs -->
          <div class="tab-nav">
            <button class="tab-btn" [class.tab-active]="activeTab() === 'general'"     (click)="activeTab.set('general')">General</button>
            <button class="tab-btn" [class.tab-active]="activeTab() === 'description'" (click)="activeTab.set('description')">Description</button>
            <button class="tab-btn" [class.tab-active]="activeTab() === 'images'"      (click)="activeTab.set('images')">Images</button>
            <button class="tab-btn" [class.tab-active]="activeTab() === 'inventory'"   (click)="activeTab.set('inventory')">Inventory</button>
            <button class="tab-btn" [class.tab-active]="activeTab() === 'physical'"    (click)="activeTab.set('physical')">Physical</button>
            <button class="tab-btn" [class.tab-active]="activeTab() === 'payment'"     (click)="activeTab.set('payment')">Payment</button>
            <button class="tab-btn" [class.tab-active]="activeTab() === 'seo'"         (click)="activeTab.set('seo')">SEO</button>
          </div>

          <!-- Scrollable Body -->
          <div class="modal-body">

            <!-- TAB: General -->
            @if (activeTab() === 'general') {
              <div class="form-grid">
                <div class="field field-full">
                  <label>Product Name *</label>
                  <input type="text" [(ngModel)]="form().name" class="form-input" placeholder="e.g. Kesar Panchamrit Soap" />
                </div>
                <div class="field field-full">
                  <label>Subtitle / Tagline</label>
                  <input type="text" [(ngModel)]="form().subtitle" class="form-input" placeholder="e.g. Natural Radiant Glow | Rejuvenating & Moisturizing" />
                </div>
                <div class="field">
                  <label>Category *</label>
                  <select [(ngModel)]="form().category_id" class="form-input">
                    <option value="">Select category...</option>
                    @for (cat of filteredCategories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>
                <div class="field">
                  <label>Status</label>
                  <select [(ngModel)]="form().status" class="form-input">
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div class="field field-full checkboxes">
                  <label><input type="checkbox" [(ngModel)]="form().is_featured" /> Featured on Homepage</label>
                  <label><input type="checkbox" [(ngModel)]="form().is_bestseller" /> Bestseller Badge</label>
                  <label><input type="checkbox" [(ngModel)]="form().is_new" /> New Arrival Badge</label>
                </div>
              </div>
            }

            <!-- TAB: Description -->
            @if (activeTab() === 'description') {
              <div class="form-grid">
                <div class="field field-full">
                  <label>Short Description</label>
                  <textarea [(ngModel)]="form().short_description" class="form-textarea" rows="2" placeholder="One or two lines shown in product listings..."></textarea>
                </div>
                <div class="field field-full">
                  <label>Full Description</label>
                  <textarea [(ngModel)]="form().description" class="form-textarea" rows="6" placeholder="Full product description — story, details, heritage..."></textarea>
                </div>
                <div class="field field-full">
                  <label>Benefits</label>
                  <textarea [(ngModel)]="form().benefits" class="form-textarea" rows="4" placeholder="• Promotes hair growth&#10;• Reduces dandruff&#10;• Strengthens roots&#10;• Adds shine and softness"></textarea>
                  <span class="hint">One benefit per line. Shown in the Benefits tab on product detail.</span>
                </div>
                <div class="field field-full">
                  <label>How To Use</label>
                  <textarea [(ngModel)]="form().how_to_use" class="form-textarea" rows="4" placeholder="Step 1: Apply to scalp&#10;Step 2: Massage gently for 5 minutes&#10;Step 3: Leave for 30 minutes&#10;Step 4: Rinse with mild shampoo"></textarea>
                  <span class="hint">Step-by-step instructions. Shown in the How To Use tab.</span>
                </div>
                <div class="field field-full">
                  <label>Key Ingredients</label>
                  <textarea [(ngModel)]="form().ingredients_list" class="form-textarea" rows="4" placeholder="Kesar (Saffron): Brightens skin tone&#10;Sandalwood: Soothes and cools&#10;Rose Water: Deep hydration"></textarea>
                  <span class="hint">One ingredient per line. Recommended: Name: Benefit</span>
                </div>
                <div class="field field-full">
                  <label>Badges / Labels</label>
                  <input type="text" [(ngModel)]="form().badges" class="form-input" placeholder="Ayurvedic, Natural, Handcrafted, Cruelty-Free, Paraben-Free" />
                  <span class="hint">Comma-separated. Shown as tags on product cards.</span>
                </div>
                <div class="field field-full">
                  <label>Search Tags</label>
                  <input type="text" [(ngModel)]="form().tags" class="form-input" placeholder="soap, kesar, saffron, ayurvedic, skin glow, panchamrit" />
                  <span class="hint">Comma-separated. Used for site search and filtering.</span>
                </div>
              </div>
            }

            <!-- TAB: Images -->
            @if (activeTab() === 'images') {
              <div class="form-grid">
                <div class="field field-full">
                  <label>Product Images <span class="hint-inline">(first = primary · max 5)</span></label>
                  <div class="img-slots">
                    @for (slot of imgSlots(); track slot.id; let i = $index) {
                      <div class="img-slot" [class.slot-primary]="i === 0">
                        @if (slot.preview) {
                          <img [src]="slot.preview" class="slot-img" alt="Image {{ i + 1 }}" />
                          <div class="slot-actions">
                            <button type="button" class="slot-btn slot-remove" (click)="removeSlot(i)" title="Remove">×</button>
                            @if (i > 0) {
                              <button type="button" class="slot-btn slot-primary-btn" (click)="setSlotPrimary(i)" title="Set as primary">★</button>
                            }
                          </div>
                          @if (i === 0) { <span class="primary-tag">Primary</span> }
                        } @else {
                          <label class="slot-empty" [for]="'img-input-' + i">
                            <span class="slot-plus">+</span>
                            <span class="slot-label">{{ i === 0 ? 'Primary' : 'Image ' + (i + 1) }}</span>
                          </label>
                        }
                        <input [id]="'img-input-' + i" type="file" accept="image/jpeg,image/png,image/webp" hidden
                               (change)="onSlotFile(i, $event)" />
                      </div>
                    }
                  </div>
                  <span class="hint">Upload JPEG, PNG or WebP. Auto-converted to WebP at 800×1000px. Drag ★ to reorder.</span>
                </div>
              </div>
            }

            <!-- TAB: Inventory -->
            @if (activeTab() === 'inventory') {
              <div class="form-grid">
                <div class="field">
                  <label>Selling Price (₹) *</label>
                  <input type="number" [(ngModel)]="form().price" class="form-input" placeholder="399" />
                </div>
                <div class="field">
                  <label>MRP (₹)</label>
                  <input type="number" [(ngModel)]="form().mrp" class="form-input" placeholder="499" />
                </div>
                <div class="field">
                  <label>Cost Price (₹)</label>
                  <input type="number" [(ngModel)]="form().cost_price" class="form-input" placeholder="150" />
                </div>
                <div class="field">
                  <label>Stock Quantity</label>
                  <input type="number" [(ngModel)]="form().stock_quantity" class="form-input" placeholder="100" />
                </div>
                @if (form().price && form().mrp && +form().mrp > +form().price) {
                  <div class="field-full">
                    <div class="margin-preview">
                      Discount: <strong>{{ getDiscount() }}%</strong>
                      @if (form().cost_price) {
                        &nbsp;·&nbsp; Margin: <strong>{{ getMargin() }}%</strong>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            <!-- TAB: Physical -->
            @if (activeTab() === 'physical') {
              <div class="form-grid">
                <div class="section-title field-full">Dimensions &amp; Weight (for shipping)</div>
                <div class="field">
                  <label>Weight (grams)</label>
                  <input type="number" [(ngModel)]="form().weight" class="form-input" placeholder="100" />
                </div>
                <div class="field">
                  <label>Length (cm)</label>
                  <input type="number" [(ngModel)]="form().length_cm" class="form-input" placeholder="8" step="0.1" />
                </div>
                <div class="field">
                  <label>Width (cm)</label>
                  <input type="number" [(ngModel)]="form().width_cm" class="form-input" placeholder="6" step="0.1" />
                </div>
                <div class="field">
                  <label>Height (cm)</label>
                  <input type="number" [(ngModel)]="form().height_cm" class="form-input" placeholder="3" step="0.1" />
                </div>
                <div class="field-full hint" style="color:#AAAAAA;font-size:0.72rem">
                  These values are used by Shiprocket when booking shipments for this product.
                </div>
              </div>
            }

            <!-- TAB: Payment -->
            @if (activeTab() === 'payment') {
              <div class="form-grid">
                <div class="section-title field-full">Payment Configuration</div>
                <div class="field field-full">
                  <label>Payment Mode</label>
                  <select [(ngModel)]="form().payment_mode" class="form-input">
                    <option value="full_cod">Complete COD — Pay everything on delivery</option>
                    <option value="full_online">Complete Online — No COD allowed</option>
                    <option value="partial">Partial — Advance online + rest on delivery</option>
                    <option value="hybrid">Customer Choice — COD / Online / Partial</option>
                  </select>
                </div>
                @if (form().payment_mode === 'partial') {
                  <div class="field">
                    <label>Advance Amount (₹)</label>
                    <input type="number" [(ngModel)]="form().advance_amount" class="form-input" placeholder="500" />
                    <span class="hint">Customer pays this amount online. Balance on delivery.</span>
                  </div>
                }
                <div class="field-full" style="margin-top:0.5rem">
                  <div class="payment-guide">
                    <div class="pg-item"><strong>full_cod</strong> — Standard products, local delivery</div>
                    <div class="pg-item"><strong>full_online</strong> — High-value, pre-order items</div>
                    <div class="pg-item"><strong>partial</strong> — Hair wigs, patches, custom orders</div>
                    <div class="pg-item"><strong>hybrid</strong> — When both COD and online are acceptable</div>
                  </div>
                </div>
              </div>
            }

            <!-- TAB: SEO -->
            @if (activeTab() === 'seo') {
              <div class="form-grid">
                <div class="section-title field-full">Search Engine Optimization</div>
                <div class="field field-full">
                  <label>SEO Title</label>
                  <input type="text" [(ngModel)]="form().seo_title" class="form-input" placeholder="Kesar Panchamrit Soap — Natural Glow | Luv Kush Natural" />
                  <span class="hint char" [class.over]="(form().seo_title?.length || 0) > 60">{{ form().seo_title?.length || 0 }}/60 chars</span>
                </div>
                <div class="field field-full">
                  <label>Meta Description</label>
                  <textarea [(ngModel)]="form().seo_description" class="form-textarea" rows="3" placeholder="Buy natural Kesar Panchamrit Soap online. Made with saffron and 5 sacred Ayurvedic ingredients for radiant, glowing skin."></textarea>
                  <span class="hint char" [class.over]="(form().seo_description?.length || 0) > 160">{{ form().seo_description?.length || 0 }}/160 chars</span>
                </div>
                <div class="field field-full">
                  <label>Meta Keywords</label>
                  <input type="text" [(ngModel)]="form().seo_keywords" class="form-input" placeholder="kesar soap, saffron soap, ayurvedic soap, natural soap india" />
                  <span class="hint">Comma-separated. Focus on 5–10 specific phrases.</span>
                </div>
              </div>
            }

            @if (formError()) {
              <div class="error-msg" style="margin-top:1rem">{{ formError() }}</div>
            }
          </div>

          <!-- Sticky Footer -->
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeForm()">Cancel</button>
            <button class="btn-primary" (click)="saveProduct()" [disabled]="saving()">
              {{ saving() ? 'Saving...' : (editingId() ? 'Update Product' : 'Create Product') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Bulk Confirm Modal -->
    @if (showBulkConfirm()) {
      <div class="modal-backdrop" (click)="showBulkConfirm.set(false)">
        <div class="modal confirm-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Confirm Bulk Action</h2>
            <button class="modal-close" (click)="showBulkConfirm.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <p>Apply <strong>{{ bulkActionLabel() }}</strong> to <strong>{{ selectedIds().size }}</strong> products?
              @if (bulkAction === 'delete') {
                <br/><span style="color:#DC2626;font-size:0.8rem">This permanently deletes the products and their images.</span>
              }
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="showBulkConfirm.set(false)">Cancel</button>
            <button class="btn-primary" [class.btn-danger]="bulkAction === 'delete'" (click)="executeBulk()" [disabled]="bulkRunning()">
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

    /* Bulk */
    .bulk-bar { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem; background: rgba(184,115,51,0.06); border: 1px solid rgba(184,115,51,0.2); border-radius: 6px; margin-bottom: 1rem; }
    .bulk-count { font-size: 0.8rem; font-weight: 600; color: #B87333; }
    .bulk-select { padding: 0.4rem 0.6rem; border: 1px solid #E8E8E8; border-radius: 4px; font-size: 0.8rem; outline: none; background: #fff; }
    .btn-bulk-apply { padding: 0.35rem 0.75rem; background: #B87333; color: #fff; border: none; border-radius: 4px; font-size: 0.8rem; cursor: pointer; }
    .btn-bulk-apply:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-bulk-clear { padding: 0.35rem 0.75rem; background: none; border: 1px solid #E8E8E8; color: #888; border-radius: 4px; font-size: 0.8rem; cursor: pointer; }

    .loading { color: #888; padding: 2rem; }
    .error-msg { color: #DC2626; padding: 0.75rem; background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.15); border-radius: 6px; font-size: 0.875rem; }
    .error-msg button { margin-left: 1rem; background: none; border: 1px solid #DC2626; color: #DC2626; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; background: #fff; border: 1px solid #E8E8E8; border-radius: 8px; overflow: hidden; }
    .data-table th { text-align: left; padding: 0.65rem 0.875rem; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #888; background: #FAFAFA; border-bottom: 1px solid #E8E8E8; }
    .data-table td { padding: 0.7rem 0.875rem; border-bottom: 1px solid #F0F0F0; color: #333; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #F7F8FA; }
    .row-selected td { background: rgba(184,115,51,0.05) !important; }
    .cb { width: 15px; height: 15px; cursor: pointer; accent-color: #B87333; }
    .thumb { width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #E8E8E8; }
    .thumb-empty { width: 44px; height: 44px; background: #F0F0F0; border-radius: 6px; }
    .product-name { font-weight: 600; color: #1C1C1C; }
    .product-sub { font-size: 0.72rem; color: #888; margin-top: 1px; }
    .product-sku { font-size: 0.68rem; color: #AAAAAA; margin-top: 2px; font-family: monospace; }
    .mrp { font-size: 0.75rem; color: #AAAAAA; text-decoration: line-through; }
    .muted { color: #888; }
    .stock-low { color: #B45309; font-weight: 600; }
    .stock-out { color: #DC2626; font-weight: 600; }
    .inline-select { background: #fff; border: 1px solid #E8E8E8; border-radius: 4px; color: #333; font-size: 0.8rem; padding: 4px 6px; cursor: pointer; outline: none; }
    .inline-select:focus { border-color: #B87333; }
    .action-btns { display: flex; gap: 0.5rem; }
    .btn-edit { padding: 4px 10px; background: rgba(184,115,51,0.08); border: 1px solid rgba(184,115,51,0.3); color: #B87333; border-radius: 4px; font-size: 0.75rem; cursor: pointer; transition: background 0.15s; }
    .btn-edit:hover { background: rgba(184,115,51,0.15); }
    .btn-delete { padding: 4px 10px; background: none; border: 1px solid rgba(220,38,38,0.3); color: #DC2626; border-radius: 4px; font-size: 0.75rem; cursor: pointer; transition: background 0.15s; }
    .btn-delete:hover { background: rgba(220,38,38,0.06); }
    .btn-primary { padding: 0.5rem 1.25rem; background: #B87333; color: #fff; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-danger { background: #DC2626 !important; }
    .btn-secondary { padding: 0.5rem 1.25rem; background: #fff; border: 1px solid #E8E8E8; color: #555; border-radius: 6px; font-size: 0.875rem; cursor: pointer; transition: background 0.15s; }
    .btn-secondary:hover { background: #F7F8FA; }
    .empty-cell { text-align: center; color: #AAAAAA; padding: 3rem; font-style: italic; }
    .pagination { display: flex; gap: 1rem; align-items: center; justify-content: center; margin-top: 1.5rem; font-size: 0.875rem; color: #888; }
    .pagination button { padding: 0.4rem 0.75rem; background: #fff; border: 1px solid #E8E8E8; color: #555; border-radius: 4px; cursor: pointer; font-size: 0.8rem; transition: background 0.15s; }
    .pagination button:hover { background: #F7F8FA; }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Modal — flex column, fixed height, proper scroll */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .modal {
      background: #fff; border: 1px solid #E8E8E8; border-radius: 12px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.12);
      width: 100%; max-width: 700px;
      height: 88vh; max-height: 800px;
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    .confirm-modal { height: auto; max-height: none; max-width: 440px; }

    /* Sticky header */
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #E8E8E8; flex-shrink: 0; }
    .modal-header h2 { font-size: 1rem; font-weight: 700; color: #1C1C1C; margin: 0; }
    .modal-close { background: none; border: none; color: #888; font-size: 1.1rem; cursor: pointer; padding: 4px 8px; border-radius: 4px; line-height: 1; transition: color 0.15s; }
    .modal-close:hover { color: #1C1C1C; }

    /* Sticky tabs */
    .tab-nav { display: flex; border-bottom: 1px solid #E8E8E8; flex-shrink: 0; padding: 0 1.5rem; gap: 0; overflow-x: auto; }
    .tab-btn { padding: 0.5rem 0.75rem; background: none; border: none; border-bottom: 2px solid transparent; color: #888; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; margin-bottom: -1px; transition: color 0.15s; white-space: nowrap; flex-shrink: 0; }
    .tab-btn:hover { color: #555; }
    .tab-active { color: #B87333 !important; border-bottom-color: #B87333 !important; }

    /* Scrollable body — BOTH flex:1 AND min-height:0 required */
    .modal-body { padding: 1.25rem 1.5rem; overflow-y: auto; flex: 1; min-height: 0; }

    /* Sticky footer */
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 0.9rem 1.5rem; border-top: 1px solid #E8E8E8; flex-shrink: 0; }

    /* Form */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
    .field { display: flex; flex-direction: column; gap: 0.32rem; }
    .field-full { grid-column: 1 / -1; }
    .field label { font-size: 0.67rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #888; }
    .form-input { padding: 0.48rem 0.7rem; background: #fff; border: 1px solid #E8E8E8; border-radius: 6px; color: #1C1C1C; font-size: 0.875rem; outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.15s; }
    .form-input:focus { border-color: #B87333; box-shadow: 0 0 0 3px rgba(184,115,51,0.1); }
    .form-input::placeholder { color: #AAAAAA; }
    .form-textarea { padding: 0.48rem 0.7rem; background: #fff; border: 1px solid #E8E8E8; border-radius: 6px; color: #1C1C1C; font-size: 0.875rem; outline: none; width: 100%; box-sizing: border-box; resize: vertical; font-family: inherit; line-height: 1.55; transition: border-color 0.15s; }
    .form-textarea:focus { border-color: #B87333; box-shadow: 0 0 0 3px rgba(184,115,51,0.1); }
    .form-textarea::placeholder { color: #AAAAAA; }
    .hint { font-size: 0.67rem; color: #AAAAAA; }
    .hint-inline { font-size: 0.67rem; color: #AAAAAA; text-transform: none; letter-spacing: 0; font-weight: 400; }
    .char { text-align: right; display: block; }
    .over { color: #DC2626; }
    .checkboxes { flex-direction: row; gap: 1.25rem; align-items: center; padding-top: 0.2rem; flex-wrap: wrap; }
    .checkboxes label { font-size: 0.8rem; color: #555; text-transform: none; letter-spacing: 0; display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-weight: 400; }
    .section-title { font-size: 0.67rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: #AAAAAA; padding-bottom: 0.4rem; border-bottom: 1px solid #F0F0F0; }
    .margin-preview { font-size: 0.78rem; color: #555; background: #F7F8FA; padding: 0.4rem 0.75rem; border-radius: 4px; }
    .payment-guide { display: flex; flex-direction: column; gap: 0.35rem; }
    .pg-item { font-size: 0.78rem; color: #555; padding: 0.35rem 0.6rem; background: #F7F8FA; border-radius: 4px; border-left: 2px solid #B87333; }

    /* Image slots */
    .img-slots { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: 0.35rem; }
    .img-slot { position: relative; width: 100px; height: 100px; border-radius: 8px; overflow: hidden; border: 2px solid #E8E8E8; background: #FAFAFA; flex-shrink: 0; }
    .slot-primary { border-color: rgba(184,115,51,0.6); }
    .slot-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .slot-actions { position: absolute; top: 3px; right: 3px; display: flex; flex-direction: column; gap: 3px; opacity: 0; transition: opacity 0.15s; }
    .img-slot:hover .slot-actions { opacity: 1; }
    .slot-btn { width: 22px; height: 22px; border-radius: 50%; border: none; cursor: pointer; font-size: 0.75rem; line-height: 1; display: flex; align-items: center; justify-content: center; }
    .slot-remove { background: rgba(220,38,38,0.85); color: #fff; }
    .slot-primary-btn { background: rgba(184,115,51,0.9); color: #fff; }
    .primary-tag { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(184,115,51,0.85); color: #fff; font-size: 0.55rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; text-align: center; padding: 2px 0; }
    .slot-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; cursor: pointer; gap: 3px; }
    .slot-plus { font-size: 1.75rem; color: #CCCCCC; line-height: 1; }
    .slot-label { font-size: 0.55rem; color: #AAAAAA; text-transform: uppercase; letter-spacing: 0.04em; }
  `]
})
export class AdminProductsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly imgUrl = imageUrl;

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  error = signal('');
  total = signal(0);
  page = signal(1);
  pages = signal(1);
  searchQ = '';
  statusFilter = '';
  private searchTimer: any;

  // Bulk
  selectedIds = signal<Set<number>>(new Set());
  bulkAction = '';
  showBulkConfirm = signal(false);
  bulkRunning = signal(false);

  // Modal
  showForm = signal(false);
  editingId = signal<number | null>(null);
  saving = signal(false);
  formError = signal('');
  form = signal(EMPTY_FORM());
  activeTab = signal<ProductTab>('general');
  imgSlots = signal<ImgSlot[]>(emptySlots());

  readonly allSelected = computed(() => {
    const ids = this.products().map(p => p.id);
    const sel = this.selectedIds();
    return ids.length > 0 && ids.every(id => sel.has(id));
  });

  readonly filteredCategories = computed(() =>
    this.categories().filter(c => !EXCLUDED_CATEGORY_SLUGS.includes(c.slug))
  );

  readonly bulkActionLabel = computed(() => {
    const map: Record<string, string> = { active: 'Activate', draft: 'Deactivate', delete: 'Delete' };
    return map[this.bulkAction] || this.bulkAction;
  });

  ngOnInit(): void { this.load(); this.loadCategories(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const params: any = { page: this.page(), limit: 20 };
    if (this.searchQ.trim()) params['search'] = this.searchQ.trim();
    if (this.statusFilter) params['status'] = this.statusFilter;

    this.api.get<any>('/admin/products', params).subscribe({
      next: (res) => {
        this.products.set(res.data || []);
        this.total.set(res.total || 0);
        this.pages.set(res.pages || 1);
        this.loading.set(false);
      },
      error: (err) => { this.error.set(err.userMessage || 'Failed to load products'); this.loading.set(false); }
    });
  }

  private loadCategories(): void {
    this.api.get<any>('/admin/categories').subscribe({
      next: (res) => this.categories.set(res.data || [])
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 400);
  }

  goPage(n: number): void { this.page.set(n); this.load(); }

  // Bulk
  toggleSelect(id: number): void {
    this.selectedIds.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.products().map(p => p.id)));
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

    let reqs: Promise<any>[];
    if (this.bulkAction === 'delete') {
      reqs = ids.map(id => this.api.delete<any>(`/admin/products/${id}`).toPromise().catch(() => null));
    } else {
      const status = this.bulkAction;
      reqs = ids.map(id => this.api.patch<any>(`/admin/products/${id}`, { status }).toPromise().catch(() => null));
    }

    Promise.all(reqs).then(() => {
      this.bulkRunning.set(false);
      this.showBulkConfirm.set(false);
      this.clearSelection();
      this.load();
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.set(EMPTY_FORM());
    this.formError.set('');
    this.activeTab.set('general');
    this.revokeSlotUrls();
    this.imgSlots.set(emptySlots());
    this.showForm.set(true);
  }

  openEdit(p: Product): void {
    this.editingId.set(p.id);
    this.form.set({
      name: p.name,
      subtitle: p.subtitle || '',
      category_id: String(p.category_id || ''),
      price: String(p.price),
      mrp: String(p.mrp || ''),
      cost_price: String(p.cost_price || ''),
      stock_quantity: String(p.stock_quantity),
      short_description: p.short_description || '',
      description: p.description || '',
      benefits: p.benefits || '',
      how_to_use: p.how_to_use || '',
      ingredients_list: p.ingredients_list || '',
      badges: p.badges || '',
      tags: p.tags || '',
      seo_title: p.seo_title || '',
      seo_description: p.seo_description || '',
      seo_keywords: p.seo_keywords || '',
      weight: String(p.weight || ''),
      length_cm: String(p.length_cm || ''),
      width_cm: String(p.width_cm || ''),
      height_cm: String(p.height_cm || ''),
      payment_mode: p.payment_mode || 'full_cod',
      advance_amount: String(p.advance_amount || ''),
      status: p.status,
      is_featured: p.is_featured,
      is_bestseller: p.is_bestseller,
      is_new: p.is_new
    });
    this.formError.set('');
    this.activeTab.set('general');
    this.revokeSlotUrls();
    const allUrls: string[] = [];
    if (p.primary_image) allUrls.push(p.primary_image);
    try {
      const parsed: string[] = JSON.parse(p.images || '[]');
      parsed.forEach(u => { if (u && !allUrls.includes(u)) allUrls.push(u); });
    } catch { /* ignore */ }
    this.imgSlots.set(Array.from({ length: 5 }, (_, i) => ({
      id: i,
      existingUrl: allUrls[i] ?? null,
      file: null,
      preview: allUrls[i] ? imageUrl(allUrls[i]) : ''
    })));
    this.showForm.set(true);
  }

  closeForm(): void { this.revokeSlotUrls(); this.showForm.set(false); }

  onSlotFile(slotIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const currentSlot = this.imgSlots()[slotIndex];
    if (currentSlot.file) URL.revokeObjectURL(currentSlot.preview);
    const preview = URL.createObjectURL(file);
    this.imgSlots.update(slots => slots.map((s, i) => i === slotIndex ? { ...s, file, preview } : s));
    input.value = '';
  }

  removeSlot(slotIndex: number): void {
    this.imgSlots.update(slots => {
      const updated = [...slots];
      const s = updated[slotIndex];
      if (s.file) URL.revokeObjectURL(s.preview);
      updated[slotIndex] = { id: s.id, existingUrl: null, file: null, preview: '' };
      return updated;
    });
  }

  setSlotPrimary(slotIndex: number): void {
    this.imgSlots.update(slots => {
      const updated = [...slots];
      const [chosen] = updated.splice(slotIndex, 1);
      return [chosen, ...updated];
    });
  }

  private revokeSlotUrls(): void {
    this.imgSlots().forEach(s => { if (s.file) URL.revokeObjectURL(s.preview); });
  }

  getDiscount(): number {
    const p = +this.form().price, m = +this.form().mrp;
    if (!p || !m || m <= p) return 0;
    return Math.round(((m - p) / m) * 100);
  }

  getMargin(): number {
    const p = +this.form().price, c = +this.form().cost_price;
    if (!p || !c || c >= p) return 0;
    return Math.round(((p - c) / p) * 100);
  }

  saveProduct(): void {
    const f = this.form();
    if (!f.name.trim()) { this.activeTab.set('general'); this.formError.set('Product name is required'); return; }
    if (!f.category_id) { this.activeTab.set('general'); this.formError.set('Category is required'); return; }
    if (!f.price) { this.activeTab.set('inventory'); this.formError.set('Price is required'); return; }

    this.saving.set(true);
    this.formError.set('');

    const slots = this.imgSlots();
    const keptUrls = slots.filter(s => s.existingUrl && !s.file).map(s => s.existingUrl as string);
    const newFiles  = slots.filter(s => s.file).map(s => s.file as File);

    const fd = new FormData();
    fd.append('name',              f.name.trim());
    fd.append('subtitle',          f.subtitle || '');
    fd.append('category_id',       String(Number(f.category_id)));
    fd.append('price',             String(Number(f.price)));
    fd.append('mrp',               String(Number(f.mrp) || Number(f.price)));
    fd.append('cost_price',        f.cost_price ? String(Number(f.cost_price)) : '');
    fd.append('stock_quantity',    String(Number(f.stock_quantity) || 0));
    fd.append('short_description', f.short_description || '');
    fd.append('description',       f.description || '');
    fd.append('benefits',          f.benefits || '');
    fd.append('how_to_use',        f.how_to_use || '');
    fd.append('ingredients_list',  f.ingredients_list || '');
    fd.append('badges',            f.badges || '');
    fd.append('tags',              f.tags || '');
    fd.append('seo_title',         f.seo_title || '');
    fd.append('seo_description',   f.seo_description || '');
    fd.append('seo_keywords',      f.seo_keywords || '');
    fd.append('weight',            f.weight ? String(Number(f.weight)) : '');
    fd.append('length_cm',         f.length_cm ? String(Number(f.length_cm)) : '');
    fd.append('width_cm',          f.width_cm ? String(Number(f.width_cm)) : '');
    fd.append('height_cm',         f.height_cm ? String(Number(f.height_cm)) : '');
    fd.append('payment_mode',      f.payment_mode || 'full_cod');
    fd.append('advance_amount',    f.advance_amount ? String(Number(f.advance_amount)) : '');
    fd.append('status',            f.status);
    fd.append('is_featured',       String(f.is_featured ? 1 : 0));
    fd.append('is_bestseller',     String(f.is_bestseller ? 1 : 0));
    fd.append('is_new',            String(f.is_new ? 1 : 0));
    if (keptUrls.length) fd.append('existing_images', JSON.stringify(keptUrls));
    newFiles.forEach(file => fd.append('images', file));

    const id = this.editingId();
    const req = id
      ? this.api.uploadFormData<any>(`/admin/products/${id}`, fd, 'put')
      : this.api.uploadFormData<any>('/admin/products', fd, 'post');

    req.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.page.set(1); this.load(); },
      error: (err) => { this.saving.set(false); this.formError.set(err.userMessage || 'Save failed'); }
    });
  }

  changeStatus(p: Product): void {
    this.api.patch<any>(`/admin/products/${p.id}`, { status: p.status }).subscribe({
      error: () => this.load()
    });
  }

  toggleFeatured(p: Product): void {
    p.is_featured = !p.is_featured;
    this.api.patch<any>(`/admin/products/${p.id}`, { is_featured: p.is_featured }).subscribe({
      error: () => { p.is_featured = !p.is_featured; }
    });
  }

  confirmDelete(p: Product): void {
    if (!confirm(`Permanently delete "${p.name}"? This cannot be undone.`)) return;
    this.api.delete<any>(`/admin/products/${p.id}`).subscribe({
      next: () => this.load(),
      error: (err) => alert(err.userMessage || 'Delete failed')
    });
  }
}
