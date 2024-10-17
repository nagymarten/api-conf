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
  selectedSchemaData: any = null;

  constructor(
    private route: ActivatedRoute,
    private apiDataService: ApiDataService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.schemaDetailsForm = this.fb.group({
      selectedSchema: [''],
      schemaContent: [''],
    });

    this.route.params.subscribe((params) => {
      this.models = params['models']; 
      this.model = params['model'];
      this.fetchModelDetails();
    });
  }

  fetchModelDetails(): void {
    this.swaggerSubscription = this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec: ExtendedSwaggerSpec | null) => {
        if (swaggerSpec?.components?.schemas) {
          const schemas = swaggerSpec.components.schemas;

          this.apiSchemas = Object.keys(schemas).map((schemaName) => ({
            name: schemaName,
            details: schemas[schemaName],
          }));

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

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  onSelectSchema(eventOrSchemaName: Event | string): void {
    let schemaName: string;

    if (typeof eventOrSchemaName === 'string') {
      schemaName = eventOrSchemaName;
    } else {
      const selectElement = eventOrSchemaName.target as HTMLSelectElement;
      schemaName = selectElement.value;
    }

    const selectedSchema = this.apiSchemas.find((s) => s.name === schemaName);

    if (selectedSchema) {
      this.selectedSchemaData = selectedSchema.details;

      this.schemaDetailsForm.patchValue({
        selectedSchema: schemaName,
        schemaContent: JSON.stringify(selectedSchema.details, null, 2),
      });

      console.log('Selected Schema:', selectedSchema);
    }
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
