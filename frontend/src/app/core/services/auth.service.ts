import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { Observable, throwError, of } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);
  private _loading = signal(false);

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isAdmin = computed(() => {
    const role = this._user()?.role;
    return role === 'super_admin' || role === 'admin';
  });
  readonly loading = this._loading.asReadonly();

  constructor() {
    this.restore();
  }

  get fullName(): string {
    const u = this._user();
    return u ? `${u.first_name} ${u.last_name}`.trim() : '';
  }

  login(email: string, password: string): Observable<any> {
    this._loading.set(true);
    return this.api.post('/auth/login', { email, password }).pipe(
      tap((res: any) => {
        this.setSession(res.data);
        this._loading.set(false);
      }),
      catchError(err => {
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  register(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
  }): Observable<any> {
    this._loading.set(true);
    return this.api.post('/auth/register', data).pipe(
      tap((res: any) => {
        this.setSession(res.data);
        this._loading.set(false);
      }),
      catchError(err => {
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.api.post('/auth/forgot-password', { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.api.post('/auth/reset-password', { token, password });
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) return throwError(() => ({ userMessage: 'No refresh token' }));

    return this.api.post('/auth/refresh', { refreshToken }).pipe(
      tap((res: any) => this.setSession(res.data)),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  updateProfile(user: Partial<User>): void {
    this._user.update(u => u ? { ...u, ...user } : null);
    this.saveUser();
  }

  logout(): void {
    this._user.set(null);
    this._token.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('lk_token');
      localStorage.removeItem('lk_refresh_token');
      localStorage.removeItem('lk_user');
    }
    this.router.navigate(['/login']);
  }

  private setSession(data: any): void {
    if (!data) return;
    const { user, token, refreshToken } = data;
    this._user.set(user);
    this._token.set(token);

    if (isPlatformBrowser(this.platformId)) {
      if (token) localStorage.setItem('lk_token', token);
      if (refreshToken) localStorage.setItem('lk_refresh_token', refreshToken);
      if (user) localStorage.setItem('lk_user', JSON.stringify(user));
    }
  }

  private restore(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const token = localStorage.getItem('lk_token');
      const user = localStorage.getItem('lk_user');
      if (token && user && !this.isTokenExpired(token)) {
        this._token.set(token);
        this._user.set(JSON.parse(user));
      } else if (token || user) {
        localStorage.removeItem('lk_token');
        localStorage.removeItem('lk_refresh_token');
        localStorage.removeItem('lk_user');
      }
    } catch { /* ignore */ }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private saveUser(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const u = this._user();
      if (u) localStorage.setItem('lk_user', JSON.stringify(u));
    } catch { /* ignore */ }
  }

  private getStoredRefreshToken(): string | null {
    try {
      return isPlatformBrowser(this.platformId)
        ? localStorage.getItem('lk_refresh_token')
        : null;
    } catch { return null; }
  }
}
