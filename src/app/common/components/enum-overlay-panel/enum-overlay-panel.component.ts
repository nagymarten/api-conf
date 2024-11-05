import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';

@Component({
  selector: 'app-enum-overlay-panel',
  standalone: true,
  imports: [OverlayPanelModule],
  templateUrl: './enum-overlay-panel.component.html',
  styleUrl: './enum-overlay-panel.component.css',
})
export class EnumOverlayPanelComponent {
  @ViewChild('optionsMenu') optionsMenu!: OverlayPanel;
  @Output() markAsExample = new EventEmitter<number>();
  @Output() markAsDefault = new EventEmitter<number>();

  @Input() index!: number;

  open(event: Event) {
    this.optionsMenu.toggle(event);
  }

  selectOption(option: 'example' | 'default', index: number) {
    if (option === 'example') {
      this.markAsExample.emit(index);
    } else {
      this.markAsDefault.emit(index);
    }
  }
}
