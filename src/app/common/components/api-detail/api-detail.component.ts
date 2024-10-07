import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiDataService } from '../../../services/api-data.service';
import {
  ExtendedOperation,
  ExtendedSwaggerSpec,
  HttpMethod,
  Paths,
} from '../../../models/swagger.types';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-api-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './api-detail.component.html',
  styleUrls: ['./api-detail.component.css'],
})
export class ApiDetailComponent implements OnInit, OnDestroy {
  apiPath: string = '';
  method: string = '';
  methodDetailsForm!: FormGroup;
  swaggerSubscription!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private apiDataService: ApiDataService,
    private fb: FormBuilder,
    private router: Router
  ) {}
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }

  ngOnInit(): void {
    // Initialize the form with empty controls
    this.methodDetailsForm = this.fb.group({
      summary: [''],
      description: [''],
      requestBody: [''],
      responses: [''],
    });

    // Get the path and method from the route parameters
    this.route.params.subscribe((params) => {
      this.apiPath = params['path'];
      this.method = params['method'];
      this.fetchMethodDetails();
    });
  }

  fetchMethodDetails(): void {
    this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec: ExtendedSwaggerSpec | null) => {
        if (swaggerSpec) {
          const apiPathObject = swaggerSpec.paths[this.apiPath as keyof Paths];

          if (
            apiPathObject &&
            apiPathObject[
              this.method.toLowerCase() as keyof typeof apiPathObject
            ]
          ) {
            const methodDetails =
              apiPathObject[
                this.method.toLowerCase() as keyof typeof apiPathObject
              ];

            if (methodDetails) {
              const extendedMethodDetails = methodDetails as ExtendedOperation;
              this.methodDetailsForm.patchValue({
                summary: extendedMethodDetails.summary || '',
                description: extendedMethodDetails.description || '',
                requestBody:
                  JSON.stringify(extendedMethodDetails.requestBody, null, 2) ||
                  '',
                responses:
                  JSON.stringify(extendedMethodDetails.responses, null, 2) ||
                  '',
              });
            } else {
              console.error(
                'methodDetails is undefined for the given API path and method.'
              );
            }
          } else {
            console.error(
              `Method not found for path: ${this.apiPath} and method: ${this.method}`
            );
          }
        } else {
          console.error('Received null Swagger spec');
        }
      },

      error: (error) => {
        console.error('Error fetching Swagger spec:', error);
      },
    });
  }

  onUpdateDocument() {
    this.apiDataService
      .getSwaggerSpec()
      .subscribe((swaggerSpec: ExtendedSwaggerSpec | null) => {
        if (swaggerSpec && swaggerSpec.paths) {
          const apiPathObject = swaggerSpec.paths[this.apiPath]; // Get the current API path

          if (apiPathObject) {
            // Cast the method to HttpMethod
            const method = this.method.toLowerCase() as HttpMethod;

            // Ensure that methodDetails is treated as ExtendedOperation
            const methodDetails = apiPathObject[method] as ExtendedOperation;

            if (methodDetails) {
              const formData = this.methodDetailsForm.value;

              // Update the method details based on form data
              methodDetails.summary = formData.summary || methodDetails.summary;
              methodDetails.description =
                formData.description || methodDetails.description;
              methodDetails.requestBody =
                JSON.parse(formData.requestBody) || methodDetails.requestBody;
              methodDetails.responses =
                JSON.parse(formData.responses) || methodDetails.responses;

              // Update the paths in the Swagger spec
              swaggerSpec.paths[this.apiPath][method] = methodDetails;

              // Call the service to update the Swagger spec and notify subscribers
              this.apiDataService.setPaths(
                JSON.stringify(swaggerSpec.paths, null, 2)
              );

              console.log('Updated Paths:', swaggerSpec.paths);
            } else {
              console.error(
                `No method found for path: ${this.apiPath} and method: ${this.method}`
              );
            }
          } else {
            console.error(`No path found for: ${this.apiPath}`);
          }
        } else {
          console.error('No Swagger spec or paths found.');
        }
        console.log('Parsed Swagger Spec:', swaggerSpec);
      });
  }
}
