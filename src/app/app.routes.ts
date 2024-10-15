import { Routes , RouterModule } from '@angular/router';
import { PathComponent } from './common/path/path.component';
import { SidebarComponent } from './common/components/sidebar/sidebar.component';
import { ApiDetailComponent } from './common/components/api-detail/api-detail.component';
import { RequestBodiesComponent } from './common/request-bodies/request-bodies.component';

export const routes: Routes = [
  { path: '', redirectTo: '', pathMatch: 'full' },
  { path: 'api', component: SidebarComponent },
  { path: 'api/:path/:method', component: ApiDetailComponent },
];
