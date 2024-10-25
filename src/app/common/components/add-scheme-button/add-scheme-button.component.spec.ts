import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSchemeButtonComponent } from './add-scheme-button.component';

describe('AddSchemeButtonComponent', () => {
  let component: AddSchemeButtonComponent;
  let fixture: ComponentFixture<AddSchemeButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddSchemeButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddSchemeButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
