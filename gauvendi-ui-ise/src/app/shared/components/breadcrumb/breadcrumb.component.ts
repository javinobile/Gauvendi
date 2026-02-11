import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRouterService } from '@app/services/app-router.service';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import { select, Store } from '@ngrx/store';
import { selectorHotelName } from '@store/hotel/hotel.selectors';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbComponent {
  @Input() breadcrumb: {
    name: string;
    isSelected: boolean;
    url: string;
  }[];
  store = inject(Store);
  route = inject(ActivatedRoute);
  router = inject(Router);
  appRouterService = inject(AppRouterService);

  hotelName$ = this.store.pipe(select(selectorHotelName));

  navigate(url: string): void {
    switch (url) {
      case RouterPageKey.recommendation:
        const queryParams = this.route.snapshot.queryParams;
        const prepareQueryParams = {
          [RouteKeyQueryParams.checkInDate]:
            queryParams[RouteKeyQueryParams.checkInDate],
          [RouteKeyQueryParams.checkOutDate]:
            queryParams[RouteKeyQueryParams.checkOutDate],
          [RouteKeyQueryParams.numberOfRoom]:
            queryParams[RouteKeyQueryParams.numberOfRoom],
          [RouteKeyQueryParams.lang]: queryParams[RouteKeyQueryParams.lang],
          [RouteKeyQueryParams.hotelCode]:
            queryParams[RouteKeyQueryParams.hotelCode],
          [RouteKeyQueryParams.currency]:
            queryParams[RouteKeyQueryParams.currency],
          [RouteKeyQueryParams.specificRoom]:
            queryParams[RouteKeyQueryParams.specificRoom],
          [RouteKeyQueryParams.promoCode]:
            queryParams[RouteKeyQueryParams.promoCode],
          [RouteKeyQueryParams.customizeStay]:
            queryParams[RouteKeyQueryParams.customizeStay]
        };

        this.appRouterService.updateRouteQueryParams(prepareQueryParams, {
          navigateUrl: RouterPageKey.recommendation
        });
        break;
      case RouterPageKey.pickExtras:
        this.appRouterService.updateRouteQueryParams(
          this.route.snapshot.queryParams,
          {
            navigateUrl: RouterPageKey.pickExtras
          }
        );
        break;
      case RouterPageKey.summaryPayment:
        this.appRouterService.updateRouteQueryParams(
          this.route.snapshot.queryParams,
          {
            navigateUrl: RouterPageKey.summaryPayment
          }
        );
        break;
      default:
        break;
    }
  }

  protected readonly RouterPageKey = RouterPageKey;
}
