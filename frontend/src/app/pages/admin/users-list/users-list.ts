import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css'
})
export class UsersListComponent implements OnInit {
  users: any[] = [];
  filtered: any[] = [];
  page: any[] = [];
  loading = true;
  error: string | null = null;
  searchQuery = '';
  roleFilter = '';
  readonly pageSize = 15;
  currentPage = 0;

  get totalPages() { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get pageStart()  { return this.currentPage * this.pageSize; }
  get pageEnd()    { return Math.min(this.pageStart + this.pageSize, this.filtered.length); }

  constructor(private userService: UserService, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.loading = true; this.error = null; this.cdr.markForCheck();
    this.userService.getAllUsers().subscribe({
      next: (d: any[]) => { this.users = Array.isArray(d) ? d : []; this.applyFilters(); this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.error = 'Failed to load users.'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered = this.users.filter(u => {
      const mr = !this.roleFilter || u.role === this.roleFilter;
      const mq = !q || [u.name, u.email].some((v: string) => v?.toLowerCase().includes(q));
      return mr && mq;
    });
    this.currentPage = 0; this.refreshPage();
  }

  setFilter(r: string): void { this.roleFilter = r; this.applyFilters(); }
  refreshPage(): void { this.page = this.filtered.slice(this.pageStart, this.pageEnd); }
  prevPage(): void { if (this.currentPage > 0) { this.currentPage--; this.refreshPage(); } }
  nextPage(): void { if (this.currentPage < this.totalPages - 1) { this.currentPage++; this.refreshPage(); } }

  avatarColor(name: string): string {
    const colors = ['#1B3A6B','#C41E3A','#7C3AED','#0369A1','#15803D','#B45309'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  }
}
