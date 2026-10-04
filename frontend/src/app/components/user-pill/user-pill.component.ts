import {
  Component, Input, OnInit, OnDestroy, HostListener,
  signal, computed, ElementRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-pill',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-pill.component.html',
  styleUrl: './user-pill.component.css'
})
export class UserPillComponent implements OnInit, OnDestroy {

  /** Extra links injected by the host (customer / driver / admin context items) */
  @Input() contextLinks: { label: string; icon: string; route: string }[] = [];

  private auth   = inject(AuthService);
  private router = inject(Router);
  private el     = inject(ElementRef);

  open = signal(false);

  // ── Derived display values ─────────────────────────────────
  readonly fullName  = computed(() => this.auth.userName() || this.auth.currentUser()?.email || 'Account');
  readonly email     = computed(() => this.auth.currentUser()?.email || '');
  readonly role      = computed(() => this.auth.getUserRole() ?? '');
  readonly firstName = computed(() => {
    const n = this.fullName();
    return n.includes('@') ? n.split('@')[0] : n.split(' ')[0];
  });
  readonly initials  = computed(() => {
    const n = this.fullName();
    if (n.includes('@')) return n.charAt(0).toUpperCase();
    const parts = n.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].charAt(0).toUpperCase();
  });
  readonly roleLabel = computed(() => {
    const r = this.role();
    if (r === 'ADMIN')    return 'Admin';
    if (r === 'DRIVER')   return 'Driver';
    if (r === 'CUSTOMER') return 'Customer';
    return r;
  });

  // ── Gradient per first initial (deterministic, vivid) ─────
  readonly avatarGradient = computed(() => {
    const code = this.initials().charCodeAt(0);
    const gradients = [
      'linear-gradient(135deg,#C41E3A,#FF6B6B)',
      'linear-gradient(135deg,#1B3A6B,#4A90D9)',
      'linear-gradient(135deg,#7C3AED,#C084FC)',
      'linear-gradient(135deg,#0369A1,#38BDF8)',
      'linear-gradient(135deg,#16A34A,#4ADE80)',
      'linear-gradient(135deg,#D97706,#FCD34D)',
      'linear-gradient(135deg,#BE185D,#F472B6)',
      'linear-gradient(135deg,#0F766E,#2DD4BF)',
    ];
    return gradients[code % gradients.length];
  });

  ngOnInit(): void {}
  ngOnDestroy(): void {}

  toggle(e: Event): void {
    e.stopPropagation();
    this.open.set(!this.open());
  }

  close(): void { this.open.set(false); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.open.set(false); }

  /** Arrow-key + Escape navigation inside the dropdown */
  onMenuKey(e: KeyboardEvent): void {
    const items = Array.from(
      (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="menuitem"]')
    );
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape')    { this.close(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length]?.focus(); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); }
  }

  logout(): void {
    this.auth.logout();
    this.close();
    this.router.navigate(['/login']);
  }
}
