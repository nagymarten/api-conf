import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestBodiesComponent } from './request-bodies.component';

describe('RequestBodiesComponent', () => {
  let component: RequestBodiesComponent;
  let fixture: ComponentFixture<RequestBodiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestBodiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestBodiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
