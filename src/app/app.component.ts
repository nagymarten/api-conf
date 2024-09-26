import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiDocumentUploadButtonComponent } from '../components/api-document-upload-button/api-document-upload-button.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ApiDocumentUploadButtonComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'api-conf';
}
