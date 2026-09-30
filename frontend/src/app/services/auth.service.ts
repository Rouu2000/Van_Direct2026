import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.apiUrl}/api/auth`;
  private tokenKey = 'jwt_token';
  private userKey = 'current_user';
  private roleKey = 'user_role';
  private nameKey = 'user_name';
  private idKey = 'user_id';

  /** Reactive auth state — required for zoneless Angular change detection */
  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _role = signal<string | null>(null);
  private readonly _name = signal<string | null>(null);
  private readonly _id = signal<string | null>(null);

  readonly token = this._token.asReadonly();
  readonly currentUser = this._user.asReadonly();
  readonly role = this._role.asReadonly();
  readonly userName = this._name.asReadonly();
  readonly userId = this._id.asReadonly();

  readonly loggedIn = computed(() => !!this._token());
  readonly admin = computed(() => this._role() === 'ADMIN');
  readonly customer = computed(() => this._role() === 'CUSTOMER');
  readonly driver = computed(() => this._role() === 'DRIVER');

  constructor(private http: HttpClient) {
    this.hydrateFromStorage();
  }

  /** Load auth state from localStorage (call on init / refresh) */
  hydrateFromStorage(): void {
    const token = localStorage.getItem(this.tokenKey);
    const userRaw = localStorage.getItem(this.userKey);
    const role = localStorage.getItem(this.roleKey);
    const name = localStorage.getItem(this.nameKey);
    const id = localStorage.getItem(this.idKey);

    this._token.set(token);
    this._role.set(role ? role.toUpperCase() : null);
    this._name.set(name);
    this._id.set(id);

    if (userRaw) {
      try {
        this._user.set(JSON.parse(userRaw));
      } catch {
        this._user.set(null);
      }
    } else {
      this._user.set(null);
    }

    // Recover role/name/id from token or user if keys are missing
    if (token && !this._role()) {
      const decoded = this.decodeToken(token);
      const recoveredRole = this._user()?.role || decoded?.role;
      if (recoveredRole) {
        this._role.set(String(recoveredRole).toUpperCase());
        localStorage.setItem(this.roleKey, String(recoveredRole).toUpperCase());
      }
    }
    if (!this._name() && this._user()?.name) {
      this._name.set(this._user()!.name!);
    }
    if (!this._id() && this._user()?.id) {
      this._id.set(String(this._user()!.id));
    }
  }

  register(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, user).pipe(
      tap((response: any) => {
        if (response?.token) {
          this.storeAuthData(response.token, response.user);
        }
      })
    );
  }

  registerDriver(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register-driver`, user);
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response?.token) {
          this.storeAuthData(response.token, response.user);
        }
      })
    );
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password/request`, { email });
  }

  confirmPasswordReset(data: { token: string; newPassword?: string; password?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password/confirm`, data);
  }

  storeToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this._token.set(token);
    const decoded = this.decodeToken(token);
    if (decoded) {
      this.persistDecodedUser(decoded);
    }
  }

  storeAuthData(token: string, user: any): void {
    localStorage.setItem(this.tokenKey, token);
    this._token.set(token);

    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
      this._user.set(user);
    }

    const decoded = this.decodeToken(token);
    const role = user?.role || decoded?.role || null;
    const name = user?.name || decoded?.name || decoded?.fullName || null;
    const id = user?.id || decoded?.id || decoded?.userId || null;

    if (role) {
      const roleUpper = String(role).toUpperCase();
      localStorage.setItem(this.roleKey, roleUpper);
      this._role.set(roleUpper);
    }
    if (name) {
      localStorage.setItem(this.nameKey, name);
      this._name.set(name);
    }
    if (id) {
      localStorage.setItem(this.idKey, String(id));
      this._id.set(String(id));
    }
  }

  storeUser(user: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this._user.set(user);
    if (user?.role) {
      const roleUpper = String(user.role).toUpperCase();
      localStorage.setItem(this.roleKey, roleUpper);
      this._role.set(roleUpper);
    }
    if (user?.name) {
      localStorage.setItem(this.nameKey, user.name);
      this._name.set(user.name);
    }
    if (user?.id) {
      localStorage.setItem(this.idKey, String(user.id));
      this._id.set(String(user.id));
    }
  }

  getToken(): string | null {
    return this._token() ?? localStorage.getItem(this.tokenKey);
  }

  getUser(): any {
    return this._user() ?? (() => {
      const user = localStorage.getItem(this.userKey);
      return user ? JSON.parse(user) : null;
    })();
  }

  getUserRole(): string | null {
    const role = this._role() || localStorage.getItem(this.roleKey) || (this.getUser()?.role ?? null);
    return role ? String(role).toUpperCase() : null;
  }

  getUserName(): string | null {
    return this._name() || localStorage.getItem(this.nameKey) || this.getUser()?.name || null;
  }

  getUserId(): string | null {
    return this._id() || localStorage.getItem(this.idKey) || this.getUser()?.id || null;
  }

  getCurrentUserId(): string | null {
    return this.getUserId();
  }

  isLoggedIn(): boolean {
    return this.loggedIn() || !!this.getToken();
  }

  isAdmin(): boolean {
    return this.admin() || this.getUserRole() === 'ADMIN';
  }

  isCustomer(): boolean {
    return this.customer() || this.getUserRole() === 'CUSTOMER';
  }

  isDriver(): boolean {
    return this.driver() || this.getUserRole() === 'DRIVER';
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.nameKey);
    localStorage.removeItem(this.idKey);
    this._token.set(null);
    this._user.set(null);
    this._role.set(null);
    this._name.set(null);
    this._id.set(null);
  }

  private persistDecodedUser(decoded: any): void {
    if (decoded?.role) {
      const roleUpper = String(decoded.role).toUpperCase();
      localStorage.setItem(this.roleKey, roleUpper);
      this._role.set(roleUpper);
    }
    if (decoded?.name) {
      localStorage.setItem(this.nameKey, decoded.name);
      this._name.set(decoded.name);
    }
    if (decoded?.fullName) {
      localStorage.setItem(this.nameKey, decoded.fullName);
      this._name.set(decoded.fullName);
    }
    if (decoded?.id || decoded?.userId) {
      const id = String(decoded.id || decoded.userId);
      localStorage.setItem(this.idKey, id);
      this._id.set(id);
    }
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }
}
