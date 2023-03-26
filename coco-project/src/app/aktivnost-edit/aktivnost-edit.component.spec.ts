import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AktivnostEditComponent } from './aktivnost-edit.component';

describe('AktivnostEditComponent', () => {
  let component: AktivnostEditComponent;
  let fixture: ComponentFixture<AktivnostEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AktivnostEditComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AktivnostEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
