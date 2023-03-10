import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZadatakComponent } from './zadatak.component';

describe('ZadatakComponent', () => {
  let component: ZadatakComponent;
  let fixture: ComponentFixture<ZadatakComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ZadatakComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZadatakComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
