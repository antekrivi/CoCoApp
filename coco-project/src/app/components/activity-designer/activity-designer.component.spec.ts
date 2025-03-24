import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityDesignerComponent } from './activity-designer.component';

describe('ActivityDesignerComponent', () => {
  let component: ActivityDesignerComponent;
  let fixture: ComponentFixture<ActivityDesignerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActivityDesignerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityDesignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
