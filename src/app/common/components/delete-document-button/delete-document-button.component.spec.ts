import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteDocumentButtonComponent } from './delete-document-button.component';

describe('DeleteDocumentButtonComponent', () => {
  let component: DeleteDocumentButtonComponent;
  let fixture: ComponentFixture<DeleteDocumentButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteDocumentButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteDocumentButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
