import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { ApiDocumentUploadButtonComponent } from '../api-document-upload-button/api-document-upload-button.component';
import { Subscription } from 'rxjs';
import { ApiDataService } from '../../../services/api-data.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatExpansionModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    ApiDocumentUploadButtonComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  apiPaths: { [key: string]: any } = {}; // Object to store API paths and methods
  swaggerSubscription!: Subscription;

  // Define valid HTTP methods (e.g., POST, GET, PUT, etc.)
  validHttpMethods = ['get', 'post', 'put', 'delete', 'patch'];

  constructor(private apiDataService: ApiDataService) {}

  ngOnInit(): void {
    // Fetch the Swagger spec when the component initializes
    this.swaggerSubscription = this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec) => {
        if (swaggerSpec) {
          this.apiPaths = this.buildApiPaths(swaggerSpec); // Process the Swagger spec
        }
      },
      error: (error) => {
        console.error('Error fetching Swagger spec:', error);
      },
    });
  }

  // Function to build the API paths with methods only (filter out parameters)
  buildApiPaths(swaggerSpec: any): { [key: string]: any } {
    const apiPaths: { [key: string]: any } = {};

    // Loop over each API path
    Object.keys(swaggerSpec.paths).forEach((pathKey) => {
      const methods = Object.keys(swaggerSpec.paths[pathKey])
        .filter((methodKey) => this.validHttpMethods.includes(methodKey)) // Only include valid HTTP methods
        .map((methodKey) => {
          const methodDetails = swaggerSpec.paths[pathKey][methodKey];

          // Build the method details object (without parameters)
          return {
            method: methodKey, // HTTP method (POST, GET, etc.)
            summary: methodDetails.summary, // Summary for each method
            description: methodDetails.description, // Method description (optional)
            responses: JSON.stringify(methodDetails.responses, null, 2), // Stringify the responses
          };
        });

      apiPaths[pathKey] = methods; // Assign the methods to the path
    });

    return apiPaths;
  }

  ngOnDestroy(): void {
    // Clean up the subscription when the component is destroyed
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
