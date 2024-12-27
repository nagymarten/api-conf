import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem, MessageService } from 'primeng/api';
import { TabMenuModule } from 'primeng/tabmenu';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Clipboard } from '@angular/cdk/clipboard';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-schema-extensions',
  standalone: true,
  imports: [
    CommonModule,
    TabMenuModule,
    InputTextareaModule,
    ReactiveFormsModule,
    ButtonModule,
    ToastModule,
    RippleModule,
  ],
  providers: [MessageService],
  templateUrl: './schema-extensions.component.html',
  styleUrl: './schema-extensions.component.css',
})
export class SchemaExtensionsComponent implements OnInit {
  @Input() selectedSchema: any;
  @Input() nameOfId: string | undefined;
  @Output() extensionChanged = new EventEmitter<string>();

  extensions: MenuItem[] = [];
  activeItem!: MenuItem;
  extensionsControl = new FormControl('');
  currentIndex: number = 0;

  constructor(
    private clipboard: Clipboard,
    private toastMessageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initializeExtensions();
  }

  initializeExtensions(): void {
    if (!this.selectedSchema) {
      console.warn('No selected schema found.');
      return;
    }

    const extensions = Object.keys(this.selectedSchema)
      .filter((key) => key.startsWith('x-') && key !== `x-${this.nameOfId}`)
      .map((key) => ({ key, value: this.selectedSchema[key] }));

    this.extensions = extensions.map((extension, index) => ({
      label: `${extension.key}`,
      command: () => this.onExtensionSelect(index),
    }));

    if (this.extensions.length > 0) {
      this.activeItem = this.extensions[0];
      this.currentIndex = 0;
      this.setExtensionValue(this.currentIndex);
    }
  }

  onExtensionSelect(index: number): void {
    this.currentIndex = index;
    this.setExtensionValue(index);
  }

  setExtensionValue(index: number): void {
    const selectedExtension = this.extensions[index];
    if (selectedExtension) {
      const extensionValue = selectedExtension?.label
        ? this.selectedSchema[selectedExtension.label]
        : undefined;

      let extensionString = '';

      if (typeof extensionValue === 'object' && extensionValue !== null) {
        if (
          Object.keys(extensionValue).length === 1 &&
          'id' in extensionValue
        ) {
          extensionString = `id: '${extensionValue['id']}'`;
        } else {
          extensionString = JSON.stringify(extensionValue, null, 2);
        }
      } else if (typeof extensionValue === 'string') {
        extensionString = extensionValue.trim();
      } else {
        extensionString = String(extensionValue);
      }

      this.extensionsControl.setValue(extensionString);
      this.extensionChanged.emit(extensionString);
    }
  }

  saveCurrentExample(): void {
    try {
      const updatedValue = this.extensionsControl.value?.trim();
      const selectedExtensionKey = this.extensions[this.currentIndex]?.label;

      if (selectedExtensionKey && updatedValue !== undefined) {
        this.selectedSchema[selectedExtensionKey] = updatedValue;
      } else {
        console.warn('No selected extension key or value is undefined.');
      }
    } catch (error) {
      console.error('Error while saving extension:', error);
    }
  }

  generateAndAddExtension(): void {
    if (!this.selectedSchema) {
      console.error('No schema selected to add an extension.');
      return;
    }

    const extensionKey = `x-custom-extension-${Date.now()}`;

    this.selectedSchema[extensionKey] = '';

    this.initializeExtensions();

    this.currentIndex = this.extensions.findIndex(
      (item) => item.label === extensionKey
    );

    if (this.currentIndex !== -1) {
      this.activeItem = this.extensions[this.currentIndex];
      this.setExtensionValue(this.currentIndex);
    }
  }

  copyExample(): void {
    const extensionText = this.extensionsControl.value;
    if (extensionText) {
      this.clipboard.copy(extensionText);
      this.toastMessageService.add({
        severity: 'info',
        summary: 'Copied',
        detail: 'Extension copied to clipboard',
      });
    }
  }

  deleteExtension(): void {
    if (!this.selectedSchema || this.currentIndex === -1) {
      console.warn('No schema or extension selected for deletion.');
      return;
    }

    const selectedExtensionKey = this.extensions[this.currentIndex]?.label;

    console.log('Selected key to delete:', selectedExtensionKey);
    console.log('Schema before deletion:', this.selectedSchema);

    if (selectedExtensionKey && selectedExtensionKey in this.selectedSchema) {
      delete this.selectedSchema[selectedExtensionKey];
      console.log(`Deleted extension: ${selectedExtensionKey}`);

      this.initializeExtensions();

      if (this.extensions.length > 0) {
        this.currentIndex = 0;
        this.activeItem = this.extensions[0];
        this.setExtensionValue(this.currentIndex);
      } else {
        this.currentIndex = -1;
        this.activeItem = {} as MenuItem;
        this.extensionsControl.setValue('');
      }
    } else {
      console.warn('Selected extension key not found in the schema.');
    }

    console.log('Schema after deletion:', this.selectedSchema);
  }
}
