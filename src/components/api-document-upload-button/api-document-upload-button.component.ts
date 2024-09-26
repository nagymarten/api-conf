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

  fileContent: string | null = null;
  fileLines: string[] = [];

  ngAfterViewInit() {
    // The ViewChild will be available here
    console.log(this.fileInput);
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.fileContent = e.target.result;
        if (this.fileContent) {
          this.fileLines = this.fileContent.split(/\r?\n/);
          console.log('File content:', this.fileContent);
          console.log('File lines:', this.fileLines);
        } else {
          console.error('File content is null or empty');
        }
      };

      reader.onerror = (error) => {
        console.error('Error reading file:', error);
      };

      reader.readAsText(file);
    }
  }
}
