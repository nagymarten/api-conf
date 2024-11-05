import { CommonModule } from '@angular/common';
import {
  Component,
} from '@angular/core';
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

interface Type {
  name: string;
}

@Component({
  selector: 'app-sub-scheme-type',
  standalone: true,
  imports: [
    CommonModule,
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
  ],
  templateUrl: './sub-scheme-type.component.html',
  styleUrl: './sub-scheme-type.component.css',
})
export class SubSchemeTypeComponent {
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
  scrollHeight!: string;
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

  booleanDefaults = [{ name: 'true' }, { name: 'false' }];

  enumValue: string = ''; // Temporarily holds the value to be added to the enum list
  enumValues: string[] = []; // Holds all enum values
  showEnumInput: boolean = false;
  optionsMenu: any;
  apiSchemas: any[] | null | undefined;

  ngOnInit() {
    this.activeItem = this.responseExamples[0];
  }

  toggleEnumInput() {
    this.showEnumInput = !this.showEnumInput;
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

  markAsExample(index: number) {
    console.log(
      `Marking value at index ${index} as example: ${this.enumValues[index]}`
    );
    // Add your logic to handle marking as example
  }

  // Mark as default for the specific index
  markAsDefault(index: number) {
    console.log(
      `Marking value at index ${index} as default: ${this.enumValues[index]}`
    );
    // Add your logic to handle marking as default
  }

  onSchemeSelect(scheme: any) {
    console.log('Selected scheme in overlay:', scheme);
  }

  onCombineTypeChange() {
    console.log('Selected combine type:', this.selectedCombineType);
  }

  onMarkAsExample(index: number) {
    console.log(
      `Marking value at index ${index} as example: ${this.enumValues[index]}`
    );
    // Add logic for marking the value as an example
  }

  onMarkAsDefault(index: number) {
    console.log(
      `Marking value at index ${index} as default: ${this.enumValues[index]}`
    );
    // Add logic for marking the value as default
  }
}
