import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { ApiService } from "../../../core/services/api.service";
import { AccountNavComponent } from "../account-nav/account-nav.component";
import { imageUrl } from "../../../shared/utils/image-url";

@Component({
  selector: "lk-orders",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, AccountNavComponent],
  templateUrl: "./orders.component.html",
  styleUrls: ["./orders.component.scss"]
})
export class OrdersComponent implements OnInit {
  private readonly api = inject(ApiService);

  orders  = signal<any[]>([]);
  loading = signal(true);

  readonly imgUrl = imageUrl;

  readonly STATUS_COLOR: Record<string, string> = {
    pending:   "status--pending",
    confirmed: "status--confirmed",
    shipped:   "status--shipped",
    delivered: "status--delivered",
    cancelled: "status--cancelled"
  };

  ngOnInit(): void {
    this.api.get("/orders/my").subscribe({
      next: (res: any) => { this.orders.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}