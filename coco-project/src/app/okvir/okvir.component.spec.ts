import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OkvirComponent } from './okvir.component';

describe('OkvirComponent', () => {
  let component: OkvirComponent;
  let fixture: ComponentFixture<OkvirComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OkvirComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OkvirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
