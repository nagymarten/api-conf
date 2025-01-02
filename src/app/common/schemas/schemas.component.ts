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
import { MenuItem, MessageService, TreeNode } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { NodeService } from '../../services/node.service';
import { ButtonModule } from 'primeng/button';
import { AddSchemeButtonComponent } from '../components/add-scheme-button/add-scheme-button.component';
import { SchemeTypeOverlayPanelComponent } from '../components/scheme-type-overlay-panel/scheme-type-overlay-panel.component';
import { InputTextModule } from 'primeng/inputtext';
import { RefButtonComponent } from '../components/ref-button/ref-button.component';
import { Router } from '@angular/router';
import { SchemaExamplesComponent } from './schema-examples/schema-examples.component';
import { SchemaExtensionsComponent } from './schema-extensions/schema-extensions.component';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { OverlayTextareaComponent } from '../components/overlay-textarea/overlay-textarea.component';

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
    SchemaExtensionsComponent,
    ToggleButtonModule,
    TooltipModule,
    ToastModule,
    OverlayTextareaComponent,
  ],
  templateUrl: './schemas.component.html',
  styleUrls: ['./schemas.component.css'],
  providers: [NodeService, MessageService],
})
export class SchemasComponent implements OnInit, OnDestroy {
  @ViewChild(SchemeTypeOverlayPanelComponent)
  childComponent!: SchemeTypeOverlayPanelComponent;

  @ViewChild(OverlayTextareaComponent)
  childComponentOverlayTextarea!: OverlayTextareaComponent;

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
  selectedRowData: any;
  selectedCol: any;
  nameOfId: string = 'myappika';
  examplesSubscheema: any;
  rowData: any;
  selectedSchemaTitle: string = '';
  isEditingTitle: boolean = false;
  selectedSchemaDescription: string = '';
  isEditingDescription: boolean = false;
  private isUpdating = false;
  checked: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private apiDataService: ApiDataService,
    private fb: FormBuilder,
    private nodeService: NodeService,
    private router: Router,
    private toastMessageService: MessageService
  ) {}

  ngOnInit(): void {
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

    if (this.selectedSchema) {
      this.selectedSchemaTitle = this.selectedSchema.title || '';
      this.selectedSchemaDescription = this.selectedSchema.description || '';
    }
    console.log(this.apiDataService.getSelectedSwaggerSpecValue());
    console.log(
      'Child OverlayTextareaComponent:',
      this.childComponentOverlayTextarea
    );
  }

  formatTypeWithCount(type: string, count: number): string {
    return `${type} {${count}}`;
  }

  getSchemaName(schema: any): string {
    if (Array.isArray(schema?.type)) {
      const nonNullTypes = schema.type.filter((t: string) => t !== 'null');
      const formattedType =
        nonNullTypes.join(' or ') +
        (schema.type.includes('null') ? ' or null' : '');
      return this.formatTypeWithCount(formattedType, schema.type.length);
    }

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
      this.modifyExtensions(schema);

      rootNode = {
        label: schema?.title || 'No schema',
        data: {
          name: schemaName,
          description: schema?.description || '',
          type: schemaName,
          showAddButton: this.shouldShowAddButton(schema),
          editDisabled: false,
          isReferenceChild: false,
          isRootNode: false,
          isSubschemeChild: true,
          uniqueId: schema[`x-${this.nameOfId}`]?.id || 'no-idsss',
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
      const validTypes = [
        'array',
        'integer',
        'number',
        'string',
        'boolean',
        'dictionary',
        'null',
        'any',
      ];

      subSchemas.forEach((subSchema: any) => {
        this.modifyExtensions(subSchema);

        if (subSchema?.$ref) {
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
                  type: this.formatType(referencedSchema.type || ''),
                  showReferenceButton: true,
                  editDisabled: true,
                  childOfSchema: true,
                  uniqueId: subSchema[`x-${this.nameOfId}`]?.id || 'no-id',
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
        } else if (subSchema?.items) {
          const arrayType = this.handleArray(subSchema);
          this.modifyExtensions(subSchema);

          const childNode: TreeNode = {
            label: arrayType,
            data: {
              name: arrayType,
              description: subSchema?.description || '',
              type: '',
              showReferenceButton: !!subSchema?.$ref,
              editDisabled: !!subSchema?.$ref,
              isReferenceChild: false,
              isRootNode: false,
              childOfSchema: true,
              isObjArrOrDisc: true,
              uniqueId: subSchema[`x-${this.nameOfId}`]?.id || 'no-id',
            },
            children: [],
            parent: rootNode,
          };

          const processItemsRecursively = (
            items: any,
            parentNode: TreeNode
          ) => {
            const hasType = !!items.type;
            const hasProperties =
              items.properties && Object.keys(items.properties).length > 0;
            const hasNestedItems = items.items || items.additionalProperties;

            if (hasType || hasProperties || hasNestedItems) {
              const resolvedChildren = this.schemaToTreeNode(
                items,
                null,
                resolvedRefs
              );

              resolvedChildren.forEach((resolvedChild) => {
                if (resolvedChild.data) {
                  if (resolvedChild.data.type) {
                    resolvedChild.data.type = resolvedChild.data.type.replace(
                      /\s\{\d+\}/,
                      ''
                    );
                  }
                  if (resolvedChild.data.name) {
                    resolvedChild.data.name = resolvedChild.data.name.replace(
                      /\s\{\d+\}/,
                      ''
                    );
                  }
                }

                if (
                  resolvedChild.data &&
                  resolvedChild.data.type === 'object' &&
                  resolvedChild.children &&
                  resolvedChild.children.length > 0
                ) {
                  const deepestItems = this.getDeepestItems(
                    resolvedChild.children
                  );
                  deepestItems.forEach((deepestItem) => {
                    parentNode.children!.push(deepestItem);
                  });
                } else if (
                  resolvedChild.data &&
                  resolvedChild.data.type === 'array'
                ) {
                  processItemsRecursively(items.items, parentNode);
                } else if (
                  items.additionalProperties &&
                  items.additionalProperties.properties
                ) {
                  const additionalPropsResolved = this.schemaToTreeNode(
                    items.additionalProperties,
                    null,
                    resolvedRefs
                  );

                  const additionalDeepestItems = this.getDeepestItems(
                    additionalPropsResolved
                  );
                  additionalDeepestItems.forEach((deepestItem) => {
                    parentNode.children!.push(deepestItem);
                  });
                }
              });
            }
          };

          processItemsRecursively(subSchema.items, childNode);

          if (childNode.children && childNode.children.length > 0) {
            childNode.data.showAddButton = true;
          }

          rootNode.children!.push(childNode);
        } else if (subSchema?.additionalProperties) {
          const discType = this.handleAdditionalProperties(subSchema);

          const childNode: TreeNode = {
            label: discType,
            data: {
              name: discType,
              description: subSchema?.description || '',
              type: '',
              showReferenceButton: !!subSchema?.$ref,
              editDisabled: !!subSchema?.$ref,
              isReferenceChild: false,
              isRootNode: false,
              isObjArrOrDisc: true,
              childOfSchema: true,
              uniqueId: subSchema[`x-${this.nameOfId}`]?.id || 'no-id',
            },
            children: [],
            parent: rootNode,
          };

          const additionalProps = subSchema.additionalProperties;

          const hasProperties =
            additionalProps.properties &&
            Object.keys(additionalProps.properties).length > 0;

          const hasNestedAdditionalProperties =
            !!additionalProps.additionalProperties &&
            this.checkNestedProperties(additionalProps.additionalProperties);

          if (!hasProperties && !hasNestedAdditionalProperties) {
            rootNode.children!.push(childNode);
            return;
          }

          if (hasProperties) {
            Object.keys(additionalProps.properties).forEach((key) => {
              const subProperty = additionalProps.properties[key];

              const subChildNode: TreeNode = {
                label: key,
                data: {
                  name: key,
                  description: subProperty?.description || '',
                  type: this.formatPropertyType(subProperty),
                  showReferenceButton: !!subProperty?.$ref,
                  editDisabled: !!subProperty?.$ref,
                  isReferenceChild: false,
                  isRootNode: false,
                  uniqueId: subProperty[`x-${this.nameOfId}`]?.id || 'no-id',
                },
                children: [],
                parent: childNode,
              };

              childNode.children!.push(subChildNode);
            });
          }

          if (hasNestedAdditionalProperties) {
            const resolvedChildren = this.schemaToTreeNode(
              subSchema.additionalProperties,
              null,
              resolvedRefs
            );

            resolvedChildren.forEach((resolvedChild) => {
              if (
                resolvedChild.data &&
                resolvedChild.data.type === 'object' &&
                resolvedChild.children &&
                resolvedChild.children.length > 0
              ) {
                const deepestItems = this.getDeepestItems(
                  resolvedChild.children
                );
                deepestItems.forEach((deepestItem) => {
                  childNode.children!.push(deepestItem);
                });
              }
            });
          }

          if (childNode.children && childNode.children.length > 0) {
            childNode.data.showAddButton = true;
          }

          rootNode.children!.push(childNode);
        } else if (
          (subSchema?.type && validTypes.includes(subSchema.type)) ||
          Array.isArray(subSchema?.type)
        ) {
          let typeLabel: string | string[] = subSchema.type;

          const itemsType = Array.isArray(subSchema.items?.type)
            ? subSchema.items?.type
            : subSchema.items?.type
            ? [subSchema.items.type]
            : [];

          if (
            Array.isArray(subSchema.type) &&
            subSchema.type.includes('object') &&
            !subSchema.properties
          ) {
            subSchema.properties = {};
          }

          if (subSchema.type === 'array' && itemsType.length > 0) {
            typeLabel = itemsType.includes('null')
              ? [
                  'array',
                  ...itemsType.filter((t: string) => t !== 'null'),
                  'null',
                ]
              : ['array', ...itemsType];
          } else if (
            subSchema.type === 'object' &&
            subSchema.additionalProperties
          ) {
            const dictionaryType = this.handleAdditionalProperties(subSchema);
            typeLabel = `dictionary[string, ${dictionaryType}]`;
          }

          const childNode: TreeNode = {
            label: Array.isArray(typeLabel)
              ? typeLabel.join(' or ')
              : typeLabel,
            data: {
              name: Array.isArray(typeLabel)
                ? typeLabel.join(' or ')
                : typeLabel,
              description: subSchema?.description || '',
              type: '',
              showReferenceButton: !!subSchema?.$ref,
              editDisabled: true,
              isReferenceChild: false,
              isRootNode: false,
              isSubschemeChild: true,
              uniqueId: subSchema[`x-${this.nameOfId}`]?.id || 'no-id',
            },
            children: [],
            parent: rootNode,
          };
          rootNode.children!.push(childNode);
        } else {
          const resolvedSubSchemas = this.schemaToTreeNode(
            subSchema,
            null,
            resolvedRefs
          );

          resolvedSubSchemas.forEach((resolvedChild) => {
            if (resolvedChild.data) {
              resolvedChild.data.editDisabled = true;
            }
            rootNode!.children!.push(resolvedChild);
          });
        }
      });
    };

    this.modifyExtensions(schema);

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
      this.modifyExtensions(schema);

      // console.log('Scheama:', schema.required);

      Object.keys(schema.properties).forEach((propertyKey) => {
        const property = schema.properties[propertyKey];

        if (!property) {
          console.warn(`Property ${propertyKey} is null or undefined.`);
          return;
        }

        // if (schema.required && schema.required.includes(propertyKey)) {
        //   console.log('Property:', propertyKey);
        // }

        this.modifyExtensions(property);

        if (property.$ref) {
          const refSchemaName = this.extractSchemaNameFromRef(property.$ref);
          this.modifyExtensions(property);

          const childNode: TreeNode = {
            label: propertyKey,
            data: {
              name: propertyKey,
              description: property?.description || '',
              type: refSchemaName || '',
              showReferenceButton: !!property?.$ref,
              editDisabled: false,
              isReferenceChild: false,
              isRootNode: false,
              isObjArrOrDisc: true,
              isRequired: schema.required?.includes(propertyKey),
              uniqueId: property[`x-${this.nameOfId}`]?.id || 'no-id',
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
        } else if (property?.allOf || property?.oneOf || property?.anyOf) {
          const combinedType = property.allOf
            ? 'allOf'
            : property.oneOf
            ? 'oneOf'
            : 'anyOf';

          this.modifyExtensions(property);

          const childNode: TreeNode = {
            label: propertyKey,
            data: {
              name: propertyKey,
              description: property?.description || '',
              type:
                this.formatTypeWithCount(
                  combinedType,
                  Object.keys(property[combinedType]).length
                ) || '',
              showReferenceButton: !!property?.$ref,
              editDisabled: !!property?.$ref,
              isReferenceChild: false,
              isRootNode: false,
              showAddButton: this.shouldShowAddButton(property),
              childOfProperty: true,
              isObjectChild: true,
              isRequired: schema.required?.includes(propertyKey),
              uniqueId: property[`x-${this.nameOfId}`]?.id || 'no-id',
            },
            children: [],
            parent: rootNode,
          };

          const resolvedChildren = this.schemaToTreeNode(
            property,
            null,
            resolvedRefs
          );

          resolvedChildren.forEach((resolvedChild) => {
            if (resolvedChild.children && resolvedChild.children.length > 0) {
              resolvedChild.children.forEach((nestedChild) => {
                childNode.children!.push(nestedChild);
              });
            }
          });

          rootNode.children!.push(childNode);
        } else if (property?.properties) {
          this.modifyExtensions(property);

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
              childOfProperty: true,
              isObjectChild: true,
              isRequired: schema.required?.includes(propertyKey),
              showAddButton: this.shouldShowAddButton(property),
              uniqueId: property[`x-${this.nameOfId}`]?.id || 'no-id',
            },
            children: [],
            parent: rootNode,
          };

          const resolvedChildren = this.schemaToTreeNode(
            property,
            null,
            resolvedRefs
          );

          resolvedChildren.forEach((resolvedChild) => {
            if (resolvedChild.children && resolvedChild.children.length > 0) {
              resolvedChild.children.forEach((nestedChild) => {
                childNode.children!.push(nestedChild);
              });
            }
          });
          rootNode.children!.push(childNode);
        } else if (property?.enum) {
          this.modifyExtensions(property);

          const childNode: TreeNode = {
            label: propertyKey,
            data: {
              name: propertyKey,
              description: property?.description || '',
              type: 'enum',
              showReferenceButton: !!property?.$ref,
              editDisabled: !!property?.$ref,
              isReferenceChild: false,
              isRootNode: false,
              isObjectChild: true,
              isRequired: schema.required?.includes(propertyKey),
              uniqueId: property[`x-${this.nameOfId}`]?.id || 'no-id',
            },
            children: [],
            parent: rootNode,
          };

          rootNode.children!.push(childNode);
        } else if (property?.additionalProperties) {
          this.modifyExtensions(property);

          const discType = this.handleAdditionalProperties(property);

          const childNode: TreeNode = {
            label: propertyKey,
            data: {
              name: propertyKey,
              description: property?.description || '',
              type: discType,
              showReferenceButton: !!property?.$ref,
              editDisabled: !!property?.$ref,
              isReferenceChild: false,
              isRootNode: false,
              isObjArrOrDisc: true,
              isObjectChild: true,
              isRequired: schema.required?.includes(propertyKey),
              uniqueId: property[`x-${this.nameOfId}`]?.id || 'no-id',
            },
            children: [],
            parent: rootNode,
          };

          const additionalProps = property.additionalProperties;

          const hasProperties =
            additionalProps.properties &&
            Object.keys(additionalProps.properties).length > 0;

          const hasNestedAdditionalProperties =
            !!additionalProps.additionalProperties &&
            this.checkNestedProperties(additionalProps.additionalProperties);

          if (!hasProperties && !hasNestedAdditionalProperties) {
            rootNode.children!.push(childNode);
            return;
          }

          if (hasProperties) {
            Object.keys(additionalProps.properties).forEach((key) => {
              const subProperty = additionalProps.properties[key];
              this.modifyExtensions(subProperty);

              const subChildNode: TreeNode = {
                label: key,
                data: {
                  name: key,
                  description: subProperty?.description || '',
                  type: this.formatPropertyType(subProperty),
                  showReferenceButton: !!subProperty?.$ref,
                  editDisabled: !!subProperty?.$ref,
                  isReferenceChild: false,
                  isRootNode: false,
                  isRequired: schema.required?.includes(propertyKey),
                  showAddButton: this.shouldShowAddButton(subProperty),
                  uniqueId: subProperty[`x-${this.nameOfId}`]?.id || 'no-id',
                },
                children: [],
                parent: childNode,
              };

              childNode.children!.push(subChildNode);
            });
          }

          if (hasNestedAdditionalProperties) {
            const resolvedChildren = this.schemaToTreeNode(
              property.additionalProperties,
              null,
              resolvedRefs
            );

            resolvedChildren.forEach((resolvedChild) => {
              if (
                resolvedChild.data &&
                resolvedChild.data.type === 'object' &&
                resolvedChild.children &&
                resolvedChild.children.length > 0
              ) {
                const deepestItems = this.getDeepestItems(
                  resolvedChild.children
                );
                deepestItems.forEach((deepestItem) => {
                  childNode.children!.push(deepestItem);
                });
              }
            });
          }
          if (childNode.children && childNode.children.length > 0) {
            childNode.data.showAddButton = true;
          }

          rootNode.children!.push(childNode);
        } else if (property.items) {
          this.modifyExtensions(property);

          const arrayType = this.handleArray(property);

          const childNode: TreeNode = {
            label: propertyKey,
            data: {
              name: propertyKey,
              description: property?.description || '',
              type: arrayType,
              showReferenceButton: !!property?.$ref,
              editDisabled: !!property?.$ref,
              isReferenceChild: false,
              isRootNode: false,
              isObjArrOrDisc: true,
              isObjectChild: true,
              isRequired: schema.required?.includes(propertyKey),
              uniqueId: property[`x-${this.nameOfId}`]?.id || 'no-id',
            },
            children: [],
            parent: rootNode,
          };

          const processItemsRecursively = (
            items: any,
            parentNode: TreeNode
          ) => {
            const hasType = !!items.type;
            const hasProperties =
              items.properties && Object.keys(items.properties).length > 0;
            const hasNestedItems = items.items || items.additionalProperties;

            if (hasType || hasProperties || hasNestedItems) {
              const resolvedChildren = this.schemaToTreeNode(
                items,
                null,
                resolvedRefs
              );

              resolvedChildren.forEach((resolvedChild) => {
                if (resolvedChild.data) {
                  if (resolvedChild.data.type) {
                    resolvedChild.data.type = resolvedChild.data.type.replace(
                      /\s\{\d+\}/,
                      ''
                    );
                  }
                  if (resolvedChild.data.name) {
                    resolvedChild.data.name = resolvedChild.data.name.replace(
                      /\s\{\d+\}/,
                      ''
                    );
                  }
                }

                if (
                  resolvedChild.data &&
                  resolvedChild.data.type === 'object' &&
                  resolvedChild.children &&
                  resolvedChild.children.length > 0
                ) {
                  const deepestItems = this.getDeepestItems(
                    resolvedChild.children
                  );
                  deepestItems.forEach((deepestItem) => {
                    parentNode.children!.push(deepestItem);
                  });
                } else if (
                  resolvedChild.data &&
                  resolvedChild.data.type === 'array'
                ) {
                  processItemsRecursively(items.items, parentNode);
                } else if (
                  items.additionalProperties &&
                  items.additionalProperties.properties
                ) {
                  const additionalPropsResolved = this.schemaToTreeNode(
                    items.additionalProperties,
                    null,
                    resolvedRefs
                  );

                  const additionalDeepestItems = this.getDeepestItems(
                    additionalPropsResolved
                  );
                  additionalDeepestItems.forEach((deepestItem) => {
                    parentNode.children!.push(deepestItem);
                  });
                }
              });
            }
          };

          processItemsRecursively(property.items, childNode);

          if (childNode.children && childNode.children.length > 0) {
            childNode.data.showAddButton = true;
          }

          rootNode.children!.push(childNode);
        } else if (this.isValidType(property?.type)) {
          this.modifyExtensions(property);

          if (
            Array.isArray(property.type) &&
            property.type.includes('object') &&
            !property.properties
          ) {
            property.properties = {};
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
              showAddButton: this.shouldShowAddButton(property),
              isChildOfProperties: true,
              isObjArrOrDisc: false,
              isRequired: schema.required?.includes(propertyKey),
              uniqueId: property[`x-${this.nameOfId}`]?.id || 'no-ids',
            },
            children: [],
            parent: rootNode,
          };
          rootNode.children!.push(childNode);
        }
      });
    } else if (schema?.enum) {
      this.modifyExtensions(schema);

      rootNode!.children = schema.enum.map((enumValue: string) => ({
        label: enumValue,
        data: {
          name: enumValue,
          type: '',
          editDisabled: true,
          uniqueId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
        },
        children: [],
      }));
    } else if (schema?.additionalProperties) {
      this.modifyExtensions(schema);

      const discType = this.handleAdditionalProperties(schema);

      const childNode: TreeNode = {
        label: 'asdqweqe',
        data: {
          name: 'propertyKey',
          description: schema?.description || '',
          type: discType,
          showReferenceButton: !!schema?.$ref,
          editDisabled: !!schema?.$ref,
          isReferenceChild: false,
          isObjArrOrDisc: true,
          isRootNode: false,

          uniqueId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
        },
        children: [],
        parent: rootNode,
      };

      const resolvedChildren = this.schemaToTreeNode(
        schema.additionalProperties,
        null,
        resolvedRefs
      );

      resolvedChildren.forEach((resolvedChild) => {
        if (resolvedChild.children && resolvedChild.children.length > 0) {
          resolvedChild.children.forEach((nestedChild) => {
            childNode.children!.push(nestedChild);
          });
        }
      });
      rootNode.children!.push(childNode);
    } else if (schema?.items) {
      this.modifyExtensions(schema);

      const arrayType = this.handleArray(schema);

      const childNode: TreeNode = {
        //TODO: check its good like this the name
        label: schema.name,
        data: {
          name: schema.name,
          description: schema?.description || '',
          type: arrayType,
          showReferenceButton: !!schema?.$ref,
          editDisabled: !!schema?.$ref,
          isReferenceChild: false,
          isRootNode: false,
          isObjArrOrDisc: true,
          uniqueId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
        },
        children: [],
        parent: rootNode,
      };

      if (schema.items != null && Object.keys(schema.items).length > 0) {
        const resolvedChildren = this.schemaToTreeNode(
          schema.items,
          null,
          resolvedRefs
        );

        resolvedChildren.forEach((resolvedChild) => {
          if (resolvedChild.children && resolvedChild.children.length > 0) {
            resolvedChild.children.forEach((nestedChild) => {
              // disableEditOnAllChildren(nestedChild);
              // referenceChildren(nestedChild);
              childNode.children!.push(nestedChild);
            });
          }
        });
      }
      rootNode.children!.push(childNode);
    }

    nodes.push(rootNode);
    return nodes;
  }

  formatType = (type: any): string => {
    if (Array.isArray(type)) {
      return type.join(' | ');
    } else {
      return type;
    }
  };

  shouldShowAddButton(schema: any): boolean {
    if (!schema) {
      return false;
    }

    if (schema.properties || schema.type === 'object') {
      return true;
    }

    if (schema.allOf) {
      return true;
    }

    if (schema.oneOf) {
      return true;
    }

    if (schema.anyOf) {
      return true;
    }

    const excludedTypes = [
      'string',
      'number',
      'boolean',
      'enum',
      'array',
      'dictionary',
    ];
    if (excludedTypes.includes(schema.type)) {
      return false;
    }

    if (schema.$ref) {
      return false;
    }

    return false;
  }

  modifyExtensions = (schema: any): any => {
    if (!schema || typeof schema !== 'object') return schema;

    if (!schema[`x-${this.nameOfId}`]) {
      schema[`x-${this.nameOfId}`] = { id: this.generateUniqueId() };
    }

    return schema;
  };

  generateUniqueId = (): string => {
    return Math.random().toString(36).substring(2, 15);
  };

  cleanSchemaName(value: string): string {
    value = value.split(':')[0];

    value = value.replace(/\{\d+\}/g, '');

    return value.trim();
  }

  handleGoRefScheme(schemaName: string) {
    const cleanedSchemaName = this.cleanSchemaName(schemaName);
    this.router.navigate(['/schemas', cleanedSchemaName]);
  }

  handleAdditionalProperties(property: any): string {
    const additionalProps = property.additionalProperties;

    if (!additionalProps) {
      return 'dictionary[string, any]';
    }

    if (additionalProps.type === 'array' && additionalProps.items) {
      const arrayType = additionalProps.items.type || 'any';
      const nestedType = additionalProps.items.additionalProperties
        ? this.handleAdditionalProperties({
            additionalProperties: additionalProps.items.additionalProperties,
          })
        : arrayType;

      return `dictionary[string, array[${nestedType}]]`;
    }

    if (
      additionalProps.type === 'object' &&
      additionalProps.additionalProperties
    ) {
      const nestedDictionaryType = this.handleAdditionalProperties({
        additionalProperties: additionalProps.additionalProperties,
      });
      return `dictionary[string, ${nestedDictionaryType}]`;
    }

    if (additionalProps.type === 'object' && additionalProps.properties) {
      return 'dictionary[string, object]';
    }

    const types = Array.isArray(additionalProps.type)
      ? additionalProps.type.join(' or ')
      : additionalProps.type || 'any';

    const additionalFormat = additionalProps.format
      ? `<${additionalProps.format}>`
      : '';

    return `dictionary[string, ${types}${additionalFormat}]`;
  }

  handleArray(property: any): string {
    const resolveArrayType = (items: any): string => {
      if (!items || Object.keys(items).length === 0) {
        return '';
      }

      if (items.$ref) {
        const schemaName = this.extractSchemaNameFromRef(items.$ref);
        return schemaName.replace(/\s+/g, '');
      }

      if (
        items.type === 'array' ||
        (Array.isArray(items.type) && items.type.includes('array'))
      ) {
        const nestedType = resolveArrayType(items.items);
        return `array[${nestedType}]`;
      }

      const itemTypes = Array.isArray(items.type)
        ? items.type
        : [items.type || ''];
      const resolvedItemType = itemTypes.includes('null')
        ? itemTypes.filter((type: string) => type !== 'null').join(' or ') +
          ' or null'
        : itemTypes.join(' or ');

      return resolvedItemType;
    };

    const items = property.items;

    const resolvedItemType = resolveArrayType(items);

    const parentTypes = Array.isArray(property.type)
      ? property.type
      : [property.type || 'array'];
    const parentHasNull = parentTypes.includes('null');

    return parentHasNull
      ? resolvedItemType
        ? `array[${resolvedItemType}] or null`
        : `array or null`
      : resolvedItemType
      ? `array[${resolvedItemType}]`
      : `array`;
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
    if (Array.isArray(property.type)) {
      if (property.type.length === 2 && property.type.includes('null')) {
        const nonNullType = property.type.find((t: string) => t !== 'null');
        return property.format
          ? `${nonNullType}<${property.format}> or null`
          : `${nonNullType} or null`;
      }
      return property.type.join(' or ');
    } else if (typeof property.type === 'string') {
      return property.format
        ? `${property.type}<${property.format}>`
        : property.type;
    }

    return 'any';
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

  onSchemaUpdated(updatedSchema: any): void {
    console.log('Schema updated in child:', updatedSchema);

    this.selectedSchema = updatedSchema;

    const swaggerSpec = this.apiDataService.getSelectedSwaggerSpecValue();
    if (swaggerSpec?.components?.schemas) {
      swaggerSpec.components.schemas[this.selectedSchemaName] =
        this.selectedSchema;
      this.apiDataService.updateSwaggerSpec(
        swaggerSpec.info.title,
        swaggerSpec
      );
      this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);
      this.fetchModelDetails();
    } else {
      console.error('No schemas found in Swagger spec.');
    }
  }

  getTypeStatus(input: string): boolean {
    const result = this.isValidTypeWithNumber(input);
    return result.isValidType && result.isTypeWithNumber;
  }

  getDeepestItems(nodes: TreeNode[]): TreeNode[] {
    const deepestItems: TreeNode[] = [];

    const traverse = (node: TreeNode, currentDepth: number) => {
      if (!node.children || node.children.length === 0) {
        deepestItems.push(node);
      } else {
        node.children.forEach((child) => traverse(child, currentDepth + 1));
      }
    };

    nodes.forEach((node) => traverse(node, 0));
    return deepestItems;
  }

  onFieldBlur(_field: string, event: Event, rowData: any): void {
    if (this.isUpdating) return;
    this.isUpdating = true;
    const value = (event.target as HTMLInputElement).value;
    this.updateSchemaField(value, rowData);
    this.isUpdating = false;
  }

  onFieldEnter(_field: string, event: Event, rowData: any): void {
    if (this.isUpdating || (event as KeyboardEvent).key !== 'Enter') return;
    this.isUpdating = true;
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    this.updateSchemaField(value, rowData);
    inputElement.blur();
    this.isUpdating = false;
  }

  updateSchemaField(newName: string, rowData: any): void {
    //TODO: Test disc and arrays
    const updateInSchema = (
      schema: any,
      oldName: string,
      newName: string
    ): void => {
      const propertyValue = schema[oldName];

      if (!propertyValue) {
        console.warn(`Property '${oldName}' not found in schema.`);
        return;
      }

      delete schema[oldName];

      schema[newName] = propertyValue;
    };

    const findAndUpdate = (schema: any): void => {
      if (!schema || typeof schema !== 'object') return;

      if (schema.properties) {
        const propertyKey = Object.keys(schema.properties).find((key) => {
          const propertyId = schema.properties[key][`x-${this.nameOfId}`]?.id;
          const isMatchingId = propertyId === rowData.uniqueId;

          if (isMatchingId) {
            return true;
          }

          if (schema.properties[key].properties) {
            findAndUpdate(schema.properties[key]);
          }

          return false;
        });
        if (propertyKey !== undefined) {
          updateInSchema(schema.properties, propertyKey, newName);
          this.updateSwaggerSpec();
          return;
        }
      }

      ['allOf', 'anyOf', 'oneOf'].forEach((composite) => {
        if (schema[composite] && Array.isArray(schema[composite])) {
          schema[composite].forEach((subSchema: any) => {
            findAndUpdate(subSchema);
          });
        }
      });

      if (schema.items) {
        if (Array.isArray(schema.items)) {
          schema.items.forEach((item: any) => findAndUpdate(item));
        } else {
          console.log('Checking single items object...');
          findAndUpdate(schema.items);
        }
      }

      if (schema.additionalItems) {
        findAndUpdate(schema.additionalItems);
      }
    };

    if (this.selectedSchema) {
      findAndUpdate(this.selectedSchema);
      console.log('Updated schema:', this.selectedSchema);
      this.updateSwaggerSpec();
    } else {
      console.warn('No schema found for updating.');
    }
  }

  handleAddScheme(_event: Event, rowData: any): void {
    this.selectedCol = this.findFieldInSchema(rowData, this.selectedSchema);

    console.log('Matched Schema Field (selectedCol):', this.selectedCol);

    let addedToSchema = false;
    let isComposite = false;
    let uniqueId = 'no-id';

    if (this.selectedCol) {
      if (rowData.type === 'object' && !this.selectedCol.properties) {
        console.log("Parent node is an 'object'. Adding '.properties'.");
        this.selectedCol.properties = {};
      }

      if (rowData.type === 'array' && !this.selectedCol.items) {
        console.log("Parent node is an 'array'. Adding '.items'.");
        this.selectedCol.items = {};
      }

      if (
        rowData.type === 'dictionary' &&
        !this.selectedCol.additionalProperties
      ) {
        console.log(
          "Parent node is a 'dictionary'. Adding '.additionalProperties'."
        );
        this.selectedCol.additionalProperties = {};
      }

      const newProperty: Record<string, any> = {
        type: 'string',
        [`x-${this.nameOfId}`]: {
          id: this.generateUniqueId(),
        },
      };

      this.modifyExtensions(newProperty);
      uniqueId = newProperty[`x-${this.nameOfId}`]?.id || 'no-id';

      if (this.selectedCol.properties) {
        const isDuplicate = Object.keys(this.selectedCol.properties).some(
          (key) =>
            this.selectedCol.properties[key][`x-${this.nameOfId}`]?.id ===
            uniqueId
        );

        if (!isDuplicate) {
          console.log('Adding to .properties');
          this.selectedCol.properties[''] = newProperty;
          addedToSchema = true;
        } else {
          console.warn('Property already exists in .properties. Skipping.');
        }
      }

      ['allOf', 'anyOf', 'oneOf'].forEach((composite) => {
        if (
          this.selectedCol[composite] &&
          Array.isArray(this.selectedCol[composite])
        ) {
          const isDuplicate = this.selectedCol[composite].some(
            (item) => item[`x-${this.nameOfId}`]?.id === uniqueId
          );

          if (!isDuplicate) {
            this.selectedCol[composite].push(newProperty);
            addedToSchema = true;
            isComposite = true;
            this.fetchModelDetails();
          } else {
            console.warn(`Property already exists in ${composite}. Skipping.`);
          }
        }
      });

      if (this.selectedCol.items) {
        const items = Array.isArray(this.selectedCol.items)
          ? this.selectedCol.items
          : [this.selectedCol.items];

        const isDuplicate = items.some(
          (item: Record<string, any>) =>
            item[`x-${this.nameOfId}`]?.id === uniqueId
        );

        if (!isDuplicate) {
          console.log('Adding to .items');
          if (Array.isArray(this.selectedCol.items)) {
            this.selectedCol.items.push(newProperty);
          } else if (typeof this.selectedCol.items === 'object') {
            this.selectedCol.items = [this.selectedCol.items, newProperty];
          } else {
            this.selectedCol.items = newProperty;
          }
          addedToSchema = true;
        } else {
          console.warn('Property already exists in .items. Skipping.');
        }
      }

      if (this.selectedCol.additionalProperties) {
        const isDuplicate =
          this.selectedCol.additionalProperties[`x-${this.nameOfId}`]?.id ===
          uniqueId;

        if (!isDuplicate) {
          console.log('Adding to .additionalProperties');
          if (typeof this.selectedCol.additionalProperties === 'object') {
            this.selectedCol.additionalProperties = {
              ...this.selectedCol.additionalProperties,
              ...newProperty,
            };
          } else {
            this.selectedCol.additionalProperties = newProperty;
          }
          addedToSchema = true;
        } else {
          console.warn(
            'Property already exists in .additionalProperties. Skipping.'
          );
        }
      }
    } else {
      console.warn(
        'selectedCol does not have properties or valid structures to add a new field.'
      );
    }

    if (addedToSchema) {
      this.updateSwaggerSpec();
    } else {
      //TODO: Add toast
      console.warn('No new property added. It already exists in the schema.');
    }

    const newSchemaNode: TreeNode = isComposite
      ? {
          label: 'string',
          data: {
            name: 'string',
            description: '',
            type: 'string',
            showAddButton: false,
            showReferenceButton: false,
            uniqueId: uniqueId,
          },
          children: [],
          expanded: true,
        }
      : {
          label: '',
          data: {
            name: '',
            description: '',
            type: 'string',
            showAddButton: false,
            showReferenceButton: false,
            uniqueId: uniqueId,
          },
          children: [],
          expanded: true,
        };

    const parentNode = this.findParentNode(this.jsonTree, rowData.uniqueId);

    if (parentNode) {
      if (!parentNode.children) {
        parentNode.children = [];
      }

      const nodeAlreadyExists = parentNode.children.some(
        (child) =>
          child.data.uniqueId === newSchemaNode.data.uniqueId ||
          child.data.name === newSchemaNode.data.name
      );

      if (!nodeAlreadyExists) {
        parentNode.children.push(newSchemaNode);
        console.log('New schema node added to parent.');
      }
    } else {
      console.warn('Parent node not found. Adding to root level.');

      const nodeAlreadyExistsAtRoot = this.jsonTree.some(
        (node) =>
          node.data.uniqueId === newSchemaNode.data.uniqueId ||
          node.data.name === newSchemaNode.data.name
      );

      if (!nodeAlreadyExistsAtRoot) {
        this.jsonTree.push(newSchemaNode);
        console.log('New schema node added to root level.');
      } else {
        console.warn(
          'Node already exists at the root level. Skipping addition.'
        );
      }
    }

    this.jsonTree = [...this.jsonTree];
  }

  findParentNode(tree: TreeNode[], uniqueId: string): TreeNode | null {
    for (const node of tree) {
      if (node.data.uniqueId === uniqueId) {
        return node;
      }
      if (node.children) {
        const foundNode = this.findParentNode(node.children, uniqueId);
        if (foundNode) {
          return foundNode;
        }
      }
    }
    return null;
  }

  updateSwaggerSpec(): void {
    if (this.selectedSchemaName && this.selectedSchema) {
      const swaggerSpec = this.apiDataService.getSelectedSwaggerSpecValue();
      if (swaggerSpec && swaggerSpec.components.schemas) {
        swaggerSpec.components.schemas[this.selectedSchemaName] =
          this.selectedSchema;

        this.apiDataService.updateSwaggerSpec(
          swaggerSpec.info.title,
          swaggerSpec
        );

        this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);
      } else {
        console.error(
          'Error: Could not fetch the Swagger spec or schema components.'
        );
      }
    } else {
      console.warn('No selected schema or schema name to update.');
    }
  }

  isRowDataMatching(rowData: any, schemaField: any): boolean {
    if (!rowData || !schemaField) {
      console.warn('RowData or SchemaField is undefined or null:', {
        rowData,
        schemaField,
      });
      return false;
    }
    if (
      rowData.uniqueId &&
      schemaField[`x-${this.nameOfId}`] &&
      schemaField[`x-${this.nameOfId}`].id === rowData.uniqueId
    ) {
      return true;
    }

    return false;
  }

  private checkNestedProperties(nestedProps: any): boolean {
    if (!nestedProps || typeof nestedProps !== 'object') {
      return false;
    }

    if (
      nestedProps.properties &&
      Object.keys(nestedProps.properties).length > 0
    ) {
      return true;
    }

    if (nestedProps.additionalProperties) {
      return this.checkNestedProperties(nestedProps.additionalProperties);
    }

    return false;
  }

  toggleChildOverlay(event: Event, rowData: any): void {
    this.selectedRowData = rowData;

    this.selectedCol = this.findFieldInSchema(rowData, this.selectedSchema);
    console.log('Matched Schema Field (selectedCol):', this.selectedCol);

    this.childComponent.toggleOverlay(
      event,
      this.selectedRowData,
      this.selectedCol
    );
  }

  findFieldInSchema(
    rowData: any,
    schema: any,
    resolvedRefs: Set<string> = new Set()
  ): any {
    if (!schema || !rowData) {
      return null;
    }
    if (
      rowData.uniqueId &&
      schema[`x-${this.nameOfId}`] &&
      schema[`x-${this.nameOfId}`].id === rowData.uniqueId
    ) {
      return schema;
    }

    if (schema.properties) {
      for (const propertyKey in schema.properties) {
        const property = schema.properties[propertyKey];
        if (this.isRowDataMatching(rowData, property)) {
          return property;
        }

        const nestedField = this.findFieldInSchema(
          rowData,
          property,
          resolvedRefs
        );
        if (nestedField) {
          return nestedField;
        }
      }
    }

    const compositeConstructs = ['allOf', 'anyOf', 'oneOf'];
    for (const construct of compositeConstructs) {
      if (schema[construct] && Array.isArray(schema[construct])) {
        for (const subSchema of schema[construct]) {
          if (this.isRowDataMatching(rowData, subSchema)) {
            return subSchema;
          }

          const field = this.findFieldInSchema(
            rowData,
            subSchema,
            resolvedRefs
          );
          if (field) {
            return field;
          }
        }
      }
    }

    if (schema.enum && Array.isArray(schema.enum)) {
      if (schema.enum.includes(rowData.name)) {
        return {
          enum: schema.enum,
          description: schema.description || '',
        };
      }
    }

    if (schema.additionalProperties) {
      if (this.isRowDataMatching(rowData, schema.additionalProperties)) {
        return schema.additionalProperties;
      }

      const nestedField = this.findFieldInSchema(
        rowData,
        schema.additionalProperties,
        resolvedRefs
      );
      if (nestedField) {
        return nestedField;
      }
    }

    if (schema.type === 'array' && schema.items) {
      if (this.isRowDataMatching(rowData, schema.items)) {
        return schema.items;
      }

      const nestedField = this.findFieldInSchema(
        rowData,
        schema.items,
        resolvedRefs
      );
      if (nestedField) {
        return nestedField;
      }
    }

    if (schema.$ref) {
      const refSchemaName = this.extractSchemaNameFromRef(schema.$ref);

      if (!resolvedRefs.has(refSchemaName)) {
        resolvedRefs.add(refSchemaName);
        const referencedSchema = this.getSchemaByRef(schema.$ref);
        return this.findFieldInSchema(rowData, referencedSchema, resolvedRefs);
      }
    }

    return null;
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

  onInfoClick(rowData: any): void {
    if (!this.selectedSchema || !rowData || !rowData.uniqueId) {
      console.warn(
        'No schema or invalid row data provided for required toggle.'
      );
      return;
    }

    const toggleRequiredByUniqueId = (
      schema: any,
      uniqueId: string,
      fieldName: string
    ): boolean => {
      if (!schema || typeof schema !== 'object') return false;

      if (schema.properties) {
        for (const key in schema.properties) {
          if (schema.properties[key][`x-${this.nameOfId}`]?.id === uniqueId) {
            if (!schema.required) {
              schema.required = [];
            }

            const isRequired = schema.required.includes(fieldName);

            if (isRequired) {
              schema.required = schema.required.filter(
                (field: string) => field !== fieldName
              );
            } else {
              schema.required.push(fieldName);
            }

            return true;
          }

          if (
            toggleRequiredByUniqueId(
              schema.properties[key],
              uniqueId,
              fieldName
            )
          ) {
            return true;
          }
        }
      }

      ['allOf', 'oneOf', 'anyOf'].forEach((compositeKey) => {
        if (schema[compositeKey] && Array.isArray(schema[compositeKey])) {
          schema[compositeKey].forEach((subSchema: any) =>
            toggleRequiredByUniqueId(subSchema, uniqueId, fieldName)
          );
        }
      });

      if (schema.additionalProperties) {
        toggleRequiredByUniqueId(
          schema.additionalProperties,
          uniqueId,
          fieldName
        );
      }

      if (schema.items) {
        if (Array.isArray(schema.items)) {
          schema.items.forEach((item: any) =>
            toggleRequiredByUniqueId(item, uniqueId, fieldName)
          );
        } else {
          toggleRequiredByUniqueId(schema.items, uniqueId, fieldName);
        }
      }

      return false;
    };

    const fieldName = rowData.name;
    const isUpdated = toggleRequiredByUniqueId(
      this.selectedSchema,
      rowData.uniqueId,
      fieldName
    );

    if (isUpdated) {
      console.log(
        `Field with uniqueId '${rowData.uniqueId}' updated in required.`
      );
      this.updateSwaggerSpec();
      console.log('Updated schema required:', this.selectedSchema.required);
    }
  }

  onBookClick(event: Event, rowData: any) {
    console.log('Book button clicked', rowData);
    this.selectedRowData = rowData;
    this.selectedCol = this.findFieldInSchema(rowData, this.selectedSchema);
    this.childComponentOverlayTextarea?.toggleOverlay(
      event,
      this.selectedRowData,
    );
  }

  onDeleteClick(rowData: any): void {
    if (!this.selectedSchema || !rowData || !rowData.uniqueId) {
      console.warn('No schema or invalid row data provided for deletion.');
      return;
    }

    const deleteFieldByUniqueId = (schema: any, uniqueId: string): boolean => {
      if (!schema || typeof schema !== 'object') return false;

      if (schema.properties) {
        for (const key in schema.properties) {
          if (schema.properties[key][`x-${this.nameOfId}`]?.id === uniqueId) {
            delete schema.properties[key];
            return true;
          } else if (deleteFieldByUniqueId(schema.properties[key], uniqueId)) {
            return true;
          }
        }
      }

      ['allOf', 'oneOf', 'anyOf'].forEach((compositeKey) => {
        if (schema[compositeKey] && Array.isArray(schema[compositeKey])) {
          const beforeFilter = schema[compositeKey];
          schema[compositeKey] = schema[compositeKey].filter(
            (subSchema: any) => {
              const shouldKeep =
                subSchema[`x-${this.nameOfId}`]?.id !== uniqueId;
              return shouldKeep;
            }
          );

          const afterFilter = schema[compositeKey];

          console.log(`Before filtering ${compositeKey}:`, beforeFilter);
          console.log(`After filtering ${compositeKey}:`, afterFilter);

          if (JSON.stringify(beforeFilter) !== JSON.stringify(afterFilter)) {
            console.log(`Modification detected in ${compositeKey}.`);
            return true;
          } else {
            schema[compositeKey].forEach((subSchema: any) => {
              deleteFieldByUniqueId(subSchema, uniqueId);
            });
          }
        }
        return false;
      });

      if (schema.additionalProperties) {
        if (
          schema.additionalProperties[`x-${this.nameOfId}`]?.id === uniqueId
        ) {
          delete schema.additionalProperties;
          return true;
        } else if (
          deleteFieldByUniqueId(schema.additionalProperties, uniqueId)
        ) {
          return true;
        }
      }

      if (schema.items) {
        if (Array.isArray(schema.items)) {
          schema.items = schema.items.filter(
            (item: any) => item[`x-${this.nameOfId}`]?.id !== uniqueId
          );

          schema.items.forEach((item: any) => {
            deleteFieldByUniqueId(item, uniqueId);
          });
        } else if (schema.items[`x-${this.nameOfId}`]?.id === uniqueId) {
          delete schema.items;
          return true;
        } else {
          deleteFieldByUniqueId(schema.items, uniqueId);
        }
      }

      return false;
    };

    deleteFieldByUniqueId(this.selectedSchema, rowData.uniqueId);

    this.updateSwaggerSpec();
    this.fetchModelDetails();

    this.toastMessageService.add({
      severity: 'info',
      summary: 'Deleted',
      detail: `Finished processing delete`,
    });
  }

  fetchModelDetails(): void {
    this.swaggerSubscription = this.apiDataService
      .getSelectedSwaggerSpec()
      .subscribe({
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
            //TODO: Add toast messege
            console.warn('No schemas found in the Swagger spec.');
          }
        },
        error: (error) => {
          console.error('Error fetching Swagger spec:', error);
        },
      });

    const schemaName = this.getSchemaName(this.selectedSchema);

    this.modifyExtensions(this.selectedSchema);

    const rootNode: TreeNode = {
      label: this.selectedSchema.title,
      data: {
        name: schemaName,
        description: this.selectedSchema.description || '',
        type: schemaName,
        showAddButton: this.shouldShowAddButton(this.selectedSchema),
        editDisabled: false,
        isReferenceChild: false,
        isRootNode: true,
        isSubschemeChild: false,
        uniqueId: this.selectedSchema[`x-${this.nameOfId}`]?.id || 'no-id',
      },
      children: [],
      expanded: true,
    };

    this.jsonTree = this.schemaToTreeNode(this.selectedSchema, rootNode);
    console.log('jsonTree', this.jsonTree);
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
    this.isEditingTitle = true;
  }

  stopEditingTitle(): void {
    this.isEditingTitle = false;

    if (this.selectedSchema && this.selectedSchemaName) {
      const oldSchemaName = this.selectedSchemaName;
      const newSchemaName = this.selectedSchemaTitle.trim();

      if (newSchemaName && newSchemaName !== oldSchemaName) {
        this.apiDataService
          .getSelectedSwaggerSpec()
          .subscribe((swaggerSpec: any) => {
            if (swaggerSpec?.components?.schemas) {
              swaggerSpec.components.schemas[newSchemaName] =
                swaggerSpec.components.schemas[oldSchemaName];
              delete swaggerSpec.components.schemas[oldSchemaName];

              swaggerSpec.components.schemas[newSchemaName].title =
                newSchemaName;

              this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);

              this.selectedSchemaName = newSchemaName;
              this.selectedSchema =
                swaggerSpec.components.schemas[newSchemaName];
              console.log('Schema name updated:', newSchemaName);

              this.router.navigate(['/schemas', newSchemaName]);
            } else {
              console.error('No schemas found in Swagger spec.');
            }
          });
      }
    }
  }

  startEditingDescription(): void {
    this.isEditingDescription = true;
  }

  stopEditingDescription(): void {
    this.isEditingDescription = false;

    if (this.selectedSchema) {
      if (this.selectedSchemaDescription.trim() === '') {
        delete this.selectedSchema.description;
      } else {
        this.selectedSchema.description = this.selectedSchemaDescription;
      }
    }

    this.onUpdateSchema();
  }

  onUpdateSchema(): void {
    this.apiDataService
      .getSelectedSwaggerSpec()
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

            try {
              schemaObject.properties =
                typeof formData.properties === 'string'
                  ? JSON.parse(formData.properties)
                  : formData.properties;
            } catch (error) {
              console.error('Invalid JSON format for properties:', error);
              return;
            }

            if (formData.examples) {
              try {
                schemaObject.examples = JSON.parse(formData.examples);
                console.log('Parsed Examples:', schemaObject.examples);
              } catch (e) {
                console.error('Invalid JSON format for examples:', e);
              }
            }

            swaggerSpec.components.schemas[schemaName] = schemaObject;

            this.apiDataService.setSchemes(
              JSON.stringify(swaggerSpec.components.schemas, null, 2)
            );

            this.apiDataService
              .getSelectedSwaggerSpec()
              .subscribe((updatedSpec: ExtendedSwaggerSpec | null) => {
                if (updatedSpec) {
                  this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);
                }
              });
          }
        }
      });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  isSpecialType(type: string | string[] | { type: string }[]): boolean {
    const specialTypes = [
      'allOf',
      'anyOf',
      'oneOf',
      'enum',
      'object',
      'array',
      'integer',
      'number',
      'string',
      'boolean',
      'dictionary',
      'null',
      'any',
    ];

    const stringFormats = [
      'None',
      'byte',
      'binary',
      'date',
      'date-time',
      'password',
      'email',
      'time',
      'duration',
      'idn-email',
      'hostname',
      'idn-hostname',
      'ipv4',
      'ipv6',
      'uri',
      'uri-reference',
      'uuid',
      'uri-template',
      'json-pointer',
      'relative-json-pointer',
      'regex',
    ];

    const numberFormats = ['float', 'double'];
    const intFormats = ['int32', 'int64'];

    const cleanType = (typeStr: string): string => {
      return typeStr.replace(/ or null$/, '').trim();
    };

    const isObjectWithNumber = (typeStr: string): boolean => {
      const match = typeStr.match(/^(object|allOf|anyOf|oneOf)\s*\{\d+\}$/);
      return match !== null;
    };

    const validateDictionaryType = (typeStr: string): boolean => {
      const match = typeStr.match(/^dictionary\[(.+), (.+)\]$/);
      if (match) {
        const keyType = match[1].trim();
        const valueType = match[2].trim();
        return (
          keyType === 'string' &&
          (specialTypes.includes(cleanType(valueType)) ||
            stringFormats.includes(cleanType(valueType)) ||
            numberFormats.includes(cleanType(valueType)) ||
            intFormats.includes(cleanType(valueType)) ||
            validateGenericType(valueType))
        );
      }
      return false;
    };

    const validateGenericType = (typeStr: string): boolean => {
      const match = typeStr.match(/^(\w+)<(.+)>$/);
      if (match) {
        const baseType = match[1];
        const formatType = match[2];
        return (
          specialTypes.includes(cleanType(baseType)) &&
          (stringFormats.includes(cleanType(formatType)) ||
            numberFormats.includes(cleanType(formatType)) ||
            intFormats.includes(cleanType(formatType)))
        );
      }
      return false;
    };

    const validateArrayType = (typeStr: string): boolean => {
      if (typeStr === 'array') {
        return true;
      }

      if (typeStr === 'array[]') {
        return true;
      }

      const match = typeStr.match(/^array\[(.+)\]$/);
      if (match) {
        const innerType = match[1].trim();

        if (innerType.startsWith('array')) {
          return validateArrayType(innerType);
        }

        const isReferenceValid = this.getSchemaByRef
          ? !!this.getSchemaByRef(`#/components/schemas/${innerType}`)
          : false;

        return (
          specialTypes.includes(cleanType(innerType)) ||
          isReferenceValid ||
          stringFormats.includes(cleanType(innerType)) ||
          numberFormats.includes(cleanType(innerType)) ||
          intFormats.includes(cleanType(innerType)) ||
          validateGenericType(innerType)
        );
      }

      return false;
    };

    const validateUnionTypes = (typeStr: string): boolean => {
      const unionTypes = typeStr.split(' or ').map((t) => t.trim());
      return unionTypes.every(
        (t) =>
          validateArrayType(t) ||
          validateGenericType(t) ||
          specialTypes.includes(cleanType(t)) ||
          stringFormats.includes(cleanType(t)) ||
          numberFormats.includes(cleanType(t)) ||
          intFormats.includes(cleanType(t))
      );
    };

    if (typeof type === 'string') {
      const cleanedType = type.trim();

      if (isObjectWithNumber(cleanedType)) {
        return true;
      }

      if (cleanedType === 'array') {
        return true;
      }
      if (cleanedType.startsWith('array')) {
        return validateArrayType(cleanedType);
      }
      if (cleanedType.startsWith('dictionary')) {
        return validateDictionaryType(cleanedType);
      }
      if (cleanedType.includes(' or ')) {
        return validateUnionTypes(cleanedType);
      }

      return (
        specialTypes.includes(cleanType(cleanedType)) ||
        stringFormats.includes(cleanType(cleanedType)) ||
        numberFormats.includes(cleanType(cleanedType)) ||
        intFormats.includes(cleanType(cleanedType)) ||
        validateGenericType(cleanedType)
      );
    }

    if (Array.isArray(type)) {
      return type.every((t) =>
        this.isSpecialType(typeof t === 'string' ? t : t.type)
      );
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

    const nodeToUpdate = findNode(this.jsonTree, updatedNodeData.name);
    console.log('Node to update:', nodeToUpdate);

    if (nodeToUpdate) {
      nodeToUpdate.data = { ...updatedNodeData };
      console.log('Updated node data in jsonTree:', nodeToUpdate);
      this.jsonTree = [...this.jsonTree];
      console.log('Updated jsonTree:', this.jsonTree);

      console.log('Node data before patching form:', {
        name: nodeToUpdate.data.name,
        description: nodeToUpdate.data.description,
        type: nodeToUpdate.data.type,
      });

      const allProperties = JSON.parse(
        this.schemaDetailsForm.get('properties')?.value || '{}'
      );

      const propertyToUpdate = allProperties[nodeToUpdate.data.name];
      console.log('Property to update:', propertyToUpdate);

      if (propertyToUpdate) {
        propertyToUpdate.type = nodeToUpdate.data.type; // or any other update
        console.log(
          `Updated property ${nodeToUpdate.data.name}:`,
          propertyToUpdate
        );

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
