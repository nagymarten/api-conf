import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as Swagger from 'swagger-schema-official';
import * as yaml from 'js-yaml';

@Injectable({
  providedIn: 'root',
})
export class ApiDataService {
  private swaggerSpecSubject = new BehaviorSubject<ExtendedSwaggerSpec | null>(
    null
  );
  swaggerSpec$: Observable<ExtendedSwaggerSpec | null> =
    this.swaggerSpecSubject.asObservable();

  constructor() {}

  parseSwaggerFile(file: File): void {
    const reader = new FileReader();

    reader.onload = (event: any) => {
      const fileContent = event.target.result;

      if (fileContent) {
        try {
          const swaggerSpec = yaml.load(fileContent) as ExtendedSwaggerSpec;
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

  getSwaggerSpec(): Observable<ExtendedSwaggerSpec | null> {
    return this.swaggerSpec$;
  }

  getOpenApiVersion(): string {
    const swaggerSpec = this.swaggerSpecSubject.getValue(); // Get the current value of the spec
    if (swaggerSpec?.openapi) {
      return swaggerSpec.openapi; // OpenAPI 3.x
    } else if (swaggerSpec?.swagger) {
      return swaggerSpec.swagger; // Swagger 2.0
    } else {
      return 'Unknown version';
    }
  }

  getServers(): Array<{ url: string; description?: string }> | string {
    const swaggerSpec = this.swaggerSpecSubject.getValue(); // Get the current value of the spec

    // Check if it's OpenAPI 3.x and has servers
    if (swaggerSpec?.openapi && (swaggerSpec as any).servers) {
      return (swaggerSpec as any).servers; // OpenAPI 3.x servers
    } else if (swaggerSpec?.swagger === '2.0') {
      // Swagger 2.0 doesn't have servers but uses host, basePath, and schemes
      const host = swaggerSpec.host || 'localhost';
      const basePath = swaggerSpec.basePath || '/';
      const schemes = swaggerSpec.schemes
        ? swaggerSpec.schemes.join(', ')
        : 'http';

      return `${schemes}://${host}${basePath}`;
    } else {
      return 'No servers found';
    }
  }
}

// Extend the Swagger Spec interface to support OpenAPI 3.x
interface ExtendedSwaggerSpec extends Swagger.Spec {
  openapi?: string; // For OpenAPI 3.x
  servers?: Array<{ url: string; description?: string }>; // For OpenAPI 3.x servers
}
