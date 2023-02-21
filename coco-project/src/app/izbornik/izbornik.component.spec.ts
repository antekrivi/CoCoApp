import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IzbornikComponent } from './izbornik.component';

describe('IzbornikComponent', () => {
  let component: IzbornikComponent;
  let fixture: ComponentFixture<IzbornikComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IzbornikComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IzbornikComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
