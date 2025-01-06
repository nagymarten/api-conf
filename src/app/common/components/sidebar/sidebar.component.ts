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
import { Subscription, debounceTime, distinctUntilChanged, take } from 'rxjs';
import { ApiDataService } from '../../../services/api-data.service';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import * as yaml from 'js-yaml';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';

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
    DialogModule,
    FormsModule,
    DividerModule,
    ToolbarModule,
    InputTextModule,
    ButtonModule,
    RadioButtonModule,
    CheckboxModule,
  ],
  providers: [MessageService],
})
export class SidebarComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('contextMenu') contextMenu!: ContextMenu;
  @ViewChild('contextHeaderMenu') contextHeaderMenu!: ContextMenu;
  @ViewChild('pathMethodContextMenu') pathMethodContextMenu!: ContextMenu;
  @ViewChild('inputRef') inputElement!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  paths: { [key: string]: any } = {};
  models: any[] = [];
  swaggerSubscription!: Subscription;
  items: MenuItem[] | undefined;
  editingPath: string | null = null;
  validHttpMethods = [
    'get',
    'post',
    'put',
    'delete',
    'patch',
    'head',
    'options',
    'trace',
  ];
  contextMenuItems: MenuItem[] = [];
  modelContextMenuItems: MenuItem[] = [];
  topLevelPathContextMenuItems: MenuItem[] = [];
  topLevelModelContextMenuItems: MenuItem[] = [];
  topLevelReferenceContextMenuItems: MenuItem[] = [];
  referenceContextMenuItems: MenuItem[] = [];
  selectedItem: any;
  pathEndpointItems: MenuItem[] = [];
  clickedType!: string;
  expandAllPaths = false;
  private currentMenu: ContextMenu | null = null;
  visibleAddPath: boolean = false;
  visibleAddModel: boolean = false;
  newPathName: string = '';
  newModelName: string = '';
  renameEndpointDialogVisible: boolean = false;
  newMethodKey: string = '';
  selectedPath: any = null;
  selectedMethod: any = null;
  searchQuery: string = '';
  swaggerKeys: string[] = [];
  selectedSwaggerKey: string | null = null;
  swaggerSpec: any = null;
  isAddNewRefDialogVisible: boolean = false;
  newOpenApiTitle: string = '';
  selectedFileType: 'yaml' | 'json' = 'json';
  selectedVersion: 'v3.1' | 'v3.0' | 'v2.0' = 'v3.1';
  isExportDialogVisible: boolean = false;
  selectedReference: 'bundled' = 'bundled';
  includeExtensions: boolean = true;
  selectedFormat: 'json' | 'yaml' = 'json';

  constructor(private apiDataService: ApiDataService, private router: Router) {}

  ngOnInit(): void {
    this.fetchSidebar();
  }

  fetchSidebar(): void {
    this.initializeComponentState();
    const savedKey = this.apiDataService.getSelectedSwaggerKey();
    if (savedKey) {
      this.selectedSwaggerKey = savedKey;
      this.apiDataService.setSelectedSwaggerSpec(savedKey);
    } else if (this.swaggerKeys.length > 0) {
      this.selectedSwaggerKey = this.swaggerKeys[0];
      this.apiDataService.setSelectedSwaggerSpec(this.selectedSwaggerKey);
    }
  }

  ngAfterViewChecked(): void {
    if (this.editingPath && this.inputElement) {
      this.inputElement.nativeElement.focus();
    }
  }

  initializeComponentState(): void {
    this.swaggerSubscription = this.apiDataService
      .getSelectedSwaggerSpec()
      .pipe(debounceTime(100), distinctUntilChanged())
      .subscribe({
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

    this.loadAvailableSwaggerSpecs();
    this.setupContextMenuItems();
  }

  loadAvailableSwaggerSpecs(): void {
    const allSpecs = this.apiDataService.getAllSwaggerSpecs();
    this.swaggerKeys = Object.keys(allSpecs);

    if (this.swaggerKeys.length > 0) {
      this.selectedSwaggerKey = this.swaggerKeys[0];
      this.loadSwaggerSpec();
    }
  }

  onSwaggerKeyRightClick(event: MouseEvent, key: string): void {
    event.preventDefault();
    console.log(`Right-clicked on Swagger Key: ${key}`);
  }

  openAddNewRefDialog(
    fileType: 'yaml' | 'json',
    version: 'v3.1' | 'v3.0' | 'v2.0'
  ): void {
    this.isAddNewRefDialogVisible = true;
    this.newOpenApiTitle = '';
    this.selectedFileType = fileType;
    this.selectedVersion = version;
  }

  confirmCreateNewOpenApi(): void {
    //TODO: toast messeges
    if (!this.newOpenApiTitle.trim()) {
      console.warn('Title is required!');
      return;
    }

    if (this.isTitleExisting(this.newOpenApiTitle.trim())) {
      console.warn('A reference with this title already exists!');
      return;
    }

    console.log('confirmCreateNewOpenApi');
    console.log(this.newOpenApiTitle);
    this.createNewOpenApi(this.selectedVersion);
    this.isAddNewRefDialogVisible = false;
  }

  isTitleExisting(title: string): boolean {
    const allSpecs = this.apiDataService.getAllSwaggerSpecs();
    return Object.keys(allSpecs).some(
      (key) => key.toLowerCase() === title.toLowerCase()
    );
  }

  onReferenceRightClick(event: MouseEvent, key: string): void {
    event.preventDefault();

    if (this.currentMenu) {
      this.currentMenu.hide();
      this.currentMenu = null;
    }

    this.currentMenu = this.contextMenu;
    this.selectedItem = key;
    this.referenceContextMenuItems = [
      {
        label: 'Export',
        icon: 'pi pi-download',
        command: () => this.exportReference(),
      },
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
        label: 'Rename',
        icon: 'pi pi-pencil',
        command: () => this.renameReference(),
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteReference(key),
      },
      {
        label: 'Duplicate',
        icon: 'pi pi-clone',
        command: () => this.duplicateReference(),
      },
    ];
    this.contextMenu.model = [...this.referenceContextMenuItems];
    this.contextMenu.show(event);
  }
  duplicateReference(): void {
    throw new Error('Method not implemented.');
  }

  onReferenceSelect(key: string): void {
    this.selectedSwaggerKey = key;
    this.apiDataService.setSelectedSwaggerSpec(key);
    this.router.navigate(['/reference', key]);
  }

  onReferenceRightClickHeader(event: MouseEvent): void {
    event.preventDefault();

    if (this.currentMenu) {
      this.currentMenu.hide();
      this.currentMenu = null;
    }

    this.currentMenu = this.contextHeaderMenu;

    this.contextHeaderMenu.model = [...this.topLevelReferenceContextMenuItems];

    this.contextHeaderMenu.show(event);
  }

  loadSwaggerSpec(): void {
    if (this.selectedSwaggerKey) {
      this.swaggerSpec = this.apiDataService.getSwaggerSpecByKey(
        this.selectedSwaggerKey
      );
    }
  }

  switchSwaggerReference(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedSwaggerKey = selectElement.value;
    this.apiDataService.clearCurrentSpec();
    this.loadSwaggerSpec();
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
    if (!swaggerSpec || !swaggerSpec.paths) {
      console.warn('Swagger spec or paths is null.');
      return {};
    }

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
    this.modelContextMenuItems = [
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
        label: 'Rename Model',
        icon: 'pi pi-pencil',
        command: () => this.renameModel(),
      },
      {
        label: 'Delete Model',
        icon: 'pi pi-trash',
        command: () => this.deleteModel(),
      },
    ];

    this.topLevelPathContextMenuItems = [
      {
        label: 'New Path',
        icon: 'pi pi-plus',
        command: () => this.createNewPath(),
      },
      {
        separator: true,
      },
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
    ];

    this.topLevelModelContextMenuItems = [
      {
        label: 'New Model',
        icon: 'pi pi-plus',
        command: () => this.createNewModel(),
      },
      {
        separator: true,
      },
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
    ];

    this.topLevelReferenceContextMenuItems = [
      {
        label: 'New OpenAPI',
        icon: 'pi pi-plus',
        items: [
          {
            label: 'YAML',
            items: [
              {
                label: 'v3.1',
                command: () => this.openAddNewRefDialog('yaml', 'v3.1'),
              },
              {
                label: 'v3.0',
                command: () => this.openAddNewRefDialog('yaml', 'v3.0'),
              },
              {
                label: 'v2.0',
                command: () => this.openAddNewRefDialog('yaml', 'v2.0'),
              },
            ],
          },
          {
            label: 'JSON',
            items: [
              {
                label: 'v3.1',
                command: () => this.openAddNewRefDialog('json', 'v3.1'),
              },
              {
                label: 'v3.0',
                command: () => this.openAddNewRefDialog('json', 'v3.0'),
              },
              {
                label: 'v2.0',
                command: () => this.openAddNewRefDialog('json', 'v2.0'),
              },
            ],
          },
        ],
      },
      {
        label: 'New Model',
        icon: 'pi pi-plus',
        items: [
          {
            label: 'JSON Schema (YAML)',
            icon: 'pi pi-file',
            command: () => this.createNewRefModel('yaml'),
          },
          {
            label: 'JSON Schema (JSON)',
            icon: 'pi pi-file',
            command: () => this.createNewRefModel('json'),
          },
        ],
      },
      {
        label: 'Import',
        icon: 'pi pi-download',
        items: [
          {
            label: 'YAML',
            icon: 'pi pi-file',
            command: () => this.triggerFileUpload('yaml'),
          },
          {
            label: 'JSON',
            icon: 'pi pi-file',
            command: () => this.triggerFileUpload('json'),
          },
          // {
          //   label: 'Postman Collection',
          //   icon: 'pi pi-file',
          //   command: () => this.importPostmanCollection(),
          // },
        ],
      },

      {
        separator: true,
      },
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
        label: 'Rename',
        icon: 'pi pi-pencil',
        command: () => this.renameItem(),
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.selectedItem(),
      },
    ];
  }

  deleteReference(key: string): void {
    try {
      const allSpecs = this.apiDataService.getAllSwaggerSpecs();

      if (allSpecs[key]) {
        delete allSpecs[key];

        localStorage.setItem('swaggerSpecs', JSON.stringify(allSpecs));

        this.initializeComponentState();
      } else {
        console.warn(`Swagger spec with key "${key}" does not exist.`);
      }
    } catch (error) {
      console.error(`Error deleting Swagger spec with key "${key}":`, error);
    }
  }

  renameReference(): void {
    throw new Error('Method not implemented.');
  }

  exportReference(): void {
    this.isExportDialogVisible = true;
  }

  exportFile(): void {
    this.apiDataService.getSelectedSwaggerSpec().subscribe((swaggerSpec) => {
      if (swaggerSpec) {
        let fileContent: string;
        let fileType: string;
        let fileExtension: string;

        if (this.selectedFormat === 'json') {
          fileContent = JSON.stringify(swaggerSpec, null, 2);
          fileType = 'application/json';
          fileExtension = 'json';
        } else {
          fileContent = yaml.dump(swaggerSpec);
          fileType = 'text/yaml';
          fileExtension = 'yaml';
        }

        const fileName = `${
          swaggerSpec.info?.title || 'openapi'
        }.${fileExtension}`;
        this.downloadFile(fileContent, fileName, fileType);
      } else {
        console.error('No Swagger specification is currently selected.');
      }

      this.isExportDialogVisible = false;
    });
  }

  copyToClipboard(): void {
    this.apiDataService.getSelectedSwaggerSpec().subscribe((swaggerSpec) => {
      if (swaggerSpec) {
        let contentToCopy: string;

        if (this.selectedFormat === 'json') {
          contentToCopy = JSON.stringify(swaggerSpec, null, 2);
        } else {
          contentToCopy = yaml.dump(swaggerSpec);
        }

        navigator.clipboard.writeText(contentToCopy).then(
          () => {
            console.log('Content copied to clipboard.');
          },
          (err) => {
            console.error('Failed to copy content: ', err);
          }
        );
      } else {
        console.error('No Swagger specification is currently selected.');
      }
    });
  }

  private downloadFile(
    content: string,
    fileName: string,
    fileType: string
  ): void {
    const blob = new Blob([content], { type: fileType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  }

  importPostmanCollection(): void {
    throw new Error('Method not implemented.');
  }

  handleFileUpload(event: any, fileType?: string): void {
    const files = event?.target?.files || [];
    if (files.length > 0) {
      (Array.from(files) as File[]).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const fileContent = reader.result as string;
            let parsedContent;
            let normalizedFileName = file.name.replace(
              /\.(json|yaml|yml)$/i,
              ''
            );

            if (
              (!fileType || fileType === 'json') &&
              file.name.endsWith('.json')
            ) {
              parsedContent = JSON.parse(fileContent);
            } else if (
              (!fileType || fileType === 'yaml') &&
              (file.name.endsWith('.yaml') || file.name.endsWith('.yml'))
            ) {
              parsedContent = yaml.load(fileContent);
            } else {
              return;
            }

            if (
              !parsedContent ||
              (!parsedContent.swagger && !parsedContent.openapi) ||
              !parsedContent.info ||
              !parsedContent.paths
            ) {
              throw new Error(
                `Invalid Swagger/OpenAPI file: Missing required fields in ${file.name}.`
              );
            }

            this.apiDataService.storeSwaggerSpec(
              normalizedFileName,
              parsedContent
            );
            this.initializeComponentState();
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
          }
        };

        reader.readAsText(file);
      });

      event.target.value = '';
    }
  }

  triggerFileUpload(fileType: string): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = fileType === 'yaml' ? '.yaml,.yml' : '.json';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (event: any) =>
      this.handleFileUpload(event, fileType)
    );

    fileInput.click();
  }

  createNewRefModel(_arg0: string): void {
    throw new Error('Method not implemented.');
  }
  renameItem(): void {
    throw new Error('Method not implemented.');
  }
  importModel(): void {
    throw new Error('Method not implemented.');
  }
  createNewOpenApi(version: 'v3.1' | 'v3.0' | 'v2.0'): void {
    try {
      let newSpec: any;

      if (version === 'v3.1') {
        newSpec = {
          openapi: '3.1.0',
          info: {
            title: this.newOpenApiTitle,
            version: '1.0',
          },
          servers: [
            {
              url: 'http://localhost:3000',
            },
          ],
          paths: {
            '/users/{userId}': {
              parameters: [
                {
                  schema: {
                    type: 'integer',
                  },
                  name: 'userId',
                  in: 'path',
                  required: true,
                  description: 'Id of an existing user.',
                },
              ],
              get: {
                summary: 'Get User Info by User ID',
                operationId: 'get-users-userId',
                responses: {
                  '200': {
                    description: 'User Found',
                    content: {
                      'application/json': {
                        schema: {
                          $ref: '#/components/schemas/User',
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
              User: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                },
                required: ['id', 'firstName', 'lastName', 'email'],
              },
            },
          },
        };
      } else if (version === 'v3.0') {
        newSpec = {
          openapi: '3.0.0',
          info: {
            title: this.newOpenApiTitle,
            version: '1.0',
          },
          servers: [
            {
              url: 'http://localhost:3000',
            },
          ],
          paths: {
            '/users/{userId}': {
              parameters: [
                {
                  schema: {
                    type: 'integer',
                  },
                  name: 'userId',
                  in: 'path',
                  required: true,
                  description: 'Id of an existing user.',
                },
              ],
              get: {
                summary: 'Get User Info by User ID',
                operationId: 'get-users-userId',
                responses: {
                  '200': {
                    description: 'User Found',
                    content: {
                      'application/json': {
                        schema: {
                          $ref: '#/components/schemas/User',
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
              User: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                },
                required: ['id', 'firstName', 'lastName', 'email'],
              },
            },
          },
        };
      }

      this.apiDataService.storeSwaggerSpec(this.newOpenApiTitle, newSpec);

      console.log(`New OpenAPI specification stored: ${this.newOpenApiTitle}`);

      this.initializeComponentState();
    } catch (error) {
      console.error('Error creating new OpenAPI/Swagger document:', error);
    }
  }

  renameModel(): void {
    throw new Error('Method not implemented.');
  }

  deleteModel(): void {
    throw new Error('Method not implemented.');
  }

  filter(): void {
    const query = this.searchQuery.toLowerCase().trim();

    if (!query) {
      this.apiDataService.getSelectedSwaggerSpec().subscribe((swaggerSpec) => {
        if (swaggerSpec && swaggerSpec.paths) {
          this.paths = this.getPaths(swaggerSpec);
          this.models = this.getModels(swaggerSpec);
        }
      });
      return;
    }

    this.apiDataService.getSelectedSwaggerSpec().subscribe((swaggerSpec) => {
      if (swaggerSpec && swaggerSpec.paths) {
        const originalPaths = this.getPaths(swaggerSpec);
        const originalModels = this.getModels(swaggerSpec);

        this.paths = Object.fromEntries(
          Object.entries(originalPaths).filter(([pathKey, methods]) => {
            return (
              pathKey.toLowerCase().includes(query) ||
              methods.some(
                (method: any) =>
                  method.summary && method.summary.toLowerCase().includes(query)
              )
            );
          })
        );

        this.models = originalModels.filter((model: any) =>
          model.name.toLowerCase().includes(query)
        );
      }
    });
  }

  createNewModel(): void {
    this.visibleAddModel = true;
  }

  saveNewModel(): void {
    const newModelKey = this.newModelName.trim();

    if (!newModelKey) {
      console.warn('Model name cannot be empty.');
      return;
    }

    if (!this.models) {
      this.models = [];
    }

    const newModel = {
      name: newModelKey,
      title: this.newModelName,
      type: 'object',
      properties: {
        exampleField: { type: 'string', example: 'Example value' },
      },
      required: ['exampleField'],
      description: `Auto-generated model for ${newModelKey}`,
    };

    this.models.push(newModel);

    console.log('New model added locally:', newModel);

    // Use `pipe(take(1))` to ensure only one emission
    this.apiDataService
      .getSelectedSwaggerSpec()
      .pipe(take(1)) // Ensures that only the first emission is handled
      .subscribe((swaggerSpec) => {
        if (!swaggerSpec) {
          console.error('No Swagger spec found.');
          return;
        }

        if (!swaggerSpec.components) {
          swaggerSpec.components = { schemas: {} };
        }
        if (!swaggerSpec.components.schemas) {
          swaggerSpec.components.schemas = {};
        }

        if (swaggerSpec.components.schemas[newModelKey]) {
          console.warn('Model with this key already exists:', newModelKey);
          return;
        }

        swaggerSpec.components.schemas[newModelKey] = {
          title: this.newModelName,
          type: 'object',
          properties: {
            exampleField: { type: 'string', example: 'Example value' },
          },
          required: ['exampleField'],
          description: `Auto-generated model for ${newModelKey}`,
        };

        this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);

        console.log(
          'New model added to selected Swagger spec:',
          swaggerSpec.components.schemas[newModelKey]
        );

        this.models = [...this.models];
        
        this,this.fetchSidebar();

        this.visibleAddModel = false;
      });
  }

  saveAndNavigate(): void {
    this.saveNewModel();

    this.router.navigate(['/schemas', this.newModelName.trim()]);
    this.newModelName = '';
  }

  addOperation(method: string, pathKey: string): void {
    console.log(`Adding ${method.toUpperCase()} operation to path: ${pathKey}`);

    this.apiDataService
      .getSelectedSwaggerSpec()
      .pipe(take(1))
      .subscribe((swaggerSpec: any) => {
        if (!swaggerSpec || !swaggerSpec.paths) {
          console.error('No selected Swagger spec found or paths missing.');
          return;
        }

        if (!swaggerSpec.paths[pathKey]) {
          swaggerSpec.paths[pathKey] = {};
        }

        if (swaggerSpec.paths[pathKey][method]) {
          console.warn(
            `Method "${method}" already exists for path "${pathKey}"`
          );
          return;
        }

        swaggerSpec.paths[pathKey][method] = {
          summary: `Default ${method.toUpperCase()} operation for ${pathKey}`,
          description: `This is an auto-generated ${method.toUpperCase()} operation.`,
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
        };

        this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);

        console.log(
          `Added ${method.toUpperCase()} operation to path "${pathKey}" in the selected Swagger spec.`
        );

        this.paths = { ...this.paths };
        this.fetchSidebar();
      });
  }

  renamePath(originalKey: string, event: any): void {
    const newPathKey = (event.target as HTMLInputElement).value.trim();

    if (!newPathKey) {
      console.warn('New path key is invalid or empty.');
      this.cancelEditPath(originalKey);
      return;
    }

    console.log(`Renaming path from "${originalKey}" to "${newPathKey}"`);

    this.apiDataService.getSwaggerSpec().subscribe((swaggerSpec: any) => {
      if (swaggerSpec && swaggerSpec.paths) {
        if (swaggerSpec.paths[originalKey]) {
          swaggerSpec.paths[newPathKey] = swaggerSpec.paths[originalKey];

          delete swaggerSpec.paths[originalKey];

          this.paths[newPathKey] = this.paths[originalKey];
          delete this.paths[originalKey];

          console.log(
            `Successfully renamed path from "${originalKey}" to "${newPathKey}"`
          );

          this.apiDataService.setPaths(
            JSON.stringify(swaggerSpec.paths, null, 2)
          );
          this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);

          console.log('Updated Swagger spec with renamed path:', swaggerSpec);

          this.paths = { ...this.paths };
        } else {
          console.warn(
            `Original path "${originalKey}" does not exist in the Swagger spec.`
          );
        }
      } else {
        console.error('Failed to fetch Swagger spec.');
      }
    });

    this.editingPath = null;
  }

  deletePath(selectedPath: any): void {
    this.apiDataService
      .getSwaggerSpec()
      .pipe(take(1))
      .subscribe((swaggerSpec) => {
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

  renameEndpoint(pathKey: any, methodKey: any, newSummary: string): void {
    if (!pathKey || !methodKey || !newSummary) {
      console.warn('Invalid pathKey, methodKey, or newSummary.');
      return;
    }

    this.apiDataService.getSwaggerSpec().subscribe((swaggerSpec: any) => {
      if (swaggerSpec && swaggerSpec.paths) {
        const path = swaggerSpec.paths[pathKey.key];

        if (!path || !path[methodKey.method]) {
          console.warn(
            `Method "${methodKey.method}" does not exist for path "${pathKey.key}".`
          );
          return;
        }

        path[methodKey.method].summary = newSummary;

        const endpointIndex = this.paths[pathKey.key]?.findIndex(
          (endpoint: any) => endpoint.method === methodKey.method
        );
        if (endpointIndex !== -1) {
          this.paths[pathKey.key][endpointIndex].summary = newSummary;
        }

        this.apiDataService.setPaths(
          JSON.stringify(swaggerSpec.paths, null, 2)
        );
        this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);

        this.paths = { ...this.paths };
      } else {
        console.error('Failed to fetch Swagger spec.');
      }
    });
  }

  openRenameEndpointDialog(path: any, method: any): void {
    this.selectedPath = path;
    this.selectedMethod = method;
    this.newMethodKey = '';
    this.renameEndpointDialogVisible = true;
  }

  saveRenamedEndpoint(): void {
    if (!this.newMethodKey.trim()) {
      console.warn('New method name cannot be empty.');
      return;
    }

    this.renameEndpoint(
      this.selectedPath,
      this.selectedMethod,
      this.newMethodKey
    );
    this.renameEndpointDialogVisible = false;
    this.selectedPath = null;
    this.selectedMethod = null;
  }

  deleteEndpoint(pathKey: any, methodKey: any): void {
    console.log(
      `Deleting endpoint: ${methodKey.method} from path: ${pathKey.key}`
    );

    this.apiDataService
      .getSelectedSwaggerSpec()
      .subscribe((swaggerSpec: any) => {
        if (swaggerSpec && swaggerSpec.paths) {
          console.log(
            'Available Paths Before Deletion:',
            Object.keys(swaggerSpec.paths)
          );

          if (
            swaggerSpec.paths[pathKey.key] &&
            swaggerSpec.paths[pathKey.key][methodKey.method]
          ) {
            delete swaggerSpec.paths[pathKey.key][methodKey.method];
            console.log(
              `Endpoint "${methodKey.method}" deleted successfully from path "${pathKey.key}"`
            );

            if (this.paths[pathKey.key]) {
              const pathEndpoints: any = this.paths[pathKey.key];
              this.paths[pathKey.key] = pathEndpoints.filter(
                (endpoint: any) => endpoint.method !== methodKey.method
              );
            }

            this.apiDataService.setPaths(
              JSON.stringify(swaggerSpec.paths, null, 2)
            );
            this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);

            console.log('Updated Swagger spec:', swaggerSpec);

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

  showDialog() {
    this.visibleAddPath = true;
  }

  createNewPath(): void {
    this.visibleAddPath = true;
  }

  saveNewPath(): void {
    const newPathKey = this.newPathName.trim();

    if (!newPathKey) {
      console.warn('Path name cannot be empty.');
      return;
    }

    if (!this.paths) {
      this.paths = {};
    }

    this.paths[newPathKey] = [
      {
        method: 'get',
        summary: `Default GET operation for ${newPathKey}`,
        description: `Auto-generated GET operation for ${newPathKey}.`,
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
      },
    ];

    this.apiDataService
      .getSelectedSwaggerSpec()
      .pipe(take(1))
      .subscribe((swaggerSpec) => {
        if (!swaggerSpec || !swaggerSpec.paths) {
          console.error('No selected Swagger spec found or paths missing.');
          return;
        }

        if (swaggerSpec.paths[newPathKey]) {
          console.warn('Path with this key already exists:', newPathKey);
          return;
        }

        swaggerSpec.paths[newPathKey] = {
          get: {
            summary: `Default GET operation for ${newPathKey}`,
            description: `Auto-generated GET operation for ${newPathKey}.`,
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
          },
        };

        this.apiDataService.saveSwaggerSpecToStorage(swaggerSpec);

        console.log('New path added to the selected Swagger spec:', newPathKey);

        this.newPathName = '';
        this.visibleAddPath = false;
        this.paths = { ...this.paths };
      });
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
    if (!swaggerSpec.components || !swaggerSpec.components.schemas) {
      return [];
    }

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

    this.contextHeaderMenu.model = [...this.topLevelPathContextMenuItems];

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
        command: () => this.openRenameEndpointDialog(path, method),
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

    const existingMethods = path.value.map((methods: any) =>
      methods.method.toLowerCase()
    );

    const allMethods = [
      'get',
      'post',
      'put',
      'delete',
      'patch',
      'head',
      'options',
      'trace',
    ];

    const availableMethods = allMethods.filter(
      (method) => !existingMethods.includes(method)
    );

    this.pathMethodContextMenu.model = [
      {
        label: 'New Operation',
        items: availableMethods.map((method: string) => ({
          label: method.toUpperCase(),
          command: () => this.addOperation(method, path.key),
        })),
      },
      { separator: true },
      { label: 'Copy Path', command: () => this.copyPath() },
      {
        label: 'Rename Path',
        command: () => {
          this.editingPath = path.key;
          setTimeout(() => this.inputElement?.nativeElement?.focus(), 0);
        },
      },
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
    this.contextHeaderMenu.model = [...this.topLevelModelContextMenuItems];
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
    this.contextMenu.model = [...this.modelContextMenuItems];
    this.contextMenu.show(event);
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
