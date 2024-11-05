import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { ApiDataService } from '../../../services/api-data.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: true,
  imports: [
    PanelMenuModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class SidebarComponent implements OnInit, OnDestroy {
  items: MenuItem[] = [];
  swaggerSubscription!: Subscription;

  constructor(private apiDataService: ApiDataService) {}

  ngOnInit(): void {
    // Fetch Swagger spec data
    this.swaggerSubscription = this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec) => {
        if (swaggerSpec) {
          this.items = this.buildMenuItems(swaggerSpec);
        }
      },
      error: (error) => {
        console.error('Error fetching Swagger spec:', error);
      },
    });
  }

  private buildMenuItems(swaggerSpec: any): MenuItem[] {
    return [
      {
        label: 'Paths',
        icon: 'pi pi-folder',
        items: this.getPaths(swaggerSpec),
      },
      {
        label: 'Models',
        icon: 'pi pi-folder',
        items: this.getModels(swaggerSpec),
      },
      {
        label: 'Request Bodies',
        icon: 'pi pi-folder',
        items: this.getRequestBodies(swaggerSpec),
      },
      {
        label: 'Responses',
        icon: 'pi pi-folder',
        items: this.getResponses(swaggerSpec),
      },
      {
        label: 'Parameters',
        icon: 'pi pi-folder',
        items: this.getParameters(swaggerSpec),
      },
      {
        label: 'Examples',
        icon: 'pi pi-folder',
        items: this.getExamples(swaggerSpec),
      },
    ];
  }

  private getPaths(swaggerSpec: any): MenuItem[] {
    return Object.keys(swaggerSpec.paths).map((pathKey) => ({
      label: pathKey,
      icon: 'pi pi-folder', // Icon for the folder (top-level path)
      expanded: true, // Expands this item by default
      items: Object.keys(swaggerSpec.paths[pathKey])
        .filter((methodKey) => this.isHttpMethod(methodKey))
        .map((methodKey) => ({
          label: `
                    <span class="method-summary">
                        ${
                          swaggerSpec.paths[pathKey][methodKey].summary ||
                          'No summary available'
                        }:
                    </span>
                    <span class="method-type method-type-${methodKey.toLowerCase()}">
                        ${methodKey.toUpperCase()}
                    </span>
                `,
          escape: false,
          icon: this.getMethodIcon(methodKey), // Set method-specific icon
          routerLink: ['/path', pathKey, methodKey],
        })),
    }));
  }

  private getModels(swaggerSpec: any): MenuItem[] {
    return Object.keys(swaggerSpec.components.schemas).map((modelKey) => ({
      label: modelKey,
      icon: 'pi pi-file',
      routerLink: ['/schemas', modelKey],
    }));
  }

  private getRequestBodies(swaggerSpec: any): MenuItem[] {
    return Object.keys(swaggerSpec.components.requestBodies || {}).map(
      (requestKey) => ({
        label: requestKey,
        icon: 'pi pi-file',
        routerLink: ['/request-bodies', requestKey],
      })
    );
  }

  private getResponses(swaggerSpec: any): MenuItem[] {
    return Object.keys(swaggerSpec.components.responses || {}).map(
      (responseKey) => ({
        label: responseKey,
        icon: 'pi pi-file',
        routerLink: ['/responses', responseKey],
      })
    );
  }

  private getParameters(swaggerSpec: any): MenuItem[] {
    return Object.keys(swaggerSpec.components.parameters || {}).map(
      (parameterKey) => ({
        label: parameterKey,
        icon: 'pi pi-file',
        routerLink: ['/parameters', parameterKey],
      })
    );
  }

  private getExamples(swaggerSpec: any): MenuItem[] {
    return Object.keys(swaggerSpec.components.examples || {}).map(
      (exampleKey) => ({
        label: exampleKey,
        icon: 'pi pi-file',
        routerLink: ['/examples', exampleKey],
      })
    );
  }

  private getMethodIcon(method: string): string {
    switch (method.toLowerCase()) {
      case 'get':
        return 'pi pi-arrow-right';
      case 'post':
        return 'pi pi-plus';
      case 'put':
        return 'pi pi-refresh';
      case 'delete':
        return 'pi pi-trash';
      case 'patch':
        return 'pi pi-pencil';
      default:
        return 'pi pi-file';
    }
  }

  private isHttpMethod(method: string): boolean {
    const validHttpMethods = ['get', 'post', 'put', 'delete', 'patch'];
    return validHttpMethods.includes(method.toLowerCase());
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
