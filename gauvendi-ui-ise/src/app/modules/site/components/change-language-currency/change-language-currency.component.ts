import { animate, style, transition, trigger } from '@angular/animations';
import { OverlayRef } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { AccessibilityService } from '@app/services/accessibility.service';
import { AppRouterService } from '@app/services/app-router.service';
import { CommonService } from '@app/services/common.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { HexToRgbaPipe } from '@app/shared/pipes/hex-to-rgba.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import { Currency } from '@core/graphql/generated/graphql';
import { DropdownItem } from '@models/dropdown-item.model';
import { Store } from '@ngrx/store';
import { loadStaticContent } from '@store/multi-lang/multi-lang.actions';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-change-language-currency',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe, HexToRgbaPipe],
  templateUrl: './change-language-currency.component.html',
  styleUrls: ['./change-language-currency.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('tooltip', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [animate('500ms', style({ opacity: 0 }))])
    ])
  ]
})
export class ChangeLanguageCurrencyComponent implements OnInit {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private appRouterService = inject(AppRouterService);
  private hotelConfigService = inject(HotelConfigService);
  private commonService = inject(CommonService);
  private accessibilityService = inject(AccessibilityService);

  @Input() data: {
    langList: DropdownItem[];
    currencies: Currency[];
    langSelected: DropdownItem;
    currencyCode: string;
  };
  isOpen: boolean;
  overlayRef: OverlayRef;
  selectedLang = null;
  selectedCurrency = null;

  value$ = new BehaviorSubject(null);
  hotelPrimary$ = this.hotelConfigService.hotelPrimaryColor$;

  ngOnInit(): void {
    this.selectedLang = this.data?.langSelected?.code;
    this.selectedCurrency = this.data?.currencyCode;
    this.overlayRef
      ?.outsidePointerEvents()
      .pipe(tap((__) => this.overlayRef?.detach()))
      .subscribe();
  }

  selectCurrency(currency: Currency): void {
    this.selectedCurrency = currency?.code;
  }

  selectLang(lang: DropdownItem): void {
    this.selectedLang = lang?.code;
  }

  onApply(): void {
    this.store.dispatch(
      loadStaticContent({
        locale: this.selectedLang
      })
    );
    const queryParams = {
      ...this.route.snapshot.queryParams,
      [RouteKeyQueryParams.lang]: this.selectedLang,
      [RouteKeyQueryParams.currency]: this.selectedCurrency
    };
    this.appRouterService.updateRouteQueryParams(queryParams, {
      done: () => {
        this.accessibilityService.loadAccessibility(this.selectedLang);
      }
    });
    this.overlayRef?.detach();
  }

  onApplyMobile(): void {
    this.store.dispatch(
      loadStaticContent({
        locale: this.selectedLang
      })
    );
    const queryParams = {
      ...this.route.snapshot.queryParams,
      [RouteKeyQueryParams.lang]: this.selectedLang,
      [RouteKeyQueryParams.currency]: this.selectedCurrency
    };
    this.appRouterService.updateRouteQueryParams(queryParams, {
      done: () => {
        this.accessibilityService.loadAccessibility(this.selectedLang);
      }
    });
    this.closeWithAnimation();
  }

  closePopover(): void {
    this.closeWithAnimation();
  }

  closeWithAnimation(): void {
    this.isOpen = false;
    setTimeout(() => {
      this.overlayRef?.detach();
    }, 500);
  }
}
