import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PathsComponent } from './paths.component';

describe('ApiDetailComponent', () => {
  let component: PathsComponent;
  let fixture: ComponentFixture<PathsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PathsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PathsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
