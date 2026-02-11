import { Pipe, PipeTransform } from '@angular/core';
import { get } from 'lodash';
@Pipe({
  name: 'groupArray',
  standalone: true
})
export class GroupArrayPipe implements PipeTransform {
  transform(
    value: any[],
    mappingKey: string,
    filterKey: string,
    filterValue: string,
    groupByKey: string,
    valueKey: string,
    tooltipKey: string
  ): { count: number; value: any; description: string }[] {
    if (!value?.length) return [];

    const newArr = value
      ?.map((item) => {
        const mappedValue = get(item, mappingKey) || item;
        return Array.isArray(mappedValue) ? mappedValue : [mappedValue];
      })
      .flat()
      .filter(
        (item) =>
          get(item, filterKey) === filterValue ||
          get(item, filterKey)?.startsWith(filterValue)
      );
    if (!newArr?.length) return [];

    const unknownKey = 'unknownKey';
    const groupedObj = newArr.reduce(
      (acc, item) => {
        let key = get(item, groupByKey);
        if (!key) key = unknownKey;

        if (!acc[key]) {
          acc[key] = {
            count: 1,
            value: key === unknownKey ? null : get(item, valueKey),
            description: key === unknownKey ? null : get(item, tooltipKey)
          };
        } else {
          acc[key].count++;
        }
        return acc;
      },
      {} as Record<string, { count: number; value: any; description: string }>
    );

    // If only have unknownKey, return it
    if (Object.keys(groupedObj).length > 1) {
      delete groupedObj[unknownKey];
    }
    const groupedArr = Object.values(groupedObj) as {
      count: number;
      value: any;
      description: string;
    }[];

    // Otherwise return list without unknownKey
    return groupedArr;
  }
}
