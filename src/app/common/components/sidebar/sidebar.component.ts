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
  swaggerSubscription!: Subscription;
  items: MenuItem[] | undefined;
  editingPath: string | null = null;
  validHttpMethods = ['get', 'post', 'put', 'delete', 'patch'];
  contextMenuItems: MenuItem[] = [];
  topLevelContextMenuItems: MenuItem[] = [];
  selectedItem: any;
  pathEndpointItems: MenuItem[] = [];
  clickedType!: string;
  expandAllPaths = false;
  private currentMenu: ContextMenu | null = null;

  constructor(private apiDataService: ApiDataService) {}

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

    Object.keys(swaggerSpec.paths).forEach((pathKey) => {
      const methods = Object.keys(swaggerSpec.paths[pathKey])
        .sort()
        .filter((methodKey) => this.validHttpMethods.includes(methodKey))
        .map((methodKey) => {
          const methodDetails = swaggerSpec.paths[pathKey][methodKey];
          return {
            method: methodKey,
            summary: methodDetails.summary,
            description: methodDetails.description,
            responses: JSON.stringify(methodDetails.responses, null, 2),
          };
        });

      apiPaths[pathKey] = methods;
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
        // command: () => this.deleteEndpoint(),
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
  }
  addOperation(_arg0: string): void {
    throw new Error('Method not implemented.');
  }
  renamePath(): void {
    throw new Error('Method not implemented.');
  }
  deletePath(selectedPath: any): void {
    this.apiDataService.getSwaggerSpec().subscribe((swaggerSpec) => {
      if (swaggerSpec && swaggerSpec.paths) {
        if (swaggerSpec.paths[selectedPath.key]) {
          delete swaggerSpec.paths[selectedPath.key];

          delete this.paths[selectedPath.key];

          this.apiDataService.setPaths(
            JSON.stringify(swaggerSpec.paths, null, 2)
          );
          this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);

          console.log('Updated Swagger spec:', swaggerSpec);

          this.paths = { ...this.paths };
        } else {
          console.warn(
            `Path "${selectedPath.key}" does not exist in Swagger spec.`
          );
        }
      } else {
        console.error('Failed to fetch Swagger spec.');
      }
    });
  }

  renameEndpoint(): void {
    throw new Error('Method not implemented.');
  }
  deleteEndpoint(pathKey: any, methodKey: any): void {
    console.log(
      `Deleting endpoint: ${methodKey.method} from path: ${pathKey.key}`
    );

    // Fetch the current Swagger spec
    this.apiDataService.getSwaggerSpec().subscribe((swaggerSpec: any) => {
      if (swaggerSpec && swaggerSpec.paths) {
        console.log(
          'Available Paths Before Deletion:',
          Object.keys(swaggerSpec.paths)
        );

        // Check if the path and method exist
        if (
          swaggerSpec.paths[pathKey.key] &&
          swaggerSpec.paths[pathKey.key][methodKey.method]
        ) {
          // Delete the specific endpoint (HTTP method) from the path
          delete swaggerSpec.paths[pathKey.key][methodKey.method];
          console.log(
            `Endpoint "${methodKey.method}" deleted successfully from path "${pathKey.key}"`
          );

          // Update the local paths state
          if (this.paths[pathKey.key]) {
            const pathEndpoints: any = this.paths[pathKey.key];
            this.paths[pathKey.key] = pathEndpoints.filter(
              (endpoint: any) => endpoint.method !== methodKey.method
            );
          }

          // Save the updated Swagger spec
          this.apiDataService.setPaths(
            JSON.stringify(swaggerSpec.paths, null, 2)
          );
          this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);

          console.log('Updated Swagger spec:', swaggerSpec);

          // Trigger UI change detection
          this.paths = { ...this.paths };
          console.log('Updated paths:', this.paths);
        } else {
          console.warn(
            `Endpoint "${methodKey.method}" does not exist in path "${pathKey.key}" within the Swagger spec.`
          );
        }
      } else {
        console.error('Failed to fetch Swagger spec.');
      }
    });
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

  onPanelClose() {
    this.expandAllPaths = false;
  }

  getModels(swaggerSpec: any): any[] {
    return Object.keys(swaggerSpec.components.schemas)
      .sort()
      .map((key) => ({
        name: key,
      }));
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

  onPathRightClickHeader(event: MouseEvent): void {
    event.preventDefault();

    if (this.currentMenu) {
      this.currentMenu.hide();
      this.currentMenu = null;
    }

    this.currentMenu = this.contextHeaderMenu;

    this.updateContextMenuLabels('Path');
    this.contextHeaderMenu.model = [...this.topLevelContextMenuItems];

    this.contextHeaderMenu.show(event);
  }

  onPathEndpointRightClick(event: MouseEvent, path: any, method: any): void {
    event.preventDefault();

    if (this.currentMenu) {
      this.currentMenu.hide();
      this.currentMenu = null;
    }

    this.currentMenu = this.contextMenu;

    this.selectedItem = path;
    this.contextMenuItems = [
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
      {
        separator: true,
      },
      {
        label: 'Rename Endpoint',
        icon: 'pi pi-pencil',
        command: () => this.renameEndpoint(),
      },
      {
        label: 'Delete Endpoint',
        icon: 'pi pi-trash',
        command: () => this.deleteEndpoint(path, method),
      },
    ];
    this.contextMenu.show(event);
  }

  onPathRightClick(event: MouseEvent, path: any): void {
    event.preventDefault();

    if (this.currentMenu) {
      this.currentMenu.hide();
      this.currentMenu = null;
    }
    this.currentMenu = this.pathMethodContextMenu;

    this.pathMethodContextMenu.model = [
      { label: 'New Operation', command: () => this.addOperation('GET') },
      { label: 'Copy Path', command: () => this.copyPath() },
      { label: 'Rename', command: () => this.renamePath() },
      { label: 'Delete Path', command: () => this.deletePath(path) },
    ];
    this.pathMethodContextMenu.show(event);
  }

  onModelsRightClickHeader(event: MouseEvent): void {
    event.preventDefault();

    if (this.currentMenu) {
      this.currentMenu.hide();
      this.currentMenu = null;
    }

    this.currentMenu = this.contextHeaderMenu;
    this.updateContextMenuLabels('Model');
    this.contextHeaderMenu.model = [...this.topLevelContextMenuItems];
    this.contextHeaderMenu.show(event);
  }

  onModelRightClick(event: MouseEvent, model: any): void {
    event.preventDefault();

    if (this.currentMenu) {
      this.currentMenu.hide();
      this.currentMenu = null;
    }

    this.currentMenu = this.contextMenu;
    this.selectedItem = model;
    this.updateContextMenuLabels('Model');
    this.contextMenu.model = [...this.contextMenuItems];
    this.contextMenu.show(event);
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
