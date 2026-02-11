import { OverlayRef } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { CalendarMobileComponent } from '@app/modules/site/components/calendar-mobile/calendar-mobile.component';
import { OptionUnitsInfoComponent } from '@app/shared/components/option-units-info/option-units-info.component';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { InputComponent } from '@app/shared/form-controls/input/input.component';
import { DateWithLocalePipe } from '@app/shared/pipes/date-with-locale.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { select } from '@ngrx/store';
import { selectorHotelRetailFeatureList } from '@store/hotel/hotel.selectors';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { SearchBarAbstractComponent } from '../search-bar-abstract/search-bar-abstract.component';
import { TravelOverlayMobileComponent } from '../travel-overlay-mobile/travel-overlay-mobile.component';
import { RouteKeyQueryParams } from '@app/constants/RouteKey';

@Component({
  selector: 'app-search-bar-content-mobile',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    FilterSvgDirective,
    InputComponent,
    MatIconModule,
    ReactiveFormsModule,
    MatTabsModule,
    CalendarMobileComponent,
    DateWithLocalePipe,
    OptionUnitsInfoComponent,
    TravelOverlayMobileComponent
  ],
  templateUrl: './search-bar-content-mobile.component.html',
  styleUrls: ['./search-bar-content-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarContentMobileComponent extends SearchBarAbstractComponent {
  isOpen: boolean;
  overlayRef: OverlayRef;

  selectedView$ = new BehaviorSubject(0);
  value$ = new BehaviorSubject<any>(null);

  spaceTypeList$ = this.store.pipe(
    select(selectorHotelRetailFeatureList),
    map((data) =>
      data?.filter((feature) => feature?.hotelRetailCategory?.code === 'SPT')
    )
  );

  override ngOnInit(): void {
    super.ngOnInit();
    const promoCode = this.route.snapshot.queryParams[RouteKeyQueryParams.promoCode];
    if (promoCode) {
      this.promoCtrl.setValue(promoCode);
    }
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
  }

  closeDialog(): void {
    this.isOpen = false;
    setTimeout(() => {
      this.overlayRef?.detach();
    }, 500);
  }

  override onSearch(): void {
    this.value$.next('search');
    this.closeDialog();
  }
}
