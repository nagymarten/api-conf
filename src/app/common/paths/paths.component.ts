import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiDataService } from '../../services/api-data.service';
import {
  ExtendedOperation,
  ExtendedSwaggerSpec,
  HttpMethod,
  Paths,
  ResponseDetails,
} from '../../models/swagger.types';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RouterModule } from '@angular/router';
import { PathRequestPageComponent } from "./path-request-page/path-request-page.component";

@Component({
  selector: 'paths',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PathRequestPageComponent,
],
  templateUrl: './paths.component.html',
  styleUrls: ['./paths.component.css'],
})
export class PathsComponent implements OnInit, OnDestroy {
  apiPath: string = '';
  method: string = '';
  methodDetailsForm!: FormGroup;
  swaggerSubscription!: Subscription;
  activeTab: string = 'general';
  activeResponseCode: number = 200;
  responsesArray: any[] = [];
  showDeleteButtons: boolean = false;
  hoveredResponseCode: string | null = null;
  openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: 'UDBK-Hugo-API',
      version: '1.0',
    },
    paths: {
      '/FleetService/ud/sectionPurchaseRequest': {
        post: {
          summary: 'Data provision for toll sections affected by vehicles',
          responses: {
            '200': {
              description: 'SectionPurchaseResponse',
            },
          },
        },
      },
    },
  };

  constructor(
    private route: ActivatedRoute,
    private apiDataService: ApiDataService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.methodDetailsForm = this.fb.group({
      summary: [''],
      description: [''],
      requestBody: [''],
      responseMessage: [''],
      headers: [''],
      responseBody: [''],
    });

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
    this.apiDataService.getSelectedSwaggerSpec().subscribe({
      next: (swaggerSpec: ExtendedSwaggerSpec | null) => {
        if (swaggerSpec) {
          const apiPathObject = swaggerSpec.paths[this.apiPath as keyof Paths];
          console.log('apiPathObject:', apiPathObject);

          if (apiPathObject) {
            const methodDetails = apiPathObject[
              this.method.toLowerCase() as keyof typeof apiPathObject
            ] as ExtendedOperation;

            if (methodDetails) {
              this.methodDetailsForm.patchValue({
                summary: methodDetails.summary || '',
                description: methodDetails.description || '',
                requestBody:
                  JSON.stringify(methodDetails.requestBody, null, 2) || '',
              });

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

  parseResponses(responses: any): Array<any> {
    const parsedResponses = [];
    for (const [statusCode, response] of Object.entries(responses)) {
      const responseDetails = response as ResponseDetails;
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

  onUpdatePath() {
    this.apiDataService
      .getSelectedSwaggerSpec()
      .subscribe((swaggerSpec: ExtendedSwaggerSpec | null) => {
        if (swaggerSpec && swaggerSpec.paths) {
          const apiPathObject = swaggerSpec.paths[this.apiPath];

          if (apiPathObject) {
            const method = this.method.toLowerCase() as HttpMethod;

            const methodDetails = apiPathObject[method] as ExtendedOperation;

            if (methodDetails) {
              const formData = this.methodDetailsForm.value;

              methodDetails.summary = formData.summary || methodDetails.summary;
              methodDetails.description =
                formData.description || methodDetails.description;

              if (
                formData.requestBody &&
                this.isValidJson(formData.requestBody)
              ) {
                methodDetails.requestBody = JSON.parse(formData.requestBody);
              }

              if (this.activeResponseCode) {
                const responseToUpdate =
                  methodDetails.responses[this.activeResponseCode];

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

              swaggerSpec.paths[this.apiPath][method] = methodDetails;

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

  onDeleteResponse(responseCode: string): void {
    const confirmDelete = confirm(
      `Are you sure you want to delete the response with code ${responseCode}?`
    );

    if (confirmDelete) {
      this.responsesArray = this.responsesArray.filter(
        (response) => response.code !== responseCode
      );

      this.apiDataService.getSelectedSwaggerSpec().subscribe({
        next: (swaggerSpec: ExtendedSwaggerSpec | null) => {
          if (swaggerSpec && swaggerSpec.paths) {
            const apiPathObject = swaggerSpec.paths[this.apiPath];

            if (apiPathObject) {
              const method = this.method.toLowerCase() as HttpMethod;
              const methodDetails = apiPathObject[method] as ExtendedOperation;

              if (methodDetails) {
                if (methodDetails.responses[responseCode]) {
                  delete methodDetails.responses[responseCode];

                  swaggerSpec.paths[this.apiPath][method] = methodDetails;

                  this.apiDataService.setPaths(
                    JSON.stringify(swaggerSpec.paths, null, 2)
                  );

                  console.log(`Deleted response with code: ${responseCode}`);
                  console.log('Updated Paths:', swaggerSpec.paths);
                } else {
                  console.error(
                    `Response with code ${responseCode} not found.`
                  );
                }
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
        },
        error: (error) => {
          console.error('Error fetching Swagger spec:', error);
        },
      });
    }
  }

  onAddResponse(): void {
    const newResponseCode = prompt(
      'Enter the new response code (e.g., 201, 404):'
    );

    if (newResponseCode && !isNaN(Number(newResponseCode))) {
      const existingResponse = this.responsesArray.find(
        (response) => response.code === newResponseCode
      );

      if (!existingResponse) {
        const newResponse: ResponseDetails = {
          description: 'New response description',
          headers: {},
          content: {
            'application/json': {
              schema: {},
            },
          },
        };

        this.responsesArray.push({
          code: newResponseCode,
          description: newResponse.description,
          headers: newResponse.headers,
          bodySchema:
            JSON.stringify(
              newResponse.content?.['application/json']?.schema,
              null,
              2
            ) || 'No body content',
        });

        this.apiDataService.getSelectedSwaggerSpec().subscribe({
          next: (swaggerSpec: ExtendedSwaggerSpec | null) => {
            if (swaggerSpec && swaggerSpec.paths) {
              const apiPathObject = swaggerSpec.paths[this.apiPath];

              if (apiPathObject) {
                const method = this.method.toLowerCase() as HttpMethod;
                const methodDetails = apiPathObject[
                  method
                ] as ExtendedOperation;

                if (methodDetails) {
                  const newSwaggerResponse = {
                    description: newResponse.description || '',
                  };

                  if (Object.keys(newResponse.headers || {}).length > 0) {
                    (newSwaggerResponse as any).headers = newResponse.headers;
                  }

                  if (
                    newResponse.content &&
                    newResponse.content['application/json']
                  ) {
                    (newSwaggerResponse as any).content = {
                      'application/json': {
                        schema: newResponse.content['application/json'].schema,
                      },
                    };
                  }

                  methodDetails.responses[newResponseCode] = newSwaggerResponse;

                  swaggerSpec.paths[this.apiPath][method] = methodDetails;

                  this.apiDataService.setPaths(
                    JSON.stringify(swaggerSpec.paths, null, 2)
                  );

                  console.log(
                    'Added new response to Paths:',
                    swaggerSpec.paths
                  );
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
          },
          error: (error) => {
            console.error('Error fetching Swagger spec:', error);
          },
        });

        console.log(`Added new response with code: ${newResponseCode}`);
      } else {
        alert(`Response code ${newResponseCode} already exists.`);
      }
    } else {
      alert('Please enter a valid numeric response code.');
    }
  }

  toggleDeleteResponses(): void {
    this.showDeleteButtons = !this.showDeleteButtons;
  }

  private isValidJson(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
