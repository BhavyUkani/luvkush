import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, PLATFORM_ID } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { CartService } from "../../core/services/cart.service";
import { ApiService } from "../../core/services/api.service";
import { ToastService } from "../../core/services/toast.service";
import { environment } from "../../../environments/environment";

declare const Razorpay: any;

export type CheckoutStep = "address" | "shipping" | "payment" | "review" | "confirmation";

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh"
];

@Component({
  selector: "lk-checkout",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./checkout.component.html",
  styleUrls: ["./checkout.component.scss"]
})
export class CheckoutComponent implements OnInit {
  private readonly fb         = inject(FormBuilder);
  private readonly router     = inject(Router);
  private readonly api        = inject(ApiService);
  private readonly toast      = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly cart               = inject(CartService);

  readonly STATES = STATES;
  readonly STEPS: CheckoutStep[] = ["address", "shipping", "payment", "review", "confirmation"];
  readonly STEP_LABELS: Record<CheckoutStep, string> = {
    address: "Address", shipping: "Shipping", payment: "Payment", review: "Review", confirmation: "Confirmed"
  };

  step           = signal<CheckoutStep>("address");
  savedAddresses = signal<any[]>([]);
  selectedAddrId = signal<number | null>(null);
  shippingMethod = signal<"standard" | "express">("standard");
  paymentMethod  = signal<"cod" | "online" | "partial">("cod");
  placing        = signal(false);
  orderId        = signal<string | null>(null);
  addrSubmitted  = false;
  newAddress     = signal(false);

  effectivePaymentMode = computed(() => {
    const modes = this.cart.items().map(i => i.payment_mode || 'full_cod');
    if (modes.includes('full_online')) return 'full_online';
    if (modes.includes('partial')) return 'partial';
    if (modes.includes('hybrid')) return 'hybrid';
    return 'full_cod';
  });

  advanceAmount = computed(() =>
    this.cart.items().reduce((sum, i) => {
      if ((i.payment_mode === 'partial') && i.advance_amount) {
        return sum + i.advance_amount * i.quantity;
      }
      return sum;
    }, 0)
  );

  addrForm = this.fb.nonNullable.group({
    full_name:     ["", Validators.required],
    phone:         ["", [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    address_line1: ["", Validators.required],
    address_line2: [""],
    city:          ["", Validators.required],
    state:         ["", Validators.required],
    pincode:       ["", [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  get af() { return this.addrForm.controls; }

  stepIndex = computed(() => this.STEPS.indexOf(this.step()));

  get shippingCost() { return this.shippingMethod() === "express" ? 99 : (this.cart.subtotal() >= 499 ? 0 : 49); }
  get discount() {
    const c = this.cart.appliedCoupon();
    if (!c) return 0;
    return c.discount_type === "percentage"
      ? Math.round(this.cart.subtotal() * c.discount_value / 100)
      : c.discount_value;
  }
  get orderTotal() { return Math.max(0, this.cart.subtotal() - this.discount) + this.shippingCost; }

  ngOnInit(): void {
    if (this.cart.isEmpty()) { this.router.navigate(["/cart"]); return; }
    this.cart.loadFromServer().subscribe();
    this.api.get<any[]>("/account/addresses").subscribe({
      next: (res: any) => {
        const addrs = res.data ?? [];
        this.savedAddresses.set(addrs);
        const def = addrs.find((a: any) => a.is_default);
        if (def) this.selectedAddrId.set(def.id);
        if (!addrs.length) this.newAddress.set(true);
      },
      error: () => this.newAddress.set(true)
    });
  }

  selectAddress(id: number): void { this.selectedAddrId.set(id); this.newAddress.set(false); }
  useNewAddress(): void { this.newAddress.set(true); this.selectedAddrId.set(null); }

  goToStep(target: CheckoutStep): void {
    const curr = this.stepIndex();
    const targetIdx = this.STEPS.indexOf(target);
    if (targetIdx < curr) this.step.set(target);
  }

  nextFromAddress(): void {
    if (this.newAddress()) {
      this.addrSubmitted = true;
      if (this.addrForm.invalid) return;
    } else if (!this.selectedAddrId()) {
      this.toast.error("Please select a delivery address."); return;
    }
    this.step.set("shipping");
  }

  nextFromShipping(): void {
    const mode = this.effectivePaymentMode();
    if (mode === 'full_online') this.paymentMethod.set('online');
    else if (mode === 'full_cod') this.paymentMethod.set('cod');
    else if (mode === 'partial') this.paymentMethod.set('partial');
    this.step.set("payment");
  }
  nextFromPayment(): void { this.step.set("review"); }

  placeOrder(): void {
    this.placing.set(true);
    const addrId  = this.selectedAddrId();
    const pm = this.paymentMethod();
    const backendPaymentMethod = pm === 'partial' ? 'razorpay' : pm;
    const payload: any = {
      shipping_method: this.shippingMethod(),
      payment_method:  backendPaymentMethod
    };
    if (addrId) {
      payload.address_id = addrId;
    } else {
      payload.address = this.addrForm.value;
    }

    this.api.post("/orders", payload).subscribe({
      next: (res: any) => {
        this.placing.set(false);
        const orderData = res.data;
        const oid = orderData?.order_number ?? orderData?.id ?? "LK" + Date.now();

        if (pm === "online") {
          this.openRazorpay(orderData, null);
          return;
        }
        if (pm === "partial") {
          this.openRazorpay(orderData, this.advanceAmount());
          return;
        }

        this.orderId.set(oid);
        this.cart.clearCart();
        this.step.set("confirmation");
      },
      error: (err: any) => {
        this.placing.set(false);
        this.toast.error(err?.error?.message ?? "Failed to place order. Please try again.");
      }
    });
  }

  private openRazorpay(orderData: any, advanceAmount: number | null): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.placing.set(true);
    const body: any = { order_id: orderData.id };
    if (advanceAmount != null) body.advance_amount = advanceAmount;

    this.api.post<any>("/payment/create-order", body).subscribe({
      next: (res: any) => {
        const rzp = res.data;
        const isPartial = advanceAmount != null;
        const options: any = {
          key: environment.razorpayKeyId,
          amount: rzp.amount,
          currency: rzp.currency || 'INR',
          name: "Luv Kush Natural",
          description: isPartial
            ? `Advance for Order ${rzp.order_number}`
            : `Order ${rzp.order_number}`,
          order_id: rzp.razorpay_order_id,
          handler: (response: any) => {
            this.verifyPayment(orderData.id, response, advanceAmount);
          },
          prefill: {},
          theme: { color: "#B87333" },
          modal: {
            ondismiss: () => {
              this.placing.set(false);
              // Abort the pending order — restores stock, keeps cart intact
              this.api.delete(`/orders/my/${orderData.id}/abort-payment`).subscribe({
                next: () => this.cart.loadFromServer().subscribe(),
                error: () => this.cart.loadFromServer().subscribe()
              });
              this.toast.info('Payment cancelled. Your cart is intact — you can retry anytime.');
              this.step.set('payment');
            }
          }
        };
        this.placing.set(false);
        const razorpayInstance = new Razorpay(options);
        razorpayInstance.open();
      },
      error: (err: any) => {
        this.placing.set(false);
        this.toast.error(err?.error?.message ?? "Could not initiate payment");
      }
    });
  }

  private verifyPayment(orderId: number, response: any, advanceAmount: number | null): void {
    this.placing.set(true);
    const payload: any = {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
      order_id: orderId,
    };
    if (advanceAmount != null) payload.advance_amount = advanceAmount;
    this.api.post<any>("/payment/verify", payload).subscribe({
      next: (res: any) => {
        this.placing.set(false);
        this.orderId.set(res.data?.order_number ?? orderId);
        this.cart.clearCart(); // Cart cleared here after payment verified
        this.step.set("confirmation");
        this.toast.success("Payment successful! Your order is confirmed.");
      },
      error: (err: any) => {
        this.placing.set(false);
        // Payment verify failed — abort the order so cart is restored
        this.api.delete(`/orders/my/${orderId}/abort-payment`).subscribe({
          next: () => this.cart.loadFromServer().subscribe(),
          error: () => {}
        });
        this.toast.error(err?.error?.message ?? "Payment verification failed. Please contact support.");
      }
    });
  }

  get selectedAddress(): any {
    return this.savedAddresses().find(a => a.id === this.selectedAddrId());
  }
}