import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefButtonComponent } from './ref-button.component';

describe('RefButtonComponent', () => {
  let component: RefButtonComponent;
  let fixture: ComponentFixture<RefButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
