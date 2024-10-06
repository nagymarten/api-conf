// swagger.types.ts
import * as Swagger from 'swagger-schema-official';

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
