import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild, OnInit } from '@angular/core';
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
export class AddSchemeButtonComponent implements OnInit {
  @Input() rowData: any;
  @Input() col: any;
  @Input() apiSchemas: any;

  @ViewChild('op') op!: OverlayPanel;

  responseExamples: MenuItem[] = [];
  activeItem!: MenuItem;
  types: Type[] | undefined;
  selectedType: Type | undefined;

  showAddPropertyForm: boolean = false;
  scrollHeight!: string;

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
    this.activeItem = this.responseExamples[0];
    const itemHeight = 50;
    const maxHeight = 200; // max scrollable height
    const calculatedHeight = this.apiSchemas.length * itemHeight;

    this.scrollHeight =
      calculatedHeight > maxHeight ? `${maxHeight}px` : `${calculatedHeight}px`;
  }

  testClick(event: Event) {
    console.log('Button clicked');
    this.op.toggle(event);
    console.log(this.apiSchemas);
  }
  onSchemeSelect(scheme: any) {
    console.log('Item clicked:', scheme);

  }
}
