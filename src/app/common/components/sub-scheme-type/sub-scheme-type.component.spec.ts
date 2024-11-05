import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubSchemeTypeComponent } from './sub-scheme-type.component';

describe('SubSchemeTypeComponent', () => {
  let component: SubSchemeTypeComponent;
  let fixture: ComponentFixture<SubSchemeTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubSchemeTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubSchemeTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
