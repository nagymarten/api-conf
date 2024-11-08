import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener,
  ElementRef,
  AfterViewChecked,
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
  ],
  providers: [MessageService],
})
export class SidebarComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('contextMenu') contextMenu!: ContextMenu;
  @ViewChild('contextHeaderMenu') contextHeaderMenu!: ContextMenu;
  @ViewChild('pathMethodContextMenu') pathMethodContextMenu!: ContextMenu;
  @ViewChild('inputRef') inputElement!: ElementRef<HTMLInputElement>;

  paths: { [key: string]: any } = {};
  models: any[] = [];
  requestBodies: any[] = [];
  responses: any[] = [];
  parameters: any[] = [];
  examples: any[] = [];
  swaggerSubscription!: Subscription;
  items: MenuItem[] | undefined;
  editingPath: string | null = null;
  validHttpMethods = ['get', 'post', 'put', 'delete', 'patch'];
  contextMenuItems: MenuItem[] = [];
  topLevelContextMenuItems: MenuItem[] = [];
  selectedItem: any;
  pathEndpointItems: MenuItem[] = [];
  clickedType!: string;
  expandAllPaths = false; // Control whether all paths are expanded or collapsed

  constructor(
    private apiDataService: ApiDataService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.swaggerSubscription = this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec) => {
        if (swaggerSpec && swaggerSpec.paths) {
          this.paths = this.getPaths(swaggerSpec);
          this.models = this.getModels(swaggerSpec);
        }
      },
      error: (error) => {
        console.error('Error fetching Swagger spec:', error);
      },
    });

    this.setupContextMenuItems();
  }

  ngAfterViewChecked(): void {
    if (this.editingPath && this.inputElement) {
      this.inputElement.nativeElement.focus();
    }
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
        command: () => this.createNewPath(this.clickedType),
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

    this.pathEndpointItems = [
      {
        label: 'New Operation',
        icon: 'pi pi-plus',
        items: [
          { label: 'GET', command: () => this.addOperation('GET') },
          { label: 'PUT', command: () => this.addOperation('PUT') },
          { label: 'PATCH', command: () => this.addOperation('PATCH') },
          { label: 'DELETE', command: () => this.addOperation('DELETE') },
          { label: 'HEAD', command: () => this.addOperation('HEAD') },
          { label: 'OPTIONS', command: () => this.addOperation('OPTIONS') },
          { label: 'TRACE', command: () => this.addOperation('TRACE') },
        ],
      },
      { separator: true },
      {
        label: 'Copy Path',
        icon: 'pi pi-copy',
        command: () => this.copyPath(),
      },
      {
        label: 'Copy Relative Path',
        icon: 'pi pi-copy',
        command: () => this.copyRelativePath(),
      },
      { separator: true },
      {
        label: 'Rename',
        icon: 'pi pi-pencil',
        command: () => this.renamePath(),
      },
      {
        label: 'Delete Path',
        icon: 'pi pi-trash',
        command: () => this.deletePath(),
      },
    ];
  }
  addOperation(_arg0: string): void {
    throw new Error('Method not implemented.');
  }
  renamePath(): void {
    throw new Error('Method not implemented.');
  }
  deletePath(): void {
    throw new Error('Method not implemented.');
  }

  renameEndpoint(): void {
    throw new Error('Method not implemented.');
  }
  deleteEndpoint(): void {
    throw new Error('Method not implemented.');
  }
  createNewPath(clickedType: string): void {
    this.expandAllPaths = true;
    if (clickedType === 'Path') {
      const newPathKey = `/new-path-${Date.now()}`;
      if (!this.paths) {
        this.paths = {};
      }
      this.paths[newPathKey] = [];
      this.editingPath = newPathKey;
    }
  }

  savePath(originalKey: string, event: any): void {
    const newPathKey = (event.target as HTMLInputElement).value.trim();

    if (!newPathKey || newPathKey === originalKey) {
      this.cancelEditPath(originalKey);
      return;
    }

    const originalPathData = this.paths[originalKey] || [];
    delete this.paths[originalKey];
    this.paths[newPathKey] = originalPathData;

    this.paths[newPathKey].push({
      method: 'get',
      summary: 'Default GET endpoint for the new path',
      description: 'Auto-generated GET endpoint.',
      responses: {
        200: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Success' },
                },
              },
            },
          },
        },
      },
    });

    this.apiDataService.getSwaggerSpec().subscribe((swaggerSpec) => {
      if (swaggerSpec && swaggerSpec.paths) {
        if (!swaggerSpec.paths[newPathKey]) {
          swaggerSpec.paths[newPathKey] = {};
        }

        swaggerSpec.paths[newPathKey] = {
          get: {
            summary: 'Default GET endpoint for the new path',
            description: 'Auto-generated GET endpoint.',
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: { type: 'string', example: 'Success' },
                      },
                    },
                  },
                },
              } as any,
            },
          },
        };

        this.apiDataService.setPaths(
          JSON.stringify(swaggerSpec.paths, null, 2)
        );
        this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);

        console.log('Updated Swagger spec:', swaggerSpec);
      }
    });
    this.editingPath = null;
  }

  cancelEditPath(_key: string): void {
    this.editingPath = null;
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

  onPanelClose(){
    this.expandAllPaths = false;
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

  onPathEndpointRightClick(event: MouseEvent, path: any): void {
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

  onPathRightClick(event: MouseEvent, _method: any): void {
    event.preventDefault();
    //  this.selectedItem = example;
    this.updateContextMenuLabels('Path');
    this.pathMethodContextMenu.model = [...this.pathEndpointItems];
    this.pathMethodContextMenu.show(event);
  }

  onOpen(): void {
    console.log('Open:', this.selectedItem);
  }

  private updateContextMenuLabels(type: string): void {
    this.clickedType = type;
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
