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
import { TreeTableModule } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { NodeService } from '../../services/node.service';
interface Column {
  field: string;
  header: string;
}
@Component({
  selector: 'app-models',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AgGridModule,
    MatGridListModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    TreeTableModule,
  ],
  templateUrl: './schemas.component.html',
  styleUrls: ['./schemas.component.css'],
  providers: [NodeService],
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
  additionalItems: any[] = [];
  files!: TreeNode[];
  cols!: Column[];
  jsonTree: TreeNode[] = [];

  constructor(
    private route: ActivatedRoute,
    private apiDataService: ApiDataService,
    private fb: FormBuilder,
    private nodeService: NodeService
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

    this.nodeService.getFilesystem().then((files) => (this.files = files));
    this.cols = [
      { field: 'name', header: 'Name' },
      { field: 'type', header: 'Type' },
    ];
  }

  schemaToTreeNode(schema: any): TreeNode[] {
    const nodes: TreeNode[] = [];

    const rootNode: TreeNode = {
      label: schema.title || 'Schema',
      data: {
        name: schema.title,
        description: schema.description,
        type: schema.type,
      },
      children: [],
      expanded: true,
    };

    if (schema.allOf) {
      Object.keys(schema.allOf).forEach((propertyKey) => {
        const property = schema.allOf[propertyKey];

        const childNode: TreeNode = {
          label: propertyKey,
          data: {
            name: propertyKey,
            description: property.description || '',
            type: property.type || '',
            format: property.format || '',
          },
          children: [],
        };

        if (property.allOf) {
          childNode.data.type = 'allOf';
          childNode.children = this.schemaToTreeNode({
            properties: this.mergeAllOfProperties(property.allOf),
          });
        } else if (property.enum) {
          childNode.data.type = 'enum';
          childNode.children = property.enum.map((enumValue: string) => ({
            label: enumValue,
            data: {
              name: enumValue,
              type: 'enum value',
            },
            children: [],
          }));
        } else if (property.oneOf) {
          childNode.data.type = 'oneOf';
          childNode.children = property.oneOf.map(
            (item: any, index: number) => ({
              label: `Option ${index + 1}`,
              data: {
                name: `Option ${index + 1}`,
                type: item.type || 'Unknown',
              },
              children:
                this.schemaToTreeNode(item).length > 0
                  ? this.schemaToTreeNode(item)
                  : [],
            })
          );
        } else if (property.anyOf) {
          childNode.data.type = 'anyOf';
          childNode.children = property.anyOf.map(
            (item: any, index: number) => ({
              label: `Option ${index + 1}`,
              data: {
                name: `Option ${index + 1}`,
                type: item.type || 'Unknown',
              },
              children:
                this.schemaToTreeNode(item).length > 0
                  ? this.schemaToTreeNode(item)
                  : [],
            })
          );
        }

        // If the property is an object, recursively add children
        if (property.type === 'object' && property.properties) {
          childNode.children = this.schemaToTreeNode(property);
        }

        rootNode.children?.push(childNode);
      });
    } else if (schema.properties) {
      Object.keys(schema.properties).forEach((propertyKey) => {
        const property = schema.properties[propertyKey];

        const childNode: TreeNode = {
          label: propertyKey,
          data: {
            name: propertyKey,
            description: property.description || '',
            type: property.type || '',
            format: property.format || '',
          },
          children: [],
        };

        // Check if property has allOf, enum, oneOf, or anyOf
        if (property.allOf) {
          childNode.data.type = 'allOf';
          childNode.children = this.schemaToTreeNode({
            properties: this.mergeAllOfProperties(property.allOf),
          });
        } else if (property.enum) {
          childNode.data.type = 'enum';
          childNode.children = property.enum.map((enumValue: string) => ({
            label: enumValue,
            data: {
              name: enumValue,
              type: 'enum value',
            },
            children: [],
          }));
        } else if (property.oneOf) {
          childNode.data.type = 'oneOf';
          childNode.children = property.oneOf.map(
            (item: any, index: number) => ({
              label: `Option ${index + 1}`,
              data: {
                name: `Option ${index + 1}`,
                type: item.type || 'Unknown',
              },
              children:
                this.schemaToTreeNode(item).length > 0
                  ? this.schemaToTreeNode(item)
                  : [],
            })
          );
        }

        if (property.type === 'object' && property.properties) {
          childNode.children = this.schemaToTreeNode(property);
        }

        rootNode.children?.push(childNode);
      });
    }

    nodes.push(rootNode);
    return nodes;
  }

  // Helper function to merge properties in allOf arrays
  mergeAllOfProperties(allOfArray: any[]): any {
    const mergedProperties: any = {};
    allOfArray.forEach((item) => {
      if (item.properties) {
        Object.assign(mergedProperties, item.properties);
      }
    });
    return mergedProperties;
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
    this.jsonTree = this.schemaToTreeNode(this.selectedSchema);
    console.log(this.jsonTree);
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

      if (this.selectedSchema.properties) {
        this.schemaDetailsForm.patchValue({
          title: this.selectedSchema.title || '',
          description: this.selectedSchema.description || '',
          properties: JSON.stringify(this.selectedSchema.properties, null, 2),
          isEditingDescription: false,
        });
      }
    }
  }

  extractSchemaNameFromRef(ref: string): string {
    const refParts = ref.split('/');
    return refParts[refParts.length - 1]; // Return the last part as the schema name
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

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
