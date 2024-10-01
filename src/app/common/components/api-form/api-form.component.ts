import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ApiDataService } from '../../../services/api-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-api-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './api-form.component.html',
  styleUrl: './api-form.component.css',
})
export class ApiFormComponent implements OnInit {
  todoForm: FormGroup;
  swaggerSubscription!: Subscription;

  constructor(private fb: FormBuilder, private apiDataService: ApiDataService) {
    this.todoForm = this.fb.group({
      version: [''],
      consumes: [''],
      paths: [''], 
      security: [''],
    });
  }

  ngOnInit(): void {
    // Subscribe to the Swagger spec observable and update the form when data is available
    this.swaggerSubscription = this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec) => {
        if (swaggerSpec) {
          // Update the form fields with the Swagger spec data
          this.todoForm.patchValue({
            version: JSON.stringify(swaggerSpec.info.version, null, 2),
            consumes: JSON.stringify(swaggerSpec.consumes, null, 2),
            paths: JSON.stringify(swaggerSpec.paths, null, 2),
            security: JSON.stringify(swaggerSpec.responses, null, 2),
          });
        }
      },
      error: (error) => {
        console.error('Error fetching Swagger spec:', error);
      },
    });
  }

  onSubmit() {
    console.log(this.todoForm.value);
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
