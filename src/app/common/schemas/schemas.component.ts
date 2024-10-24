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
import { MenuItem, TreeNode } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { NodeService } from '../../services/node.service';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TabMenuModule } from 'primeng/tabmenu';
import { ButtonModule } from 'primeng/button';

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
    InputTextareaModule,
    TabMenuModule,
    ButtonModule,
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
  selectedSchema: any;
  selectedSchemaName: string = '';
  activeTab: string = 'schema';
  descriptionProperty: string | null = null;
  additionalItems: any[] = [];
  files!: TreeNode[];
  cols!: Column[];
  jsonTree: TreeNode[] = [];
  examples: any[] = [];
  responseExamples: MenuItem[] = []; // Initialize as an empty array
  activeItem!: MenuItem; // Remove undefined check by using non-null assertion

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
      examples: [''],
      isEditingTitle: [false],
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

  schemaToTreeNode(
    schema: any,
    resolvedRefs: Set<string> = new Set()
  ): TreeNode[] {
    const nodes: TreeNode[] = [];

    const rootNode: TreeNode = {
      label: schema.title || 'No schema',
      data: {
        name: this.selectedSchemaName || 'Untitled schema',
        description: schema.description,
        type: schema.allOf
          ? 'allOf'
          : schema.properties
          ? 'object'
          : schema.type || '',
      },
      children: [],
      expanded: true,
    };

    if (schema.allOf) {
      schema.allOf.forEach((subSchema: any) => {
        let childNode: TreeNode;

        // Handle subSchema when it has $ref
        if (subSchema.$ref) {
          const refSchemaName = this.extractSchemaNameFromRef(subSchema.$ref);

          // Check if it is already resolved to avoid circular references
          if (!resolvedRefs.has(refSchemaName)) {
            resolvedRefs.add(refSchemaName);

            const referencedSchema = this.getSchemaByRef(subSchema.$ref);
            if (referencedSchema) {
              // Create childNode for referenced schema
              childNode = {
                label: refSchemaName,
                data: {
                  name: refSchemaName,
                  description: referencedSchema.description || '',
                  type: referencedSchema.allOf
                    ? 'allOf'
                    : referencedSchema.properties
                    ? 'object'
                    : referencedSchema.enum
                    ? 'enum'
                    : referencedSchema.type || '',
                },
                children: [],
                parent: rootNode,
              };

              const resolvedChildren = this.schemaToTreeNode(
                referencedSchema,
                resolvedRefs
              );
              childNode.children = resolvedChildren[0]?.children || [];

              rootNode.children?.push(childNode);
            }
          }
        }
      });
    } else if (schema.properties) {
      Object.keys(schema.properties).forEach((propertyKey) => {
        const property = schema.properties[propertyKey];

        let childNode: TreeNode = {
          label: propertyKey,
          data: {
            name: propertyKey,
            description: property.description || '',
            type: property.allOf
              ? 'allOf'
              : property.properties
              ? 'object'
              : property.enum
              ? 'enum'
              : property.type || '',
          },
          children: [],
          parent: rootNode,
        };

        if (property.$ref) {
          const refSchemaName = this.extractSchemaNameFromRef(property.$ref);

          // Check if it is already resolved to avoid circular references
          if (!resolvedRefs.has(refSchemaName)) {
            resolvedRefs.add(refSchemaName);

            const referencedSchema = this.getSchemaByRef(property.$ref);
            if (referencedSchema) {
              childNode = {
                label: refSchemaName,
                data: {
                  name: refSchemaName,
                  description: referencedSchema.description || '',
                  type: referencedSchema.allOf
                    ? 'allOf'
                    : referencedSchema.properties
                    ? 'object'
                    : referencedSchema.enum
                    ? 'enum'
                    : referencedSchema.type || '',
                },
                children: [],
                parent: rootNode,
              };

              // Create childNode for the referenced schema, without adding another layer
              const referencedChildren = this.schemaToTreeNode(
                referencedSchema,
                resolvedRefs
              );

              // Directly assign the children of the referenced schema
              childNode.children = referencedChildren[0]?.children || [];
            }
          }
        }
        rootNode.children?.push(childNode);
      });
    } else if (schema.enum) {
      rootNode.children = schema.enum.map((enumValue: string) => ({
        label: enumValue,
        data: {
          name: enumValue,
          type: '',
        },
        children: [],
      }));
    }

    nodes.push(rootNode);
    return nodes;
  }

  mergeAllOfProperties(allOfArray: any[]): any {
    const mergedProperties: any = {};
    allOfArray.forEach((item) => {
      if (item.properties) {
        Object.assign(mergedProperties, item.properties);
      }
    });
    return mergedProperties;
  }

  extractSchemaNameFromRef(ref: string): string {
    const refParts = ref.split('/');
    return refParts[refParts.length - 1];
  }

  getSchemaByRef(ref: string): any {
    const schemaName = this.extractSchemaNameFromRef(ref);
    return this.apiSchemas.find((schema) => schema.name === schemaName)
      ?.details;
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
      return [];
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

      // Check if the selected schema has examples and populate responseExamples if it does
      if (this.selectedSchema.examples && this.selectedSchema.examples.length) {
        this.responseExamples = this.selectedSchema.examples.map(
          (_example: any, index: number) => ({
            label: `Example ${index + 1}`, // Generate label like 'Example 1', 'Example 2', etc.
            command: () => this.onExampleSelect(index), // Handle example selection
          })
        );

        // Set the first example as active and populate the textarea with its content
        this.activeItem = this.responseExamples[0];
        this.schemaDetailsForm.patchValue({
          examples: JSON.stringify(this.selectedSchema.examples[0], null, 2),
        });
      } else {
        // If no examples exist, clear responseExamples and textarea
        this.responseExamples = [];
        this.schemaDetailsForm.patchValue({
          examples: '',
        });
      }

      // Handle setting other schema details like enum and properties
      if (this.selectedSchema.enum) {
        this.schemaDetailsForm.patchValue({
          title: this.selectedSchemaName,
          description: this.selectedSchema.description || '',
          enum: JSON.stringify(this.selectedSchema.enum, null, 2),
          isEditingDescription: false,
        });
      } else if (this.selectedSchema.properties) {
        this.schemaDetailsForm.patchValue({
          title: this.selectedSchema.title || '',
          description: this.selectedSchema.description || '',
          properties: JSON.stringify(this.selectedSchema.properties, null, 2),
          isEditingDescription: false,
        });
      }
    }
  }

  onExampleSelect(index: number): void {
    this.schemaDetailsForm.patchValue({
      examples: JSON.stringify(this.selectedSchema.examples[index], null, 2),
    });
  }

  onActiveItemChange(event: MenuItem) {
    this.activeItem = event;
  }

  onAddProperty() {
    throw new Error('Method not implemented.');
  }

  onDeleteProperty(_t44: string) {
    throw new Error('Method not implemented.');
  }

  startEditingTitle(): void {
    this.schemaDetailsForm.patchValue({ isEditingTitle: true });
  }

  // Method to stop editing the title
  stopEditingTitle(): void {
    this.schemaDetailsForm.patchValue({ isEditingTitle: false });
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
