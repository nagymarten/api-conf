import { Routes } from '@angular/router';
import { SidebarComponent } from './common/components/sidebar/sidebar.component';
import { PathsComponent } from './common/paths/paths.component';
import { SchemasComponent } from './common/schemas/schemas.component';
import { ResponsesComponent } from './common/responses/responses.component';
import { ReferenceComponent } from './common/reference/reference.component';

export const routes: Routes = [
  { path: '', redirectTo: '', pathMatch: 'full' },
  { path: 'path', component: SidebarComponent },
  { path: 'path/:path/:method', component: PathsComponent },
  { path: 'schemas', component: SchemasComponent },
  { path: 'schemas/:schema', component: SchemasComponent },
  { path: 'responses', component: ResponsesComponent },
  { path: 'responses/:response', component: ResponsesComponent },
  { path: 'reference', component: ReferenceComponent },
  { path: 'reference/:reference', component: ReferenceComponent },
  { path: '**', redirectTo: '' }, 
];
