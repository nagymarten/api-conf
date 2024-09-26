import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiDocumentUploadButtonComponent } from './api-document-upload-button.component';

describe('ApiDocumentUploadButtonComponent', () => {
  let component: ApiDocumentUploadButtonComponent;
  let fixture: ComponentFixture<ApiDocumentUploadButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiDocumentUploadButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApiDocumentUploadButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
