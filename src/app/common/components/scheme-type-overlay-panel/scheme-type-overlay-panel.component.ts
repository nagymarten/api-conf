import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  ViewChild,
  OnInit,
  Output,
  EventEmitter,
  ElementRef,
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
  @Input() selectedCol: any;
  @Input() apiSchemas: any;
  @Input() selectedSchema: any;
  @Input() selectedSchemaName: any;

  @ViewChild('op') op!: OverlayPanel;
  @ViewChild('scroller') scroller!: ElementRef;

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
  scrollHeight: string = '250px';
  selectedCombineType: Type | undefined;
  selectedRefSchema: string = '';
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
  apiSchemasS = Array.from({ length: 50 }, (_, i) => ({
    name: `Item ${i + 1}`,
  }));

  //Object
  minProperties: number | null = null;
  maxProperties: number | null = null;
  allowAdditionalProperties: boolean = false;
  deprecatedObject: boolean = false;
  isNullableObject: boolean = false;

  //String
  selectedStringFormat: Type | undefined;
  selectedStringBehavior: Type | undefined;
  defaultString: string = '';
  exampleString: string = '';
  stringPattern: string = '';
  stringMinLength: number | null = null;
  stringMaxLength: number | null = null;
  isStringDeprecated: boolean = false;
  isNullableString: boolean = false;

  //Integer
  selectedIntegerFormat: Type | undefined;
  selectedIntegerBehavior: Type | undefined;
  defaultInteger: string = '';
  exampleInteger: string = '';
  minimumInteger: number | null = null;
  maximumInteger: number | null = null;
  multipleOfInteger: number | null = null;
  exclusiveMinInteger: boolean = false;
  exclusiveMaxInteger: boolean = false;
  deprecatedInteger: boolean = false;
  isNullableInteger: boolean = false;

  //Number
  selectedNumberFormat: Type | undefined;
  selectedNumberBehavior: Type | undefined;
  defaultNumber: string = '';
  exampleNumber: string = '';
  minimumNumber: number | null = null;
  maximumNumber: number | null = null;
  multipleOfNumber: number | null = null;
  exclusiveMinNumber: boolean = false;
  exclusiveMaxNumber: boolean = false;
  deprecatedNumber: boolean = false;
  isNullableNumber: boolean = false;

  //Boolean
  selectedBooleanBehavior: Type | undefined;
  defaultBoolean: Type | undefined;
  deprecatedBoolean: boolean = false;
  isNullableBoolean: boolean = false;

  //Enum
  selectedEnumBehavior: Type | undefined;
  deprecatedEnum: boolean = false;
  enumDefault: string | null = null;
  enumExample: string | null = null;
  enumValue: string = '';
  enumValues: string[] = [];
  showEnumInput: boolean = false;

  //Array
  selectedArrayBehavior: Type | undefined;
  minArrayItems: number | null = null;
  maxArrayItems: number | null = null;
  uniqueArrayItems: boolean = false;
  deprecatedArray: boolean = false;
  arrayItems: any = null;
  isNullableArray: boolean = false;

  //Dictionary
  selectedDictionaryBehavior: Type | undefined;
  minDictionaryProperties: number | null = null;
  maxDictionaryProperties: number | null = null;
  deprecatedDictionary: boolean = false;

  minItems: number | null = null;
  maxItems: number | null = null;
  uniqueItems: boolean = false;

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

  numberFormats = [{ name: 'float' }, { name: 'double' }];

  booleanDefaults = [{ name: 'true' }, { name: 'false' }];

  constructor(private apiDataService: ApiDataService) {}

  ngOnInit() {}

  toggleEnumInput() {
    this.showEnumInput = !this.showEnumInput;
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

  toggleOverlay(event: Event, rowData: any, selectedCol: any) {
    const cleanString = (value: string) =>
      value
        .replace(/\{\d+\}/g, '')
        .replace(/\s*or\s+null\s*$/i, '')
        .replace(/<[^>]*>/g, '')
        .trim();

    const extractRootType = (value: string): string => {
      const match = value.match(/^(\w+)\[/);
      if (match) {
        return match[1].trim();
      }
      return value.split(' or ')[0].trim();
    };

    const cleanedValue = cleanString(rowData.type);
    const rootType = extractRootType(cleanedValue);

    const originalType = { name: rootType };
    this.selectedType = originalType;

    console.log('rowData', rowData);
    console.log('selected schema', selectedCol);

    if (selectedCol.properties) {
      this.minProperties = selectedCol.minProperties || null;
      this.maxProperties = selectedCol.maxProperties || null;
      this.allowAdditionalProperties =
        selectedCol.allowAdditionalProperties || false;
      this.deprecated = selectedCol.deprecated || false;
      this.isNullableObject = false;
    } else if (
      Array.isArray(selectedCol.type) &&
      selectedCol.type.includes('object') &&
      selectedCol.type.includes('null')
    ) {
      this.minProperties = selectedCol.minProperties || null;
      this.maxProperties = selectedCol.maxProperties || null;
      this.allowAdditionalProperties =
        selectedCol.allowAdditionalProperties || false;
      this.deprecated = selectedCol.deprecated || false;
      this.isNullableObject = true;
    }
    if (selectedCol.type === 'string') {
      this.selectedStringFormat = { name: selectedCol.format || null };
      if (selectedCol.writeOnly) {
        this.selectedStringBehavior = { name: 'WriteOnly' };
      } else if (selectedCol.readOnly) {
        this.selectedStringBehavior = { name: 'ReadOnly' };
      } else {
        this.selectedStringBehavior = { name: 'Read/Write' };
      }
      this.defaultString = selectedCol.default || '';
      this.exampleString = selectedCol.example || '';
      this.stringPattern = selectedCol.pattern || '';
      this.stringMinLength = selectedCol.minLength || null;
      this.stringMaxLength = selectedCol.maxLength || null;
      this.isStringDeprecated = selectedCol.deprecated || false;
      this.isNullableString = false;
    } else if (
      Array.isArray(selectedCol.type) &&
      selectedCol.type.includes('string') &&
      selectedCol.type.includes('null')
    ) {
      this.selectedStringFormat = { name: selectedCol.format || null };
      if (selectedCol.writeOnly) {
        this.selectedStringBehavior = { name: 'WriteOnly' };
      } else if (selectedCol.readOnly) {
        this.selectedStringBehavior = { name: 'ReadOnly' };
      } else {
        this.selectedStringBehavior = { name: 'Read/Write' };
      }
      this.defaultString = selectedCol.default || '';
      this.exampleString = selectedCol.example || '';
      this.stringPattern = selectedCol.pattern || '';
      this.stringMinLength = selectedCol.minLength || null;
      this.stringMaxLength = selectedCol.maxLength || null;
      this.isStringDeprecated = selectedCol.deprecated || false;
      this.isNullableString = true;
    }

    if (selectedCol.type === 'integer') {
      this.selectedIntegerFormat = { name: selectedCol.format || null };
      if (selectedCol.writeOnly) {
        this.selectedIntegerBehavior = { name: 'WriteOnly' };
      } else if (selectedCol.readOnly) {
        this.selectedIntegerBehavior = { name: 'ReadOnly' };
      } else {
        this.selectedIntegerBehavior = { name: 'Read/Write' };
      }
      this.defaultInteger = selectedCol.default || '';
      this.exampleInteger = selectedCol.example || '';
      this.minimumInteger =
        selectedCol.minimum || selectedCol.exclusiveMinimum || null;
      this.maximumInteger =
        selectedCol.maximum || selectedCol.exclusiveMaximum || null;
      this.multipleOfInteger = selectedCol.multipleOf || null;
      this.exclusiveMinInteger = !!selectedCol.exclusiveMinimum || false;
      this.exclusiveMaxInteger = !!selectedCol.exclusiveMaximum || false;
      this.deprecatedInteger = selectedCol.deprecated || false;
      this.isNullableInteger = false;
    } else if (
      Array.isArray(selectedCol.type) &&
      selectedCol.type.includes('integer') &&
      selectedCol.type.includes('null')
    ) {
      this.selectedIntegerFormat = { name: selectedCol.format || null };
      if (selectedCol.writeOnly) {
        this.selectedIntegerBehavior = { name: 'WriteOnly' };
      } else if (selectedCol.readOnly) {
        this.selectedIntegerBehavior = { name: 'ReadOnly' };
      } else {
        this.selectedIntegerBehavior = { name: 'Read/Write' };
      }
      this.defaultInteger = selectedCol.default || '';
      this.exampleInteger = selectedCol.example || '';
      this.minimumInteger =
        selectedCol.exclusiveMinimum || selectedCol.minimum || null;
      this.maximumInteger =
        selectedCol.exclusiveMaximum || selectedCol.maximum || null;
      this.multipleOfInteger = selectedCol.multipleOf || null;
      this.deprecatedInteger = selectedCol.deprecated || false;
      this.exclusiveMinInteger = !!selectedCol.exclusiveMinimum || false;
      this.exclusiveMaxInteger = !!selectedCol.exclusiveMaximum || false;
      this.isNullableInteger = true;
    }

    if (selectedCol.type === 'number') {
      this.selectedNumberFormat = { name: selectedCol.format || null };
      if (selectedCol.writeOnly) {
        this.selectedNumberBehavior = { name: 'WriteOnly' };
      } else if (selectedCol.readOnly) {
        this.selectedNumberBehavior = { name: 'ReadOnly' };
      } else {
        this.selectedNumberBehavior = { name: 'Read/Write' };
      }
      this.defaultNumber = selectedCol.default || '';
      this.exampleNumber = selectedCol.example || '';
      this.minimumNumber =
        selectedCol.minimum || selectedCol.exclusiveMinimum || null;
      this.maximumNumber =
        selectedCol.maximum || selectedCol.exclusiveMaximum || null;
      this.multipleOfNumber = selectedCol.multipleOf || null;
      this.exclusiveMinNumber = !!selectedCol.exclusiveMinimum || false;
      this.exclusiveMaxNumber = !!selectedCol.exclusiveMaximum || false;
      this.deprecatedNumber = selectedCol.deprecated || false;
      this.isNullableNumber = false;
    } else if (
      Array.isArray(selectedCol.type) &&
      selectedCol.type.includes('number') &&
      selectedCol.type.includes('null')
    ) {
      this.selectedNumberFormat = { name: selectedCol.format || null };
      if (selectedCol.writeOnly) {
        this.selectedNumberBehavior = { name: 'WriteOnly' };
      } else if (selectedCol.readOnly) {
        this.selectedNumberBehavior = { name: 'ReadOnly' };
      } else {
        this.selectedNumberBehavior = { name: 'Read/Write' };
      }
      this.defaultNumber = selectedCol.default || '';
      this.exampleNumber = selectedCol.example || '';
      this.minimumNumber =
        selectedCol.exclusiveMinimum || selectedCol.minimum || null;
      this.maximumNumber =
        selectedCol.exclusiveMaximum || selectedCol.maximum || null;
      this.multipleOfNumber = selectedCol.multipleOf || null;
      this.deprecatedNumber = selectedCol.deprecated || false;
      this.exclusiveMinNumber = !!selectedCol.exclusiveMinimum || false;
      this.exclusiveMaxNumber = !!selectedCol.exclusiveMaximum || false;
      this.isNullableNumber = true;
    }
    if (selectedCol.type === 'boolean') {
      if (selectedCol.writeOnly) {
        this.selectedBooleanBehavior = { name: 'WriteOnly' };
      } else if (selectedCol.readOnly) {
        this.selectedBooleanBehavior = { name: 'ReadOnly' };
      } else {
        this.selectedBooleanBehavior = { name: 'Read/Write' };
      }

      if (selectedCol.default) {
        console.log(selectedCol.default);
        this.defaultBoolean = { name: 'true' };
      } else if (!selectedCol.default) {
        console.log(selectedCol.default);
        this.defaultBoolean = { name: 'false' };
      } else {
        console.log(selectedCol.default);
        this.defaultBoolean = { name: '' };
      }

      this.deprecatedBoolean = selectedCol.deprecated || false;
      this.isNullableBoolean = false;
    } else if (
      Array.isArray(selectedCol.type) &&
      selectedCol.type.includes('boolean') &&
      selectedCol.type.includes('null')
    ) {
      if (selectedCol.writeOnly) {
        this.selectedBooleanBehavior = { name: 'WriteOnly' };
      } else if (selectedCol.readOnly) {
        this.selectedBooleanBehavior = { name: 'ReadOnly' };
      } else {
        this.selectedBooleanBehavior = { name: 'Read/Write' };
      }

      if (selectedCol.default) {
        console.log(selectedCol.default);
        this.defaultBoolean = { name: 'true' };
      } else if (!selectedCol.default) {
        console.log(selectedCol.default);
        this.defaultBoolean = { name: 'false' };
      } else {
        console.log(selectedCol.default);
        this.defaultBoolean = { name: '' };
      }

      this.deprecatedBoolean = selectedCol.deprecated || false;
      this.isNullableBoolean = true;
    }

    if (this.selectedSchema?.properties[rowData.name]?.enum) {
      const enumValue = this.selectedSchema.properties[rowData.name];

      this.enumValues = enumValue.enum;

      if (enumValue.writeOnly) {
        this.selectedEnumBehavior = { name: 'WriteOnly' };
      } else if (enumValue.readOnly) {
        this.selectedEnumBehavior = { name: 'ReadOnly' };
      } else {
        this.selectedEnumBehavior = { name: 'Read/Write' };
      }
      this.enumDefault = enumValue.default || '';
      this.enumExample = enumValue.example || '';
      this.deprecatedEnum = enumValue.deprecated || false;
    }
    if (this.selectedSchema?.properties[rowData.name].type === 'array') {
      const arrayValue = this.selectedSchema.properties[rowData.name];
      console.log(this.selectedSchema?.properties[rowData.name]);

      if (arrayValue.writeOnly) {
        this.selectedArrayBehavior = { name: 'WriteOnly' };
      } else if (arrayValue.readOnly) {
        this.selectedArrayBehavior = { name: 'ReadOnly' };
      } else {
        this.selectedArrayBehavior = { name: 'Read/Write' };
      }

      this.minArrayItems = arrayValue.minItems || null;
      this.maxArrayItems = arrayValue.maxItems || null;
      this.uniqueArrayItems = arrayValue.uniqueItems || false;
      this.deprecatedArray = arrayValue.deprecated || false;
      this.arrayItems = arrayValue.items || false;

      console.log('this.arrayItens in obj');
      console.log(this.arrayItems);
      this.isNullableArray = false;
    } else if (
      Array.isArray(this.selectedSchema?.properties[rowData.name]?.type) &&
      this.selectedSchema?.properties[rowData.name].type.includes('array') &&
      this.selectedSchema?.properties[rowData.name].type.includes('null')
    ) {
      const arrayValue = this.selectedSchema.properties[rowData.name];
      console.log(this.selectedSchema?.properties[rowData.name]);

      if (arrayValue.writeOnly) {
        this.selectedArrayBehavior = { name: 'WriteOnly' };
      } else if (arrayValue.readOnly) {
        this.selectedArrayBehavior = { name: 'ReadOnly' };
      } else {
        this.selectedArrayBehavior = { name: 'Read/Write' };
      }

      this.minArrayItems = arrayValue.minItems || null;
      this.maxArrayItems = arrayValue.maxItems || null;
      this.uniqueArrayItems = arrayValue.uniqueItems || false;
      this.deprecatedArray = arrayValue.deprecated || false;
      this.arrayItems = arrayValue.items || false;

      console.log('this.arrayItens in obj or null');
      console.log(this.arrayItems);
      this.isNullableArray = true;
    }
    if (this.selectedSchema?.properties[rowData.name].type === 'dictionary') {
      const dictionaryValue = this.selectedSchema.properties[rowData.name];
      console.log(this.selectedSchema?.properties[rowData.name]);

      console.log('dictionaryValue', dictionaryValue);
    }

    this.checkAndInitializeSelectedType();

    this.op.toggle(event);

    setTimeout(() => {
      this.op.align();
      this.scrollToSelected();
    }, 0);
  }

  checkAndInitializeSelectedType() {
    console.log(this.selectedType);
    if (!this.selectedType) {
      console.warn('No type selected.');
      return;
    }

    const selectedTypeName = this.selectedType.name;

    const isInCombineTypes = ['allOf', 'anyOf', 'oneOf'].includes(
      selectedTypeName
    );

    const isSpecialType = [
      'array',
      'boolean',
      'integer',
      'dictionary',
      'number',
      'string',
      'enum',
      'object',
    ].includes(selectedTypeName);

    const isInReferences = this.apiSchemas.some(
      (schema: any) => schema.name === selectedTypeName
    );

    if (isInCombineTypes) {
      this.activeItem = this.responseExamples[2];
      this.handleSpecialType(selectedTypeName);
    } else if (isSpecialType) {
      this.activeItem = this.responseExamples[0];
      this.selectedType.name = selectedTypeName;
    } else if (isInReferences) {
      const matchedSchema = this.apiSchemas.find(
        (schema: any) => schema.name === selectedTypeName
      );
      if (matchedSchema) {
        this.selectedRefSchema = selectedTypeName;
        console.log(`${selectedTypeName} found in references.`);
        this.initializeFromSchema(matchedSchema);
        this.activeItem = this.responseExamples[1];
        this.scrollToSelected();
      }
    } else {
      console.warn(
        `${selectedTypeName} is neither in combineTypes, references, nor a special type.`
      );
    }
  }

  scrollToSelected(): void {
    if (this.selectedRefSchema) {
      const selectedElement = document.getElementById(
        `item-${this.selectedRefSchema}`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  handleSpecialType(type: string) {
    switch (type) {
      case 'allOf':
        this.selectedCombineType = { name: 'AND' };

        break;
      case 'anyOf':
        this.selectedCombineType = { name: 'OR' };
        break;
      case 'oneOf':
        this.selectedCombineType = { name: 'XOR' };
        break;
      default:
        console.warn(`Unhandled special type: ${type}`);
        this.selectedCombineType = { name: '' };
    }
  }

  initializeFromSchema(schema: any) {
    console.log('Initializing from schema:', schema);

    this.minProperties = schema.minProperties || null;
    this.maxProperties = schema.maxProperties || null;
    this.allowAdditionalProperties = schema.allowAdditionalProperties || false;
    this.deprecated = schema.deprecated || false;
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
          if (value.name === 'WriteOnly') {
            integer.writeOnly = true;
            delete integer.readOnly;
          } else if (value.name === 'ReadOnly') {
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
          integer.multipleOf = value ? Number(value) : null;
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

  onBooleanFieldChange(field: string, value: any): void {
    if (this.selectedSchema && this.selectedSchema.properties) {
      const boolean = this.selectedSchema?.properties[this.rowData.name];

      if (!boolean) {
        console.warn('Property not found in selected schema.');
        return;
      }

      switch (field) {
        case 'selectedBooleanBehavior':
          if (value.name === 'WriteOnly') {
            boolean.writeOnly = true;
            delete boolean.readOnly;
          } else if (value.name === 'ReadOnly') {
            boolean.readOnly = true;
            delete boolean.writeOnly;
          } else {
            delete boolean.readOnly;
            delete boolean.writeOnly;
          }
          break;
        case 'defaultBoolean':
          console.log('Default Boolean:', value.name);

          if (typeof value.name === 'string') {
            if (value.name.toLowerCase() === 'true') {
              boolean.default = true;
            } else if (value.name.toLowerCase() === 'false') {
              boolean.default = false;
            } else {
              console.warn('Unexpected value for defaultBoolean:', value.name);
              boolean.default = null;
            }
          } else {
            boolean.default = !!value.name;
          }
          break;
        case 'isNullableBoolean':
          if (value) {
            if (Array.isArray(boolean.type)) {
              if (!boolean.type.includes('null')) {
                boolean.type.push('null');
              }
            } else if (typeof boolean.type === 'string') {
              boolean.type = [boolean.type, 'null'];
            } else {
              console.warn('Unexpected type, resetting to ["string", "null"]');
              boolean.type = ['string', 'null'];
            }
          } else {
            if (Array.isArray(boolean.type)) {
              boolean.type = boolean.type.filter((t: string) => t !== 'null');
              if (boolean.type.length === 1) {
                boolean.type = boolean.type[0];
              }
            } else if (typeof boolean.type === 'string') {
              console.log('Type is already not nullable');
            } else {
              console.warn('Unexpected type, resetting to "string"');
              boolean.type = 'string';
            }
          }

          break;
        case 'deprecatedBoolean':
          boolean.deprecated = !!value;
          break;

        default:
          console.warn(`Unhandled field: ${field}`);
      }
      console.log(this.selectedSchema);

      this.updateSwaggerSpec();
    }
  }

  onEnumFieldChange(field: string, value: any): void {
    if (this.selectedSchema && this.selectedSchema.properties) {
      const enumValue = this.selectedSchema?.properties[this.rowData.name];

      if (!enumValue) {
        console.warn('Property not found in selected schema.');
        return;
      }

      switch (field) {
        case 'selectedEnumBehavior':
          if (value.name === 'WriteOnly') {
            enumValue.writeOnly = true;
            delete enumValue.readOnly;
          } else if (value.name === 'ReadOnly') {
            enumValue.readOnly = true;
            delete enumValue.writeOnly;
          } else {
            delete enumValue.readOnly;
            delete enumValue.writeOnly;
          }
          break;
        case 'enumExample':
          if (value !== null) {
            enumValue.example = value;
            break;
          } else {
            delete enumValue.example;
            break;
          }
        case 'enumDefault':
          if (value !== null) {
            enumValue.default = value;
            break;
          } else {
            delete enumValue.default;
            break;
          }
        case 'deprecatedEnum':
          enumValue.deprecated = !!value;
          break;
        default:
          console.warn(`Unhandled field: ${field}`);
      }
      console.log(this.selectedSchema);

      this.updateSwaggerSpec();
    }
  }

  onNumberFieldBlur(field: string, event: any): void {
    const value = event.target?.value || event;
    this.onNumberFieldChange(field, value);
  }

  onNumberFieldChange(field: string, value: any): void {
    if (this.selectedSchema && this.selectedSchema.properties) {
      const number = this.selectedSchema?.properties[this.rowData.name];

      if (!number) {
        console.warn('Property not found in selected schema.');
        return;
      }

      switch (field) {
        case 'selectedNumberFormat':
          number.format = value.name || null;
          break;
        case 'selectedNumberBehavior':
          if (value.name === 'WriteOnly') {
            number.writeOnly = true;
            delete number.readOnly;
          } else if (value.name === 'ReadOnly') {
            number.readOnly = true;
            delete number.writeOnly;
          } else {
            delete number.readOnly;
            delete number.writeOnly;
          }
          break;
        case 'defaultNumber':
          number.default = value || '';
          break;
        case 'exampleNumber':
          number.example = value || '';
          break;
        case 'minimumNumber':
          if (number.minimum) {
            number.minimum = value ? Number(value) : null;
          } else if (number.exclusiveMinimum) {
            number.exclusiveMinimum = value ? Number(value) : null;
          }
          break;
        case 'maximumNumber':
          if (number.maximum) {
            number.minimum = value ? Number(value) : null;
          } else if (number.exclusiveMaximum) {
            number.exclusiveMaximum = value ? Number(value) : null;
          }
          break;
        case 'multipleOfNumber':
          number.multipleOf = value ? Number(value) : null;
          break;
        case 'exclusiveMinNumber':
          if (!!value === true && number.minimum) {
            number.exclusiveMinimum = number.minimum;
            delete number.minimum;
          } else if (!!value === false && number.exclusiveMinimum) {
            number.minimum = number.exclusiveMinimum;
            delete number.exclusiveMinimum;
          }
          break;

        case 'exclusiveMaxNumber':
          if (!!value === true && number.maximum) {
            number.exclusiveMaximum = number.maximum;
            delete number.maximum;
          } else if (!!value === false && number.exclusiveMaximum) {
            number.maximum = number.exclusiveMaximum;
            delete number.exclusiveMaximum;
          }
          break;

        case 'deprecatedNumber':
          number.deprecated = !!value;
          break;
        case 'isNullableNumber':
          if (value) {
            if (Array.isArray(number.type)) {
              if (!number.type.includes('null')) {
                number.type.push('null');
              }
            } else if (typeof number.type === 'string') {
              number.type = [number.type, 'null'];
            } else {
              console.warn('Unexpected type, resetting to ["string", "null"]');
              number.type = ['string', 'null'];
            }
          } else {
            if (Array.isArray(number.type)) {
              number.type = number.type.filter((t: string) => t !== 'null');
              if (number.type.length === 1) {
                number.type = number.type[0];
              }
            } else if (typeof number.type === 'string') {
              console.log('Type is already not nullable');
            } else {
              console.warn('Unexpected type, resetting to "string"');
              number.type = 'string';
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
    this.selectedRefSchema = scheme.name;
    this.scrollToSelected();
  }

  onCombineTypeChange() {
    console.log('Selected combine type:', this.selectedCombineType);
  }

  updateRowData(rowData: any) {
    rowData[this.selectedCol.field] =
      this.selectedType?.name || rowData[this.selectedCol.field];
  }

  onMarkAsExample(index: number) {
    console.log('onMarkAsExample');

    const value = this.enumValues[index];
    console.log('value', value);
    this.enumExample = this.enumExample === value ? null : value;
    console.log('enumex', this.enumExample);

    this.onEnumFieldChange('enumExample', this.enumExample || null);
  }

  onMarkAsDefault(index: number) {
    const value = this.enumValues[index];
    console.log('onMarkAsDefault');
    console.log('value', value);
    this.enumDefault = this.enumDefault === value ? null : value;
    console.log('enumdef', this.enumDefault);
    this.onEnumFieldChange('enumDefault', this.enumDefault || null);
  }
}
