import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import {MessageService, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TreeTableModule } from 'primeng/treetable';
import { ToggleButtonModule } from 'primeng/togglebutton';
import {
  FormsModule,
} from '@angular/forms';

import { SchemeTypeOverlayPanelComponent } from '../scheme-type-overlay-panel/scheme-type-overlay-panel.component';
import { RefButtonComponent } from '../ref-button/ref-button.component';
import { AddSchemeButtonComponent } from '../add-scheme-button/add-scheme-button.component';
import { OverlayTextareaComponent } from '../overlay-textarea/overlay-textarea.component';
import { SchemaExamplesComponent } from '../../schemas/schema-examples/schema-examples.component';
import { SchemaExtensionsComponent } from '../../schemas/schema-extensions/schema-extensions.component';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  selector: 'app-schema-tabs',
  standalone: true,
  imports: [
    CommonModule,
    TreeTableModule,
    ButtonModule,
    ToggleButtonModule,
    FormsModule,
    SchemeTypeOverlayPanelComponent,
    RefButtonComponent,
    AddSchemeButtonComponent,
    OverlayTextareaComponent,
    SchemaExamplesComponent,
    SchemaExtensionsComponent,
    MatGridListModule,
  ],
  templateUrl: './schema-tabs.component.html',
  styleUrls: ['./schema-tabs.component.css'],
})
export class SchemaTabsComponent {
  @Input() jsonTree: TreeNode[] = [];
  @Input() cols: any[] = [];
  @Input() selectedSchema: any;
  @Input() nameOfId: string = '';
  @Input() activeTab: string = 'schema';
  @Input() selectedSchemaName: any;
  @Input() selectedCol: string = '';
  @Input() apiSchemas: any[] = [];
  @Input() apiDataService: any;
  @Input() fetchModelDetails!: () => void;

  @Output() activeTabChange = new EventEmitter<string>();
  @Output() schemaUpdated = new EventEmitter<any>();
  @Output() deleteRow = new EventEmitter<any>();
  @Output() bookClick = new EventEmitter<{ event: Event; rowData: any }>();
  @Output() addScheme = new EventEmitter<{ event: Event; rowData: any }>();

  @ViewChild(SchemeTypeOverlayPanelComponent)
  childComponent!: SchemeTypeOverlayPanelComponent;

  @ViewChild(OverlayTextareaComponent)
  childComponentOverlayTextarea!: OverlayTextareaComponent;

  @ViewChild(AddSchemeButtonComponent)
  addSchemeButtonComponent!: AddSchemeButtonComponent;

  VALID_TYPES = [
    'string',
    'number',
    'boolean',
    'object',
    'array',
    'integer',
    'null',
  ];

  private isUpdating = false;

  constructor(private toastMessageService: MessageService) {}

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.activeTabChange.emit(tab);
  }

  ngOnInit(): void {
    console.log('JSON Tree in Child Component:', this.jsonTree);
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
    } else {
      console.error('No schemas found in Swagger spec.');
    }
  }

  updateButtonLabel(event: any): void {
    console.log('Button label updated:', event);
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

  handleGoRefScheme(event: any): void {
    console.log('Go to reference scheme clicked:', event);
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

  toggleChildOverlay(event: Event, rowData: any): void {
    console.log(rowData);

    this.selectedCol = this.findFieldInSchema(rowData, this.selectedSchema);

    console.log(this.findFieldInSchema(rowData, this.selectedSchema));
    console.log('Matched Schema Field (selectedCol):', this.selectedCol);

    this.childComponent.toggleOverlay(event, rowData, this.selectedCol);
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

  getTypeStatus(input: string): boolean {
    const result = this.isValidTypeWithNumber(input);
    return result.isValidType && result.isTypeWithNumber;
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

  onInfoClick(rowData: any): void {
    console.log('Info clicked:', rowData);
  }

  onBookClick(event: Event, rowData: any): void {
    console.log('Book clicked in child:', rowData);
    this.bookClick.emit({ event, rowData });
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
          schema[compositeKey] = schema[compositeKey].filter(
            (subSchema: any) => subSchema[`x-${this.nameOfId}`]?.id !== uniqueId
          );
        }
      });

      if (schema.additionalProperties) {
        if (
          schema.additionalProperties[`x-${this.nameOfId}`]?.id === uniqueId
        ) {
          delete schema.additionalProperties;
          return true;
        }
      }

      if (schema.items) {
        if (Array.isArray(schema.items)) {
          schema.items = schema.items.filter(
            (item: any) => item[`x-${this.nameOfId}`]?.id !== uniqueId
          );
        } else if (schema.items[`x-${this.nameOfId}`]?.id === uniqueId) {
          delete schema.items;
          return true;
        }
      }

      return false;
    };

    const deleted = deleteFieldByUniqueId(
      this.selectedSchema,
      rowData.uniqueId
    );

    if (deleted) {
      this.updateSwaggerSpec();
      this.fetchModelDetails();

      this.toastMessageService.add({
        severity: 'info',
        summary: 'Deleted',
        detail: `Finished processing delete`,
      });

      this.deleteRow.emit(rowData);
    }
  }

  handleAddScheme(event: Event, rowData: any): void {
    console.log('Emitting addScheme event from child:', rowData);
    this.addScheme.emit({ event, rowData });
  }

  extractSchemaNameFromRef(ref: string): string {
    const refParts = ref.split('/');
    return refParts[refParts.length - 1];
  }

  findFieldInSchema(
    rowData: any,
    schema: any,
    resolvedRefs: Set<string> = new Set()
  ): any {
    if (!schema || !rowData) {
      return null;
    }
    console.log(this.nameOfId);
    console.log(rowData);
    console.log(schema[`x-${this.nameOfId}`].id);
    if (
      rowData.uniqueId &&
      schema[`x-${this.nameOfId}`] &&
      schema[`x-${this.nameOfId}`].id === rowData.uniqueId
    ) {
      console.log('✅ Matched schema by uniqueId:', schema);
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

        if (!referencedSchema) {
          return null;
        }

        return this.findFieldInSchema(rowData, referencedSchema, resolvedRefs);
      }
    }

    return null;
  }

  getSchemaByRef(ref: string): any {
    const schemaName = this.extractSchemaNameFromRef(ref);
    return this.apiSchemas.find((schema) => schema.name === schemaName)
      ?.details;
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
}
