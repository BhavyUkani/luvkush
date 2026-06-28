import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "lk-account-nav",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: "./account-nav.component.html",
  styleUrls: ["./account-nav.component.scss"]
})
export class AccountNavComponent {
  readonly auth = inject(AuthService);

  get initials(): string {
    const u = this.auth.user();
    if (!u) return "U";
    return `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase();
  }

  get fullName(): string { return this.auth.fullName || "My Account"; }
  get email(): string { return this.auth.user()?.email ?? ""; }

  logout(): void { this.auth.logout(); }
}