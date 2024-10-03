import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiDocumentUploadButtonComponent } from './common/components/api-document-upload-button/api-document-upload-button.component';
import { ApiFormComponent } from './common/components/api-form/api-form.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ApiDocumentUploadButtonComponent,
    ApiFormComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'api-conf';
}
