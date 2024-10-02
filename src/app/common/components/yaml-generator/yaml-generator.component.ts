import { Component } from '@angular/core';

@Component({
  selector: 'app-yaml-generator',
  standalone: true,
  imports: [],
  templateUrl: './yaml-generator.component.html',
  styleUrl: './yaml-generator.component.css',
})
export class YamlGeneratorComponent {
  private jsonData = {
    openapi: '3.0.0',
    info: {
      title: 'Simple To-Do API',
      description: 'A simple API to manage To-Do tasks',
      version: '1.0.0',
    },
    paths: {
      '/todos': {
        get: {
          summary: 'Get all to-do items',
          responses: {
            '200': {
              description: 'List of to-do items',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ToDo' },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        ToDo: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            completed: { type: 'boolean' },
          },
        },
      },
    },
  };

  generateYamlFile() {
    const jsonString = JSON.stringify(this.jsonData, null, 2);

    const blob = new Blob([jsonString], { type: 'application/yaml' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'api-spec.yml'; // The name of the downloaded file
    link.click(); // Trigger the download

    URL.revokeObjectURL(link.href);
  }
}
