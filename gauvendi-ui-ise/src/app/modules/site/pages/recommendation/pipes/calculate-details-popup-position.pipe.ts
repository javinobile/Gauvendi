import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'calDetailsPopupPos',
  standalone: true
})
export class CalculateDetailsPopupPositionPipe implements PipeTransform {
  transform(
    viewIndex: number,
    columns: number,
    currentIndex: number,
    totalStayOptions: number
  ): boolean {
    // Tìm hàng của viewIndex
    const viewRow = Math.floor(viewIndex / columns);

    // Tính index cuối của hàng đó
    const lastIndexInViewRow = Math.min(
      (viewRow + 1) * columns - 1,
      totalStayOptions - 1
    );

    // Nếu currentIndex là index cuối của hàng view, thì return true
    return currentIndex === lastIndexInViewRow;
  }
}
