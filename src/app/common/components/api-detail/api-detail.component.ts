import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiDataService } from '../../../services/api-data.service';
import {
  ExtendedOperation,
  ExtendedSwaggerSpec,
  Paths,
} from '../../../models/swagger.types'; // Import the types
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import * as yaml from 'js-yaml';
import { Operation } from 'swagger-schema-official';

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
const formData = this.methodDetailsForm.value;
    console.log(formData);

    const safeParse = (data: string) => {
      try {
        return JSON.parse(data);
      } catch (e) {
        return {};
      }
    };

    const yamlData = yaml.dump({
      openapi: formData.openApiVersion,
      info: {
        version: formData.version,
        title: formData.title,
      },
      servers: safeParse(formData.servers),
      schemes: safeParse(formData.schemes),
      paths: safeParse(formData.paths),
      security: safeParse(formData.security),
      models: safeParse(formData.models),
    });

    const blob = new Blob([yamlData], { type: 'text/yaml' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'api-spec.yml';
    link.click();
    URL.revokeObjectURL(link.href);
  } 
}
