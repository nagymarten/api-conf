// swagger.types.ts
import * as Swagger from 'swagger-schema-official';

export type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'options'
  | 'head';

// Extend the Operation interface to include requestBody (for OpenAPI 3.0+)
export interface ExtendedOperation extends Swagger.Operation {
  requestBody?: any; // OpenAPI 3.0 requestBody
}

// Define the ExtendedSwaggerSpec interface, extending the Swagger Spec
export interface ExtendedSwaggerSpec extends Swagger.Spec {
  openapi?: string; // OpenAPI version
  servers?: Array<{ url: string; description?: string }>; // OpenAPI 3.0+ servers
}

// Define Paths interface for typing the paths
export interface Paths {
  [path: string]: {
    [method: string]: {
      summary?: string;
      description?: string;
      requestBody?: any;
      responses?: any;
      parameters?: any[];
      security?: any[];
    };
  };
}
