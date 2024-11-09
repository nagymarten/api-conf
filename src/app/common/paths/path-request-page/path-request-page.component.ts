import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-path-request-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './path-request-page.component.html',
  styleUrls: ['./path-request-page.component.css'],
})
export class PathRequestPageComponent implements OnInit {
  @Input() methodDetails!: FormGroup;
  //TODO: Make the page display body like scheme & make discription
  requestBodyValue!: string;

  ngOnInit(): void {
    this.initializeRequestBody();
  }

  initializeRequestBody(): void {
    if (this.methodDetails && this.methodDetails.get('requestBody')) {
      this.requestBodyValue =
        this.methodDetails.get('requestBody')?.value || '';
    } else {
      console.error('methodDetails or requestBody control is not defined.');
    }
  }

  updateRequestBody(): void {
    if (this.methodDetails) {
      this.methodDetails.get('requestBody')?.setValue(this.requestBodyValue);
    }
  }
}
