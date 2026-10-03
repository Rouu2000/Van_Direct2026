import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ShipmentService } from '../../../services/shipment.service';
import { AddressFormComponent, AddressData, validateAddressData } from '../../../components/address-form/address-form.component';
import { CadPipe } from '../../../shared/cad.pipe';
import { weightValidator, declaredValueValidator, getError } from '../../../shared/validators';

@Component({
  selector: 'app-create-shipment',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule, MatRadioModule,
    AddressFormComponent, CadPipe
  ],
  templateUrl: './create-shipment.component.html',
  styleUrls: ['./create-shipment.component.css']
})
export class CreateShipmentComponent implements OnInit, OnDestroy {

  step = 1;
  loading = false;
  error: string | null = null;
  warning: string | null = null;
  createdTrackingNumber: string | null = null;
  estimatedTotal = 0;
  estimatedDistanceKm = 0;

  serviceTier = 'STANDARD';
  customerId  = '';

  pickupAddress: AddressData  = this.emptyAddress();
  dropoffAddress: AddressData = this.emptyAddress();

  parcelsForm!: FormGroup;
  getError = getError;

  get parcelsArray(): FormArray { return this.parcelsForm.get('parcels') as FormArray; }
  get parcels() { return this.parcelsArray.controls as FormGroup[]; }

  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private shipmentService: ShipmentService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.hydrateFromStorage();
    this.customerId = this.authService.getUserId() || '';
    this.parcelsForm = this.fb.group({
      parcels: this.fb.array([this.makeParcelGroup()])
    });
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  private emptyAddress(city = 'Ottawa', province = 'ON'): AddressData {
    return { contactName:'', company:'', phone:'', email:'', line1:'', line2:'',
             postalCode:'', province, city, residential:false, lat:null, lng:null, geoAccuracy:null };
  }

  private makeParcelGroup(): FormGroup {
    return this.fb.group({
      weightKg:      [1,    [Validators.required, weightValidator()]],
      sizeCategory:  ['SMALL', Validators.required],
      description:   ['',   [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
      declaredValue: [null, [declaredValueValidator()]]
    });
  }

  showErr(ctrl: ReturnType<FormGroup['get']>): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  addParcel(): void {
    this.parcelsArray.push(this.makeParcelGroup());
    this.refreshEstimate();
    this.cdr.markForCheck();
  }

  removeParcel(i: number): void {
    if (this.parcelsArray.length > 1) {
      this.parcelsArray.removeAt(i);
      this.refreshEstimate();
      this.cdr.markForCheck();
    }
  }

  onPickupChange(addr: AddressData): void  { this.pickupAddress  = addr; this.refreshEstimate(); }
  onDropoffChange(addr: AddressData): void { this.dropoffAddress = addr; this.refreshEstimate(); }

  refreshEstimate(): void {
    if (this.step < 3) return;
    const { lat: pLat, lng: pLng } = this.pickupAddress;
    const { lat: dLat, lng: dLng } = this.dropoffAddress;
    if (pLat == null || dLat == null) return;
    const parcels = this.parcelsArray.value.map((p: any) => ({
      weightKg: Number(p.weightKg) || 0, sizeCategory: p.sizeCategory
    }));
    this.shipmentService.estimatePrice({
      serviceTier: this.serviceTier,
      pickupLat: pLat, pickupLng: pLng!, dropoffLat: dLat, dropoffLng: dLng!, parcels
    }).subscribe({
      next: (res) => {
        this.estimatedTotal = Number(res?.priceAmount) || 0;
        this.estimatedDistanceKm = Number(res?.distanceKm) || 0;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  onServiceTierChange(): void { this.refreshEstimate(); }

  canGoStep2(): boolean { return !validateAddressData(this.pickupAddress, true); }

  nextStep(): void {
    this.error = null;
    if (this.step === 1) {
      const pickupErr = validateAddressData(this.pickupAddress, true);
      if (pickupErr) { this.error = pickupErr; this.cdr.markForCheck(); return; }
      if (!this.dropoffAddress.contactName?.trim()) {
        this.error = 'Please fill in at least the recipient name and city.'; this.cdr.markForCheck(); return;
      }
    }
    if (this.step === 2) {
      this.parcelsArray.markAllAsTouched();
      if (this.parcelsForm.invalid) {
        this.error = 'Please fix the parcel errors before continuing.';
        this.cdr.markForCheck(); return;
      }
    }
    this.step++;
    if (this.step === 3 || this.step === 4) this.refreshEstimate();
    this.cdr.markForCheck();
  }

  prevStep(): void { this.error = null; if (this.step > 1) { this.step--; this.cdr.markForCheck(); } }

  confirm(): void {
    this.error = null;
    if (!this.customerId) { this.error = 'You must be logged in.'; this.cdr.markForCheck(); return; }
    this.loading = true; this.cdr.markForCheck();

    const payload: any = {
      customerId:   this.customerId,
      serviceTier:  this.serviceTier,
      recipientName:  this.dropoffAddress.contactName,
      recipientPhone: this.dropoffAddress.phone,
      pickupContactName: this.pickupAddress.contactName,
      pickupCompany:     this.pickupAddress.company,
      pickupPhone:       this.pickupAddress.phone,
      pickupEmail:       this.pickupAddress.email,
      pickupLine1:       this.pickupAddress.line1,
      pickupLine2:       this.pickupAddress.line2,
      pickupPostalCode:  this.pickupAddress.postalCode,
      pickupProvince:    this.pickupAddress.province,
      pickupCity:        this.pickupAddress.city,
      pickupResidential: this.pickupAddress.residential,
      dropoffContactName: this.dropoffAddress.contactName,
      dropoffCompany:     this.dropoffAddress.company,
      dropoffPhone:       this.dropoffAddress.phone,
      dropoffEmail:       this.dropoffAddress.email,
      dropoffLine1:       this.dropoffAddress.line1,
      dropoffLine2:       this.dropoffAddress.line2,
      dropoffPostalCode:  this.dropoffAddress.postalCode,
      dropoffProvince:    this.dropoffAddress.province,
      dropoffCity:        this.dropoffAddress.city,
      dropoffResidential: this.dropoffAddress.residential,
      parcels: this.parcelsArray.value.map((p: any) => ({
        weightKg: p.weightKg, sizeCategory: p.sizeCategory,
        description: p.description, declaredValue: p.declaredValue
      }))
    };

    this.shipmentService.createShipment(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.createdTrackingNumber = res?.shipment?.trackingNumber || null;
        // A geocoding warning must not block the booking — just show it
        this.warning = res?.warning || null;
        this.step = 5;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to create shipment.';
        this.cdr.markForCheck();
      }
    });
  }

  goToDashboard(): void { this.router.navigate(['/customer/dashboard']); }
}
