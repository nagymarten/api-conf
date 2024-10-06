import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiFormComponent } from './common/components/api-form/api-form.component';
import { SidebarComponent } from "./common/components/sidebar/sidebar.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ApiFormComponent,
    SidebarComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'api-conf';
}
