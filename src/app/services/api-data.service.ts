import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as Swagger from 'swagger-schema-official';
import * as yaml from 'js-yaml';
import { Parameter, Schema, Security } from 'swagger-schema-official';

@Injectable({
  providedIn: 'root',
})
export class ApiDataService {
  private swaggerSpecSubject = new BehaviorSubject<ExtendedSwaggerSpec | null>(
    this.getSwaggerSpecFromStorage()
  );
  swaggerSpec$: Observable<ExtendedSwaggerSpec | null> =
    this.swaggerSpecSubject.asObservable();

  private openApiVersion: string = '';
  private version: string = '';
  private title: string = '';
  private schemes: string = '';
  private paths: string = '';
  private security: string = '';
  // private servers: string = '';
  private responses: string = '';

  constructor() {}

  parseSwaggerFile(file: File): void {
    const reader = new FileReader();

    reader.onload = (event: any) => {
      const fileContent = event.target.result;

      if (fileContent) {
        try {
          const swaggerSpec = yaml.load(fileContent) as ExtendedSwaggerSpec;
          this.swaggerSpecSubject.next(swaggerSpec);
          this.setApiData(swaggerSpec);
          this.saveSwaggerSpecToStorage(swaggerSpec);
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

  setApiData(swaggerSpec: ExtendedSwaggerSpec): void {
    this.openApiVersion =
      swaggerSpec.openapi || swaggerSpec.swagger || 'Unknown version';
    this.version = swaggerSpec.info?.version || '';
    this.title = swaggerSpec.info?.title || '';
    this.schemes = JSON.stringify(swaggerSpec.schemes || '', null, 2);
    this.paths = JSON.stringify(swaggerSpec.paths, null, 2);
    this.security = JSON.stringify(swaggerSpec.security || '', null, 2);
    // this.servers = this.getServers();
    this.responses = JSON.stringify(swaggerSpec.responses || '', null, 2);
  }

  getSwaggerSpec(): Observable<ExtendedSwaggerSpec | null> {
    return this.swaggerSpec$;
  }

  // Getters to retrieve the stored data
  getOpenApiVersion(): string {
    return this.openApiVersion;
  }

  getVersion(): string {
    return this.version;
  }

  getTitle(): string {
    return this.title;
  }

  getSchemes(): string {
    return this.schemes;
  }

  getPaths(): string {
    return this.paths;
  }

  getSecurity(): string {
    return this.security;
  }

  getServers(): string {
    const swaggerSpec = this.swaggerSpecSubject.getValue();
    if (swaggerSpec?.openapi && swaggerSpec.servers) {
      return JSON.stringify(swaggerSpec.servers, null, 2);
    } else if (swaggerSpec?.swagger === '2.0') {
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

  getResponses(): string {
    return this.responses;
  }

  // Methods to set data
  setOpenApiVersion(openApiVersion: string): void {
    this.openApiVersion = openApiVersion;
  }

  setVersion(version: string): void {
    this.version = version;
  }

  setTitle(title: string): void {
    this.title = title;
  }

  setSchemes(schemes: string): void {
    this.schemes = schemes;
  }

  setPaths(paths: string): void {
    this.paths = paths;
  }

  setSecurity(security: string): void {
    this.security = security;
  }

  // setServers(servers: string): void {
  //   this.servers = servers;
  // }

  setResponses(responses: string): void {
    this.responses = responses;
  }

  saveSwaggerSpecToStorage(swaggerSpec: ExtendedSwaggerSpec): void {
    localStorage.setItem('swaggerSpec', JSON.stringify(swaggerSpec));
  }

  // Retrieve the Swagger spec from localStorage
  getSwaggerSpecFromStorage(): ExtendedSwaggerSpec | null {
    const swaggerSpecString = localStorage.getItem('swaggerSpec');
    if (swaggerSpecString) {
      try {
        return JSON.parse(swaggerSpecString);
      } catch (error) {
        console.error('Error parsing stored Swagger spec:', error);
        return null;
      }
    }
    return null;
  }

  // Clear the Swagger spec from localStorage
  clearSwaggerSpecStorage(): void {
    localStorage.removeItem('swaggerSpec');
  }
}

// Extending the Swagger Spec to include OpenAPI 3.0 components
interface ExtendedSwaggerSpec extends Swagger.Spec {
  openapi?: string; // OpenAPI 3.x.x
  servers?: Array<{ url: string; description?: string }>; // OpenAPI 3.x.x
  components?: {
    schemas?: { [schemaName: string]: Schema };
    responses?: { [responseName: string]: Response };
    parameters?: { [parameterName: string]: Parameter };
    securitySchemes?: { [securitySchemeName: string]: Security };
  }; // OpenAPI 3.x.x components section
}
