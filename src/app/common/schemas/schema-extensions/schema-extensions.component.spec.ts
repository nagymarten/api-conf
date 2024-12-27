import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchemaExtensionsComponent } from './schema-extensions.component';

describe('SchemaExtensionsComponent', () => {
  let component: SchemaExtensionsComponent;
  let fixture: ComponentFixture<SchemaExtensionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchemaExtensionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchemaExtensionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
