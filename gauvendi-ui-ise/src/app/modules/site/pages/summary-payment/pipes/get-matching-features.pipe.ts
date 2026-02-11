import {Pipe, PipeTransform} from '@angular/core';
import {HotelRetailFeature} from "@core/graphql/generated/graphql";
import {ActivatedRoute} from "@angular/router";
import {RouteKeyQueryParams} from "@constants/RouteKey";

@Pipe({
  name: 'getMatchingFeatures',
  standalone: true
})
export class GetMatchingFeaturesPipe implements PipeTransform {

  constructor(
    private route: ActivatedRoute
  ) {
  }

  transform(value: HotelRetailFeature[], roomIndex: number, isMatchedFlow: boolean): HotelRetailFeature[] {
    if (!isMatchedFlow) {
      return value;
    }
    const guaranteeCodeList: string[] = this.route.snapshot.queryParams[RouteKeyQueryParams.customizeStay]
      ?.split('~')[roomIndex]
      ?.split(',')
      ?.flatMap(x => x?.split('-'))
    return value?.filter(feat => guaranteeCodeList?.some(x => x === feat?.code));
  }

}
