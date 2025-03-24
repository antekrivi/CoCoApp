import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DizajnerPocetnoComponent } from './dizajner-pocetno.component';

describe('DizajnerPocetnoComponent', () => {
  let component: DizajnerPocetnoComponent;
  let fixture: ComponentFixture<DizajnerPocetnoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DizajnerPocetnoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DizajnerPocetnoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
