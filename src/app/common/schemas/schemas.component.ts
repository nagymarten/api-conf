import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
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
import { ButtonModule } from 'primeng/button';
import { AddSchemeButtonComponent } from '../components/add-scheme-button/add-scheme-button.component';
import { SchemeTypeOverlayPanelComponent } from '../components/scheme-type-overlay-panel/scheme-type-overlay-panel.component';
import { InputTextModule } from 'primeng/inputtext';
import { RefButtonComponent } from '../components/ref-button/ref-button.component';
import { Router } from '@angular/router';
import { SchemaExamplesComponent } from './schema-examples/schema-examples.component';

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
    ButtonModule,
    AddSchemeButtonComponent,
    SchemeTypeOverlayPanelComponent,
    InputTextModule,
    RefButtonComponent,
    SchemaExamplesComponent,
  ],
  templateUrl: './schemas.component.html',
  styleUrls: ['./schemas.component.css'],
  providers: [NodeService],
})
export class SchemasComponent implements OnInit, OnDestroy {
  @ViewChild(SchemeTypeOverlayPanelComponent)
  childComponent!: SchemeTypeOverlayPanelComponent;

  @ViewChild(AddSchemeButtonComponent)
  addSchemeButtonComponent!: AddSchemeButtonComponent;

  @ViewChild('newSchemaInput') newSchemaInput!: ElementRef;

  @ViewChild('myText') myTextInput!: ElementRef;

  schemas: string = '';
  schema: string = '';
  apiSchemas: any[] = [];
  schemaDetailsForm!: FormGroup;
  swaggerSubscription!: Subscription;
  selectedSchema: any;
  selectedSchemaName: string = '';
  activeTab: string = 'schema';
  descriptionProperty: string | null = null;
  files!: TreeNode[];
  cols!: Column[];
  jsonTree: TreeNode[] = [];
  responseExamples: MenuItem[] = [];
  activeItem!: MenuItem;
  focusNewSchemaInput = false;

  constructor(
    private route: ActivatedRoute,
    private apiDataService: ApiDataService,
    private fb: FormBuilder,
    private nodeService: NodeService,
    private router: Router
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
    const formatTypeWithCount = (type: string, count: number) =>
      `${type} {${count}}`;

    const rootNode: TreeNode = {
      label: schema.title || 'No schema',
      data: {
        name: schema.allOf
          ? formatTypeWithCount('allOf', this.objectKeys(schema.allOf).length)
          : schema.properties
          ? formatTypeWithCount(
              'object',
              this.objectKeys(schema.properties).length
            )
          : schema.enum
          ? formatTypeWithCount('enum', schema.enum.length)
          : schema.type || '',
        description: schema.description,
        type: '',
        showAddButton: true,
        editDisabled: false,
      },
      children: [],
      expanded: true,
    };

    if (schema.allOf) {
      schema.allOf.forEach((subSchema: any) => {
        if (subSchema.$ref) {
          const refSchemaName = this.extractSchemaNameFromRef(subSchema.$ref);

          if (!resolvedRefs.has(refSchemaName)) {
            resolvedRefs.add(refSchemaName);
            const referencedSchema = this.getSchemaByRef(subSchema.$ref);

            if (referencedSchema) {
              const childNode: TreeNode = {
                label: refSchemaName,
                data: {
                  name: refSchemaName,
                  description: referencedSchema.description || '',
                  type: referencedSchema.allOf
                    ? formatTypeWithCount(
                        'allOf',
                        this.objectKeys(referencedSchema.allOf).length
                      )
                    : referencedSchema.properties
                    ? formatTypeWithCount(
                        'object',
                        this.objectKeys(referencedSchema.properties).length
                      )
                    : referencedSchema.enum
                    ? formatTypeWithCount('enum', referencedSchema.enum.length)
                    : referencedSchema.type || '',
                  showReferenceButton: true,
                  editDisabled: false,
                },
                children: [],
                parent: rootNode,
              };

              const resolvedChildren = this.schemaToTreeNode(
                referencedSchema,
                resolvedRefs
              );
              childNode.children = childNode.children || [];

              resolvedChildren[0]?.children?.forEach((child) => {
                child.data.editDisabled = true;
                childNode.children!.push(child);
              });

              rootNode.children?.push(childNode);
            }
          }
        }
      });
    } else if (schema.properties) {
      // Process properties if no allOf references
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
            editDisabled: false,
          },
          children: [],
          parent: rootNode,
        };

        if (property.$ref) {
          const refSchemaName = this.extractSchemaNameFromRef(property.$ref);

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
                    ? formatTypeWithCount(
                        'allOf',
                        this.objectKeys(referencedSchema.allOf).length
                      )
                    : referencedSchema.properties
                    ? formatTypeWithCount(
                        'object',
                        this.objectKeys(referencedSchema.properties).length
                      )
                    : referencedSchema.enum
                    ? formatTypeWithCount('enum', referencedSchema.enum.length)
                    : referencedSchema.type || '',
                  showReferenceButton: true,
                  editDisabled: false,
                },
                children: [],
                parent: rootNode,
              };

              const resolvedChildren = this.schemaToTreeNode(
                referencedSchema,
                resolvedRefs
              );
              childNode.children = childNode.children || [];

              resolvedChildren[0]?.children?.forEach((child) => {
                child.data.editDisabled = true;
                childNode.children!.push(child);
              });

              rootNode.children?.push(childNode);
            }
          }
        } else {
          // Direct property children are added to root node
          rootNode.children?.push(childNode);
        }
      });
    } else if (schema.enum) {
      // Handle enum values if present
      rootNode.children = schema.enum.map((enumValue: string) => ({
        label: enumValue,
        data: {
          name: enumValue,
          type: '',
          editDisabled: false,
        },
        children: [],
      }));
    }

    nodes.push(rootNode);
    return nodes;
  }

  handleGoRefScheme(schemaName: string) {
    this.router.navigate(['/schemas', schemaName]);
  }

  handleAddScheme(_event: Event): void {
    const newSchemaNode: TreeNode = {
      label: '',
      data: {
        name: '',
        description: '',
        type: 'object',
        showAddButton: false,
        showReferenceButton: false,
      },
      children: [],
      expanded: true,
    };

    this.jsonTree[0]?.children?.push(newSchemaNode);
    this.jsonTree = [...this.jsonTree];
    this.focusNewSchemaInput = true;

    // Click the last editable cell before focusing on new schema input
    setTimeout(() => {
      // Find the last editable cell in p-treeTableCellEditor
      const lastTreeTableCellEditors = document.querySelectorAll(
        'p-treeTableCellEditor'
      );

      if (lastTreeTableCellEditors.length > 0) {
        // Get the last editable cell and click it
        const lastCell = lastTreeTableCellEditors[
          lastTreeTableCellEditors.length - 1
        ] as HTMLElement;
        lastCell.click();
        console.log('Last TreeTableCellEditor clicked:', lastCell);
        setTimeout(() => {
          if (this.newSchemaInput) {
            this.newSchemaInput.nativeElement.focus();
            console.log('Focusing on new schema input:', this.newSchemaInput);
          } else {
            console.warn('newSchemaInput is not found.');
          }
        }, 0);
      } else {
        console.warn('No TreeTableCellEditor elements found for clicking.');
      }
      // Focus on the new schema input

      // Reset focus flag
      this.focusNewSchemaInput = false;
    }, 0);
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

  toggleChildOverlay(event: Event): void {
    if (this.childComponent) {
      this.childComponent.toggleOverlay(event);
    }
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

  getRootNode(node: TreeNode): TreeNode {
    return node.parent ? this.getRootNode(node.parent) : node;
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

      this.schemaDetailsForm.patchValue({
        title: this.selectedSchemaName || 'Untitled schema',
        description: this.selectedSchema.description || '',
      });

      if (this.selectedSchema.enum) {
        this.schemaDetailsForm.patchValue({
          enum: JSON.stringify(this.selectedSchema.enum, null, 2),
          isEditingDescription: false,
        });
      } else if (this.selectedSchema.properties) {
        this.schemaDetailsForm.patchValue({
          properties: JSON.stringify(this.selectedSchema.properties, null, 2),
          isEditingDescription: false,
        });
      }
    }
  }

  onExampleChanged(exampleJSON: string): void {
    this.schemaDetailsForm.patchValue({
      examples: exampleJSON,
    });
  }

  onActiveItemChange(event: MenuItem) {
    this.activeItem = event;
  }

  onDeleteProperty(_t44: string) {
    throw new Error('Method not implemented.');
  }

  startEditingTitle(): void {
    this.schemaDetailsForm.patchValue({ isEditingTitle: true });
  }

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
            
              if (formData.examples) {
              try {
                schemaObject.examples = JSON.parse(formData.examples);
              } catch (e) {
                console.error('Invalid JSON format for examples:', e);
              }
            }

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

  isSpecialType(type: string): boolean {
    return [
      'allOf',
      'enum',
      'object',
      'array',
      'integer',
      'number',
      'string',
      'boolean',
      'dictionary',
    ].some((specialType) => type.startsWith(specialType));
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
