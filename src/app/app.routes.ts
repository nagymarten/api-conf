import { Routes } from '@angular/router';
import { SidebarComponent } from './common/components/sidebar/sidebar.component';
import { PathsComponent } from './common/pahts/paths.component';
import { ModelsComponent } from './common/models/models.component';
import { ResponsesComponent } from './common/responses/responses.component';

export const routes: Routes = [
  { path: '', redirectTo: '', pathMatch: 'full' },
  { path: 'path', component: SidebarComponent },
  { path: 'path/:path/:method', component: PathsComponent },
  { path: 'models', component: ModelsComponent },
  { path: 'models/:model', component: ModelsComponent },
  { path: 'responses', component: ResponsesComponent },
  { path: 'responses/:response', component: ResponsesComponent },
];
