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
  selectedRowData: any;
  selectedCol: any;

  constructor(
    private route: ActivatedRoute,
    private apiDataService: ApiDataService,
    private fb: FormBuilder,
    private nodeService: NodeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize base form fields
    this.schemaDetailsForm = this.fb.group({
      title: [''],
      description: [''],
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

  formatTypeWithCount(type: string, count: number): string {
    return `${type} {${count}}`;
  }

  getSchemaName(schema: any): string {
    return schema?.allOf
      ? this.formatTypeWithCount('allOf', Object.keys(schema.allOf).length)
      : schema?.oneOf
      ? this.formatTypeWithCount('oneOf', Object.keys(schema.oneOf).length)
      : schema?.anyOf
      ? this.formatTypeWithCount('anyOf', Object.keys(schema.anyOf).length)
      : schema?.properties
      ? this.formatTypeWithCount(
          'object',
          Object.keys(schema.properties).length
        )
      : schema?.enum
      ? this.formatTypeWithCount('enum', schema.enum.length)
      : schema?.type || 'unknown';
  }

  schemaToTreeNode(
    schema: any,
    rootNode: TreeNode | null = null,
    resolvedRefs: Set<string> = new Set()
  ): TreeNode[] {
    const nodes: TreeNode[] = [];

    const schemaName = schema?.allOf
      ? this.formatTypeWithCount('allOf', Object.keys(schema.allOf).length)
      : schema?.oneOf
      ? this.formatTypeWithCount('oneOf', Object.keys(schema.oneOf).length)
      : schema?.anyOf
      ? this.formatTypeWithCount('anyOf', Object.keys(schema.anyOf).length)
      : schema?.properties
      ? this.formatTypeWithCount(
          'object',
          Object.keys(schema.properties).length
        )
      : schema?.enum
      ? this.formatTypeWithCount('enum', schema.enum.length)
      : schema?.type || 'unknown';

    if (!rootNode) {
      rootNode = {
        label: schema?.title || 'No schema',
        data: {
          name: schemaName,
          description: schema?.description || '',
          type: schemaName,
          showAddButton: true,
          editDisabled: false,
          isReferenceChild: false,
          isRootNode: false,
        },
        children: [],
        expanded: true,
      };
    }

    const disableEditOnAllChildren = (node: TreeNode) => {
      node.data.editDisabled = true;
      node.children?.forEach(disableEditOnAllChildren);
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
          // console.log(refSchemaName);

          if (!resolvedRefs.has(refSchemaName)) {
            resolvedRefs.add(refSchemaName);
            const referencedSchema = this.getSchemaByRef(subSchema.$ref);

            if (referencedSchema) {
              const childNode: TreeNode = {
                label: refSchemaName,
                data: {
                  name: refSchemaName,
                  description: referencedSchema.description || '',
                  type: this.formatType(referencedSchema.type || ''),
                  showReferenceButton: true,
                  editDisabled: true,
                },
                children: [],
                parent: rootNode,
              };

              const resolvedChildren = this.schemaToTreeNode(
                referencedSchema,
                null,
                resolvedRefs
              );

              resolvedChildren.forEach((resolvedChild) => {
                disableEditOnAllChildren(resolvedChild);
                referenceChildren(resolvedChild);
                childNode.children!.push(resolvedChild);
              });

              rootNode.children!.push(childNode);
            }
          }
        } else {
          const resolvedSubSchemas = this.schemaToTreeNode(
            subSchema,
            null,
            resolvedRefs
          );
          resolvedSubSchemas.forEach((resolvedChild) => {
            rootNode!.children!.push(resolvedChild);
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

        if (!property) {
          console.warn(`Property ${propertyKey} is null or undefined.`);
          return;
        }

        const childNode: TreeNode = {
          label: propertyKey,
          data: {
            name: propertyKey,
            description: property?.description || '',
            type: this.formatPropertyType(property) || '',
            showReferenceButton: !!property?.$ref,
            editDisabled: !!property?.$ref,
            isReferenceChild: false,
            isRootNode: false,
          },
          children: [],
          parent: rootNode,
        };

        if (property.$ref) {
          const refSchemaName = this.extractSchemaNameFromRef(property.$ref);
          const childNode: TreeNode = {
            label: refSchemaName,
            data: {
              name: refSchemaName,
              description: property?.description || '',
              type: property?.type || '',
              showReferenceButton: !!property?.$ref,
              editDisabled: !!property?.$ref,
              isReferenceChild: false,
              isRootNode: false,
            },
            children: [],
            parent: rootNode,
          };

          if (!resolvedRefs.has(refSchemaName)) {
            resolvedRefs.add(refSchemaName);
            const referencedSchema = this.getSchemaByRef(property.$ref);

            if (referencedSchema) {
              const resolvedChildren = this.schemaToTreeNode(
                referencedSchema,
                null,
                resolvedRefs
              );

              resolvedChildren.forEach((resolvedChild) => {
                disableEditOnAllChildren(resolvedChild);
                referenceChildren(resolvedChild);
                childNode.children!.push(resolvedChild);
              });

              rootNode.children!.push(childNode);
            }
          }
        } else if (this.isValidType(property?.type)) {
          rootNode.children!.push(childNode);
        }
      });
    } else if (schema?.enum) {
      rootNode!.children = schema.enum.map((enumValue: string) => ({
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

  isValidType(type: any): boolean {
    if (type === undefined) return false;

    if (Array.isArray(type)) {
      return type.every(
        (t) => typeof t === 'string' && this.VALID_TYPES.includes(t)
      );
    } else if (typeof type === 'string') {
      const arrayTypeMatch = type.match(/^Array\((\w+)\)$/);
      if (arrayTypeMatch) {
        const innerType = arrayTypeMatch[1];
        return this.VALID_TYPES.includes(innerType);
      }
      return this.VALID_TYPES.includes(type);
    }

    return false;
  }

  formatPropertyType(property: any): string {
    if (property.type) {
      return property.format
        ? `${property.type}<${property.format}>`
        : property.type;
    }
    return 'unknown';
  }

  isValidTypeWithNumber(input: string): {
    isValidType: boolean;
    isTypeWithNumber: boolean;
  } {
    const isValidType = this.isValidType(input);

    const isTypeWithNumber = /\{\d+\}/.test(input);

    return {
      isValidType,
      isTypeWithNumber,
    };
  }

  getTypeStatus(input: string): boolean {
    const result = this.isValidTypeWithNumber(input);
    return result.isValidType && result.isTypeWithNumber;
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
    // console.log('Selected Row Data:', rowData);
    // console.log('Selected Column Data:', col);
    this.childComponent.toggleOverlay(event, rowData, col);
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

  onInfoClick() {
    console.log('Info button clicked');
    // Add your logic here
  }

  onBookClick() {
    console.log('Book button clicked');
    // Add your logic here
  }

  onDeleteClick() {
    console.log('Delete button clicked');
    // Add your logic here
  }

  onRowUpdated(updatedRowData: any) {
    console.log('Updated Row Data:', updatedRowData);
    // Here, you can apply any additional logic or state updates as needed
    // If you need to force a UI update, you can update your component's data binding here
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

    const schemaName = this.getSchemaName(this.selectedSchema);

    const rootNode: TreeNode = {
      label: this.selectedSchema.title,
      data: {
        name: schemaName,
        description: this.selectedSchema.description || '',
        type: schemaName,
        showAddButton: true,
        editDisabled: false,
        isReferenceChild: false,
        isRootNode: true,
      },
      children: [],
      expanded: true,
    };
    console.log(this.selectedSchema);
    this.jsonTree = this.schemaToTreeNode(this.selectedSchema, rootNode);
    console.log(this.jsonTree);
  }

  private initializeFormBasedOnSchema(
    schema: any,
    selectedSchemaName: string
  ): void {
    ['properties', 'allOf', 'oneOf', 'anyOf', 'enum'].forEach((control) => {
      if (this.schemaDetailsForm.contains(control)) {
        this.schemaDetailsForm.removeControl(control);
      }
    });

    // Dynamically adjust form controls based on the schema's structure
    if (schema.properties) {
      this.schemaDetailsForm.addControl('properties', this.fb.control(''));
      this.schemaDetailsForm.patchValue({
        properties: JSON.stringify(schema.properties, null, 2),
      });
    }
    if (schema.allOf) {
      this.schemaDetailsForm.addControl('allOf', this.fb.control(''));
      this.schemaDetailsForm.patchValue({
        allOf: JSON.stringify(schema.allOf, null, 2),
      });
    }
    if (schema.oneOf) {
      this.schemaDetailsForm.addControl('oneOf', this.fb.control(''));
      this.schemaDetailsForm.patchValue({
        oneOf: JSON.stringify(schema.oneOf, null, 2),
      });
    }
    if (schema.anyOf) {
      this.schemaDetailsForm.addControl('anyOf', this.fb.control(''));
      this.schemaDetailsForm.patchValue({
        anyOf: JSON.stringify(schema.anyOf, null, 2),
      });
    }
    if (schema.enum) {
      this.schemaDetailsForm.addControl('enum', this.fb.control(''));
      this.schemaDetailsForm.patchValue({
        enum: JSON.stringify(schema.enum, null, 2),
      });
    }

    // Only patch individual fields, setting title to selectedSchemaName
    this.schemaDetailsForm.patchValue({
      title: selectedSchemaName || '',
      description: schema.description || '',
      type: schema.type || '',
      name: schema.name || '',
    });
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
    this.initializeFormBasedOnSchema(
      this.selectedSchema,
      this.selectedSchemaName
    );
    // console.log(this.schemaDetailsForm.value);
  }

  updateSchemaProperty(propertyKey: string, newValue: any): void {
    if (this.selectedSchema && this.selectedSchema[propertyKey] !== undefined) {
      this.selectedSchema[propertyKey] = newValue;
      this.onUpdateSchema();
    }
  }

  deleteSchemaProperty(propertyKey: string): void {
    if (this.selectedSchema && this.selectedSchema[propertyKey]) {
      delete this.selectedSchema[propertyKey];
      this.onUpdateSchema();
    }
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
    console.log('Starting onUpdateSchema...');

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

          console.log('Selected Schema Name:', schemaName);
          console.log('Schema Object Before Update:', schemaObject);

          if (schemaObject) {
            const formData = this.schemaDetailsForm.value;

            console.log('Form Data:', formData);

            schemaObject.title = formData.title || schemaObject.title;
            schemaObject.description =
              formData.description || schemaObject.description;

            try {
              schemaObject.properties =
                typeof formData.properties === 'string'
                  ? JSON.parse(formData.properties)
                  : formData.properties;
            } catch (error) {
              console.error('Invalid JSON format for properties:', error);
              return;
            }

            // Handle examples field
            if (formData.examples) {
              try {
                schemaObject.examples = JSON.parse(formData.examples);
                console.log('Parsed Examples:', schemaObject.examples);
              } catch (e) {
                console.error('Invalid JSON format for examples:', e);
              }
            }

            // Assign the updated schema back
            swaggerSpec.components.schemas[schemaName] = schemaObject;
            console.log('Schema Object After Update:', schemaObject);

            // Save the updated schema
            this.apiDataService.setSchemes(
              JSON.stringify(swaggerSpec.components.schemas, null, 2)
            );

            // Fetch and log the updated Swagger spec
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
      'null',
    ];

    // Helper function to clean and handle type<format> format
    const cleanType = (typeStr: string): string => {
      // Extract base type if format is type<format>
      const baseType = typeStr.split('<')[0].trim();
      return baseType;
    };

    // If type is an array of strings, check if every cleaned type is a special type
    if (Array.isArray(type) && type.every((t) => typeof t === 'string')) {
      return type.every(
        (t) => typeof t === 'string' && specialTypes.includes(cleanType(t))
      );
    }

    // If type is an array of objects with a `type` property, check if any cleaned type matches a special type
    if (
      Array.isArray(type) &&
      type.every((t) => typeof t === 'object' && 'type' in t)
    ) {
      return type.some((t) =>
        specialTypes.includes(cleanType((t as { type: string }).type))
      );
    }

    // If type is a single string, clean it and check if it matches a special type
    if (typeof type === 'string') {
      return specialTypes.includes(cleanType(type));
    }

    return false;
  }

  cleanType(value: string): string {
    value = value.replace(/\s*\{\d+\}\s*$/, '');

    return value.trim();
  }

  updateButtonLabel(updatedNodeData: any) {
    const findNode = (nodes: TreeNode[], name: string): TreeNode | null => {
      for (let node of nodes) {
        if (node.data.name === name) {
          return node;
        }
        if (node.children && node.children.length > 0) {
          const childNode = findNode(node.children, name);
          if (childNode) {
            return childNode;
          }
        }
      }
      return null;
    };

    // Locate the node in jsonTree based on unique name identifier
    const nodeToUpdate = findNode(this.jsonTree, updatedNodeData.name);
    console.log('Node to update:', nodeToUpdate);

    if (nodeToUpdate) {
      // Update the node's data
      nodeToUpdate.data = { ...updatedNodeData };
      console.log('Updated node data in jsonTree:', nodeToUpdate);
      this.jsonTree = [...this.jsonTree];
      console.log('Updated jsonTree:', this.jsonTree);

      // Log the node's data before updating the form
      console.log('Node data before patching form:', {
        name: nodeToUpdate.data.name,
        description: nodeToUpdate.data.description,
        type: nodeToUpdate.data.type,
      });

      // Parse the existing properties JSON in the form
      const allProperties = JSON.parse(
        this.schemaDetailsForm.get('properties')?.value || '{}'
      );

      // Check if the specific property exists in allProperties
      const propertyToUpdate = allProperties[nodeToUpdate.data.name];
      console.log('Property to update:', propertyToUpdate);

      if (propertyToUpdate) {
        // Update only the specific fields of the matching property
        propertyToUpdate.type = nodeToUpdate.data.type; // or any other update
        console.log(
          `Updated property ${nodeToUpdate.data.name}:`,
          propertyToUpdate
        );

        // Update the form with the modified properties as JSON string
        this.schemaDetailsForm.patchValue({
          title: nodeToUpdate.data.title || '',
          description: nodeToUpdate.data.description || '',
          properties: JSON.stringify(allProperties, null, 2), // Convert back to JSON string with all properties
          examples: JSON.stringify(nodeToUpdate.data.examples || [], null, 2),
        });

        console.log('Updated form values:', this.schemaDetailsForm.value);
      } else {
        console.warn('No matching property found in properties to update.');
      }

      // Persist the changes
      this.onUpdateSchema();
    } else {
      console.warn(
        'Node not found in jsonTree with name:',
        updatedNodeData.name
      );
    }
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
