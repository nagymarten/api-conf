import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class ApiFormComponent implements OnInit, OnDestroy {
  todoForm: FormGroup;
  swaggerSubscription!: Subscription;

  constructor(private fb: FormBuilder, private apiDataService: ApiDataService) {
    this.todoForm = this.fb.group({
      openApiVersion: [''],
      version: [''],
      title: [''],
      models: [''],
      paths: [''],
      security: [''],
      servers: [''],
      schemes: [''],
    });
  }

  ngOnInit(): void {
    this.swaggerSubscription = this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec) => {
        if (swaggerSpec) {
          this.todoForm.patchValue({
            openApiVersion: this.apiDataService.getOpenApiVersion(),
            version: swaggerSpec.info?.version || '',
            title: swaggerSpec.info?.title || '',
            schemes: JSON.stringify(swaggerSpec.schemes || '', null, 2),
            paths: JSON.stringify(swaggerSpec.paths, null, 2),
            security: JSON.stringify(swaggerSpec.security || '', null, 2),
            servers: this.getServers(swaggerSpec), // Get servers
            models: this.getServers(swaggerSpec.schemes)
          });
        }
      },
      error: (error) => {
        console.error('Error fetching Swagger spec:', error);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }

  getServers(swaggerSpec: any): string {
    return JSON.stringify(this.apiDataService.getServers(), null, 2);
  }

  onSubmit() {
    console.log(this.todoForm.value);
  }
}
