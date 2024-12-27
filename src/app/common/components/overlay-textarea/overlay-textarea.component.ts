import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { FormsModule } from '@angular/forms';
import { EditorModule } from 'primeng/editor';

@Component({
  selector: 'app-overlay-textarea',
  standalone: true,
  imports: [CommonModule, OverlayPanelModule, FormsModule, EditorModule],
  templateUrl: './overlay-textarea.component.html',
  styleUrl: './overlay-textarea.component.css',
})
export class OverlayTextareaComponent {
  @Input() selectedSchema: any;

  @ViewChild('opTextarea') opTextarea!: OverlayPanel;

  text: string =
    '<div>Hello World!</div><div>PrimeNG <b>Editor</b> Rocks</div><div><br></div>';

  onOverlayHide(): void {
    console.log('Overlay hidden. Text content:', this.text);
  }

  toggleOverlay(event: Event, selectedRowData: any,selectedCol : any): void {
    console.log(this.selectedSchema);
    console.log(selectedRowData);
    console.log(selectedCol);

    this.opTextarea.toggle(event);
  }
}
