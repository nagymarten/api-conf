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
    this.responseDetailsForm = this.fb.group({
      description: [''],
      headers: [''],
      content: [''],
    });

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
            details: responses[responseName], 
          }));

          console.log('Formatted Responses:', this.apiResponse);

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

    if (typeof eventOrResponseName === 'string') {
      responseName = eventOrResponseName;
    } else {
      const selectElement = eventOrResponseName.target as HTMLSelectElement;
      responseName = selectElement.value;
    }

    const selectedResponse = this.apiResponse.find(
      (r) => r.name === responseName
    );

    if (selectedResponse) {
      this.selectedResponseData = selectedResponse.details;

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

      this.selectedResponseData.description = formData.description;

      if (formData.headers && this.isValidJson(formData.headers)) {
        this.selectedResponseData.headers = JSON.parse(formData.headers);
      }
      if (formData.content && this.isValidJson(formData.content)) {
        this.selectedResponseData.content = JSON.parse(formData.content);
      }

      this.apiDataService.getSwaggerSpec().subscribe((swaggerSpec) => {
        if (swaggerSpec && swaggerSpec.components?.responses) {
          swaggerSpec.components.responses[this.response] =
            this.selectedResponseData;

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
