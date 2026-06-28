import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  pages?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = this.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private getToken(): string | null {
    try {
      return typeof localStorage !== 'undefined'
        ? localStorage.getItem('lk_token')
        : null;
    } catch { return null; }
  }

  get<T>(path: string, params?: Record<string, any>): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          httpParams = httpParams.set(key, String(val));
        }
      });
    }
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(catchError(this.handleError));
  }

  post<T>(path: string, body: any = {}): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  put<T>(path: string, body: any = {}): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  patch<T>(path: string, body: any = {}): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${path}`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  uploadFormData<T>(path: string, formData: FormData, method: 'post' | 'put' = 'post'): Observable<ApiResponse<T>> {
    const token = this.getToken();
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : new HttpHeaders();
    const req = method === 'put'
      ? this.http.put<ApiResponse<T>>(`${this.baseUrl}${path}`, formData, { headers })
      : this.http.post<ApiResponse<T>>(`${this.baseUrl}${path}`, formData, { headers });
    return req.pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    const message =
      error?.error?.message ||
      error?.message ||
      'Something went wrong. Please try again.';
    return throwError(() => ({ ...error, userMessage: message }));
  }
}
