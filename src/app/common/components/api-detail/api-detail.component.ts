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
import { F, X } from '@angular/cdk/keycodes';

interface ResponseDetails {
  description?: string; // Optional description
  headers?: { [headerName: string]: any }; // Optional headers
  content?: {
    [contentType: string]: {
      schema: any; // The schema for the response body
    };
  };
}

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
  activeTab: string = 'general';
  activeResponseCode: number = 200; // Default response status code
  responsesArray: any[] = []; // Store the parsed responses dynamically

  constructor(
    private route: ActivatedRoute,
    private apiDataService: ApiDataService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }

  ngOnInit(): void {
    // Initialize the form with empty controls
    this.methodDetailsForm = this.fb.group({
      summary: [''],
      description: [''],
      requestBody: [''],
      responseMessage: [''], // To hold dynamic response message
      headers: [''], // To hold headers of response
      responseBody: [''], // To hold response body schema
    });

    // Get the path and method from the route parameters
    this.route.params.subscribe((params) => {
      this.apiPath = params['path'];
      this.method = params['method'];
      this.fetchMethodDetails();
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  fetchMethodDetails(): void {
    this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec: ExtendedSwaggerSpec | null) => {
        if (swaggerSpec) {
          const apiPathObject = swaggerSpec.paths[this.apiPath as keyof Paths];

          if (apiPathObject) {
            const methodDetails = apiPathObject[
              this.method.toLowerCase() as keyof typeof apiPathObject
            ] as ExtendedOperation;

            if (methodDetails) {
              // Populate form with summary and description
              this.methodDetailsForm.patchValue({
                summary: methodDetails.summary || '',
                description: methodDetails.description || '',
                requestBody:
                  JSON.stringify(methodDetails.requestBody, null, 2) || '',
              });

              // Parse the responses and store them
              if (methodDetails.responses) {
                this.responsesArray = this.parseResponses(
                  methodDetails.responses
                );
                this.setResponseData(this.responsesArray[0].code);
              }
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

  // Parse the responses object into a usable array
  parseResponses(responses: any): Array<any> {
    const parsedResponses = [];
    for (const [statusCode, response] of Object.entries(responses)) {
      const responseDetails = response as ResponseDetails; // Cast to known type
      const responseContent =
        responseDetails.content?.['application/json']?.schema || null;
      parsedResponses.push({
        code: statusCode,
        description: responseDetails.description || '',
        headers: responseDetails.headers || null,
        bodySchema: responseContent
          ? JSON.stringify(responseContent, null, 2)
          : 'No body content',
      });
    }
    return parsedResponses;
  }
  onAddResponse(): void {
    console.log('Add response clicked');
  }

  // Set the form values based on the selected response code
  setResponseData(statusCode: string): void {
    this.activeResponseCode = parseInt(statusCode, 10);
    const response = this.responsesArray.find((r) => r.code === statusCode);

    if (response) {
      this.methodDetailsForm.patchValue({
        responseMessage: response.description,
        headers: response.headers
          ? JSON.stringify(response.headers, null, 2)
          : 'No headers defined',
        responseBody: response.bodySchema,
      });
    }
  }

  onUpdateDocument() {
    this.apiDataService
      .getSwaggerSpec()
      .subscribe((swaggerSpec: ExtendedSwaggerSpec | null) => {
        if (swaggerSpec && swaggerSpec.paths) {
          const apiPathObject = swaggerSpec.paths[this.apiPath]; // Get the current API path

          if (apiPathObject) {
            const method = this.method.toLowerCase() as HttpMethod;

            const methodDetails = apiPathObject[method] as ExtendedOperation;

            if (methodDetails) {
              const formData = this.methodDetailsForm.value;

              // Update the method summary and description
              methodDetails.summary = formData.summary || methodDetails.summary;
              methodDetails.description =
                formData.description || methodDetails.description;

              // Parse and update requestBody if it exists and is valid
              if (
                formData.requestBody &&
                this.isValidJson(formData.requestBody)
              ) {
                methodDetails.requestBody = JSON.parse(formData.requestBody);
              }

              // Update only the active response
              if (this.activeResponseCode) {
                const responseToUpdate =
                  methodDetails.responses[this.activeResponseCode];

                // Ensure the response exists and is not a reference ($ref)
                if (responseToUpdate && !('$ref' in responseToUpdate)) {
                  const responseDetails = responseToUpdate as ResponseDetails;

                  responseDetails.description =
                    formData.responseMessage || responseDetails.description;
                  responseDetails.headers =
                    formData.headers && this.isValidJson(formData.headers)
                      ? JSON.parse(formData.headers)
                      : responseDetails.headers;
                  responseDetails.content = {
                    'application/json': {
                      schema:
                        formData.responseBody &&
                        this.isValidJson(formData.responseBody)
                          ? JSON.parse(formData.responseBody)
                          : responseDetails.content?.['application/json']
                              ?.schema,
                    },
                  };
                }
              }

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

  // Utility function to check if a string is valid JSON
  private isValidJson(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
  }
}
