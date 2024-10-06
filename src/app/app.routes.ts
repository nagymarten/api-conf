import { Routes , RouterModule } from '@angular/router';
import { PathComponent } from './common/path/path.component';
import { NgModule } from '@angular/core';
import { SidebarComponent } from './common/components/sidebar/sidebar.component';
import { ApiDetailComponent } from './common/components/api-detail/api-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: '', pathMatch: 'full' },
  { path: 'api', component: SidebarComponent },
  { path: 'api/:path/:method', component: ApiDetailComponent },
  { path: 'path', component: PathComponent },
];
