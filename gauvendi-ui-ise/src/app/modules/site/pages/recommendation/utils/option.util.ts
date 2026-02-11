import {
  BookingFlow,
  HotelRetailFeature,
  Rfc,
  StayOptionSuggestion
} from '@app/core/graphql/generated/graphql';
import {
  IBundleItem,
  ICombinationOptionItem,
  IFeature,
  IOptionItem
} from '@app/models/option-item.model';
import * as __ from 'lodash';

const totalByField = (arr: IOptionItem[], field: string): number => {
  return arr.reduce((total, cur) => total + (cur[field] || 0), 0) || 0;
};

const mappingFeature = (
  feature: HotelRetailFeature,
  mostPopularFeatureList: HotelRetailFeature[]
): IFeature => {
  return {
    name: feature.name,
    recommendation: mostPopularFeatureList
      ?.map((i) => i.code)
      ?.includes(feature.code),
    matched: feature?.matched,
    metadata: { ...feature }
  };
};

export class OptionUtil {
  public static sortMostPopularFeatures(features: IFeature[]) {
    features.sort((a, b) => (b.recommendation ? 1 : -1));
    return features;
  }

  public static mappingRfcToOptionItem(
    rfc: Rfc,
    baseOption: StayOptionSuggestion
  ): IOptionItem {
    const imgUrls = rfc.rfcImageList?.map((img) => img.imageUrl);

    const rfcRatePlan =
      baseOption.availableRfcRatePlanList?.length > 0
        ? baseOption.availableRfcRatePlanList?.[0]
        : baseOption.unavailableRfcRatePlanList?.[0];

    const item: IOptionItem = {
      title: rfc.name,
      imgUrls:
        imgUrls?.length > 0 ? imgUrls : ['assets/images/option-default.png'],
      adults: rfc.allocatedAdultCount + rfc.allocatedExtraBedAdultCount,
      children: rfc.allocatedChildCount + rfc.allocatedExtraBedChildCount,
      pets: rfc.allocatedPetCount ?? 0,
      roomKey: 1,
      extraBeds:
        rfc.allocatedExtraBedAdultCount + rfc.allocatedExtraBedChildCount,
      bedRooms: rfc.numberOfBedrooms,
      roomSpace: rfc.space,
      features: OptionUtil.sortMostPopularFeatures(
        (rfc.additionalFeatureList?.length > 0
          ? rfc.additionalFeatureList
          : rfc.retailFeatureList
        )?.map((feature) => mappingFeature(feature, rfc.mostPopularFeatureList))
      ),
      matchFeatures: (rfc.retailFeatureList || [])
        ?.filter((f) => !!f?.matched)
        ?.map((feature) => mappingFeature(feature, rfc.mostPopularFeatureList)),
      notMatchFeatures: (rfc.retailFeatureList || [])
        ?.filter((f) => !f?.matched)
        ?.map((feature) => mappingFeature(feature, rfc.mostPopularFeatureList)),
      standardFeatures: rfc.standardFeatureList,
      tag: baseOption.label,
      isLocked: baseOption.unavailableRfcRatePlanList?.length > 0,
      // amount
      rfcRatePlanList: baseOption.availableRfcRatePlanList,
      rfcRatePlan,
      matchPercent:
        baseOption?.label === BookingFlow.Match &&
        (rfc?.retailFeatureList?.filter((feat) => feat?.matched)?.length ===
        rfc?.retailFeatureList?.length
          ? 1
          : rfc?.matchingPercentage || 0) * 100,
      // matchPercent: (rfc?.matchingPercentage || 0) * 100,
      metadata: { ...rfc },
      baseOption,
      isSpaceTypeSearchMatched: rfc?.isSpaceTypeSearchMatched
    };
    return item;
  }

  public static mappingCombinationOptionItem(
    baseOption: StayOptionSuggestion
  ): ICombinationOptionItem {
    const items = baseOption.availableRfcList?.map((rfc) =>
      OptionUtil.mappingRfcToOptionItem(rfc, baseOption)
    );

    return {
      title: `${baseOption.availableRfcList?.length}`,
      adults: totalByField(items, 'adults'),
      children: totalByField(items, 'children'),
      pets: totalByField(items, 'pets'),
      roomKey: totalByField(items, 'roomKey'),
      extraBeds: totalByField(items, 'extraBeds'),
      bedRooms: totalByField(items, 'bedRooms'),
      matchPercent: totalByField(items, 'matchPercent'),
      matched:
        baseOption.label === BookingFlow.Match &&
        !!items?.find((item) => item?.matchFeatures?.length > 0),
      tag: baseOption.label,
      isLocked: baseOption.unavailableRfcRatePlanList?.length > 0,
      items,
      metadata: { ...baseOption },
      isSpaceTypeSearchMatched: !items?.some(
        (item) => !item?.isSpaceTypeSearchMatched
      )
    };
  }

  public static mappingBundleItem(
    baseOption: ICombinationOptionItem[]
  ): IBundleItem[] {
    if (!baseOption) {
      return [];
    }
    const salesPlanList = __.uniqWith(
      baseOption?.map((opt) =>
        opt?.items?.flatMap((item) => item?.rfcRatePlan?.ratePlan)
      ),
      __.isEqual
    );
    if (!salesPlanList) {
      return [];
    }
    return salesPlanList?.map((item) => ({
      ratePlan: item,
      items: baseOption?.filter((opt) =>
        opt?.items?.some((item) => item?.rfcRatePlan?.ratePlan)
      )
    }));
  }

  public static mappingMatchingOptionItem(
    rfcs: Rfc[],
    stayOptionCodes: string[]
  ): ICombinationOptionItem {
    const items = rfcs?.map((rfc) =>
      OptionUtil.mappingRfcMatchingToOptionItem(rfc, stayOptionCodes?.[0])
    );

    return {
      title: '',
      adults: totalByField(items, 'adults'),
      children: totalByField(items, 'children'),
      pets: totalByField(items, 'pets'),
      roomKey: totalByField(items, 'roomKey'),
      extraBeds: totalByField(items, 'extraBeds'),
      bedRooms: totalByField(items, 'bedRooms'),
      tag: stayOptionCodes?.[0] as BookingFlow,
      isLocked: null,
      items,
      matched:
        (stayOptionCodes?.[0] as BookingFlow) === BookingFlow.Match &&
        !!items?.find((item) => item?.matchFeatures?.length > 0),
      metadata: null
    };
  }

  public static mappingRfcMatchingToOptionItem(
    rfc: Rfc,
    stayOptionCodes: string
  ): IOptionItem {
    const imgUrls = rfc.rfcImageList?.map((img) => img.imageUrl);

    const item: IOptionItem = {
      title: rfc.name,
      imgUrls:
        imgUrls?.length > 0 ? imgUrls : ['assets/images/option-default.png'],
      adults: rfc.allocatedAdultCount + rfc.allocatedExtraBedAdultCount,
      children: rfc.allocatedChildCount + rfc.allocatedExtraBedChildCount,
      pets: rfc.allocatedPetCount ?? 0,
      roomKey: 1,
      extraBeds:
        rfc.allocatedExtraBedAdultCount + rfc.allocatedExtraBedChildCount,
      bedRooms: rfc.numberOfBedrooms,
      roomSpace: rfc.space,
      features: OptionUtil.sortMostPopularFeatures(
        (rfc.additionalFeatureList?.length > 0
          ? rfc.additionalFeatureList
          : rfc.retailFeatureList
        )?.map((feature) => mappingFeature(feature, rfc.mostPopularFeatureList))
      ),
      matchFeatures: (rfc.retailFeatureList || [])
        ?.filter((f) => !!f?.matched)
        ?.map((feature) => mappingFeature(feature, rfc.mostPopularFeatureList)),
      notMatchFeatures: (rfc.retailFeatureList || [])
        ?.filter((f) => !f?.matched)
        ?.map((feature) => mappingFeature(feature, rfc.mostPopularFeatureList)),
      standardFeatures: rfc.standardFeatureList,
      tag: stayOptionCodes as BookingFlow,
      isLocked: null,
      // amount
      rfcRatePlanList: rfc?.rfcRatePlanList,
      rfcRatePlan: rfc?.rfcRatePlanList[0],
      metadata: { ...rfc },
      baseOption: null
    };
    return item;
  }
}
