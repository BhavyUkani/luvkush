import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from "@angular/core";
import { FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { Router, RouterLink, ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "lk-login",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"]
})
export class LoginComponent implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

  form = this.fb.nonNullable.group({
    email:       ["", [Validators.required, Validators.email]],
    password:    ["", [Validators.required, Validators.minLength(6)]],
    rememberMe:  [false]
  });

  loading      = signal(false);
  showPw       = signal(false);
  error        = signal("");
  submitted    = false;
  returnUrl    = "/";

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams["returnUrl"] ?? "";
    if (this.auth.isLoggedIn()) this.redirectAfterLogin();
  }

  get f() { return this.form.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.error.set("");
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.login(this.f.email.value, this.f.password.value).subscribe({
      next: () => { this.loading.set(false); this.redirectAfterLogin(); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? "Invalid email or password. Please try again.");
      }
    });
  }

  private redirectAfterLogin(): void {
    if (this.auth.isAdmin()) {
      this.router.navigateByUrl(this.returnUrl || '/admin/dashboard');
    } else {
      this.router.navigateByUrl(this.returnUrl || '/account/dashboard');
    }
  }
}