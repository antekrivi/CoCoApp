import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DizajnerLekcijaComponent } from './dizajner-lekcija.component';

describe('DizajnerLekcijaComponent', () => {
  let component: DizajnerLekcijaComponent;
  let fixture: ComponentFixture<DizajnerLekcijaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DizajnerLekcijaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DizajnerLekcijaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
