import { animate, style, transition, trigger } from '@angular/animations';
import { A11yModule } from '@angular/cdk/a11y';
import { OverlayRef } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  signal,
  ViewChild
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RecommendationFlow } from '@app/models/recommendation-flow';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { DropdownChildrenAgeComponent } from '@app/shared/form-controls/dropdown-children-age/dropdown-children-age.component';
import { NumericStepComponent } from '@app/shared/form-controls/numeric-step/numeric-step.component';
import { CalculateAgePipe } from '@app/shared/pipes/calculate-age.pipe';
import { ParseFormGroupPipe } from '@app/shared/pipes/parse-form-group.pipe';
import { ReplaceStrPipe } from '@app/shared/pipes/replace-str.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { BehaviorSubject } from 'rxjs';
import { TravelOverlayAbstractComponent } from '../travel-overlay-abstract/travel-overlay-abstract.component';
@Component({
  selector: 'app-travel-overlay',
  standalone: true,
  imports: [
    CalculateAgePipe,
    CommonModule,
    DropdownChildrenAgeComponent,
    MatIconModule,
    NumericStepComponent,
    ParseFormGroupPipe,
    ReactiveFormsModule,
    ReplaceStrPipe,
    TranslatePipe,
    FilterSvgDirective,
    A11yModule
  ],
  templateUrl: './travel-overlay.component.html',
  styleUrls: ['./travel-overlay.component.scss'],
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
export class TravelOverlayComponent extends TravelOverlayAbstractComponent {
  @Input() data: {
    defaultPax: number;
  };
  @ViewChild('travelers', { static: false }) ele: ElementRef;

  themeColors$ = this.hotelConfigService.themeColors$;
  value$ = new BehaviorSubject<any>(null);
  overlayRef: OverlayRef;

  selectedSpaceTypes = signal<string[]>([]);

  ngOnInit(): void {
    this.initData();
    // this.fillUpSpaceTypeOnStartup();
  }

  initData(): void {
    const selectedTravelers =
      this.bookingTransactionService.travelerSelected$?.value;

    if (!selectedTravelers) {
      const defaultPax = this.data?.defaultPax || 1;
      this.addRoom(defaultPax);
      return;
    }

    const rooms = selectedTravelers.toString().split(',');
    rooms.forEach((room) => {
      const [adult, ...details] = room.split('-');
      const adultCount = Math.min(+adult || 0, 10);

      if (!adultCount) {
        return;
      }

      const childrenAge = details
        .filter((item) => !item.includes('p'))
        .map((age) => JSON.parse(age)) as number[];

      const petCount =
        details.find((item) => item.includes('p'))?.replace('p', '') || 0;

      this.addRoom(adultCount, childrenAge.length, childrenAge, petCount);
    });
  }

  override onApply(): void {
    this.onTrack();
    this.overlayRef?.detach();
    this.searchBarHandlerService.openOverlayState$.next(null);
    this.searchBarHandlerService.flowSuggestion$.next(
      RecommendationFlow.CALENDAR
    );
  }

  // private fillUpSpaceTypeOnStartup(): void {
  //   this.route.queryParams
  //     .pipe(
  //       map((queryParams) => queryParams[RouteKeyQueryParams.spaceTypes]),
  //       skipWhile((spaceTypes) => !spaceTypes),
  //       distinctUntilChanged(),
  //       tap((spaceTypes) => this.selectedSpaceTypes.set(spaceTypes?.split(',')))
  //     )
  //     .subscribe();
  // }

  // selectSpaceType(spaceTypeCode: string): void {
  //   let selected = this.selectedSpaceTypes();
  //   const isSelectedBefore = selected.includes(spaceTypeCode);
  //   selected = isSelectedBefore
  //     ? selected.filter((code) => code !== spaceTypeCode)
  //     : [...new Set([...this.selectedSpaceTypes(), spaceTypeCode])];
  //   this.selectedSpaceTypes.set(selected);
  //   this.router
  //     .navigate([], {
  //       queryParams: {
  //         ...this.route.snapshot.queryParams,
  //         [RouteKeyQueryParams.spaceTypes]: this.selectedSpaceTypes().join(',')
  //       },
  //       queryParamsHandling: 'merge'
  //     })
  //     .then(() => this.suggestionHandler.loadAvailableStayOptions());
  // }
}
