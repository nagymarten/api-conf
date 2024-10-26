import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { OverlayPanelModule } from 'primeng/overlaypanel';
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
  selector: 'app-add-scheme-button',
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
  templateUrl: './add-scheme-button.component.html',
  styleUrl: './add-scheme-button.component.css',
})
export class AddSchemeButtonComponent {
  @Input() rowData: any;
  @Input() col: any;
  @Input() apiSchemas: any;

  @Output() addScheme = new EventEmitter<Event>();

  responseExamples: MenuItem[] = [];
  activeItem!: MenuItem;
  types: Type[] | undefined;
  selectedType: Type | undefined;
  combineTypes: Type[] | undefined;

  showAddPropertyForm: boolean = false;
  scrollHeight!: string;
  selectedCombineType!: string;

  onAddSchemeClick(event: Event) {
    console.log('Button clicked');
    this.addScheme.emit(event);
  }
}
