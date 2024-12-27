import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiDataService } from '../../services/api-data.service';
import { CommonModule } from '@angular/common';
import { CodeViewerComponent } from '../components/code-viewer/code-viewer.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reference',
  standalone: true,
  imports: [CommonModule, CodeViewerComponent],
  templateUrl: './reference.component.html',
  styleUrls: ['./reference.component.css'],
})
export class ReferenceComponent implements OnInit, OnDestroy {
  swaggerKeys: string[] = [];
  selectedKey: string | null = null;
  selectedSpec: any = null;
  selectedFormat: 'json' | 'yaml' = 'json';
  errorMessage: string | null = null;

  private selectedSpecSubscription!: Subscription;

  constructor(
    private apiDataService: ApiDataService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeComponentState();

    this.route.params.subscribe((params) => {
      const referenceKey = params['reference'];
      if (referenceKey) {
        this.apiDataService.setSelectedSwaggerSpec(referenceKey);
        this.selectedKey = referenceKey;
      } else if (this.swaggerKeys.length > 0) {
        const defaultKey = this.swaggerKeys[0];
        this.router.navigate(['/reference', defaultKey]);
      }
    });

    this.selectedSpecSubscription = this.apiDataService
      .getSelectedSwaggerSpec()
      .subscribe({
        next: (spec) => {
          if (spec) {
            this.selectedSpec = spec;
            this.selectedKey = this.detectKey(spec);
            this.selectedFormat = this.detectFormat(
              this.selectedKey || '',
              spec
            );
            this.errorMessage = null;
          } else {
            this.selectedSpec = null;
            this.errorMessage = 'No Swagger specification selected.';
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching selected Swagger spec:', error);
          this.errorMessage = 'Error loading Swagger specification.';
        },
      });
  }

  initializeComponentState(): void {
    this.swaggerKeys = Object.keys(this.apiDataService.getAllSwaggerSpecs());

    const spec = this.apiDataService.getSelectedSwaggerSpecValue();

    if (spec) {
      this.selectedSpec = spec;
      this.selectedKey = this.detectKey(spec);
      this.selectedFormat = this.detectFormat(this.selectedKey || '', spec);
      this.errorMessage = null;
    } else {
      this.selectedSpec = null;
      this.errorMessage = 'No Swagger specification selected.';
    }
  }

  detectKey(spec: any): string | null {
    return (
      Object.entries(this.apiDataService.getAllSwaggerSpecs()).find(
        ([, value]) => value === spec
      )?.[0] || null
    );
  }

  detectFormat(referenceKey: string, spec: any): 'json' | 'yaml' {
    if (referenceKey.endsWith('.yaml') || referenceKey.endsWith('.yml')) {
      return 'yaml';
    } else if (referenceKey.endsWith('.json')) {
      return 'json';
    }

    try {
      JSON.stringify(spec);
      return 'json';
    } catch {
      return 'yaml';
    }
  }

  switchSpecFromDropdown(event: any): void {
    const key = event.target.value;
    this.selectedKey = key;
    this.apiDataService.setSelectedSwaggerSpec(key);
    this.router.navigate(['/reference', key]);
  }

  ngOnDestroy(): void {
    if (this.selectedSpecSubscription) {
      this.selectedSpecSubscription.unsubscribe();
    }
  }
}
