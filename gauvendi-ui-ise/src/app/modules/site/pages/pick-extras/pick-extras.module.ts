import {NgModule} from '@angular/core';
import {RouterModule} from "@angular/router";
import {pickExtrasGuard} from "@app/modules/site/pages/pick-extras/guard/pick-extras.guard";
import {PickExtrasStoreModule} from "@store/pick-extras/pick-extras-store.module";


@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        loadComponent: () => import('./pick-extras.component').then(c => c.PickExtrasComponent),
        canActivate: [pickExtrasGuard]
      }
    ]),
    PickExtrasStoreModule
  ]
})
export class PickExtrasModule {
}
