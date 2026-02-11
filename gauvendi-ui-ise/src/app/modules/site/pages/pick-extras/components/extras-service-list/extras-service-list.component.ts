import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  input,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AmenityCodeEnum } from '@app/constants/extras.const';
import { IRoomSummary } from '@app/models/common.model';
import { HandlerExtrasService } from '@app/modules/site/pages/pick-extras/services/handler-extras.service';
import { AppRouterService } from '@app/services/app-router.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { selectorCurrencyCodeSelected } from '@app/state-management/router.selectors';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import {
  HotelAmenity,
  HotelTaxSettingEnum
} from '@core/graphql/generated/graphql';
import { select, Store } from '@ngrx/store';
import { selectorHotelRate } from '@store/hotel/hotel.selectors';
import { amenityServicesOfRoom } from '@store/pick-extras/pick-extras.selectors';
import { Observable, share } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExtrasServiceByCategoryComponent } from '../extras-service-by-category/extras-service-by-category.component';

@Component({
  selector: 'app-extras-service-list',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ExtrasServiceByCategoryComponent],
  templateUrl: './extras-service-list.component.html',
  styleUrls: ['./extras-service-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExtrasServiceListComponent implements OnChanges {
  @Input() availableMealPlans: HotelAmenity[];
  @Input() availableServices: HotelAmenity[];
  @Input() includedServices: HotelAmenity[];
  @Input() index: number;
  @Input() roomName: string;
  availableAmenities = input<HotelAmenity[]>();
  roomSummary = input<IRoomSummary>();

  @Output() calculatePayment = new EventEmitter();

  availableAmenitiesMapped = computed(() => {
    const hasPets = !!this.roomSummary()?.pets;
    return this.availableAmenities()?.filter(
      (item) => hasPets || item.code !== AmenityCodeEnum.PET_SURCHARGE
    );
  });
  currencyRate$: Observable<number> = this.store.pipe(
    select(selectorHotelRate),
    share()
  );
  currencyCode$: Observable<string> = this.store.pipe(
    select(selectorCurrencyCodeSelected),
    share()
  );
  isIncludedTax$ = this.configService.isePricingDisplayConfig$.pipe(
    map((mode) => mode === HotelTaxSettingEnum.Inclusive)
  );

  servicesChainByIdx$: Observable<string>;

  constructor(
    private readonly appRouterService: AppRouterService,
    private readonly configService: HotelConfigService,
    private readonly handlerExtrasService: HandlerExtrasService,
    private readonly route: ActivatedRoute,
    private readonly store: Store
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('index') && !isNaN(this.index)) {
      this.servicesChainByIdx$ = this.store.pipe(
        select(amenityServicesOfRoom(this.index)),
        share()
      );
    }
  }

  handlerToggleService({ code }): void {
    const queryParams = this.route.snapshot.queryParams;
    const currentRoomService: string[] = this.handlerExtrasService.roomService(
      queryParams[RouteKeyQueryParams.roomServices],
      this.index
    );

    const idxItem = currentRoomService.findIndex(
      (x) => x.split('-')[0] === `${code}`
    );

    if (idxItem === -1) {
      currentRoomService.push(`${code}-1`);
    } else {
      currentRoomService.splice(idxItem, 1);
    }

    const newChainAllRoomService =
      this.handlerExtrasService.generateChainAllRoomService(
        queryParams[RouteKeyQueryParams.roomServices],
        currentRoomService,
        this.index
      );

    this.appRouterService.updateRouteQueryParams({
      ...queryParams,
      [RouteKeyQueryParams.roomServices]: newChainAllRoomService
    });

    setTimeout(() => {
      this.calculatePayment.emit();
    }, 300);
  }

  handlerChangeAmount({ code, amount }): void {
    const queryParams = this.route.snapshot.queryParams;
    const currentRoomService: string[] = this.handlerExtrasService.roomService(
      queryParams[RouteKeyQueryParams.roomServices],
      this.index
    );

    const idxItem = currentRoomService.findIndex(
      (x) => x.split('-')[0] === `${code}`
    );

    if (idxItem === -1) {
      currentRoomService.push(`${code}-1`);
    } else if (idxItem !== -1 && amount) {
      const [codeService] = this.handlerExtrasService.roomServiceAmount(
        currentRoomService[idxItem]
      );
      currentRoomService[idxItem] = `${codeService}-${amount}`;
    } else {
      currentRoomService.splice(idxItem, 1);
    }

    const newChainAllRoomService =
      this.handlerExtrasService.generateChainAllRoomService(
        queryParams[RouteKeyQueryParams.roomServices],
        currentRoomService,
        this.index
      );

    this.appRouterService.updateRouteQueryParams({
      ...queryParams,
      [RouteKeyQueryParams.roomServices]: newChainAllRoomService
    });

    setTimeout(() => {
      this.calculatePayment.emit();
    }, 300);
  }
}
