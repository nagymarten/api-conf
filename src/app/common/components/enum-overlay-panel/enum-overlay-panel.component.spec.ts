import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnumOverlayPanelComponent } from './enum-overlay-panel.component';

describe('EnumOverlayPanelComponent', () => {
  let component: EnumOverlayPanelComponent;
  let fixture: ComponentFixture<EnumOverlayPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnumOverlayPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnumOverlayPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
