import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodtemaZadatakComponent } from './podtema-zadatak.component';

describe('PodtemaZadatakComponent', () => {
  let component: PodtemaZadatakComponent;
  let fixture: ComponentFixture<PodtemaZadatakComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PodtemaZadatakComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PodtemaZadatakComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
