import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipmentListComponent } from './shipment-list';

describe('ShipmentList', () => {
  let component: ShipmentListComponent;
  let fixture: ComponentFixture<ShipmentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipmentListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShipmentListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
