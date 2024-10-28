import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { TabMenuModule } from 'primeng/tabmenu';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'app-schema-examples',
  standalone: true,
  imports: [
    CommonModule,
    TabMenuModule,
    InputTextareaModule,
    ReactiveFormsModule,
  ],
  templateUrl: './schema-examples.component.html',
  styleUrls: ['./schema-examples.component.css'],
})
export class SchemaExamplesComponent implements OnInit {
  @Input() selectedSchema: any;
  @Output() exampleChanged = new EventEmitter<string>();

  responseExamples: MenuItem[] = [];
  activeItem!: MenuItem;
  examplesControl = new FormControl('');
  currentIndex: number = 0; // Track the currently selected example index

  ngOnInit(): void {
    this.initializeExamples();
  }

  initializeExamples(): void {
    if (this.selectedSchema?.examples && this.selectedSchema.examples.length) {
      this.responseExamples = this.selectedSchema.examples.map(
        (_example: any, index: number) => ({
          label: `Example ${index + 1}`,
          command: () => this.onExampleSelect(index),
        })
      );

      this.activeItem = this.responseExamples[0];
      this.setExampleValue(0);
    } else {
      this.responseExamples = [];
      this.examplesControl.setValue('');
    }
  }

  onExampleSelect(index: number): void {
    this.saveCurrentExample(); // Save the current example before switching
    this.currentIndex = index; // Update the current index
    this.setExampleValue(index); // Load the new example
  }

  setExampleValue(index: number): void {
    const exampleData = this.selectedSchema.examples[index];
    if (exampleData) {
      const exampleJSON = JSON.stringify(exampleData, null, 2);
      this.examplesControl.setValue(exampleJSON);
      this.exampleChanged.emit(exampleJSON);
    }
  }

  saveCurrentExample(): void {
    try {
      // Parse the JSON content of the textarea
      const updatedExample = JSON.parse(this.examplesControl.value || '{}');
      // Update the current example in selectedSchema.examples
      this.selectedSchema.examples[this.currentIndex] = updatedExample;
    } catch (error) {
      console.error('Invalid JSON format:', error);
    }
  }
}
  