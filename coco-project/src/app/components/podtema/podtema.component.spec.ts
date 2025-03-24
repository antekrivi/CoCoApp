import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodtemaComponent } from './podtema.component';

describe('PodtemaComponent', () => {
  let component: PodtemaComponent;
  let fixture: ComponentFixture<PodtemaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PodtemaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PodtemaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
