import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener,
} from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { ApiDataService } from '../../../services/api-data.service';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { ApiDocumentUploadButtonComponent } from '../api-document-upload-button/api-document-upload-button.component';
import { DownloadYamlButtonComponent } from '../download-yaml-button/download-yaml-button.component';
import { DeleteDocumentButtonComponent } from '../delete-document-button/delete-document-button.component';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: true,
  imports: [
    PanelMenuModule,
    ToastModule,
    ContextMenuModule,
    ButtonModule,
    CommonModule,
    MatSidenavModule,
    MatExpansionModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    RouterModule,
    ApiDocumentUploadButtonComponent,
    DownloadYamlButtonComponent,
    DeleteDocumentButtonComponent,
  ],
  providers: [MessageService],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @ViewChild('contextMenu') contextMenu!: ContextMenu;
  @ViewChild('contextHeaderMenu') contextHeaderMenu!: ContextMenu;

  paths: { [key: string]: any } = {};
  models: any[] = [];
  requestBodies: any[] = [];
  responses: any[] = [];
  parameters: any[] = [];
  examples: any[] = [];
  swaggerSubscription!: Subscription;
  items: MenuItem[] | undefined;

  validHttpMethods = ['get', 'post', 'put', 'delete', 'patch'];
  contextMenuItems: MenuItem[] = [];
  topLevelContextMenuItems: MenuItem[] = [];
  selectedItem: any;

  constructor(
    private apiDataService: ApiDataService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.swaggerSubscription = this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec) => {
        if (swaggerSpec) {
          this.paths = this.getPaths(swaggerSpec);
          this.models = this.getModels(swaggerSpec);
          this.requestBodies = this.getRequestBodies(swaggerSpec);
          this.responses = this.getResponses(swaggerSpec);
          this.parameters = this.getParameters(swaggerSpec);
          this.examples = this.getExamples(swaggerSpec);
        }
      },
      error: (error) => {
        console.error('Error fetching Swagger spec:', error);
      },
    });

    this.setupContextMenuItems();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(_event: MouseEvent): void {
    if (this.contextMenu && this.contextMenu.visible()) {
      this.contextMenu.hide();
    }
    if (this.contextHeaderMenu && this.contextHeaderMenu.visible()) {
      this.contextHeaderMenu.hide();
    }
  }

  getPaths(swaggerSpec: any): { [key: string]: any } {
    const apiPaths: { [key: string]: any } = {};

    // Loop over each API path
    Object.keys(swaggerSpec.paths).forEach((pathKey) => {
      const methods = Object.keys(swaggerSpec.paths[pathKey])
        .sort()
        .filter((methodKey) => this.validHttpMethods.includes(methodKey)) // Only include valid HTTP methods
        .map((methodKey) => {
          const methodDetails = swaggerSpec.paths[pathKey][methodKey];
          // console.log('methodDetails:', pathKey);
          return {
            method: methodKey, // HTTP method (POST, GET, etc.)
            summary: methodDetails.summary, // Summary for each method
            description: methodDetails.description, // Method description (optional)
            responses: JSON.stringify(methodDetails.responses, null, 2), // Stringify the responses
          };
        });

      apiPaths[pathKey] = methods; // Assign the methods to the path
    });

    return apiPaths;
  }

  private setupContextMenuItems(): void {
    this.contextMenuItems = [
      {
        originalLabel: 'Copy Path',
        label: 'Copy Path',
        icon: 'pi pi-copy',
        command: () => this.copyPath(),
      },
      {
        originalLabel: 'Copy Relative Path',
        label: 'Copy Relative Path',
        icon: 'pi pi-copy',
        command: () => this.copyRelativePath(),
      },
      {
        separator: true,
      },
      {
        originalLabel: 'Rename {type}',
        label: 'Rename {type}',
        icon: 'pi pi-pencil',
        command: () => this.renameEndpoint(),
      },
      {
        originalLabel: 'Delete {type}',
        label: 'Delete {type}',
        icon: 'pi pi-trash',
        command: () => this.deleteEndpoint(),
      },
    ];

    this.topLevelContextMenuItems = [
      {
        originalLabel: 'New {type}',
        label: 'New {type}',
        icon: 'pi pi-plus',
        command: () => this.createNewPath(),
      },
      {
        separator: true,
      },
      {
        originalLabel: 'Copy Path',
        label: 'Copy Path',
        icon: 'pi pi-copy',
        command: () => this.copyPath(),
      },
      {
        originalLabel: 'Copy Relative Path',
        label: 'Copy Relative Path',
        icon: 'pi pi-copy',
        command: () => this.copyRelativePath(),
      },
    ];
  }

  renameEndpoint(): void {
    throw new Error('Method not implemented.');
  }
  deleteEndpoint(): void {
    throw new Error('Method not implemented.');
  }
  createNewPath(): void {
    throw new Error('Method not implemented.');
  }
  copyPath(): void {
    throw new Error('Method not implemented.');
  }
  copyRelativePath(): void {
    throw new Error('Method not implemented.');
  }
  viewDetails() {
    this.messageService.add({
      severity: 'info',
      summary: 'View Details',
      detail: 'Viewing details of top-level item',
    });
  }

  refresh() {
    this.messageService.add({
      severity: 'success',
      summary: 'Refresh',
      detail: 'Top-level item refreshed',
    });
  }

  openItem() {
    this.messageService.add({
      severity: 'info',
      summary: 'Open',
      detail: 'Item opened',
    });
  }

  editItem() {
    this.messageService.add({
      severity: 'info',
      summary: 'Edit',
      detail: 'Edit item',
    });
  }

  deleteItem() {
    this.messageService.add({
      severity: 'warn',
      summary: 'Delete',
      detail: 'Item deleted',
    });
  }

  showProperties() {
    this.messageService.add({
      severity: 'info',
      summary: 'Properties',
      detail: 'Showing properties',
    });
  }

  getModels(swaggerSpec: any): any[] {
    return Object.keys(swaggerSpec.components.schemas)
      .sort()
      .map((key) => ({
        name: key,
      }));
  }

  getRequestBodies(_swaggerSpec: any) {
    return this.requestBodies;
  }

  getResponses(swaggerSpec: any) {
    const responsesArray: any[] = [];

    if (swaggerSpec.components && swaggerSpec.components.responses) {
      Object.keys(swaggerSpec.components.responses).forEach((responseKey) => {
        const response = swaggerSpec.components.responses[responseKey];
        const contentTypes = response.content
          ? Object.keys(response.content)
          : [];

        responsesArray.push({
          name: responseKey,
          description: response.description,
          contentTypes: contentTypes,
          examples: response.content?.['application/json']?.examples || null,
        });
      });
    }

    return responsesArray;
  }

  getParameters(_swaggerSpec: any) {
    return this.parameters;
  }

  getExamples(_swaggerSpec: any) {
    return this.examples;
  }
  onPathRightClickHeader(event: MouseEvent): void {
    event.preventDefault();
    this.updateContextMenuLabels('Path');
    this.contextHeaderMenu.model = [...this.topLevelContextMenuItems];
    this.contextHeaderMenu.show(event);
  }

  onModelsRightClickHeader(event: MouseEvent): void {
    event.preventDefault();
    this.updateContextMenuLabels('Model');
    this.contextHeaderMenu.model = [...this.topLevelContextMenuItems];
    this.contextHeaderMenu.show(event);
  }

  onRequestBodiesRightClickHeader(event: MouseEvent): void {
    event.preventDefault();
    this.updateContextMenuLabels('Request Body');
    this.contextHeaderMenu.model = [...this.topLevelContextMenuItems];
    this.contextHeaderMenu.show(event);
  }

  onResponsesRightClickHeader(event: MouseEvent): void {
    event.preventDefault();
    this.updateContextMenuLabels('Response');
    this.contextHeaderMenu.model = [...this.topLevelContextMenuItems];
    this.contextHeaderMenu.show(event);
  }

  onParametersRightClickHeader(event: MouseEvent): void {
    event.preventDefault();
    this.updateContextMenuLabels('Parameter');
    this.contextHeaderMenu.model = [...this.topLevelContextMenuItems];
    this.contextHeaderMenu.show(event);
  }

  onExamplesRightClickHeader(event: MouseEvent): void {
    event.preventDefault();
    this.updateContextMenuLabels('Example');
    this.contextHeaderMenu.model = [...this.topLevelContextMenuItems];
    this.contextHeaderMenu.show(event);
  }

  onPathRightClick(event: MouseEvent, path: any): void {
    event.preventDefault();
    this.selectedItem = path;
    this.updateContextMenuLabels('Path');
    this.contextMenu.model = [...this.contextMenuItems];
    this.contextMenu.show(event);
  }

  onModelRightClick(event: MouseEvent, model: any): void {
    event.preventDefault();
    this.selectedItem = model;
    this.updateContextMenuLabels('Model');
    this.contextMenu.model = [...this.contextMenuItems];
    this.contextMenu.show(event);
  }

  onRequestBodyRightClick(event: MouseEvent, requestBody: any): void {
    event.preventDefault();
    this.selectedItem = requestBody;
    this.updateContextMenuLabels('Request Body');
    this.contextMenu.model = [...this.contextMenuItems];
    this.contextMenu.show(event);
  }

  onResponseRightClick(event: MouseEvent, response: any): void {
    event.preventDefault();
    this.selectedItem = response;
    this.updateContextMenuLabels('Response');
    this.contextMenu.model = [...this.contextMenuItems];
    this.contextMenu.show(event);
  }

  onParameterRightClick(event: MouseEvent, parameter: any): void {
    event.preventDefault();
    this.selectedItem = parameter;
    this.updateContextMenuLabels('Parameter');
    this.contextMenu.model = [...this.contextMenuItems];
    this.contextMenu.show(event);
  }

  onExampleRightClick(event: MouseEvent, example: any): void {
    event.preventDefault();
    this.selectedItem = example;
    this.updateContextMenuLabels('Example');
    this.contextMenu.model = [...this.contextMenuItems];
    this.contextMenu.show(event);
  }

  onOpen(): void {
    console.log('Open:', this.selectedItem);
  }

  private updateContextMenuLabels(type: string): void {
    this.contextMenuItems = this.contextMenuItems.map((item) => ({
      ...item,
      label: item['originalLabel']?.replace(/\{type\}/g, type) || item.label,
    }));

    this.topLevelContextMenuItems = this.topLevelContextMenuItems.map(
      (item) => ({
        ...item,
        label: item['originalLabel']?.replace(/\{type\}/g, type) || item.label,
      })
    );
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
