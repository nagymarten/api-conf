import { Component } from '@angular/core';
import { ApiDataService } from '../../../services/api-data.service';
import * as yaml from 'js-yaml';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-download-yaml-button',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './download-yaml-button.component.html',
  styleUrl: './download-yaml-button.component.css',
})
export class DownloadYamlButtonComponent {
  constructor(private apiDataService: ApiDataService) {}

  onDownloadYaml(): void {
    this.apiDataService.getSelectedSwaggerSpec().subscribe((swaggerSpec) => {
      if (swaggerSpec) {
        const yamlContent = yaml.dump(swaggerSpec);

        const currentDate = this.getFormattedDate();

        this.downloadFile(
          yamlContent,
          `openapi_${currentDate}.yaml`,
          'text/yaml'
        );
      } else {
        console.error('Swagger spec is null or undefined.');
      }
    });
  }
  // onDownloadJSON(): void {
  //   this.apiDataService.getSwaggerSpec().subscribe((swaggerSpec) => {
  //     if (swaggerSpec) {
  //       const jsonContent = JSON.stringify(swaggerSpec, null, 2);
  //       const currentDate = this.getFormattedDate();
  //       this.downloadFile(
  //         jsonContent,
  //         `openapi_${currentDate}.json`,
  //         'application/json'
  //       );
  //     } else {
  //       console.error('Swagger spec is null or undefined.');
  //     }
  //   });
  // }

  private getFormattedDate(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}`;
  }

  private downloadFile(
    content: string,
    fileName: string,
    fileType: string
  ): void {
    const blob = new Blob([content], { type: fileType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  }
}
