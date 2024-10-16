import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiDataService } from '../../services/api-data.service';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatGridListModule } from '@angular/material/grid-list';
import { AgGridModule } from 'ag-grid-angular';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ExtendedSwaggerSpec } from '../../models/swagger.types';

@Component({
  selector: 'app-models',
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
  templateUrl: './models.component.html',
  styleUrls: ['./models.component.css'],
})
export class ModelsComponent implements OnInit, OnDestroy {
  models: string = '';
  model: string = '';
  apiSchemas: any[] = [];
  schemaDetailsForm!: FormGroup;
  swaggerSubscription!: Subscription;
  selectedSchemaData: any = null; // To hold the selected schema data

  constructor(
    private route: ActivatedRoute,
    private apiDataService: ApiDataService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Initialize the form
    this.schemaDetailsForm = this.fb.group({
      selectedSchema: [''],
      schemaContent: [''],
    });

    // Subscribe to route params
    this.route.params.subscribe((params) => {
      this.models = params['models']; // Could be a collection of models
      this.model = params['model']; // Specific model name
      this.fetchModelDetails();
    });
  }

  fetchModelDetails(): void {
    this.swaggerSubscription = this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec: ExtendedSwaggerSpec | null) => {
        if (swaggerSpec?.components?.schemas) {
          const schemas = swaggerSpec.components.schemas;

          // Map all schemas into a usable format
          this.apiSchemas = Object.keys(schemas).map((schemaName) => ({
            name: schemaName,
            details: schemas[schemaName],
          }));

          console.log('Formatted Schemas:', this.apiSchemas); // Debugging

          // If a specific model is passed as a route parameter, select it
          if (this.model) {
            this.onSelectSchema(this.model);
          }
        } else {
          console.log('No schemas found in the Swagger spec.');
        }
      },
      error: (error) => {
        console.error('Error fetching Swagger spec:', error);
      },
    });
  }

  // Helper to get object keys (for properties)
  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  // Populate the form with the selected schema's details
  onSelectSchema(eventOrSchemaName: Event | string): void {
    let schemaName: string;

    // Check if the argument is an event or a schema name string
    if (typeof eventOrSchemaName === 'string') {
      // If it's a string, use it directly
      schemaName = eventOrSchemaName;
    } else {
      // Otherwise, assume it's an event and cast it to get the select element's value
      const selectElement = eventOrSchemaName.target as HTMLSelectElement;
      schemaName = selectElement.value;
    }

    // Find the schema by its name
    const selectedSchema = this.apiSchemas.find((s) => s.name === schemaName);

    if (selectedSchema) {
      // Store the selected schema data
      this.selectedSchemaData = selectedSchema.details;

      // Optionally patch the form with schema details
      this.schemaDetailsForm.patchValue({
        selectedSchema: schemaName,
        schemaContent: JSON.stringify(selectedSchema.details, null, 2),
      });

      console.log('Selected Schema:', selectedSchema);
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
