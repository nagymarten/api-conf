import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild } from '@angular/core';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ChipsModule } from 'primeng/chips';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

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
  ],
  templateUrl: './add-scheme-button.component.html',
  styleUrl: './add-scheme-button.component.css',
})
export class AddSchemeButtonComponent {
  @Input() rowData: any;
  @Input() col: any;

  @ViewChild('op') op!: OverlayPanel;
  members = [
    {
      name: 'Amy Elsner',
      image: 'amyelsner.png',
      email: 'amy@email.com',
      role: 'Owner',
    },
    {
      name: 'Bernardo Dominic',
      image: 'bernardodominic.png',
      email: 'bernardo@email.com',
      role: 'Editor',
    },
    {
      name: 'Ioni Bowcher',
      image: 'ionibowcher.png',
      email: 'ioni@email.com',
      role: 'Viewer',
    },
  ];
  showAddPropertyForm: boolean = false;

  testClick(event: Event) {
    console.log('Button clicked');
    this.op.toggle(event);
  }
}
