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
  openapi?: string; // OpenAPI version (for OpenAPI 3.x.x)
  servers?: Array<{ url: string; description?: string }>; // OpenAPI 3.0+ servers
  components?: OpenAPIComponents; // Add components for OpenAPI 3.x.x
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

// Interface for the components section of OpenAPI 3.0+
export interface OpenAPIComponents {
  schemas?: { [schemaName: string]: any };
  responses?: { [responseName: string]: any };
  parameters?: { [parameterName: string]: any };
  securitySchemes?: { [securitySchemeName: string]: any };
}

// Interface for OpenAPI responses
export interface ResponseDetails {
  description?: string;
  headers?: { [headerName: string]: any };
  content?: {
    [contentType: string]: {
      schema: any;
    };
  };
}

export interface SchemaProperty {
  type: string;
  description?: string; // This is optional, in case the description is not always present
}

export interface SchemaDetails {
  title: string;
  description: string;
  properties: Record<string, SchemaProperty>; // Define properties as an object where keys are strings
}

export interface PropertyWithKey {
  key: string;
  value: SchemaProperty;
}