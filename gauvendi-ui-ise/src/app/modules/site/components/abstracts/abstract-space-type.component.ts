import { Component, computed, inject, signal } from '@angular/core';
import { HotelRetailFeature } from '@app/core/graphql/generated/graphql';
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';
import { selectorHotelRetailFeatureList } from '@app/store/hotel/hotel.selectors';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs';
import { ISPTFeature } from './interfaces/abstract-space-type.interface';
@Component({
  template: ''
})
export abstract class AbstractSpaceTypeComponent extends DirSettingDirective {
  protected readonly store = inject(Store);

  hotelRetailFeatureList$ = this.store
    .select(selectorHotelRetailFeatureList)
    .pipe(tap((data) => this.features.set(data)));

  features = signal<HotelRetailFeature[]>([]);

  //#region Space Type Features
  spaceTypeFeatures = computed(() => this.setSpaceTypeFeatures());
  spaceTypeFeaturesMapped = computed(() => {
    const spaceTypeFeatures = this.spaceTypeFeatures();
    const features = this.features();
    if (!(spaceTypeFeatures?.length && features?.length)) return [];

    const spaceTypes = this.mappingRetailFeature(spaceTypeFeatures, features);

    return spaceTypes;
  });
  spaceTypeUrls = computed(() => {
    const spaceTypeFeatures = this.spaceTypeFeaturesMapped();
    if (!spaceTypeFeatures?.length) return [];

    return spaceTypeFeatures.map((item) => ({
      url: item.retailFeatureImageList[0]?.imageUrl,
      title: item.name
    }));
  });

  setSpaceTypeFeatures(): ISPTFeature[] {
    return [];
  }
  //#endregion

  //#region Combination Space Type Features
  combinationSpaceTypeFeatures = computed(() =>
    this.setCombinationSpaceTypeFeatures()
  );

  combinationSpaceTypeUrls = computed(() => {
    const combinationSpaceTypeFeatures = this.combinationSpaceTypeFeatures();
    const features = this.features();
    if (!(combinationSpaceTypeFeatures?.length && features?.length)) return [];

    const spaceTypeUrls = combinationSpaceTypeFeatures.map((feature) =>
      this.mappingRetailFeature(feature, features).map((item) => ({
        url: item.retailFeatureImageList[0]?.imageUrl,
        title: item.name
      }))
    );
    if (!spaceTypeUrls?.length) return [];

    return spaceTypeUrls;
  });

  setCombinationSpaceTypeFeatures(): ISPTFeature[][] {
    return [];
  }
  //#endregion

  private mappingRetailFeature(
    features: ISPTFeature[],
    totalFeatures: HotelRetailFeature[]
  ) {
    return features
      .map((feature) => {
        const newFeature = totalFeatures.find((f) => f.code === feature?.code);
        return newFeature;
      })
      .filter((item) => !!item);
  }
}
