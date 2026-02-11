import {NgModule} from '@angular/core';
import {RouterModule} from "@angular/router";
import {summaryPaymentGuard} from "@app/modules/site/pages/summary-payment/guard/summary-payment.guard";


@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        loadComponent: () => import('./summary-payment.component').then(c => c.SummaryPaymentComponent),
        canActivate: [summaryPaymentGuard]
      }
    ])
  ]
})
export class SummaryPaymentModule {
}
