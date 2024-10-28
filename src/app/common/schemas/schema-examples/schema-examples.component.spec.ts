import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchemaExamplesComponent } from './schema-examples.component';

describe('SchemaExamplesComponent', () => {
  let component: SchemaExamplesComponent;
  let fixture: ComponentFixture<SchemaExamplesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchemaExamplesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchemaExamplesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
