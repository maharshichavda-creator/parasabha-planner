import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'parasabha-username';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  username: string;
}

/**
 * Authenticates against the backend `app_user` table (see AuthController/AuthService on the
 * backend) and tracks the logged-in username for the current browser session. Login state is
 * kept in sessionStorage so a page refresh doesn't log the user out, but closing the browser
 * tab/window does.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  private readonly username = signal<string | null>(sessionStorage.getItem(STORAGE_KEY));
  readonly isLoggedIn = computed(() => this.username() !== null);
  readonly currentUsername = this.username.asReadonly();

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap((response) => {
        sessionStorage.setItem(STORAGE_KEY, response.username);
        this.username.set(response.username);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.username.set(null);
  }
}
