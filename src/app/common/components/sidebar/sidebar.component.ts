import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Renderer2,
  AfterViewInit,
} from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { ApiDataService } from '../../../services/api-data.service';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: true,
  imports: [PanelMenuModule, ToastModule, ContextMenuModule, ButtonModule],
  providers: [MessageService],
})
export class SidebarComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('cm') contextMenu!: ContextMenu;
  @ViewChild('panelMenu', { static: false }) panelMenu!: ElementRef;

  items: MenuItem[] = [];
  swaggerSubscription!: Subscription;
  contextMenuItems: MenuItem[] = [];
  selectedMenuItem: MenuItem | null = null;
  topLevelContextMenuItems: MenuItem[] = [];

  constructor(
    private apiDataService: ApiDataService,
    private messageService: MessageService,
    private renderer: Renderer2
  ) {}

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
  private buildMenuItems(swaggerSpec: any): MenuItem[] {
    return [
      {
        label: 'Paths',
        icon: 'pi pi-folder',
        items: this.getPaths(swaggerSpec),
        styleClass: 'top-level-item',
        data: { isTopLevel: true },
      },
      {
        label: 'Models',
        icon: 'pi pi-folder',
        items: this.getModels(swaggerSpec),
        styleClass: 'top-level-item',
        data: { isTopLevel: true },
        contextmenu: 'cm',
      },
      {
        label: 'Request Bodies',
        icon: 'pi pi-folder',
        items: this.getRequestBodies(swaggerSpec),
        styleClass: 'top-level-item',
        data: { isTopLevel: true },
        contextmenu: 'cm',
      },
      {
        label: 'Responses',
        icon: 'pi pi-folder',
        items: this.getResponses(swaggerSpec),
        styleClass: 'top-level-item',
        data: { isTopLevel: true },
      },
      {
        label: 'Parameters',
        icon: 'pi pi-folder',
        items: this.getParameters(swaggerSpec),
        styleClass: 'top-level-item',
        data: { isTopLevel: true },
      },
      {
        label: 'Examples',
        icon: 'pi pi-folder',
        items: this.getExamples(swaggerSpec),
        styleClass: 'top-level-item',
        data: { isTopLevel: true },
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

  isHttpMethod(method: string): boolean {
    const validHttpMethods = ['get', 'post', 'put', 'delete', 'patch'];
    return validHttpMethods.includes(method.toLowerCase());
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

  ngOnInit(): void {
    this.setupContextMenuItems();

    this.swaggerSubscription = this.apiDataService.getSwaggerSpec().subscribe({
      next: (swaggerSpec) => {
        if (swaggerSpec) {
          this.items = this.buildMenuItems(swaggerSpec);
          console.log('Menu items:', this.items);
        }
      },
      error: (error) => {
        console.error('Error fetching Swagger spec:', error);
      },
    });
  }

  ngAfterViewInit(): void {
    if (this.panelMenu && this.panelMenu.nativeElement) {
      this.addContextMenuListeners();
    }
  }

  private addContextMenuListeners(): void {
    if (!this.panelMenu || !this.panelMenu.nativeElement) {
      console.error('panelMenu is not defined');
      return;
    }

    const menuItems = this.panelMenu.nativeElement.querySelectorAll(
      '.p-panelmenu-header'
    );
    console.log('Found menu items:', menuItems.length); // Log the count of found items

    if (menuItems.length === 0) {
      console.warn(
        'No menu items found. Check the selector or ensure items are rendered.'
      );
    }

    menuItems.forEach((menuItem: HTMLElement) => {
      console.log('Found menu item:', menuItem.innerText.trim());
      this.renderer.listen(menuItem, 'contextmenu', (event: MouseEvent) =>
        this.onRightClick(event, menuItem)
      );
    });
  }

  private setupContextMenuItems(): void {
    this.contextMenuItems = [
      {
        label: 'Open',
        icon: 'pi pi-folder-open',
        command: () => this.openItem(),
      },
      { label: 'Edit', icon: 'pi pi-pencil', command: () => this.editItem() },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteItem(),
      },
      { separator: true },
      {
        label: 'Properties',
        icon: 'pi pi-info-circle',
        command: () => this.showProperties(),
      },
    ];

    this.topLevelContextMenuItems = [
      {
        label: 'View Details',
        icon: 'pi pi-info-circle',
        command: () => this.viewDetails(),
      },
      {
        label: 'Refresh',
        icon: 'pi pi-refresh',
        command: () => this.refresh(),
      },
    ];
  }

  onRightClick(event: MouseEvent, menuItem: HTMLElement): void {
    event.preventDefault(); // Prevent the default context menu

    const itemLabel = menuItem.innerText.trim();
    const clickedItem = this.findMenuItem(itemLabel, this.items);

    if (clickedItem) {
      console.log('Right-clicked item:', clickedItem);

      const isTopLevel = clickedItem['data']?.isTopLevel;
      this.contextMenu.model = isTopLevel
        ? this.topLevelContextMenuItems
        : this.contextMenuItems;
      this.contextMenu.show(event);
    }
  }

  private findMenuItem(label: string, items: MenuItem[]): MenuItem | null {
    for (const item of items) {
      if (item.label === label) {
        return item;
      }
      if (item.items) {
        const found = this.findMenuItem(label, item.items);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  ngOnDestroy(): void {
    if (this.swaggerSubscription) {
      this.swaggerSubscription.unsubscribe();
    }
  }
}
