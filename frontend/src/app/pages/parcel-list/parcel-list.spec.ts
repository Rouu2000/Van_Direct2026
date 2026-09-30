import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParcelListComponent } from './parcel-list';

describe('ParcelList', () => {
  let component: ParcelListComponent;
  let fixture: ComponentFixture<ParcelListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParcelListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ParcelListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
