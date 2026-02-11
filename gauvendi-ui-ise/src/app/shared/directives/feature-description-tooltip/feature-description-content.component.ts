import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { OverlayRef } from "@angular/cdk/overlay";
import { HotelRetailFeature } from "@core/graphql/generated/graphql";
import { animate, style, transition, trigger } from "@angular/animations";
import { CustomTooltipModule } from "@app/shared/directives/custom-tooltip/custom-tooltip.module";
import { FilterSvgDirective } from "@app/shared/directives/filter-svg.directive";
import { HotelConfigService } from "@app/services/hotel-config.service";
import { select, Store } from "@ngrx/store";
import { selectorHotelRetailFeatureList } from "@store/hotel/hotel.selectors";
import { FeatureIconPipe } from "@app/shared/directives/feature-description-tooltip/feature-icon.pipe";
import { FeatureDescriptionPipe } from "@app/shared/directives/feature-description-tooltip/feature-description.pipe";
import { distinctUntilChanged, map } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { RouteKeyQueryParams } from "@app/constants/RouteKey";
import { MultiLangEnum } from "@app/store/multi-lang/multi-lang.state";

@Component({
  selector: "app-feature-description-tooltip-content",
  standalone: true,
  imports: [CommonModule, CustomTooltipModule, FilterSvgDirective, FeatureIconPipe, FeatureDescriptionPipe],
  templateUrl: "./feature-description-content.component.html",
  styleUrls: ["./feature-description-content.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger("tooltip", [transition(":enter", [style({ opacity: 0 }), animate("500ms", style({ opacity: 1 }))]), transition(":leave", [animate("500ms", style({ opacity: 0 }))])])],
})
export class FeatureDescriptionContentComponent {
  featureName: string;
  featureCode: string;
  featureDescription: string;
  featureIcon: string;
  isStandard: boolean;
  isDisplayIcon: boolean;
  maxWidth: string;
  overlayRef: OverlayRef;
  hotelPrimaryColor$ = this.hotelConfigService.hotelPrimaryColor$;
  hotelRetailFeatureList$ = this.store.pipe(select(selectorHotelRetailFeatureList));
  isMobile = false;

  route = inject(ActivatedRoute);
  dir$ = this.route.queryParams.pipe(
    map((params) => params[RouteKeyQueryParams.lang]),
    map((data) => (data === MultiLangEnum.AR ? "rtl" : "ltr")),
    distinctUntilChanged()
  );

  constructor(private hotelConfigService: HotelConfigService, private cd: ChangeDetectorRef, private store: Store) {
    this.isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  @HostListener("mouseleave")
  onMouseEnter() {
    this.overlayRef?.detach();
    this.cd.detectChanges();
  }
}
