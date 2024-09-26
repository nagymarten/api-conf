import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-api-document-upload-button',
  standalone: true,
  imports: [],
  templateUrl: './api-document-upload-button.component.html',
  styleUrl: './api-document-upload-button.component.css',
})
export class ApiDocumentUploadButtonComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  // Method to handle the file selection
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log('Selected file:', file);
      // You can now process the file here, e.g., upload it to a server
    }
  }
}