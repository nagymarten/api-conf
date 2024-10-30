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
  ],
  templateUrl: './scheme-type-overlay-panel.component.html',
  styleUrl: './scheme-type-overlay-panel.component.css',
})
export class SchemeTypeOverlayPanelComponent implements OnInit {
  @Input() rowData: any;
  @Input() col: any;
  @Input() apiSchemas: any;

  @ViewChild('op') op!: OverlayPanel;
  @Output() updateRow = new EventEmitter<string>();

  responseExamples: MenuItem[] = [];
  activeItem!: MenuItem;
  types: Type[] | undefined;
  selectedType: Type | undefined;
  combineTypes: Type[] | undefined;

  showAddPropertyForm: boolean = false;
  scrollHeight!: string;
  selectedCombineType!: string;

  ngOnInit() {
    this.responseExamples = [
      { label: 'Type', icon: 'pi pi-fw pi-tag' },
      { label: 'Components', icon: 'pi pi-fw pi-cog' },
      { label: 'Combine Schemas', icon: 'pi pi-fw pi-th-large' },
    ];

    this.types = [
      { name: 'object' },
      { name: 'array' },
      { name: 'integer' },
      { name: 'number' },
      { name: 'string' },
      { name: 'boolean' },
      { name: 'enum' },
      { name: 'dictionary' },
    ];
    this.combineTypes = [{ name: 'AND' }, { name: 'XOR' }, { name: 'OR' }];

    this.activeItem = this.responseExamples[0];
    const itemHeight = 50;
    const maxHeight = 200;
    const calculatedHeight = this.apiSchemas.length * itemHeight;

    this.scrollHeight =
      calculatedHeight > maxHeight ? `${maxHeight}px` : `${calculatedHeight}px`;
  }

  toggleOverlay(event: Event, rowData: any, _col: any) {
    console.log('Row Data type:', rowData.type);
    this.op.toggle(event);
  }

  onTypeSelect() {
    console.log('Selected type:', this.selectedCombineType);
  }

  onSchemeSelect(scheme: any) {
    console.log('Selected scheme in overlay:', scheme);
  }

  onCombineTypeChange() {
    console.log('Selected combine type:', this.selectedCombineType);
  }

  updateRowData(scheme: any) {
    console.log('Update row data:', scheme);
    this.updateRow.emit(this.rowData);
  }
}
