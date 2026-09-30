import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingDriversComponent } from './pending-drivers';

describe('PendingDrivers', () => {
  let component: PendingDriversComponent;
  let fixture: ComponentFixture<PendingDriversComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingDriversComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PendingDriversComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
