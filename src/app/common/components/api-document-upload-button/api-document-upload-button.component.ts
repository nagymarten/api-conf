import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { ApiDataService } from '../../../services/api-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-api-document-upload-button',
  standalone: true,
  imports: [],
  templateUrl: './api-document-upload-button.component.html',
  styleUrl: './api-document-upload-button.component.css',
})
export class ApiDocumentUploadButtonComponent implements OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  private swaggerSubscription!: Subscription;

  constructor(private apiDataService: ApiDataService) {}

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.apiDataService.parseSwaggerFile(file);
    }
  }

  ngOnInit() {
    this.swaggerSubscription = this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec) => {
        if (swaggerSpec) {
          console.log('Parsed Swagger Spec:', swaggerSpec);
        }
      },
      error: (error) => {
        console.error('Error receiving Swagger data:', error);
      },
    });
  }

  ngOnDestroy() {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
