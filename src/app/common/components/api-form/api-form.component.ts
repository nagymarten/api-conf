import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-api-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './api-form.component.html',
  styleUrl: './api-form.component.css',
})
export class ApiFormComponent {
  todoForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.todoForm = this.fb.group({
      title: [''], // For the title of the to-do item
      description: [''], // For the description field
      id: [''], // ID field (used for /todos/{id} endpoint)
      serverUrl: ['http://localhost:3000'], // Server URL from the Swagger spec
    });
  }

  onSubmit() {
    console.log(this.todoForm.value);
  }
}
