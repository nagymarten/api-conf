import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiDataService } from '../../services/api-data.service';
import { ExtendedSwaggerSpec } from '../../models/swagger.types';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-responses',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
  ],
  templateUrl: './responses.component.html',
  styleUrls: ['./responses.component.css'],
})
export class ResponsesComponent implements OnInit, OnDestroy {
  responses: string = '';
  response: string = '';
  apiResponse: any[] = [];
  responseDetailsForm!: FormGroup;
  swaggerSubscription!: Subscription;
  selectedResponseData: any = null;

  constructor(
    private route: ActivatedRoute,
    private apiDataService: ApiDataService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Initialize the form
    this.responseDetailsForm = this.fb.group({
      description: [''],
      headers: [''],
      content: [''],
    });

    // Subscribe to route params
    this.route.params.subscribe((params) => {
      this.responses = params['responses'];
      this.response = params['response'];
      this.fetchResponseDetails();
    });
  }

  fetchResponseDetails() {
    this.swaggerSubscription = this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec: ExtendedSwaggerSpec | null) => {
        if (swaggerSpec?.components?.responses) {
          const responses = swaggerSpec.components.responses;

          this.apiResponse = Object.keys(responses).map((responseName) => ({
            name: responseName,
            details: responses[responseName], // Store the response details
          }));

          console.log('Formatted Responses:', this.apiResponse);

          // If a specific response is passed in the route, select it
          if (this.response) {
            this.onSelectResponse(this.response);
          }
        } else {
          console.log('No responses found in the Swagger spec.');
        }
      },
      error: (error) => {
        console.error('Error fetching Swagger spec:', error);
      },
    });
  }

  onSelectResponse(eventOrResponseName: Event | string): void {
    let responseName: string;

    // Check if the argument is an event or a string
    if (typeof eventOrResponseName === 'string') {
      responseName = eventOrResponseName;
    } else {
      const selectElement = eventOrResponseName.target as HTMLSelectElement;
      responseName = selectElement.value;
    }

    // Find the response by its name
    const selectedResponse = this.apiResponse.find(
      (r) => r.name === responseName
    );

    if (selectedResponse) {
      // Store the selected response data
      this.selectedResponseData = selectedResponse.details;

      // Patch the form with the response details
      this.responseDetailsForm.patchValue({
        description: selectedResponse.details?.description || '',
        headers: JSON.stringify(
          selectedResponse.details?.headers || {},
          null,
          2
        ),
        content: JSON.stringify(
          selectedResponse.details?.content || {},
          null,
          2
        ),
      });

      console.log('Selected Response:', selectedResponse);
    }
  }

  onUpdateResponse(): void {
    if (this.selectedResponseData) {
      const formData = this.responseDetailsForm.value;

      // Update the selected response details
      this.selectedResponseData.description = formData.description;

      // Parse and update headers and content
      if (formData.headers && this.isValidJson(formData.headers)) {
        this.selectedResponseData.headers = JSON.parse(formData.headers);
      }
      if (formData.content && this.isValidJson(formData.content)) {
        this.selectedResponseData.content = JSON.parse(formData.content);
      }

      // Update the Swagger spec in the service
      this.apiDataService.getSwaggerSpec().subscribe((swaggerSpec) => {
        if (swaggerSpec && swaggerSpec.components?.responses) {
          swaggerSpec.components.responses[this.response] =
            this.selectedResponseData;

          // Sync the updated Swagger spec back to the service
          this.apiDataService.setResponses(
            JSON.stringify(swaggerSpec.components.responses, null, 2)
          );

          console.log(
            'Updated Response in Swagger Spec:',
            swaggerSpec.components.responses
          );
        }
      });
    }
  }

  // Utility function to validate if the JSON string is valid
  isValidJson(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
