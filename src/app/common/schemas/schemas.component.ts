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

  VALID_TYPES = [
    'string',
    'number',
    'boolean',
    'object',
    'array',
    'integer',
    'null',
  ];
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

    const schemaName =
      `${schema?.title || this.selectedSchemaName}: ` +
      (schema?.allOf
        ? formatTypeWithCount('allOf', this.objectKeys(schema.allOf).length)
        : schema?.oneOf
        ? formatTypeWithCount('oneOf', this.objectKeys(schema.oneOf).length)
        : schema?.anyOf
        ? formatTypeWithCount('anyOf', this.objectKeys(schema.anyOf).length)
        : schema?.properties
        ? formatTypeWithCount(
            'object',
            this.objectKeys(schema.properties).length
          )
        : schema?.enum
        ? formatTypeWithCount('enum', schema.enum.length)
        : this.formatType(schema?.type || ''));

    const rootNode: TreeNode = {
      label: schema?.title || 'No schema',
      data: {
        name: schemaName,
        description: schema?.description || '',
        type: schema?.allOf
          ? formatTypeWithCount('allOf', this.objectKeys(schema.allOf).length)
          : schema?.oneOf
          ? formatTypeWithCount('oneOf', this.objectKeys(schema.oneOf).length)
          : schema?.anyOf
          ? formatTypeWithCount('anyOf', this.objectKeys(schema.anyOf).length)
          : schema?.properties
          ? formatTypeWithCount(
              'object',
              this.objectKeys(schema.properties).length
            )
          : schema?.enum
          ? formatTypeWithCount('enum', schema.enum.length)
          : this.formatType(schema?.type || ''),
        showAddButton: true,
        editDisabled: false,
        isReferenceChild: false,
      },
      children: [],
      expanded: true,
    };

    const disableEditOnAllChildren = (node: TreeNode) => {
      node.data.editDisabled = true;
      node.children?.forEach(disableEditOnAllChildren);
    };

    const linkReferences = (node: TreeNode) => {
      node.data.showReferenceButton = true;
      node.data.editDisabled = true;
      node.data.showAddButton = false;
    };

    const referenceChildren = (node: TreeNode) => {
      node.data.showReferenceButton = false;
      node.data.editDisabled = true;
      node.data.showAddButton = false;
      node.data.isReferenceChild = true;
      node.children?.forEach(referenceChildren);
    };

    const processSubSchemas = (subSchemas: any[], _typeLabel: string) => {
      subSchemas.forEach((subSchema: any) => {
        if (subSchema?.$ref) {
          const refSchemaName = this.extractSchemaNameFromRef(subSchema.$ref);

          if (!resolvedRefs.has(refSchemaName)) {
            resolvedRefs.add(refSchemaName);
            const referencedSchema = this.getSchemaByRef(subSchema.$ref);

            if (referencedSchema) {
              const resolvedChildren = this.schemaToTreeNode(
                referencedSchema,
                resolvedRefs
              )[0];

              disableEditOnAllChildren(resolvedChildren);
              referenceChildren(resolvedChildren);
              linkReferences(resolvedChildren);

              rootNode.children!.push(resolvedChildren);
            }
          }
        } else {
          const resolvedSubchemas = this.schemaToTreeNode(
            subSchema,
            resolvedRefs
          );
          resolvedSubchemas.forEach((resolvedChild) => {
            rootNode.children!.push(resolvedChild);
          });
        }
      });
    };

    if (schema?.allOf) {
      processSubSchemas(schema.allOf, 'allOf');
    }
    if (schema?.oneOf) {
      processSubSchemas(schema.oneOf, 'oneOf');
    }
    if (schema?.anyOf) {
      processSubSchemas(schema.anyOf, 'anyOf');
    }

    if (schema?.properties) {
      Object.keys(schema.properties).forEach((propertyKey) => {
        const property = schema.properties[propertyKey];
        if (this.isValidType(property?.type)) {
          const childNode: TreeNode = {
            label: propertyKey,
            data: {
              name: propertyKey,
              description: property?.description || '',
              type: this.formatType(property?.type),
              showReferenceButton: property?.$ref ? true : false,
              editDisabled: property?.$ref ? true : false,
              isReferenceChild: property?.$ref ? true : false,
            },
            children: [],
            parent: rootNode,
          };
          if (property?.$ref) {
            const refSchemaName = this.extractSchemaNameFromRef(property.$ref);

            if (!resolvedRefs.has(refSchemaName)) {
              resolvedRefs.add(refSchemaName);
              const referencedSchema = this.getSchemaByRef(property.$ref);
              if (referencedSchema) {
                const referencedChildren = this.schemaToTreeNode(
                  referencedSchema,
                  resolvedRefs
                )[0];

                disableEditOnAllChildren(referencedChildren);
                referenceChildren(referencedChildren);
                linkReferences(referencedChildren);

                rootNode.children!.push(referencedChildren);
              }
            }
          } else {
            rootNode.children?.push(childNode);
          }
        }
      });
    }

    if (schema?.enum) {
      rootNode.children = schema.enum.map((enumValue: string) => ({
        label: enumValue,
        data: {
          name: enumValue,
          type: '',
          editDisabled: true,
        },
        children: [],
      }));
    }
    nodes.push(rootNode);
    return nodes;
  }

  formatType = (type: any): string => {
    // Log the type to see what is being passed in
    // console.log('Formatting type:', type);

    if (Array.isArray(type)) {
      // console.log('Type is an array:', type);
      return type.join(' | ');
    } else {
      // console.log('Type is a single value:', type);
      return type;
    }
  };

  cleanSchemaName(value: string): string {
    value = value.split(':')[0];

    value = value.replace(/\{\d+\}/g, '');

    return value.trim();
  }

  handleGoRefScheme(schemaName: string) {
    const cleanedSchemaName = this.cleanSchemaName(schemaName);
    console.log(`Navigating to schema: ${cleanedSchemaName}`);
    this.router.navigate(['/schemas', cleanedSchemaName]);
  }

  isValidType(type: string | undefined): boolean {
    return type !== undefined && this.VALID_TYPES.includes(type);
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
        // console.log('Last TreeTableCellEditor clicked:', lastCell);
        setTimeout(() => {
          if (this.newSchemaInput) {
            this.newSchemaInput.nativeElement.focus();
            // console.log('Focusing on new schema input:', this.newSchemaInput);
          } else {
            // console.warn('newSchemaInput is not found.');
          }
        }, 0);
      } else {
        // console.warn('No TreeTableCellEditor elements found for clicking.');
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

  toggleChildOverlay(event: Event, rowData: any, col: any): void {
    if (this.childComponent) {
      this.childComponent.toggleOverlay(event, rowData, col);
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

  isSpecialType(type: string | string[] | { type: string }[]): boolean {
    const specialTypes = [
      'allOf',
      'enum',
      'object',
      'array',
      'integer',
      'number',
      'string',
      'boolean',
      'dictionary',
    ];

    if (Array.isArray(type) && type.every((t) => typeof t === 'string')) {
      type.every((t) => typeof t === 'string' && specialTypes.includes(t));
    }

    if (
      Array.isArray(type) &&
      type.every((t) => typeof t === 'object' && 'type' in t)
    ) {
      return type.some((t) =>
        specialTypes.includes((t as { type: string }).type)
      );
    }

    if (typeof type === 'string') {
      return specialTypes.some((specialType) => type.startsWith(specialType));
    }

    return false;
  }

  updateButtonLabel(selectedSchemeName: string, rowData: any, col: any): void {
    // console.log('Selected Scheme Name:', selectedSchemeName);
    // console.log('Row Data in updateButtonLabel:', rowData);
    // console.log('Column Data in updateButtonLabel:', col);

    rowData[col.field] = selectedSchemeName; // Update the rowData label
    // console.log('Updated Row Data:', rowData);

    this.jsonTree = [...this.jsonTree];
    // console.log(this.jsonTree);
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
