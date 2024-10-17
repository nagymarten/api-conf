import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiDataService } from '../../services/api-data.service';
import { ExtendedSwaggerSpec } from '../../models/swagger.types';
import { AgGridModule } from 'ag-grid-angular';
import { MatGridListModule } from '@angular/material/grid-list';
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
    AgGridModule,
    MatGridListModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
  ],
  templateUrl: './responses.component.html',
  styleUrl: './responses.component.css',
})
export class ResponsesComponent {
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
      selectedSchema: [''],
      schemaContent: [''],
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

      // Optionally update the form
      this.responseDetailsForm.patchValue({
        selectedResponse: responseName,
        responseContent: JSON.stringify(selectedResponse.details, null, 2),
      });

      console.log('Selected Response:', selectedResponse);
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
