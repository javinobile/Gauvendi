import {Pipe, PipeTransform} from '@angular/core';
import {DropdownItem} from "@models/dropdown-item.model";

@Pipe({
  name: 'filterDropdown',
  standalone: true
})
export class FilterDropdownPipe implements PipeTransform {
  transform(value: DropdownItem[], searchText: string, metadata = false): DropdownItem[] {
    if (!value || value.length === 0) {
      return [];
    }
    if (metadata) {
      return value.filter((item) =>
        item?.metaData?.label?.toLowerCase()?.includes((searchText || '')?.toLowerCase())
      );
    }
    return value.filter((item) =>
      item?.label?.toLowerCase()?.includes((searchText || '')?.toLowerCase())
    );
  }
}

