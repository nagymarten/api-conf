import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayTextareaComponent } from './overlay-textarea.component';

describe('OverlayTextareaComponent', () => {
  let component: OverlayTextareaComponent;
  let fixture: ComponentFixture<OverlayTextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayTextareaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverlayTextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
