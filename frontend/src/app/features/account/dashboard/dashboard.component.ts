import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { ApiService } from "../../../core/services/api.service";
import { AccountNavComponent } from "../account-nav/account-nav.component";

@Component({
  selector: "lk-account-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, AccountNavComponent],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"]
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  stats   = signal<any>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.api.get("/account/stats").subscribe({
      next: (res: any) => { this.stats.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}