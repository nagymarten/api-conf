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
import { ExtendedSwaggerSpec, SchemaDetails } from '../../models/swagger.types';
import { MatIconModule } from '@angular/material/icon';

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
    MatIconModule,
  ],
  templateUrl: './schemas.component.html',
  styleUrls: ['./schemas.component.css'],
})
export class SchemasComponent implements OnInit, OnDestroy {
  schemas: string = '';
  schema: string = '';
  apiSchemas: any[] = [];
  schemaDetailsForm!: FormGroup;
  swaggerSubscription!: Subscription;
  selectedSchemaData: any = null;
  selectedSchema: any;
  selectedSchemaName: string = '';
  activeTab: string = 'schema';
  descriptionProperty: string | null = null;
  additionalItems: any[] = []; // This will store enums, allOf, oneOf, etc.

  constructor(
    private route: ActivatedRoute,
    private apiDataService: ApiDataService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.schemaDetailsForm = this.fb.group({
      title: [''],
      description: [''],
      properties: [''],
      isEditingDescription: [false],
    });

    this.route.params.subscribe((params) => {
      this.schemas = params['schemas'];
      this.schema = params['schema'];
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

          if (this.schema) {
            this.onSelectSchema(this.schema);
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
      this.selectedSchema = selectedSchema.details as SchemaDetails;
      this.selectedSchemaName = selectedSchema.name;

      console.log('Selected Schema:', this.selectedSchema);

      if (this.selectedSchema.allOf) {
        const resolvedProperties = this.resolveAllOf(this.selectedSchema.allOf);
        this.selectedSchema.properties = {
          ...this.selectedSchema.properties,
          ...resolvedProperties,
        };
      }

      if (this.selectedSchema.enum) {
        this.schemaDetailsForm.patchValue({
          title: this.selectedSchema.title || '',
          description: this.selectedSchema.description || '',
          properties: '',
          isEditingDescription: false,
        });

        this.displayEnum(this.selectedSchema.enum);
      }
      // If the schema has properties, handle it
      else if (this.selectedSchema.properties) {
        this.schemaDetailsForm.patchValue({
          title: this.selectedSchema.title || '',
          description: this.selectedSchema.description || '',
          properties: JSON.stringify(this.selectedSchema.properties, null, 2),
          isEditingDescription: false,
        });
      }
    }
  }

  // Method to handle displaying enum values
  displayEnum(enumValues: string[]): void {
    console.log('Enum values:', enumValues);
    // Logic to display enum values in your UI
  }

  processSchemaDetails(schema: any): void {
    if (schema.properties) {
      this.resolveSchemaReferences(schema.properties);
    } else {
      this.additionalItems = [];

      if (schema.enum) {
        this.additionalItems.push({ type: 'enum', values: schema.enum });
      }

      if (schema.allOf) {
        this.additionalItems.push({ type: 'allOf', values: schema.allOf });
      }

      if (schema.oneOf) {
        this.additionalItems.push({ type: 'oneOf', values: schema.oneOf });
      }

      if (schema.anyOf) {
        this.additionalItems.push({ type: 'anyOf', values: schema.anyOf });
      }

      console.log('Additional Schema Items:', this.additionalItems);
    }
  }

  resolveAllOf(allOfArray: any[]): any {
    const combinedProperties = {};

    for (const item of allOfArray) {
      if (item.properties) {
        Object.assign(combinedProperties, item.properties);
      } else if (item.$ref) {
        const refProperties = this.getRefProperties(item.$ref);
        Object.assign(combinedProperties, refProperties);
      } else if (item.enum) {
        Object.assign(combinedProperties, item.enum);
      }
    }

    return combinedProperties;
  }

  resolveSchemaReferences(properties: any): void {
    for (const key of Object.keys(properties)) {
      const property = properties[key];

      if (property.$ref) {
        const refProperties = this.getRefProperties(property.$ref);

        console.log(`Resolving $ref for property "${key}":`, property.$ref);
        console.log(`Referenced Properties for "${key}":`, refProperties);

        if (refProperties) {
          properties[key] = { ...refProperties, ...property };
        }
      }
    }

    console.log('Resolved Properties:', properties);
  }

  getRefProperties(ref: string): any {
    const refSchemaName = this.extractSchemaNameFromRef(ref);

    console.log('Extracted schema name from $ref:', refSchemaName);

    const referencedSchema = this.apiSchemas.find(
      (s) => s.name === refSchemaName
    );

    console.log('Referenced Schema:', referencedSchema);

    return referencedSchema ? referencedSchema.details.properties : null;
  }

  extractSchemaNameFromRef(ref: string): string {
    const refParts = ref.split('/');
    return refParts[refParts.length - 1]; // Return the last part, which is the schema name
  }

  onAddProperty() {
    throw new Error('Method not implemented.');
  }

  onDeleteProperty(_t44: string) {
    throw new Error('Method not implemented.');
  }

  startEditingDescription(): void {
    this.schemaDetailsForm.patchValue({ isEditingDescription: true });
  }

  stopEditingDescription(): void {
    this.schemaDetailsForm.patchValue({ isEditingDescription: false });
  }

  onUpdateSchema(): void {
    this.apiDataService
      .getSwaggerSpec()
      .subscribe((swaggerSpec: ExtendedSwaggerSpec | null) => {
        if (
          swaggerSpec &&
          swaggerSpec.components &&
          swaggerSpec.components.schemas
        ) {
          const schemaName = this.selectedSchemaName;
          const schemaObject = swaggerSpec.components.schemas[schemaName];

          if (schemaObject) {
            const formData = this.schemaDetailsForm.value;

            schemaObject.title = formData.title || schemaObject.title;
            schemaObject.description =
              formData.description || schemaObject.description;

            swaggerSpec.components.schemas[schemaName] = schemaObject;

            this.apiDataService.setSchemes(
              JSON.stringify(swaggerSpec.components.schemas, null, 2)
            );

            this.apiDataService
              .getSwaggerSpec()
              .subscribe((updatedSpec: ExtendedSwaggerSpec | null) => {
                if (updatedSpec) {
                  console.log('Updated Swagger Spec:', updatedSpec);
                } else {
                  console.error('Failed to fetch the updated Swagger spec.');
                }
              });
          } else {
            console.error(`Schema not found for: ${schemaName}`);
          }
        } else {
          console.error('No Swagger spec or schemas found.');
        }
      });
  }

  toggleDescription(event: Event, property: string): void {
    event.preventDefault();

    if (this.descriptionProperty === property) {
      this.descriptionProperty = null;
    } else {
      this.descriptionProperty = property;
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
