import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as Swagger from 'swagger-schema-official';
import * as yaml from 'js-yaml';

@Injectable({
  providedIn: 'root',
})
export class ApiDataService {
  private swaggerSpecSubject = new BehaviorSubject<Swagger.Spec | null>(null);
  swaggerSpec$: Observable<Swagger.Spec | null> =
    this.swaggerSpecSubject.asObservable();

  constructor() {}

  parseSwaggerFile(file: File): void {
    const reader = new FileReader();

    reader.onload = (event: any) => {
      const fileContent = event.target.result;

      if (fileContent) {
        try {
          const swaggerSpec = yaml.load(fileContent) as Swagger.Spec;
          this.swaggerSpecSubject.next(swaggerSpec); // Emit the parsed data
        } catch (error) {
          console.error('Error parsing the file as YAML:', error);
          this.swaggerSpecSubject.error(error);
        }
      } else {
        console.error('File content is null or empty');
        this.swaggerSpecSubject.error('File content is null or empty');
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      this.swaggerSpecSubject.error(error);
    };

    reader.readAsText(file);
  }

  getSwaggerSpec(): Observable<Swagger.Spec | null> {
    return this.swaggerSpec$;
  }
}
