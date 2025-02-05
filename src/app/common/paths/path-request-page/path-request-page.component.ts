import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { EditorModule } from 'primeng/editor';
import { DividerModule } from 'primeng/divider';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MenuItem } from 'primeng/api';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { TreeTableModule } from 'primeng/treetable';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { SchemeTypeOverlayPanelComponent } from '../../components/scheme-type-overlay-panel/scheme-type-overlay-panel.component';
import { RefButtonComponent } from '../../components/ref-button/ref-button.component';
import { AddSchemeButtonComponent } from '../../components/add-scheme-button/add-scheme-button.component';


@Component({
  selector: 'app-path-request-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EditorModule,
    DividerModule,
    SplitButtonModule,
    ToastModule,
    TooltipModule,
    TreeTableModule,
    OverlayPanelModule,
    SchemeTypeOverlayPanelComponent,
    RefButtonComponent,
    AddSchemeButtonComponent,
  ],
  templateUrl: './path-request-page.component.html',
  styleUrls: ['./path-request-page.component.css'],
})
export class PathRequestPageComponent implements OnInit {
  @Input() methodDetails!: FormGroup;
  //TODO: Make the page display body like scheme & make discription
  requestBodyValue!: string;
  menuItems: MenuItem[] = [];
  activeTab: string = 'schema';
  selectedSchema: any;

  ngOnInit(): void {
    this.initializeRequestBody();
    this.menuItems = [
      {
        label: 'application/xml',
        command: () => this.onSelect('application/xml'),
      },
      {
        label: 'multipart/form-data',
        command: () => this.onSelect('multipart/form-data'),
      },
      { label: 'text/html', command: () => this.onSelect('text/html') },
      {
        label: 'application/json',
        command: () => this.onSelect('application/json'),
      },
      // Add more MIME types as needed
    ];
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  initializeRequestBody(): void {
    if (this.methodDetails && this.methodDetails.get('requestBody')) {
      this.requestBodyValue =
        this.methodDetails.get('requestBody')?.value || '';
    } else {
      console.error('methodDetails or requestBody control is not defined.');
    }
  }

  onSelect(type: string): void {
    console.log('Selected MIME type:', type);
    // TODO: Handle the selection here
  }

  updateRequestBody(): void {
    if (this.methodDetails) {
      this.methodDetails.get('requestBody')?.setValue(this.requestBodyValue);
    }
  }
}
