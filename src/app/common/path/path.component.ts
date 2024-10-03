import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiDataService } from '../../services/api-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-path',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './path.component.html',
  styleUrls: ['./path.component.css'],
})
export class PathComponent implements OnInit, OnDestroy {
  apiPaths: { [key: string]: any } = {};
  formattedPaths: string = '';
  swaggerSubscription!: Subscription;

  constructor(private apiDataService: ApiDataService) {}

  ngOnInit(): void {
    this.swaggerSubscription = this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec) => {
        if (swaggerSpec) {
          this.apiPaths = swaggerSpec.paths;
          this.formatPaths(swaggerSpec);
        }
      },
      error: (error) => {
        console.error('Error fetching Swagger spec:', error);
      },
    });
  }

  formatPaths(swaggerSpec: any): void {
    this.formattedPaths = JSON.stringify(swaggerSpec.paths, null, 2);
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
