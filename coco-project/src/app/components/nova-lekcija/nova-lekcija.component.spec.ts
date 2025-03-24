import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovaLekcijaComponent } from './nova-lekcija.component';

describe('NovaLekcijaComponent', () => {
  let component: NovaLekcijaComponent;
  let fixture: ComponentFixture<NovaLekcijaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NovaLekcijaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NovaLekcijaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
