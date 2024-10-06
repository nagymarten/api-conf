import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiDataService } from '../../../services/api-data.service';
import { ExtendedSwaggerSpec, Paths } from '../../../models/swagger.types'; // Import the types


@Component({
  selector: 'app-api-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './api-detail.component.html',
  styleUrls: ['./api-detail.component.css'],
})
export class ApiDetailComponent implements OnInit {
  apiPath: string = '';
  method: string = '';
  methodDetails: any = {};

  constructor(
    private route: ActivatedRoute,
    private apiDataService: ApiDataService
  ) {}

  ngOnInit(): void {
    // Get the path and method from the route parameters
    this.route.params.subscribe((params) => {
      this.apiPath = params['path'];
      this.method = params['method'];
      this.fetchMethodDetails();
    });
  }

  fetchMethodDetails(): void {
    this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec: ExtendedSwaggerSpec | null) => {
        if (swaggerSpec) {
          const apiPathObject = swaggerSpec.paths[this.apiPath as keyof Paths];

          if (
            apiPathObject &&
            apiPathObject[
              this.method.toLowerCase() as keyof typeof apiPathObject
            ]
          ) {
            this.methodDetails =
              apiPathObject[
                this.method.toLowerCase() as keyof typeof apiPathObject
              ];
          } else {
            console.error(
              `Method not found for path: ${this.apiPath} and method: ${this.method}`
            );
          }
        } else {
          console.error('Received null Swagger spec');
        }
      },
      error: (error) => {
        console.error('Error fetching Swagger spec:', error);
      },
    });
  }
}
