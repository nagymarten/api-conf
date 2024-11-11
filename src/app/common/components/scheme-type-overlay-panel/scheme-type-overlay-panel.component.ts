import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  ViewChild,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ChipsModule } from 'primeng/chips';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TabMenuModule } from 'primeng/tabmenu';
import { MenuItem } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { ScrollerModule } from 'primeng/scroller';
import { InputSwitchModule } from 'primeng/inputswitch';
import { PanelModule } from 'primeng/panel';
import { EnumOverlayPanelComponent } from '../enum-overlay-panel/enum-overlay-panel.component';
import { SubSchemeTypeComponent } from '../sub-scheme-type/sub-scheme-type.component';
import { ApiDataService } from '../../../services/api-data.service';

interface Type {
  name: string;
}

@Component({
  selector: 'app-scheme-type-overlay-panel',
  standalone: true,
  imports: [
    CommonModule,
    OverlayPanelModule,
    InputGroupModule,
    InputGroupAddonModule,
    ChipsModule,
    InputTextModule,
    ButtonModule,
    TabMenuModule,
    DropdownModule,
    FormsModule,
    TooltipModule,
    DividerModule,
    ScrollerModule,
    InputSwitchModule,
    PanelModule,
    EnumOverlayPanelComponent,
    SubSchemeTypeComponent,
  ],
  templateUrl: './scheme-type-overlay-panel.component.html',
  styleUrl: './scheme-type-overlay-panel.component.css',
})
export class SchemeTypeOverlayPanelComponent implements OnInit {
  @Input() rowData: any;
  @Input() col: any;
  @Input() apiSchemas: any;
  @Input() selectedSchema: any;
  @Input() selectedSchemaName: any;

  @ViewChild('op') op!: OverlayPanel;
  @Output() updateRow = new EventEmitter<string>();
  @Output() schemaUpdated: EventEmitter<any> = new EventEmitter<any>();

  responseExamples: MenuItem[] = [
    { label: 'Type', icon: 'pi pi-fw pi-tag' },
    { label: 'Components', icon: 'pi pi-fw pi-cog' },
    { label: 'Combine Schemas', icon: 'pi pi-fw pi-th-large' },
  ];
  activeItem!: MenuItem;
  types: Type[] = [
    { name: 'object' },
    { name: 'array' },
    { name: 'integer' },
    { name: 'number' },
    { name: 'string' },
    { name: 'boolean' },
    { name: 'enum' },
    { name: 'dictionary' },
  ];
  selectedType: Type | undefined;
  intFormats: Type[] = [{ name: 'int32' }, { name: 'int64' }];
  selectedIntType: any;
  combineTypes: Type[] = [{ name: 'AND' }, { name: 'XOR' }, { name: 'OR' }];
  showAddPropertyForm: boolean = false;
  scrollHeight: string = '200px';
  selectedCombineType!: string;
  selectedBehavior: any;
  default: string = '';
  example: string = '';
  minimum: number | null = null;
  maximum: number | null = null;
  multipleOf: number | null = null;
  exclusiveMin: boolean = false;
  exclusiveMax: boolean = false;
  deprecated: boolean = false;
  allow_additional_properties: boolean = false;

  //Object
  minProperties: number | null = null;
  maxProperties: number | null = null;
  allowAdditionalProperties: boolean = false;
  deprecatedObject: boolean = false;

  //String
  selectedStringFormat: Type | undefined;
  selectedStringBehavior: Type | undefined;
  defaultString: string = '';
  exampleString: string = '';
  stringPattern: string = '';
  stringMinLength: number | null = null;
  stringMaxLength: number | null = null;
  isStringDeprecated: boolean = false;

  //Integer
  selectedIntegerFormat: Type | undefined;
  selectedIntegerBehavior: any;
  defaultInteger: string = '';
  exampleInteger: string = '';
  minimumInteger: number | null = null;
  maximumInteger: number | null = null;
  multipleOfInteger: number | null = null;
  exclusiveMinInteger: boolean = false;
  exclusiveMaxInteger: boolean = false;
  deprecatedInteger: boolean = false;
  isNullableInteger: boolean = false;

  selectedBehaviorArray: string = '';
  minItems: number | null = null;
  maxItems: number | null = null;
  uniqueItems: boolean = false;
  deprecatedArray: boolean = false;

  stringFormats: Type[] = [
    { name: 'None' },
    { name: 'byte' },
    { name: 'binary' },
    { name: 'date' },
    { name: 'date-time' },
    { name: 'password' },
    { name: 'email' },
    { name: 'time' },
    { name: 'duration' },
    { name: 'idn-email' },
    { name: 'hostname' },
    { name: 'idn-hostname' },
    { name: 'ipv4' },
    { name: 'ipv6' },
    { name: 'uri' },
    { name: 'uri-reference' },
    { name: 'uuid' },
    { name: 'uri-template' },
    { name: 'json-pointer' },
    { name: 'relative-json-pointer' },
    { name: 'regex' },
  ];

  behaviorOptions: Type[] = [
    { name: 'Read/Write' },
    { name: 'ReadOnly' },
    { name: 'WriteOnly' },
  ];

  selectedNumberFormat: string = '';
  selectedBehaviorNumber: string = '';
  defaultNumber: string = '';
  exampleNumber: string = '';
  minimumNumber: number | null = null;
  maximumNumber: number | null = null;
  multipleOfNumber: number | null = null;
  exclusiveMinNumber: boolean = false;
  exclusiveMaxNumber: boolean = false;
  deprecatedNumber: boolean = false;

  isNullableObject: boolean = false;
  isNullableString: boolean = false;

  numberFormats = [{ name: 'float' }, { name: 'double' }];

  defaultBoolean: string = '';

  booleanDefaults = [{ name: 'true' }, { name: 'false' }];

  enumValue: string = '';
  enumValues: string[] = [];
  showEnumInput: boolean = false;

  constructor(private apiDataService: ApiDataService) {}

  ngOnInit() {
    this.activeItem = this.responseExamples[0];
  }

  toggleEnumInput() {
    this.showEnumInput = !this.showEnumInput;
  }

  logData() {
    console.log('Selected Type:', this.selectedType);
    console.log('Min Properties:', this.minProperties);
    console.log('Max Properties:', this.maxProperties);
    console.log('Allow Additional Properties:', this.allowAdditionalProperties);
    console.log('Deprecated:', this.deprecated);
    console.log('Original Row Data:', this.rowData);
  }

  addEnumValue() {
    this.enumValues.push('');
  }

  removeEnumValue(index: number) {
    this.enumValues.splice(index, 1);
  }

  clearEnumValues() {
    this.enumValues = [];
    this.showEnumInput = false;
  }

  setRowData(rowData: any) {
    this.rowData = rowData;
  }

  setCol(col: any) {
    this.col = col;
  }

  toggleOverlay(event: Event, rowData: any, col: any) {
    // this.logData();

    const cleanString = (value: string) =>
      value
        .replace(/\{\d+\}/g, '')
        .replace(/\s*or\s+null\s*$/i, '')
        .replace(/<[^>]*>/g, '')
        .trim();

    const originalType = { name: cleanString(rowData[col.field]) };

    this.setRowData(rowData);
    this.setCol(col);
    if (!this.types.some((type) => type.name === originalType.name)) {
      this.types.unshift(originalType);
    }

    this.selectedType = originalType;

    if (this.selectedSchema?.type === 'object') {
      this.minProperties = this.selectedSchema.minProperties || null;
      this.maxProperties = this.selectedSchema.maxProperties || null;
      this.allowAdditionalProperties =
        this.selectedSchema.allowAdditionalProperties || false;
      this.deprecated = this.selectedSchema.deprecated || false;
      this.isNullableObject = false;
    } else if (
      Array.isArray(this.selectedSchema.type) &&
      this.selectedSchema.type.includes('object') &&
      this.selectedSchema.type.includes('null')
    ) {
      this.minProperties = this.selectedSchema.minProperties || null;
      this.maxProperties = this.selectedSchema.maxProperties || null;
      this.allowAdditionalProperties =
        this.selectedSchema.allowAdditionalProperties || false;
      this.deprecated = this.selectedSchema.deprecated || false;
      this.isNullableObject = true;
    }
    if (
      col.field === 'type' &&
      this.selectedSchema?.properties[rowData.name].type === 'string'
    ) {
      this.selectedStringFormat = {
        name: this.selectedSchema?.properties[rowData.name].format || null,
      };
      if (this.selectedSchema?.properties[rowData.name].writeOnly) {
        this.selectedStringBehavior = { name: 'WriteOnly' };
      } else if (this.selectedSchema?.properties[rowData.name].readOnly) {
        this.selectedStringBehavior = { name: 'ReadOnly' };
      } else {
        this.selectedStringBehavior = { name: 'Read/Write' };
      }
      this.defaultString =
        this.selectedSchema?.properties[rowData.name].default || '';
      this.exampleString =
        this.selectedSchema?.properties[rowData.name].example || '';
      this.stringPattern =
        this.selectedSchema?.properties[rowData.name].pattern || '';
      this.stringMinLength =
        this.selectedSchema?.properties[rowData.name].minLength || null;
      this.stringMaxLength =
        this.selectedSchema?.properties[rowData.name].maxLength || null;
      this.isStringDeprecated =
        this.selectedSchema?.properties[rowData.name].deprecated || false;
      this.isNullableString = false;
    } else if (
      col.field === 'type' &&
      Array.isArray(this.selectedSchema?.properties[rowData.name]?.type) &&
      this.selectedSchema?.properties[rowData.name].type.includes('string') &&
      this.selectedSchema?.properties[rowData.name].type.includes('null')
    ) {
      const property = this.selectedSchema.properties[rowData.name];

      this.selectedStringFormat = { name: property.format || null };

      if (property.writeOnly) {
        this.selectedStringBehavior = { name: 'WriteOnly' };
      } else if (property.readOnly) {
        this.selectedStringBehavior = { name: 'ReadOnly' };
      } else {
        this.selectedStringBehavior = { name: 'Read/Write' };
      }

      this.defaultString = property.default || '';
      this.exampleString = property.example || '';
      this.stringPattern = property.pattern || '';
      this.stringMinLength = property.minLength || null;
      this.stringMaxLength = property.maxLength || null;
      this.isStringDeprecated = property.deprecated || false;
      this.isNullableString = true;
    }
    if (
      col.field === 'type' &&
      this.selectedSchema?.properties[rowData.name].type === 'integer'
    ) {
      this.selectedIntegerFormat = {
        name: this.selectedSchema?.properties[rowData.name].format || null,
      };
      if (this.selectedSchema?.properties[rowData.name].writeOnly) {
        this.selectedIntegerBehavior = { name: 'WriteOnly' };
      } else if (this.selectedSchema?.properties[rowData.name].readOnly) {
        this.selectedIntegerBehavior = { name: 'ReadOnly' };
      } else {
        this.selectedIntegerBehavior = { name: 'Read/Write' };
      }
      this.defaultInteger =
        this.selectedSchema?.properties[rowData.name].default || '';
      this.exampleInteger =
        this.selectedSchema?.properties[rowData.name].example || '';
      this.minimumInteger =
        this.selectedSchema?.properties[rowData.name].minimum ||
        this.selectedSchema?.properties[rowData.name].exclusiveMinimum ||
        null;
      this.maximumInteger =
        this.selectedSchema?.properties[rowData.name].maximum ||
        this.selectedSchema?.properties[rowData.name].exclusiveMaximum ||
        null;
      this.multipleOfInteger =
        this.selectedSchema?.properties[rowData.name].multipleOf || null;
      this.exclusiveMinInteger =
        !!this.selectedSchema?.properties[rowData.name].exclusiveMinimum ||
        false;
      this.exclusiveMaxInteger =
        !!this.selectedSchema?.properties[rowData.name].exclusiveMaximum ||
        false;
      this.deprecatedInteger =
        this.selectedSchema?.properties[rowData.name].deprecated || false;
      this.isNullableInteger = false;
    } else if (
      col.field === 'type' &&
      Array.isArray(this.selectedSchema?.properties[rowData.name]?.type) &&
      this.selectedSchema?.properties[rowData.name].type.includes('integer') &&
      this.selectedSchema?.properties[rowData.name].type.includes('null')
    ) {
      const integer = this.selectedSchema.properties[rowData.name];

      this.selectedIntegerFormat = { name: integer.format || null };

      if (integer.writeOnly) {
        this.selectedIntegerBehavior = { name: 'WriteOnly' };
      } else if (integer.readOnly) {
        this.selectedIntegerBehavior = { name: 'ReadOnly' };
      } else {
        this.selectedIntegerBehavior = { name: 'Read/Write' };
      }

      this.defaultInteger = integer.default || '';
      this.exampleInteger = integer.example || '';
      this.minimumInteger = integer.exclusiveMinimum || integer.minimum || null;
      this.maximumInteger = integer.exclusiveMaximum || integer.maximum || null;
      this.multipleOfInteger = integer.multipleOf || null;
      this.deprecatedInteger = integer.deprecated || false;
      this.exclusiveMinInteger = !!integer.exclusiveMinimum || false;
      this.exclusiveMaxInteger = !!integer.exclusiveMaximum || false;
      this.isNullableInteger = true;
    }

    this.op.toggle(event);
  }

  onFieldBlur(field: string, event: any): void {
    const value = event.target?.value || event;
    this.onFieldChange(field, value);
  }

  onFieldChange(field: string, value: any) {
    if (this.selectedSchema) {
      switch (field) {
        case 'minProperties':
          this.selectedSchema.minProperties = value;
          break;
        case 'maxProperties':
          this.selectedSchema.maxProperties = value;
          break;
        case 'allowAdditionalProperties':
          this.selectedSchema.allowAdditionalProperties = value;
          break;
        case 'deprecated':
          this.selectedSchema.deprecated = value;
          break;
        case 'isNullableObject':
          if (value) {
            if (Array.isArray(this.selectedSchema.type)) {
              if (!this.selectedSchema.type.includes('null')) {
                this.selectedSchema.type.push('null');
              }
            } else if (typeof this.selectedSchema.type === 'string') {
              this.selectedSchema.type = [this.selectedSchema.type, 'null'];
            }
          } else {
            if (Array.isArray(this.selectedSchema.type)) {
              this.selectedSchema.type = this.selectedSchema.type.filter(
                (t: string) => t !== 'null'
              );
              if (this.selectedSchema.type.length === 1) {
                this.selectedSchema.type = this.selectedSchema.type[0];
              }
            }
          }
          console.log('Selected Schema:', this.selectedSchema.type);
          break;
        default:
          console.warn(`Unhandled field: ${field}`);
      }
    }

    this.updateSwaggerSpec();
  }

  onStringFieldBlur(field: string, event: any): void {
    const value = event.target?.value || event;
    this.onStringFieldChange(field, value);
  }

  onIntegerFieldBlur(field: string, event: any): void {
    const value = event.target?.value || event;
    this.onIntegerFieldChange(field, value);
  }

  onStringFormatSelect(field: string, event: any) {
    const value = event.target?.value || event;
    this.onStringFieldChange(field, value.name);
  }

  onBehaviorOptionsSelect(field: string, event: any) {
    const value = event.target?.value || event;
    this.onStringFieldChange(field, value.name);
  }

  onStringFieldChange(field: string, value: any): void {
    if (this.selectedSchema && this.selectedSchema.properties) {
      const string = this.selectedSchema?.properties[this.rowData.name];

      if (!string) {
        console.warn('Property not found in selected schema.');
        return;
      }

      switch (field) {
        case 'selectedStringFormat':
          string.format = value || null;
          break;
        case 'selectedStringBehavior':
          if (value === 'WriteOnly') {
            string.writeOnly = true;
            delete string.readOnly;
          } else if (value === 'ReadOnly') {
            string.readOnly = true;
            delete string.writeOnly;
          } else {
            delete string.readOnly;
            delete string.writeOnly;
          }
          break;
        case 'defaultString':
          string.default = value || '';
          break;
        case 'exampleString':
          string.example = value || '';
          break;
        case 'stringPattern':
          string.pattern = value || '';
          break;
        case 'stringMinLength':
          string.minLength = value ? Number(value) : null;
          break;
        case 'stringMaxLength':
          string.maxLength = value ? Number(value) : null;
          break;
        case 'isStringDeprecated':
          string.deprecated = !!value;
          break;
        case 'isNullableString':
          if (value) {
            if (Array.isArray(string.type)) {
              if (!string.type.includes('null')) {
                string.type.push('null');
              }
            } else if (typeof string.type === 'string') {
              string.type = [string.type, 'null'];
            } else {
              console.warn('Unexpected type, resetting to ["string", "null"]');
              string.type = ['string', 'null'];
            }
          } else {
            if (Array.isArray(string.type)) {
              string.type = string.type.filter((t: string) => t !== 'null');
              if (string.type.length === 1) {
                string.type = string.type[0];
              }
            } else if (typeof string.type === 'string') {
              console.log('Type is already not nullable');
            } else {
              console.warn('Unexpected type, resetting to "string"');
              string.type = 'string';
            }
          }

          break;

        default:
          console.warn(`Unhandled field: ${field}`);
      }

      this.updateSwaggerSpec();
    }
  }

  onIntegerFieldChange(field: string, value: any): void {
    if (this.selectedSchema && this.selectedSchema.properties) {
      const integer = this.selectedSchema?.properties[this.rowData.name];

      if (!integer) {
        console.warn('Property not found in selected schema.');
        return;
      }

      switch (field) {
        case 'selectedIntegerFormat':
          integer.format = value || null;
          break;
        case 'selectedIntegerBehavior':
          if (value === 'WriteOnly') {
            integer.writeOnly = true;
            delete integer.readOnly;
          } else if (value === 'ReadOnly') {
            integer.readOnly = true;
            delete integer.writeOnly;
          } else {
            delete integer.readOnly;
            delete integer.writeOnly;
          }
          break;
        case 'defaultInteger':
          integer.default = value || '';
          break;
        case 'exampleInteger':
          integer.example = value || '';
          break;
        case 'minimumInteger':
          console.log('Minimum Integer:', value);
          console.log(integer);
          if (integer.minimum) {
            integer.minimum = value ? Number(value) : null;
          } else if (integer.exclusiveMinimum) {
            integer.exclusiveMinimum = value ? Number(value) : null;
          }
          break;
        case 'maximumInteger':
          console.log('Max Integer:', value);
          console.log(integer);
          if (integer.maximum) {
            integer.minimum = value ? Number(value) : null;
          } else if (integer.exclusiveMaximum) {
            integer.exclusiveMaximum = value ? Number(value) : null;
          }
          break;
        case 'multipleOfInteger':
          integer.maxLength = value ? Number(value) : null;
          break;
        case 'exclusiveMinInteger':
          if (!!value === true && integer.minimum) {
            integer.exclusiveMinimum = integer.minimum;
            delete integer.minimum;
          } else if (!!value === false && integer.exclusiveMinimum) {
            integer.minimum = integer.exclusiveMinimum;
            delete integer.exclusiveMinimum;
          }
          break;

        case 'exclusiveMaxInteger':
          if (!!value === true && integer.maximum) {
            integer.exclusiveMaximum = integer.maximum;
            delete integer.maximum;
          } else if (!!value === false && integer.exclusiveMaximum) {
            integer.maximum = integer.exclusiveMaximum;
            delete integer.exclusiveMaximum;
          }
          break;

        case 'deprecatedInteger':
          integer.deprecated = !!value;
          break;
        case 'isNullableInteger':
          if (value) {
            if (Array.isArray(integer.type)) {
              if (!integer.type.includes('null')) {
                integer.type.push('null');
              }
            } else if (typeof integer.type === 'string') {
              integer.type = [integer.type, 'null'];
            } else {
              console.warn('Unexpected type, resetting to ["string", "null"]');
              integer.type = ['string', 'null'];
            }
          } else {
            if (Array.isArray(integer.type)) {
              integer.type = integer.type.filter((t: string) => t !== 'null');
              if (integer.type.length === 1) {
                integer.type = integer.type[0];
              }
            } else if (typeof integer.type === 'string') {
              console.log('Type is already not nullable');
            } else {
              console.warn('Unexpected type, resetting to "string"');
              integer.type = 'string';
            }
          }

          break;

        default:
          console.warn(`Unhandled field: ${field}`);
      }
      console.log(this.selectedSchema);

      this.updateSwaggerSpec();
    }
  }

  updateSwaggerSpec(): void {
    this.apiDataService.getSwaggerSpec().subscribe(
      (swaggerSpec: any) => {
        if (swaggerSpec && swaggerSpec.components.schemas) {
          swaggerSpec.components.schemas[this.selectedSchemaName] =
            this.selectedSchema;
          this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);
        }
      },
      (error: any) => {
        console.error('Error fetching Swagger spec:', error);
      }
    );
  }

  onOverlayHide(): void {
    if (this.selectedSchema) {
      this.schemaUpdated.emit(this.selectedSchema);
    }
  }

  onTypeSelect() {
    this.updateRowData(this.rowData);
  }

  onSchemeSelect(scheme: any) {
    console.log('Selected scheme in overlay:', scheme);
  }

  onCombineTypeChange() {
    console.log('Selected combine type:', this.selectedCombineType);
  }

  updateRowData(rowData: any) {
    rowData[this.col.field] =
      this.selectedType?.name || rowData[this.col.field];
    this.updateRow.emit(rowData);
  }

  onMarkAsExample(index: number) {
    console.log(
      `Marking value at index ${index} as example: ${this.enumValues[index]}`
    );
    // TODO: Add logic for marking the value as an example
  }

  onMarkAsDefault(index: number) {
    console.log(
      `Marking value at index ${index} as default: ${this.enumValues[index]}`
    );
    // TODO: Add logic for marking the value as default
  }
}
