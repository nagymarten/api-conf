import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiDataService } from '../../services/api-data.service';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list'; // Import MatListModule for list items
import { MatIconModule } from '@angular/material/icon'; // Import MatIconModule for icons

@Component({
  selector: 'app-models',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCheckboxModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatListModule,
    MatIconModule
  ],
  templateUrl: './models.component.html',
  styleUrl: './models.component.css',
})
export class ModelsComponent implements OnInit, OnDestroy {
  apiModels: any[] = []; // Models like Permission, DeviceTypes
  swaggerSubscription!: Subscription;

  constructor(private apiDataService: ApiDataService) {}

  ngOnInit(): void {
    // Fetch Swagger spec
    this.swaggerSubscription = this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec) => {
        if (swaggerSpec) {
          this.apiModels = this.getModelsFromSwagger(swaggerSpec); // Extract models dynamically
        }
      },
      error: (error) => {
        console.error('Error fetching Swagger spec:', error);
      },
    });
  }

  getModelsFromSwagger(swaggerSpec: any): any[] {
    return Object.keys(swaggerSpec.components.schemas).map((key) => ({
      name: key,
    }));
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
