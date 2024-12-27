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

  private swaggerSpecs: { [key: string]: any } = {};
  private selectedSwaggerSpecSubject = new BehaviorSubject<any | null>(null);

  selectedSwaggerSpec$ = this.selectedSwaggerSpecSubject.asObservable();

  private selectedSwaggerKey: string | null =
    localStorage.getItem('selectedSwaggerKey') || null;

  private openApiVersion: string = '';
  private version: string = '';
  private title: string = '';
  private schemes: string = '';
  private paths: string = '';
  private security: string = '';
  private responses: string = '';

  constructor() {
    this.swaggerSpecs = this.getAllSwaggerSpecs();
    if (this.selectedSwaggerKey) {
      this.setSelectedSwaggerSpec(this.selectedSwaggerKey);
    }
  }

  getSelectedSwaggerKey(): string | null {
    return this.selectedSwaggerKey;
  }

  logSwaggerSpecFromStorage(): void {
    const swaggerSpecString = localStorage.getItem('swaggerSpec');
    if (swaggerSpecString) {
      try {
        const swaggerSpec = JSON.parse(swaggerSpecString);
        console.log('Swagger Spec in Memory:', swaggerSpec);
      } catch (error) {
        console.error('Error parsing stored Swagger spec:', error);
      }
    } else {
      console.warn('No Swagger Spec found in memory.');
    }
  }

  setSwaggerSpec(swaggerSpec: any): void {
    this.swaggerSpecSubject.next(swaggerSpec);
  }

  updatePaths(paths: { [key: string]: any }): void {
    const currentSpec = this.swaggerSpecSubject.value;
    if (currentSpec) {
      currentSpec.paths = paths;
      this.swaggerSpecSubject.next(currentSpec);
      this.saveSwaggerSpecToStorage(currentSpec);
    }
  }

  setSelectedSwaggerSpec(key: string): void {
    const currentSpec = this.selectedSwaggerSpecSubject.value;
    const newSpec = this.swaggerSpecs[key] || null;

    if (currentSpec !== newSpec) {
      this.selectedSwaggerSpecSubject.next(newSpec);
      this.selectedSwaggerKey = key;
      localStorage.setItem('selectedSwaggerKey', key);
    }
  }

  getSelectedSwaggerSpec(): Observable<any | null> {
    return this.selectedSwaggerSpec$;
  }

  getSelectedSwaggerSpecValue(): any | null {
    return this.selectedSwaggerSpecSubject.value;
  }

  getSwaggerSpecByKey(key: string): ExtendedSwaggerSpec | null {
    const allSpecs = this.getAllSwaggerSpecs();
    return allSpecs[key] || null;
  }

  getAllSwaggerSpecs(): { [key: string]: ExtendedSwaggerSpec } {
    const swaggerSpecs = localStorage.getItem('swaggerSpecs');
    if (swaggerSpecs) {
      try {
        const parsedSpecs = JSON.parse(swaggerSpecs);
        const cleanKeys = Object.keys(parsedSpecs).reduce((acc, key) => {
          const value = parsedSpecs[key];
          try {
            if (typeof value === 'string') {
              try {
                acc[key] = JSON.parse(value) as ExtendedSwaggerSpec;
              } catch {
                acc[key] = yaml.load(value) as ExtendedSwaggerSpec;
              }
            } else {
              acc[key] = value;
            }
          } catch (error) {
            console.error(`Error parsing spec for key: ${key}`, error);
          }
          return acc;
        }, {} as { [key: string]: ExtendedSwaggerSpec });

        return cleanKeys;
      } catch (error) {
        console.error('Error parsing stored Swagger specs:', error);
        return {};
      }
    }
    return {};
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

  deleteSwaggerSpecFromStorage(key: string): void {
    const allSpecs = this.getAllSwaggerSpecs();
    if (allSpecs[key]) {
      delete allSpecs[key];
      localStorage.setItem('swaggerSpecs', JSON.stringify(allSpecs));
    } else {
      console.warn(`Swagger spec with key '${key}' not found in storage.`);
    }
  }

  updateSwaggerSpec(
    key: string,
    updatedSwaggerSpec: ExtendedSwaggerSpec
  ): void {
    const currentSpec = this.swaggerSpecs[key];
    if (currentSpec) {
      this.deleteSwaggerSpecFromStorage(key);
    }

    this.storeSwaggerSpec(key, updatedSwaggerSpec);

    const selectedSpec = this.getSelectedSwaggerSpecValue();
    if (selectedSpec?.info?.title === key) {
      this.setSelectedSwaggerSpec(key);
    }

  }

  getSwaggerSpec(): Observable<ExtendedSwaggerSpec | null> {
    return this.swaggerSpec$;
  }

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

  storeSwaggerSpec(key: string, swaggerSpec: ExtendedSwaggerSpec): void {
    const allSpecs: { [key: string]: ExtendedSwaggerSpec | string } =
      this.getAllSwaggerSpecs();

    allSpecs[key] = JSON.stringify(swaggerSpec, null, 2);

    localStorage.setItem('swaggerSpecs', JSON.stringify(allSpecs));
    this.swaggerSpecs = this.getAllSwaggerSpecs();
  }

  clearSwaggerSpecStorage(): void {
    localStorage.removeItem('swaggerSpec');
  }

  logAllSwaggerSpecs(): void {
    const allSpecs = this.getAllSwaggerSpecs();
    console.log('All stored Swagger specs:', allSpecs);
  }

  clearAllSwaggerSpecs(): void {
    localStorage.removeItem('swaggerSpecs');
    console.log('Cleared all stored Swagger specs.');
  }

  parseSwaggerFile(file: File): void {
    const reader = new FileReader();

    reader.onload = (event: any) => {
      const fileContent = event.target.result;

      if (fileContent) {
        try {
          const swaggerSpec = yaml.load(fileContent) as ExtendedSwaggerSpec;
          const key = file.name;
          this.storeSwaggerSpec(key, swaggerSpec);
          console.log(`Swagger spec stored under key: ${key}`);
        } catch (error) {
          console.error('Error parsing the file as YAML:', error);
        }
      } else {
        console.error('File content is null or empty');
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };

    reader.readAsText(file);
  }
}

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
