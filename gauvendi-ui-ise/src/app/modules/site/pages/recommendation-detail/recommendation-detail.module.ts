import {NgModule} from '@angular/core';
import {RouterModule} from "@angular/router";
import {PickExtrasStoreModule} from "@store/pick-extras/pick-extras-store.module";


@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild([
      {
        path: '',
        loadComponent: () => import('./recommendation-detail.component').then(c => c.RecommendationDetailComponent)
      }
    ]),
    PickExtrasStoreModule
  ]
})
export class RecommendationDetailModule {
}
