import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { ParseRankFeatureNamePipe } from '@app/modules/site/pages/recommendation/directives/ise-configurator/pipes/parse-rank-feature-name.pipe';
import { TrackingService } from '@app/services/tracking.service';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import {
  HotelRetailCategory,
  HotelRetailFeature
} from '@core/graphql/generated/graphql';
import { Rank } from '@models/rank';
import { chain, cloneDeep } from 'lodash';

@Component({
  selector: 'app-feature-retail-ranking',
  standalone: true,
  imports: [
    CommonModule,
    CdkDrag,
    CdkDropList,
    CdkDragHandle,
    FilterSvgDirective,
    ParseRankFeatureNamePipe
  ],
  templateUrl: './feature-retail-ranking.component.html',
  styleUrls: ['./feature-retail-ranking.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureRetailRankingComponent implements OnChanges {
  @Input() hotelRetailFeatureList: HotelRetailFeature[];
  @Input() selectedRetailFeatures: string[];
  @Input() selectedCategory: HotelRetailCategory;
  @Input() hotelRetailCategoryList: HotelRetailCategory[];
  @Input() featureBgColor: string;
  @Input() featureBgSelectedColor: string;
  @Input() colorText: string;
  @Output() categoryChange = new EventEmitter();
  @Output() sortChanges = new EventEmitter();

  constructor(
    private trackingService: TrackingService,
    private cd: ChangeDetectorRef
  ) {}

  ranks: Rank[] = [
    { option: 1, category: null },
    { option: 2, category: null },
    { option: 3, category: null },
    { option: 4, category: null },
    { option: 5, category: null },
    { option: 6, category: null },
    { option: 7, category: null },
    { option: 8, category: null }
  ];

  ngOnChanges({
    selectedRetailFeatures,
    hotelRetailFeatureList
  }: SimpleChanges) {
    if (
      (selectedRetailFeatures || hotelRetailFeatureList) &&
      this.selectedRetailFeatures &&
      this.hotelRetailFeatureList
    ) {
      // sort by selected feature
      const retails = cloneDeep(this.hotelRetailFeatureList);
      const selectedFeatured = retails
        ?.sort(
          (pre, cur) =>
            this.selectedRetailFeatures.indexOf(pre.code) -
            this.selectedRetailFeatures.indexOf(cur.code)
        )
        ?.filter((item) => this.selectedRetailFeatures?.includes(item?.code));
      const selectedCategory = selectedFeatured?.map((x) => ({
        ...x,
        categoryCode: x?.hotelRetailCategory?.code
      }));
      const rankSelected = chain(selectedCategory)
        .groupBy('categoryCode')
        .map((value, key) => ({
          name: this.hotelRetailCategoryList.find((x) => x?.code === key)?.name,
          code: this.hotelRetailCategoryList.find((x) => x?.code === key)?.code,
          iconImageUrl: this.hotelRetailCategoryList.find(
            (x) => x?.code === key
          )?.iconImageUrl,
          features: value?.map((x) => ({
            code: x?.code,
            name: x?.name,
            image: x?.retailFeatureImageList[0]?.imageUrl
          }))
        }))
        .value()
        .reduce((p, c) => {
          return p?.concat(c);
        }, []);
      const rankSelectedCategoryCode = rankSelected.map((x) => x?.code);

      const otherRank = this.hotelRetailCategoryList
        .filter((x) => !rankSelectedCategoryCode?.includes(x?.code))
        .map((x) => ({
          name: x?.name,
          code: x?.code,
          iconImageUrl: x?.iconImageUrl,
          features: []
        }));

      const rankCategoryList = [...rankSelected, ...otherRank];
      this.ranks = this.ranks.map((item, idx) => ({
        ...item,
        category: rankCategoryList[idx] || null
      }));
    }
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.ranks, event.previousIndex, event.currentIndex);
    this.cd.detectChanges();
    const rankObj = {};
    const rankNames = this.ranks
      .filter((x) => x?.category)
      .map((x) => x?.category?.name);
    rankNames.forEach((item, idx) => {
      rankObj[`Rank ${idx + 1}`] = item;
    });

    this.trackingService.track(MixpanelKeys.ChangeRank, {
      name: 'Configurator',
      ...rankObj
    });
    const codeRanks = this.ranks
      .filter((x) => x?.category?.features?.length > 0)
      .map((x) => x?.category?.code);

    const retails = cloneDeep(this.hotelRetailFeatureList);
    const selectedFeatured = retails
      ?.sort(
        (pre, cur) =>
          this.selectedRetailFeatures.indexOf(pre.code) -
          this.selectedRetailFeatures.indexOf(cur.code)
      )
      ?.filter((item) => this.selectedRetailFeatures?.includes(item?.code));
    const selectedCategory = selectedFeatured?.map((x) => ({
      ...x,
      categoryCode: x?.hotelRetailCategory?.code
    }));
    const currentChain = selectedCategory?.sort(
      (pre, cur) =>
        codeRanks?.indexOf(pre.categoryCode) -
        codeRanks?.indexOf(cur.categoryCode)
    );
    const sortCurrentChain = chain(currentChain)
      .groupBy('categoryCode')
      .map(
        (value, key) => `${key}-${value?.map((item) => item?.code)?.join('-')}`
      )
      .value()
      .reduce((p, c) => {
        return p?.concat(c);
      }, [])
      ?.join(',');
    this.sortChanges.emit(sortCurrentChain);
    // const queryParams = this.route.snapshot.queryParams;
    // this.appRouterService.updateRouteQueryParams({
    //   ...queryParams,
    //   [RouteKeyQueryParams.customizeStay]: sortCurrentChain,
    // });
  }

  changeSelectCategory(code: string) {
    const cFeature = this.hotelRetailCategoryList?.find(
      (x) => x?.code === code
    );
    this.categoryChange.emit(cFeature);
  }
}
