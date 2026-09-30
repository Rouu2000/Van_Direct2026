import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppNotification {
  id: string;
  userId: string;
  shipmentId?: string;
  title: string;
  message: string;
  readFlag: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private baseUrl = `${environment.apiUrl}/api/notifications`;

  private readonly _notifications = signal<AppNotification[]>([]);
  private readonly _unreadCount = signal<number>(0);

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();

  constructor(private http: HttpClient) {}

  fetchNotifications(): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(this.baseUrl).pipe(
      tap((res) => {
        if (res) {
          this._notifications.set(res.notifications || []);
          this._unreadCount.set(res.unreadCount || 0);
        }
      })
    );
  }

  markAsRead(id: string): Observable<AppNotification> {
    return this.http.put<AppNotification>(`${this.baseUrl}/${id}/read`, {}).pipe(
      tap(() => {
        this._notifications.update((list) =>
          list.map((n) => (n.id === id ? { ...n, readFlag: true } : n))
        );
        this._unreadCount.update((count) => Math.max(0, count - 1));
      })
    );
  }
}
