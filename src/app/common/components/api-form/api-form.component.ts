import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ApiDataService } from '../../../services/api-data.service';
import { Subscription } from 'rxjs';
import * as yaml from 'js-yaml'; 


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
            servers: this.getServers(swaggerSpec),
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
    const formData = this.todoForm.value;
    console.log(formData);

      const safeParse = (data: string) => {
        try {
          return JSON.parse(data);
        } catch (e) {
          return {}; // Return an empty object if parsing fails
        }
      };

    const yamlData = yaml.dump({
      openapi: formData.openApiVersion,
      info: {
        version: formData.version,
        title: formData.title,
      },
      servers: safeParse(formData.servers), // Safely parse servers
      schemes: safeParse(formData.schemes), // Safely parse schemes
      paths: safeParse(formData.paths), // Safely parse paths
      security: safeParse(formData.security), // Safely parse security
      models: safeParse(formData.models), // Safely parse models
    });

    const blob = new Blob([yamlData], { type: 'text/yaml' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'api-spec.yml';
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
