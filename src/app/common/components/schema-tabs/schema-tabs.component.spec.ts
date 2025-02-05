import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchemaTabsComponent } from './schema-tabs.component';

describe('SchemaTabsComponent', () => {
  let component: SchemaTabsComponent;
  let fixture: ComponentFixture<SchemaTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchemaTabsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchemaTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
