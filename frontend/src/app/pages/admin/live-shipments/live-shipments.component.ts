import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService, LiveShipment } from '../../../services/admin.service';
import * as L from 'leaflet';

/* Fix Leaflet default icon paths */
const iconBase = {
  iconUrl:       'assets/leaflet/marker-icon.png',
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  shadowUrl:     'assets/leaflet/marker-shadow.png',
  iconSize:    [25, 41] as [number, number],
  iconAnchor:  [12, 41] as [number, number],
  popupAnchor: [1, -34] as [number, number],
  shadowSize:  [41, 41] as [number, number]
};
L.Marker.prototype.options.icon = L.icon(iconBase);

/** Per-session Nominatim cache: address → coords or null */
const geocacheMap = new Map<string, {lat:number;lng:number} | null>();

/** Status → colour */
const STATUS_COLOR: Record<string, string> = {
  BOOKED: '#D97706', DRIVER_ASSIGNED: '#2563EB', PICKED_UP: '#16A34A'
};

function markerIcon(status: string, label: string, type: 'pickup'|'dropoff'|'driver'): L.DivIcon {
  const color = STATUS_COLOR[status] ?? '#64748B';
  const emoji = type === 'driver' ? '🚚' : type === 'pickup' ? '📦' : '🏁';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        position:relative;
        display:flex;flex-direction:column;align-items:center;
        filter:drop-shadow(0 2px 4px rgba(0,0,0,.25));">
        <div style="
          background:${color};color:#fff;
          border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          width:36px;height:36px;
          display:flex;align-items:center;justify-content:center;
          border:2px solid white;">
          <span style="transform:rotate(45deg);font-size:16px">${emoji}</span>
        </div>
        <div style="
          background:${color};color:#fff;
          font-size:9px;font-weight:700;font-family:Inter,sans-serif;
          padding:1px 5px;border-radius:4px;margin-top:1px;
          max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${label}
        </div>
      </div>`,
    iconSize:   [90, 52],
    iconAnchor: [18, 46],
    popupAnchor:[0, -46]
  });
}

@Component({
  selector: 'app-live-shipments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule],
  templateUrl: './live-shipments.component.html',
  styleUrl: './live-shipments.component.css'
})
export class LiveShipmentsComponent implements OnInit, AfterViewInit, OnDestroy {
  loading = true;
  shipments: LiveShipment[] = [];
  filteredShipments: LiveShipment[] = [];
  statusFilter: 'ALL'|'BOOKED'|'DRIVER_ASSIGNED'|'PICKED_UP' = 'ALL';
  selectedId: string | null = null;

  private map: L.Map | null = null;
  private markerGroups = new Map<string, {pickup?:L.Marker, dropoff?:L.Marker, driver?:L.Marker, line?:L.Polyline}>();
  private refreshInterval: any = null;
  private geocoding = false;

  /* Tunisia default centre */
  private readonly CENTER: L.LatLngExpression = [45.4215, -75.6972];
  private readonly ZOOM = 11;

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadShipments();
    this.refreshInterval = setInterval(() => this.loadShipments(), 5000);
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.map) { this.map.remove(); this.map = null; }
  }

  // ── Map init ──────────────────────────────────────────────
  private initMap(): void {
    const el = document.getElementById('live-shipments-map');
    if (!el || this.map) return;

    this.map = L.map(el, {
      center: this.CENTER,
      zoom: this.ZOOM,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.map);

    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  // ── Data load + geocoding ─────────────────────────────────
  private loadShipments(): void {
    this.adminService.getLiveShipments().subscribe({
      next: async data => {
        const enriched = await this.enrichCoords(data);
        this.shipments = enriched;
        this.applyStatusFilter();
        this.loading = false;
        this.updateMap();
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  private async enrichCoords(list: LiveShipment[]): Promise<LiveShipment[]> {
    const out: LiveShipment[] = [];
    for (const s of list) {
      const e = { ...s };
      if (!e.pickupLat && e.pickupAddress) {
        const c = await this.geocode(e.pickupAddress);
        if (c) { e.pickupLat = c.lat; e.pickupLng = c.lng; }
      }
      if (!e.dropoffLat && e.dropoffAddress) {
        const c = await this.geocode(e.dropoffAddress);
        if (c) { e.dropoffLat = c.lat; e.dropoffLng = c.lng; }
      }
      out.push(e);
    }
    return out;
  }

  /** Nominatim with Tunisia bias, in-memory cache, 300ms rate-limit */
  private geocode(address: string): Promise<{lat:number;lng:number}|null> {
    const key = address.trim().toLowerCase();
    if (geocacheMap.has(key)) return Promise.resolve(geocacheMap.get(key)!);

    const q = address.toLowerCase().includes('tunisia') ? address : `${address}, Tunisia`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=ca&viewbox=-76.4,45.7,-75.0,44.9&bounded=0`;

    return new Promise(resolve => {
      setTimeout(async () => {
        try {
          const r = await fetch(url, { headers: { 'Accept-Language': 'en' } });
          const j = await r.json();
          if (j?.length > 0) {
            const c = { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) };
            geocacheMap.set(key, c);
            resolve(c);
          } else {
            geocacheMap.set(key, null);
            resolve(null);
          }
        } catch {
          geocacheMap.set(key, null);
          resolve(null);
        }
      }, 300);
    });
  }

  // ── Status filter ─────────────────────────────────────────
  setStatusFilter(f: 'ALL'|'BOOKED'|'DRIVER_ASSIGNED'|'PICKED_UP'): void {
    this.statusFilter = f;
    this.applyStatusFilter();
    this.updateMap();
    this.cdr.markForCheck();
  }

  applyStatusFilter(): void {
    this.filteredShipments = this.statusFilter === 'ALL'
      ? this.shipments
      : this.shipments.filter(s => s.status === this.statusFilter);
  }

  // ── Map update ────────────────────────────────────────────
  private updateMap(): void {
    if (!this.map) return;

    // Remove old markers
    this.markerGroups.forEach(g => {
      g.pickup?.remove(); g.dropoff?.remove(); g.driver?.remove(); g.line?.remove();
    });
    this.markerGroups.clear();

    const allMarkers: L.Marker[] = [];

    this.filteredShipments.forEach(s => {
      const grp: {pickup?:L.Marker, dropoff?:L.Marker, driver?:L.Marker, line?:L.Polyline} = {};
      const dim = this.selectedId && this.selectedId !== s.id;

      if (s.pickupLat && s.pickupLng) {
        grp.pickup = L.marker([s.pickupLat, s.pickupLng], { icon: markerIcon(s.status, s.trackingNumber, 'pickup') })
          .addTo(this.map!)
          .bindPopup(this.buildPopup(s));
        if (dim) grp.pickup.setOpacity(0.35);
        grp.pickup.on('click', () => this.selectShipment(s.id));
        allMarkers.push(grp.pickup);
      }

      if (s.dropoffLat && s.dropoffLng) {
        grp.dropoff = L.marker([s.dropoffLat, s.dropoffLng], { icon: markerIcon(s.status, s.trackingNumber, 'dropoff') })
          .addTo(this.map!);
        if (dim) grp.dropoff.setOpacity(0.35);
        grp.dropoff.on('click', () => this.selectShipment(s.id));
        allMarkers.push(grp.dropoff);
      }

      if (s.driverLat && s.driverLng) {
        grp.driver = L.marker([s.driverLat, s.driverLng], { icon: markerIcon(s.status, 'Driver', 'driver') })
          .addTo(this.map!)
          .bindPopup(`<b>Driver</b><br>${s.trackingNumber}`);
        if (dim) grp.driver.setOpacity(0.35);
        allMarkers.push(grp.driver);
      }

      // Dashed line between pickup and dropoff when selected
      if (this.selectedId === s.id && s.pickupLat && s.pickupLng && s.dropoffLat && s.dropoffLng) {
        grp.line = L.polyline([[s.pickupLat, s.pickupLng], [s.dropoffLat, s.dropoffLng]], {
          color: STATUS_COLOR[s.status] ?? '#64748B', weight: 2, dashArray: '6 6', opacity: 0.7
        }).addTo(this.map!);
      }

      this.markerGroups.set(s.id, grp);
    });

    if (allMarkers.length > 0 && !this.selectedId) {
      this.map.fitBounds(L.featureGroup(allMarkers).getBounds().pad(0.15));
    }
    this.map.invalidateSize();
  }

  private buildPopup(s: LiveShipment): string {
    return `
      <div style="font-family:Inter,sans-serif;font-size:13px;min-width:180px">
        <div style="font-weight:700;color:#0F172A;margin-bottom:6px">${s.trackingNumber}</div>
        <div style="margin-bottom:4px"><span class="status-chip" style="font-size:11px">${s.status}</span></div>
        <div style="color:#64748B;font-size:12px">
          <div>📦 ${s.pickupAddress || '—'}</div>
          <div>🏁 ${s.dropoffAddress || '—'}</div>
        </div>
      </div>`;
  }

  // ── List interactions ─────────────────────────────────────
  selectShipment(id: string): void {
    this.selectedId = this.selectedId === id ? null : id;
    this.updateMap();
    if (this.selectedId) {
      const s = this.filteredShipments.find(x => x.id === id);
      if (s && this.map) {
        const pts: L.LatLngExpression[] = [];
        if (s.pickupLat  && s.pickupLng)  pts.push([s.pickupLat,  s.pickupLng]);
        if (s.dropoffLat && s.dropoffLng) pts.push([s.dropoffLat, s.dropoffLng]);
        if (s.driverLat  && s.driverLng)  pts.push([s.driverLat,  s.driverLng]);
        if (pts.length > 0) {
          this.map.fitBounds(L.latLngBounds(pts).pad(0.3));
          const grp = this.markerGroups.get(id);
          grp?.pickup?.openPopup();
        }
      }
    }
    this.cdr.markForCheck();
  }

  resetView(): void  { this.map?.setView(this.CENTER, this.ZOOM); }
  fitAll(): void {
    const markers: L.Marker[] = [];
    this.markerGroups.forEach(g => { if (g.pickup) markers.push(g.pickup); if (g.dropoff) markers.push(g.dropoff); });
    if (markers.length > 0 && this.map) {
      this.map.fitBounds(L.featureGroup(markers).getBounds().pad(0.15));
    }
  }

  statusColor(s: string): string { return STATUS_COLOR[s] ?? '#64748B'; }
}
