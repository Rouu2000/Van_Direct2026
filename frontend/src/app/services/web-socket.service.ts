import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: WebSocket | null = null;
  private driverSocket: WebSocket | null = null;
  private driverToken: string | null = null;
  private wantDriverConnection = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  subscribeToShipmentLocation(
    shipmentId: string,
    onMessage: (location: any) => void,
    onError?: () => void
  ): void {
    this.disconnect();
    this.socket = new WebSocket(
      `${environment.wsUrl}?shipmentId=${encodeURIComponent(shipmentId)}`
    );

    this.socket.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch {
        onMessage(event.data);
      }
    };

    this.socket.onerror = () => {
      if (onError) {
        onError();
      }
    };
  }

  /** Open (or keep) a driver location socket authenticated with JWT. Auto-reconnects. */
  connectDriverPublisher(token: string): void {
    this.wantDriverConnection = true;
    this.driverToken = token;
    if (this.driverSocket && (this.driverSocket.readyState === WebSocket.OPEN
        || this.driverSocket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.openDriverSocket();
  }

  sendDriverLocation(lat: number, lng: number): boolean {
    if (!this.driverSocket || this.driverSocket.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.driverSocket.send(JSON.stringify({ type: 'location', lat, lng }));
    return true;
  }

  isDriverSocketOpen(): boolean {
    return !!this.driverSocket && this.driverSocket.readyState === WebSocket.OPEN;
  }

  disconnectDriverPublisher(): void {
    this.wantDriverConnection = false;
    this.driverToken = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.driverSocket) {
      this.driverSocket.close();
      this.driverSocket = null;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private openDriverSocket(): void {
    if (!this.driverToken) {
      return;
    }
    const url = `${environment.wsUrl}?token=${encodeURIComponent(this.driverToken)}`;
    const socket = new WebSocket(url);
    this.driverSocket = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'auth', token: this.driverToken }));
    };

    socket.onclose = () => {
      if (this.driverSocket === socket) {
        this.driverSocket = null;
      }
      if (this.wantDriverConnection) {
        this.scheduleDriverReconnect();
      }
    };

    socket.onerror = () => {
      // onclose will schedule reconnect
    };
  }

  private scheduleDriverReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.wantDriverConnection) {
        this.openDriverSocket();
      }
    }, 3000);
  }
}
