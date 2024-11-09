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
  selectedFormat: any;
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

  minProperties: number | null = null;
  maxProperties: number | null = null;
  allowAdditionalProperties: boolean = false;
  deprecatedObject: boolean = false;

  selectedStringFormat: string = '';
  selectedStringBehavior: string = '';
  defaultString: string = '';
  exampleString: string = '';
  pattern: string = '';
  minLength: number | null = null;
  maxLength: number | null = null;
  deprecatedString: boolean = false;

  selectedBehaviorArray: string = '';
  minItems: number | null = null;
  maxItems: number | null = null;
  uniqueItems: boolean = false;
  deprecatedArray: boolean = false;

  stringFormats = [
    { name: 'None' },
    { name: 'byte' },
    { name: 'binary' },
    { name: 'date' },
    { name: 'date-time' },
    { name: 'password' },
    { name: 'email' },
  ];

  behaviorOptions = [
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

  numberFormats = [{ name: 'float' }, { name: 'double' }];

  defaultBoolean: string = '';

  // Options for the Default dropdown for boolean values
  booleanDefaults = [{ name: 'true' }, { name: 'false' }];

  enumValue: string = '';
  enumValues: string[] = [];
  showEnumInput: boolean = false;

  constructor(private apiDataService: ApiDataService) {}

  ngOnInit() {
    this.activeItem = this.responseExamples[0];
    // this.logData();
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
    this.enumValues.push(''); // Add an empty string to create a new input
  }

  // Removes an input field from the enumValues array by index
  removeEnumValue(index: number) {
    this.enumValues.splice(index, 1);
  }

  // Clears all enum values
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
    const cleanString = (value: string) => value.replace(/\{\d+\}/, '').trim();
    const originalType = { name: cleanString(rowData[col.field]) };

    // this.setRowData(rowData);
    // this.setCol(col);
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
    }

    this.op.toggle(event);
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
        default:
          console.warn(`Unhandled field: ${field}`);
      }
    }


    this.apiDataService.getSwaggerSpec().subscribe((swaggerSpec: any) => {
      if (swaggerSpec && swaggerSpec.components.schemas) {
        swaggerSpec.components.schemas[this.selectedSchemaName] =
          this.selectedSchema;

        this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);

      } else {
        console.error('No schemas found in the Swagger spec.');
      }
    });
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
