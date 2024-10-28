import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-ref-button',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './ref-button.component.html',
  styleUrl: './ref-button.component.css',
})
export class RefButtonComponent {
  @Input() rowData: any;
  @Input() col: any;

  @Output() onGoRefSchemeClick = new EventEmitter<string>();

  goRefScheme(_event: Event) {
    const schemaName = this.rowData[this.col.field];
    this.onGoRefSchemeClick.emit(schemaName);
  }
}
