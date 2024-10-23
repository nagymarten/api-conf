import { Component } from '@angular/core';
import { ApiDataService } from '../../../services/api-data.service';

@Component({
  selector: 'app-delete-document-button',
  standalone: true,
  imports: [],
  templateUrl: './delete-document-button.component.html',
  styleUrl: './delete-document-button.component.css',
})
export class DeleteDocumentButtonComponent {

  constructor(private apiDataService: ApiDataService) {}

  deleteFileFromMemory() {
    this.apiDataService.clearSwaggerSpecStorage();
  }
}
