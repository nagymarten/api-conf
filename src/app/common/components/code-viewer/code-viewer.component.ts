import {
  Component,
  Input,
  ElementRef,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import hljs from 'highlight.js';
import * as yaml from 'js-yaml';

@Component({
  selector: 'app-code-viewer',
  standalone: true,
  imports: [],
  templateUrl: './code-viewer.component.html',
  styleUrl: './code-viewer.component.css',
})
export class CodeViewerComponent {
  @Input() code: any;
  @Input() format: 'json' | 'yaml' = 'json';

  formattedCode: string = '';

  constructor(private el: ElementRef, private cdr: ChangeDetectorRef) {}

  ngOnChanges(_changes: SimpleChanges): void {

    this.updateFormattedCode();
  }

  updateFormattedCode(): void {
    this.formattedCode =
      this.format === 'yaml'
        ? yaml.dump(this.code)
        : JSON.stringify(this.code, null, 2);

    this.cdr.detectChanges();

    this.highlightCode();
  }

  highlightCode(): void {
    const codeBlock = this.el.nativeElement.querySelector('code');

    if (codeBlock) {
      codeBlock.textContent = this.formattedCode;
      codeBlock.removeAttribute('data-highlighted');

      setTimeout(() => {
        hljs.highlightElement(codeBlock);
      }, 0);
    }
  }
}
