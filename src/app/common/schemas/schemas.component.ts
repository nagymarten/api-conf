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
    if (!obj) {
      return []; // Return an empty array if the object is null or undefined
    }
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

      // Recursively resolve all $ref in properties and allOf
      this.resolveAllSchemaReferences(this.selectedSchema);

      // If there's an enum, display it
      if (this.selectedSchema.enum) {
        this.schemaDetailsForm.patchValue({
          title: this.selectedSchema.title || '',
          description: this.selectedSchema.description || '',
          properties: '',
          isEditingDescription: false,
        });

        this.displayEnum(this.selectedSchema.enum);
      } else if (this.selectedSchema.properties) {
        // Patch the resolved properties to the form
        this.schemaDetailsForm.patchValue({
          title: this.selectedSchema.title || '',
          description: this.selectedSchema.description || '',
          properties: JSON.stringify(this.selectedSchema.properties, null, 2),
          isEditingDescription: false,
        });
      }
    }
  }

  displayEnum(enumValues: string[]): void {
    console.log('Enum values:', enumValues);
  }

  getRefProperties(ref: string): any {
    // Extract the schema name from the $ref
    const refSchemaName = this.extractSchemaNameFromRef(ref);

    // Find the referenced schema in the apiSchemas array
    const referencedSchema = this.apiSchemas.find(
      (s) => s.name === refSchemaName
    );

    // Return the referenced schema's details if found, and resolve any nested references
    if (referencedSchema) {
      const refDetails = { ...referencedSchema.details }; // Copy to avoid modifying the original object

      // Recursively resolve all references within the referenced schema
      this.resolveAllSchemaReferences(refDetails);

      return {
        properties: refDetails.properties || null,
        enum: refDetails.enum || null,
      };
    }
    return null;
  }

  extractSchemaNameFromRef(ref: string): string {
    const refParts = ref.split('/');
    return refParts[refParts.length - 1]; // Return the last part as the schema name
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

  resolveAllSchemaReferences(schema: any): void {
    // Resolve references in allOf
    if (schema.allOf) {
      schema.properties = schema.properties || {};
      schema.allOf.forEach((subSchema: any) => {
        if (subSchema.$ref) {
          // Resolve $ref inside allOf
          const refResult = this.getRefProperties(subSchema.$ref);
          if (refResult) {
            if (refResult.properties) {
              // Merge referenced properties directly into schema properties
              Object.assign(schema.properties, refResult.properties);
            }
            if (refResult.enum) {
              // Handle enum in reference
              schema.enum = refResult.enum;
            }
          }
        } else if (subSchema.properties) {
          // Merge properties from non-$ref allOf schemas
          Object.assign(schema.properties, subSchema.properties);
        }
      });
    }

    // Resolve references in properties
    if (schema.properties) {
      for (const key of Object.keys(schema.properties)) {
        const property = schema.properties[key];

        if (property.$ref) {
          const refResult = this.getRefProperties(property.$ref);
          if (refResult) {
            if (refResult.properties) {
              // Replace the $ref entirely with the referenced properties
              schema.properties[key] = {
                ...refResult, // Replace the current property with the referenced properties
                ...property, // Include any existing metadata of the original property
              };
            }
            if (refResult.enum) {
              // Handle enum in the reference
              schema.properties[key].enum = refResult.enum;
            }
          }
        } else if (property.type === 'object' && property.properties) {
          // Recursively resolve properties within nested objects
          this.resolveAllSchemaReferences(property);
        }
      }
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
      }
    }

    return combinedProperties;
  }

  resolveSchemaReferences(properties: any): void {
    for (const key of Object.keys(properties)) {
      const property = properties[key];

      // If the property has a $ref, resolve it
      if (property.$ref) {
        const refProperties = this.getRefProperties(property.$ref);

        if (refProperties) {
          if (refProperties.enum) {
            // If it's an enum, just set the enum values
            properties[key].enum = refProperties.enum;
          } else {
            // Otherwise, merge the referenced schema properties
            properties[key] = { ...refProperties, ...property };
          }
        }
      }

      if (property.properties) {
        this.resolveSchemaReferences(property.properties);
      }
    }
  }

  isLastEnumValue(enumValue: string, property: string): boolean {
    const propertyEnum = this.selectedSchema?.properties?.[property]?.enum;

    console.log('Checking if last enum value:', {
      enumValue,
      property,
      propertyEnum,
    });

    if (!propertyEnum) {
      return false;
    }

    return propertyEnum.indexOf(enumValue) === propertyEnum.length - 1;
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
