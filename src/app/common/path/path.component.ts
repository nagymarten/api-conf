import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiDataService } from '../../services/api-data.service';
import { Subscription } from 'rxjs';
import { MatGridListModule } from '@angular/material/grid-list'; 
import { AgGridModule } from 'ag-grid-angular';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
@Component({
  selector: 'app-path',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AgGridModule,
    MatGridListModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
  ],
  templateUrl: './path.component.html',
  styleUrls: ['./path.component.css'],
})
export class PathComponent implements OnInit, OnDestroy {
  apiPaths: { [key: string]: any } = {};
  swaggerSubscription!: Subscription;
  apiForm: FormGroup; // Form for managing the editable data

  constructor(private apiDataService: ApiDataService, private fb: FormBuilder) {
    // Initialize the form
    this.apiForm = this.fb.group({
      paths: this.fb.array([]), // Form array to hold multiple API paths
    });
  }

  ngOnInit(): void {
    this.swaggerSubscription = this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec) => {
        if (swaggerSpec) {
          this.apiPaths = swaggerSpec.paths;
          this.buildForm(swaggerSpec); // Build form dynamically from Swagger spec
        }
      },
      error: (error) => {
        console.error('Error fetching Swagger spec:', error);
      },
    });
  }

  buildForm(swaggerSpec: any): void {
    const pathsArray = this.apiForm.get('paths') as FormArray;

    Object.keys(swaggerSpec.paths).forEach((pathKey) => {
      const methods = Object.keys(swaggerSpec.paths[pathKey]).map(
        (methodKey) => {
          return this.fb.group({
            method: [methodKey],
            summary: [swaggerSpec.paths[pathKey][methodKey].summary],
            description: [swaggerSpec.paths[pathKey][methodKey].description],
            parameters: this.buildParametersArray(
              swaggerSpec.paths[pathKey][methodKey].parameters || []
            ),
            requestBody: [
              swaggerSpec.paths[pathKey][methodKey].requestBody || null,
            ],
            responses: [
              JSON.stringify(
                swaggerSpec.paths[pathKey][methodKey].responses,
                null,
                2
              ),
            ],
          });
        }
      );
      pathsArray.push(
        this.fb.group({
          path: [pathKey],
          methods: this.fb.array(methods),
        })
      );
    });
  }

  // Build the parameters form array for each method
  buildParametersArray(parameters: any[]): FormArray {
    return this.fb.array(
      parameters.map((param) =>
        this.fb.group({
          name: [param.name],
          in: [param.in],
          description: [param.description],
          required: [param.required],
        })
      )
    );
  }

  onSubmit(): void {
    console.log(this.apiForm.value);
    // You can now send this data to the backend or process it further.
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }

  getMethods(pathGroup: AbstractControl): FormArray {
    return pathGroup.get('methods') as FormArray;
  }

  getParameters(methodGroup: AbstractControl): FormArray {
    return methodGroup.get('parameters') as FormArray;
  }

  get paths(): FormArray {
    return this.apiForm.get('paths') as FormArray;
  }
}
