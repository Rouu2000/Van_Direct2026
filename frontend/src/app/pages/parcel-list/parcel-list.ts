import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParcelService } from '../../services/parcel.service';

@Component({
  selector: 'app-parcel-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parcel-list.html',
  styleUrl: './parcel-list.css'
})
export class ParcelListComponent implements OnInit {
  parcels: any[] = [];

  constructor(
    private parcelService: ParcelService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.parcelService.getAll().subscribe({
      next: (data: any[]) => {
        this.parcels = Array.isArray(data) ? data : [];
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Error fetching parcels:', err);
      }
    });
  }
}
