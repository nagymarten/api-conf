import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-enum-overlay-panel',
  standalone: true,
  imports: [OverlayPanelModule, CommonModule],
  templateUrl: './enum-overlay-panel.component.html',
  styleUrl: './enum-overlay-panel.component.css',
})
export class EnumOverlayPanelComponent {
  @ViewChild('optionsMenu') optionsMenu!: OverlayPanel;

  @Output() markAsExample = new EventEmitter<number>();
  @Output() markAsDefault = new EventEmitter<number>();

  @Input() index!: number;
  @Input() markedAsExample!: string | null; // The currently marked "example" value
  @Input() markedAsDefault!: string | null; // The currently marked "default" value
  @Input() value!: string; // The current enum value being passed in

  open(event: Event) {
    this.optionsMenu.toggle(event);
  }

  selectOption(option: 'example' | 'default') {
    if (option === 'example') {
      this.markAsExample.emit(this.index);
    } else if (option === 'default') {
      this.markAsDefault.emit(this.index);
    }
  }

  isMarked(option: 'example' | 'default'): boolean {
    if (option === 'example') {
      return this.markedAsExample === this.value;
    }
    if (option === 'default') {
      return this.markedAsDefault === this.value;
    }
    return false;
  }
}
