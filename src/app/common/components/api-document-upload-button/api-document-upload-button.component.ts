import { Component, ElementRef, ViewChild } from '@angular/core';
import * as Swagger from 'swagger-schema-official';
import * as yaml from 'js-yaml';

@Component({
  selector: 'app-api-document-upload-button',
  standalone: true,
  imports: [],
  templateUrl: './api-document-upload-button.component.html',
  styleUrl: './api-document-upload-button.component.css',
})
export class ApiDocumentUploadButtonComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  private swaggerSpec!: Swagger.Spec;

  fileContent: string | null = null;
  fileLines: string[] = [];

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
          try {
            this.swaggerSpec = yaml.load(this.fileContent) as Swagger.Spec;
            
            console.log('Parsed Swagger Spec:', this.swaggerSpec);
          } catch (error) {
            console.error('Error parsing the file as JSON:', error);
          }
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
