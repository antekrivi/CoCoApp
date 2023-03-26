import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DizajnerAktivnostiComponent } from './dizajner-aktivnosti.component';

describe('DizajnerAktivnostiComponent', () => {
  let component: DizajnerAktivnostiComponent;
  let fixture: ComponentFixture<DizajnerAktivnostiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DizajnerAktivnostiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DizajnerAktivnostiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
