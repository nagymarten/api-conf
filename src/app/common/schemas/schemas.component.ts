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
  nameOfId: string = 'myappika';
  examplesSubscheema: any;

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
      // console.log('schema', schema);

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
          uniqeId: schema[`x-${this.nameOfId}`]?.id || 'no-idsss',
        },
        children: [],
        expanded: true,
      };
    }
    // console.log('rootNode', rootNode);

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
                  uniqeId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
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
              uniqeId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
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
                  // Recursively process nested arrays
                  processItemsRecursively(items.items, parentNode);
                } else if (
                  items.additionalProperties &&
                  items.additionalProperties.properties
                ) {
                  // Process additionalProperties' properties
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
              uniqeId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
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
                  uniqeId: subProperty[`x-${this.nameOfId}`]?.id || 'no-id',
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

          if (subSchema.type === 'array' && itemsType.length > 0) {
            typeLabel = itemsType.includes('null')
              ? [
                  'array',
                  ...itemsType.filter((t: string) => t !== 'null'),
                  'null',
                ]
              : ['array', ...itemsType];
          } else if (
            subSchema.type === 'dictionary' &&
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
              editDisabled: !!subSchema?.$ref,
              isReferenceChild: false,
              isRootNode: false,
              uniqeId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
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
      Object.keys(schema.properties).forEach((propertyKey) => {
        const property = schema.properties[propertyKey];

        this.modifyExtensions(schema);

        if (!property) {
          console.warn(`Property ${propertyKey} is null or undefined.`);
          return;
        }
        this.modifyExtensions(schema);

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
            uniqeId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
          },
          children: [],
          parent: rootNode,
        };

        if (property.$ref) {
          const refSchemaName = this.extractSchemaNameFromRef(property.$ref);
          this.modifyExtensions(schema);

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
              uniqeId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
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
        } else if (property?.properties) {
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
              uniqeId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
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
          this.modifyExtensions(schema);

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
              uniqeId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
            },
            children: [],
            parent: rootNode,
          };

          rootNode.children!.push(childNode);
        } else if (property?.additionalProperties) {
          this.modifyExtensions(schema);

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
              uniqeId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
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
                  showAddButton: true,
                  uniqeId: subProperty[`x-${this.nameOfId}`]?.id || 'no-id',
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
          this.modifyExtensions(schema);

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
              uniqeId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
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
                  // Recursively process nested arrays
                  processItemsRecursively(items.items, parentNode);
                } else if (
                  items.additionalProperties &&
                  items.additionalProperties.properties
                ) {
                  // Process additionalProperties' properties
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
          uniqeId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
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
          isRootNode: false,
          uniqeId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
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
            // disableEditOnAllChildren(nestedChild);
            // referenceChildren(nestedChild);
            childNode.children!.push(nestedChild);
          });
        }
      });
      rootNode.children!.push(childNode);
    } else if (schema?.items) {
      this.modifyExtensions(schema);

      const arrayType = this.handleArray(schema);

      const childNode: TreeNode = {
        label: 'arrayasdf',
        data: {
          name: 'asaarayd',
          description: schema?.description || '',
          type: arrayType,
          showReferenceButton: !!schema?.$ref,
          editDisabled: !!schema?.$ref,
          isReferenceChild: false,
          isRootNode: false,
          uniqeId: schema[`x-${this.nameOfId}`]?.id || 'no-id',
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
      //TODO: array & disc buttons
      //TODO: array deepest child type
      //TODO: check disc is not empty
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

    return 'unknown';
  };

  modifyExtensions = (schema: any): any => {
    if (!schema || typeof schema !== 'object') return schema;
    // Traverse all keys in the schema
    for (const key in schema) {
      // Check for extensions starting with `x-` but not matching `x-${appName}`
      if (key.startsWith('x-') && key !== `x-${this.nameOfId}`) {
        delete schema[key]; // Remove the custom extension
      }

      // If x-stoplight exists, replace it with x-myapp
      if (key === 'x-stoplight') {
        delete schema[key]; // Remove x-stoplight
        schema[`x-${this.nameOfId}`] = { id: this.generateUniqueId() }; // Add custom extension
      }

      // Leave x-internal untouched
      if (key === 'x-internal' && schema[key] === true) {
        continue;
      }

      // Recursively traverse nested objects
      if (typeof schema[key] === 'object') {
        this.modifyExtensions(schema[key]);
      }
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
    console.log(`Navigating to schema: ${cleanedSchemaName}`);
    this.router.navigate(['/schemas', cleanedSchemaName]);
  }

  handleAdditionalProperties(property: any): string {
    const additionalProps = property.additionalProperties;

    if (!additionalProps) {
      return 'dictionary[string, any]'; // Default if additionalProperties is missing
    }

    // Check if additionalProperties is an array
    if (additionalProps.type === 'array' && additionalProps.items) {
      const arrayType = additionalProps.items.type || 'any'; // Default to 'any' if type is missing in items
      const nestedType = additionalProps.items.additionalProperties
        ? this.handleAdditionalProperties({
            additionalProperties: additionalProps.items.additionalProperties,
          })
        : arrayType;

      return `dictionary[string, array[${nestedType}]]`;
    }

    // Check if additionalProperties is a dictionary (object with additionalProperties)
    if (
      additionalProps.type === 'object' &&
      additionalProps.additionalProperties
    ) {
      const nestedDictionaryType = this.handleAdditionalProperties({
        additionalProperties: additionalProps.additionalProperties,
      });
      return `dictionary[string, ${nestedDictionaryType}]`;
    }

    // Check if additionalProperties is a regular object with properties
    if (additionalProps.type === 'object' && additionalProps.properties) {
      return 'dictionary[string, object]';
    }

    // Handle regular types and formats
    const types = Array.isArray(additionalProps.type)
      ? additionalProps.type.join(' or ')
      : additionalProps.type || 'any'; // Default to 'any' if no type is provided

    const additionalFormat = additionalProps.format
      ? `<${additionalProps.format}>`
      : '';

    return `dictionary[string, ${types}${additionalFormat}]`;
  }

  handleArray(property: any): string {
    // Extract `items` from the property
    const items = property.items;

    if (!items) {
      return 'array[unknown]'; // Default when no items are defined
    }

    // If `items` is an empty object, return just `array`
    if (Object.keys(items).length === 0) {
      return 'array';
    }

    // Check if `additionalProperties` exists within `items`
    if (items.additionalProperties) {
      const additionalPropsType = items.additionalProperties.type || 'any'; // Default to 'any' if type is missing
      const additionalPropsFormat = items.additionalProperties.format
        ? `<${items.additionalProperties.format}>`
        : '';
      return `array[dictionary[string, ${additionalPropsType}${additionalPropsFormat}]]`;
    }

    // Check if items have multiple types or a single type
    const types = Array.isArray(items.type)
      ? items.type.join(' or ')
      : items.type || 'unknown';

    // Check for additional formats in the items
    const itemFormat = items.format ? `<${items.format}>` : '';

    // Handle nested arrays or dictionaries
    if (types === 'array') {
      return `array[${this.handleArray(items)}]`; // Recursive handling for nested arrays
    } else if (types === 'dictionary') {
      return `array[${this.handleAdditionalProperties(items)}]`; // Handle nested dictionaries
    }

    return `array[${types}${itemFormat}]`; // Default case
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
      // Handle array of types, e.g., ["string", "null"]
      if (property.type.length === 2 && property.type.includes('null')) {
        // Find the non-null type
        const nonNullType = property.type.find((t: string) => t !== 'null');
        return property.format
          ? `${nonNullType}<${property.format}> or null`
          : `${nonNullType} or null`;
      }
      return property.type.join(' | '); // Fallback for unexpected structures
    } else if (typeof property.type === 'string') {
      // Handle single string type
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

  onSchemaUpdated(updatedSchema: any) {
    console.log('Schema updated in child:', updatedSchema);

    this.selectedSchema = updatedSchema;

    this.apiDataService.getSwaggerSpec().subscribe((swaggerSpec: any) => {
      if (swaggerSpec?.components?.schemas) {
        swaggerSpec.components.schemas[this.selectedSchemaName] =
          this.selectedSchema;
        this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);

        this.fetchModelDetails();
      } else {
        console.error('No schemas found in Swagger spec.');
      }
    });
  }

  getTypeStatus(input: string): boolean {
    const result = this.isValidTypeWithNumber(input);
    return result.isValidType && result.isTypeWithNumber;
  }

  getDeepestItems(nodes: TreeNode[]): TreeNode[] {
    const deepestItems: TreeNode[] = [];

    const traverse = (node: TreeNode, currentDepth: number) => {
      if (!node.children || node.children.length === 0) {
        deepestItems.push(node); // Store the node without adding the depth property
      } else {
        // Recursively traverse each child
        node.children.forEach((child) => traverse(child, currentDepth + 1));
      }
    };

    nodes.forEach((node) => traverse(node, 0)); // Start traversal from root nodes
    return deepestItems;
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
  isRowDataMatching(
    rowData: any,
    schemaField: any,
    fieldName: string = ''
  ): boolean {
    if (!rowData || !schemaField) {
      return false;
    }

    // Match by name
    if (rowData.name && fieldName && rowData.name === fieldName) {
      return true;
    }

    // Match by description
    if (
      rowData.description &&
      schemaField.description &&
      rowData.description === schemaField.description
    ) {
      return true;
    }

    // Match by type
    if (rowData.type && schemaField.type && rowData.type === schemaField.type) {
      return true;
    }

    // Match by other fields in rowData (if applicable)
    for (const key of Object.keys(rowData)) {
      if (schemaField[key] && rowData[key] === schemaField[key]) {
        return true;
      }
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

  toggleChildOverlay(event: Event, rowData: any, col: any): void {
    // Save the selected row data
    this.selectedRowData = rowData;

    // Find the corresponding field in the schema and set it as selectedCol
    this.selectedCol = this.findFieldInSchema(rowData, this.selectedSchema);

    // Log the results for debugging
    console.log('Selected Row Data:', this.selectedRowData);
    console.log('Matched Schema Field (selectedCol):', this.selectedCol);

    // Trigger the overlay with the selected data
    this.childComponent.toggleOverlay(event, rowData, col);
  }

  findFieldInSchema(
    rowData: any,
    schema: any,
    resolvedRefs: Set<string> = new Set()
  ): any {
    if (!schema || !rowData) {
      console.warn('Schema or rowData is not defined.');
      return null;
    }

    // Check for properties
    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        if (this.isRowDataMatching(rowData, value, key)) {
          return value;
        }
      }
    }

    // Match directly within allOf, anyOf, or oneOf
    const compositeConstructs = ['allOf', 'anyOf', 'oneOf'];
    for (const construct of compositeConstructs) {
      if (schema[construct] && Array.isArray(schema[construct])) {
        for (const subSchema of schema[construct]) {
          // Check if the rowData matches directly with the subSchema
          if (this.isRowDataMatching(rowData, subSchema)) {
            return subSchema;
          }

          // Recursively search within the subSchema
          const field = this.findFieldInSchema(
            rowData,
            subSchema,
            resolvedRefs
          );
          if (field) return field;
        }
      }
    }

    // Check for enums
    if (schema.enum && Array.isArray(schema.enum)) {
      if (schema.enum.includes(rowData.name)) {
        return {
          enum: schema.enum,
          description: schema.description || '',
        };
      }
    }

    // Check for additionalProperties
    if (
      schema.additionalProperties &&
      typeof schema.additionalProperties === 'object'
    ) {
      if (this.isRowDataMatching(rowData, schema.additionalProperties)) {
        return schema.additionalProperties;
      }
    }

    // Check for items in arrays
    if (schema.type === 'array' && schema.items) {
      if (this.isRowDataMatching(rowData, schema.items)) {
        return schema.items;
      }
    }

    // Follow $ref if available
    if (schema.$ref) {
      const refSchemaName = this.extractSchemaNameFromRef(schema.$ref);

      if (!resolvedRefs.has(refSchemaName)) {
        resolvedRefs.add(refSchemaName);
        const referencedSchema = this.getSchemaByRef(schema.$ref);
        return this.findFieldInSchema(rowData, referencedSchema, resolvedRefs);
      }
    }

    console.warn(`RowData did not match any fields in the schema.`);
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

    this.modifyExtensions(this.selectedSchema);

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
        uniqeId: this.selectedSchema[`x-${this.nameOfId}`]?.id || 'no-id',
      },
      children: [],
      expanded: true,
    };

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
      'any',
    ];

    const cleanType = (typeStr: string): string => {
      const baseType = typeStr.split('<')[0].trim(); // Extract base type
      return baseType.replace(/ or null$/, '').trim(); // Remove " or null" suffix
    };

    const cleanString = (typeStr: string): string => {
      return typeStr.replace(/\{.*\}$/, '').trim(); // Remove "{...}" from the end
    };

    const validateUnionTypes = (typeStr: string): boolean => {
      const unionTypes = typeStr.split(' or ').map((t) => t.trim());
      const hasNull = unionTypes.includes('null');
      const validTypes = unionTypes.filter((t) =>
        specialTypes.includes(cleanType(t))
      );
      return (
        validTypes.length === unionTypes.length &&
        (hasNull || unionTypes.length > 1)
      );
    };

    const validateArrayType = (typeStr: string): boolean => {
      if (typeStr === 'array') {
        return true; // Accept plain 'array'
      }

      const match = typeStr.match(/^array\[(.+)\]$/);
      if (match) {
        const innerType = match[1];
        const cleanInnerType = cleanType(innerType);
        return (
          validateUnionTypes(innerType) ||
          validateDictionaryType(innerType) || // Handle dictionary inside array
          validateArrayType(innerType) || // Handle nested arrays
          specialTypes.includes(cleanInnerType)
        );
      }
      return false;
    };

    const validateDictionaryType = (typeStr: string): boolean => {
      const match = typeStr.match(/^dictionary\[string,\s*(.+)\]$/);
      if (match) {
        const innerType = match[1];
        return (
          validateUnionTypes(innerType) ||
          validateArrayType(innerType) || // Handle arrays inside dictionaries
          validateDictionaryType(innerType) || // Handle nested dictionaries
          specialTypes.includes(cleanType(innerType))
        );
      }
      return false;
    };

    // If type is a single string
    if (typeof type === 'string') {
      const cleanedType = cleanString(type); // Clean the string
      if (cleanedType === 'array') {
        return true; // Accept plain 'array'
      }
      if (cleanedType.startsWith('dictionary')) {
        return validateDictionaryType(cleanedType);
      }
      if (cleanedType.startsWith('array')) {
        return validateArrayType(cleanedType);
      }
      if (cleanedType.includes(' or ')) {
        return validateUnionTypes(cleanedType);
      }
      return specialTypes.includes(cleanType(cleanedType));
    }

    // If type is an array of strings
    if (Array.isArray(type)) {
      return type.every((t) => {
        if (typeof t === 'string') {
          return specialTypes.includes(cleanType(t));
        } else if (typeof t === 'object' && 'type' in t) {
          return specialTypes.includes(cleanType(t.type));
        }
        return false;
      });
    }

    return false; // If none of the above cases match
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
