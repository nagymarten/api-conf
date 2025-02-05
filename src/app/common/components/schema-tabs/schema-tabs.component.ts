import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TreeTableModule } from 'primeng/treetable';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { FormsModule } from '@angular/forms';

import { SchemeTypeOverlayPanelComponent } from '../scheme-type-overlay-panel/scheme-type-overlay-panel.component';
import { RefButtonComponent } from '../ref-button/ref-button.component';
import { AddSchemeButtonComponent } from '../add-scheme-button/add-scheme-button.component';
import { OverlayTextareaComponent } from '../overlay-textarea/overlay-textarea.component';
import { SchemaExamplesComponent } from '../../schemas/schema-examples/schema-examples.component';
import { SchemaExtensionsComponent } from '../../schemas/schema-extensions/schema-extensions.component';

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

  @Output() activeTabChange = new EventEmitter<string>();
  @Output() schemaUpdated = new EventEmitter<any>();
  @Output() deleteRow = new EventEmitter<any>();
  @Output() bookClick = new EventEmitter<{ event: Event; rowData: any }>();

  @ViewChild(SchemeTypeOverlayPanelComponent)
  childComponent!: SchemeTypeOverlayPanelComponent;

  @ViewChild(OverlayTextareaComponent)
  childComponentOverlayTextarea!: OverlayTextareaComponent;

  @ViewChild(AddSchemeButtonComponent)
  addSchemeButtonComponent!: AddSchemeButtonComponent;

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.activeTabChange.emit(tab);
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
    console.log('Swagger spec updated');
  }

  handleGoRefScheme(event: any): void {
    console.log('Go to reference scheme clicked:', event);
  }

  isSpecialType(value: any): boolean {
    return typeof value === 'string';
  }

  toggleChildOverlay(event: Event, rowData: any): void {
    console.log(rowData);

    this.selectedCol = this.findFieldInSchema(rowData, this.selectedSchema);

    console.log(this.findFieldInSchema(rowData, this.selectedSchema));
    console.log('Matched Schema Field (selectedCol):', this.selectedCol);

    this.childComponent.toggleOverlay(event, rowData, this.selectedCol);
  }

  onFieldBlur(value: any, _event: Event, rowData: any): void {
    console.log('Field blur event:', value, rowData);
  }

  onFieldEnter(value: any, _event: Event, rowData: any): void {
    console.log('Enter key pressed:', value, rowData);
  }

  getTypeStatus(type: any): boolean {
    return !!type;
  }

  onInfoClick(rowData: any): void {
    console.log('Info clicked:', rowData);
  }

  onBookClick(_event: Event, rowData: any): void {
    console.log('Book clicked:', rowData);
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

      // ✅ Emit event to notify parent
      this.deleteRow.emit(rowData);
    }
  }

  handleAddScheme(event: any, rowData: any): void {
    console.log('Add scheme clicked:', event, rowData);
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
      console.warn('❌ Missing schema or rowData:', { schema, rowData });
      return null;
    }
    console.log(this.nameOfId);
    console.log(rowData);
    console.log(schema[`x-${this.nameOfId}`].id);
    // ✅ Direct match by uniqueId
    if (
      rowData.uniqueId &&
      schema[`x-${this.nameOfId}`] &&
      schema[`x-${this.nameOfId}`].id === rowData.uniqueId
    ) {
      console.log('✅ Matched schema by uniqueId:', schema);
      return schema;
    }

    // ✅ Search in properties
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

    // ✅ Search in allOf, anyOf, oneOf
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

    // ✅ Search in additionalProperties
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

    // ✅ Search in array items
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

    // ✅ Resolve $ref schemas
    if (schema.$ref) {
      const refSchemaName = this.extractSchemaNameFromRef(schema.$ref);

      if (!resolvedRefs.has(refSchemaName)) {
        resolvedRefs.add(refSchemaName);
        const referencedSchema = this.getSchemaByRef(schema.$ref);

        if (!referencedSchema) {
          console.warn(`❌ Reference schema not found: ${schema.$ref}`);
          return null;
        }

        return this.findFieldInSchema(rowData, referencedSchema, resolvedRefs);
      }
    }

    console.warn('❌ Field not found in schema:', { rowData, schema });
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
