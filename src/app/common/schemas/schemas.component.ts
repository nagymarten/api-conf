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

      // If the schema has an `allOf`, resolve it
      if (this.selectedSchema.allOf) {
        const resolvedProperties = this.resolveAllOf(this.selectedSchema.allOf);
        this.selectedSchema.properties = {
          ...this.selectedSchema.properties,
          ...resolvedProperties,
        };
      }

      // Process other references and properties
      this.resolveSchemaReferences(this.selectedSchema.properties);

      console.log('Selected Schema:', this.selectedSchema);

      this.schemaDetailsForm.patchValue({
        title: this.selectedSchema.title || '',
        description: this.selectedSchema.description || '',
        properties: JSON.stringify(this.selectedSchema.properties, null, 2),
        isEditingDescription: false,
      });
    }
  }

  processSchemaDetails(schema: any): void {
    if (schema.properties) {
      // If the schema has properties, resolve references as usual
      this.resolveSchemaReferences(schema.properties);
    } else {
      // If there are no properties, check for other schema structures
      this.additionalItems = []; // Reset additionalItems

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
        // If item contains properties, add them to the combined properties
        Object.assign(combinedProperties, item.properties);
      } else if (item.$ref) {
        // If item contains a $ref, resolve it and add its properties
        const refProperties = this.getRefProperties(item.$ref);
        Object.assign(combinedProperties, refProperties);
      }
    }

    return combinedProperties;
  }

  resolveSchemaReferences(properties: any): void {
    // Loop through each property and check for $ref
    for (const key of Object.keys(properties)) {
      const property = properties[key];

      if (property.$ref) {
        // Find the referenced schema and get its properties
        const refProperties = this.getRefProperties(property.$ref);

        // Log to check the $ref being resolved
        console.log(`Resolving $ref for property "${key}":`, property.$ref);
        console.log(`Referenced Properties for "${key}":`, refProperties);

        if (refProperties) {
          // Replace the $ref with the actual properties of the referenced schema
          properties[key] = { ...refProperties, ...property };
        }
      }
    }

    // Log final properties after all references have been resolved
    console.log('Resolved Properties:', properties);
  }

  getRefProperties(ref: string): any {
    // Extract the schema name from $ref
    const refSchemaName = this.extractSchemaNameFromRef(ref);

    // Log schema name being resolved
    console.log('Extracted schema name from $ref:', refSchemaName);

    // Find the referenced schema in the apiSchemas array
    const referencedSchema = this.apiSchemas.find(
      (s) => s.name === refSchemaName
    );

    // Log the referenced schema and its properties
    console.log('Referenced Schema:', referencedSchema);

    // Return the properties of the referenced schema, or null if not found
    return referencedSchema ? referencedSchema.details.properties : null;
  }

  extractSchemaNameFromRef(ref: string): string {
    // Extract the schema name from $ref, assuming the format '#/components/schemas/SchemaName'
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
