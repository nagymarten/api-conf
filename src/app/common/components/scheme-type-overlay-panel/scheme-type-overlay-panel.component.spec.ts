import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchemeTypeOverlayPanelComponent } from './scheme-type-overlay-panel.component';

describe('SchemeTypeOverlayPanelComponent', () => {
  let component: SchemeTypeOverlayPanelComponent;
  let fixture: ComponentFixture<SchemeTypeOverlayPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchemeTypeOverlayPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchemeTypeOverlayPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
