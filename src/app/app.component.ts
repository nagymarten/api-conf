import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from "./common/components/sidebar/sidebar.component";
import { DownloadYamlButtonComponent } from './common/components/download-yaml-button/download-yaml-button.component';
import { DeleteDocumentButtonComponent } from './common/components/delete-document-button/delete-document-button.component';
import { ApiDocumentUploadButtonComponent } from './common/components/api-document-upload-button/api-document-upload-button.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    DownloadYamlButtonComponent,
    DeleteDocumentButtonComponent,
    ApiDocumentUploadButtonComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'api-conf';
}
