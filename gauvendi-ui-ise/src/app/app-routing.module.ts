import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MaintenanceGuard } from './guards/maintenance.guard';

const routes: Routes = [
  {
    path: 'maintenance',
    loadComponent: () =>
      import('./modules/maintenance/maintenance.component').then(
        (m) => m.MaintenanceComponent
      )
  },
  {
    path: 'message/404',
    pathMatch: 'full',
    loadComponent: () =>
      import('./modules/page-not-found/page-not-found.component').then(
        (c) => c.PageNotFoundComponent
      )
  },
  {
    path: 'adyen-checkout',
    loadComponent: () =>
      import('./modules/adyen-checkout/adyen-checkout.component').then(
        (m) => m.AdyenCheckoutComponent
      ),
    canActivate: [MaintenanceGuard]
  },
  {
    path: 'home',
    pathMatch: 'full',
    loadComponent: () =>
      import('./modules/home/home.component').then((c) => c.HomeComponent),
    canActivate: [MaintenanceGuard]
  },
  {
    path: '',
    loadChildren: () =>
      import('./modules/site/site.module').then((m) => m.SiteModule),
    canActivate: [MaintenanceGuard]
  },
  {
    path: '**',
    redirectTo: '/message/404'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
