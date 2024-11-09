import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PathRequestPageComponent } from './path-request-page.component';

describe('PathRequestPageComponent', () => {
  let component: PathRequestPageComponent;
  let fixture: ComponentFixture<PathRequestPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PathRequestPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PathRequestPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
