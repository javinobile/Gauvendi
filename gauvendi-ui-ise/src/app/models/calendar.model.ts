import {TemplateRef} from "@angular/core";

export interface CalendarRow {
  startDate: Date;
  dateCells: DateCell[];
  isSameMonth: boolean; // check week is same month,
}

export interface DateCell {
  cellRender?: TemplateRef<Date> | string;
  isCTA?: boolean; // Close to Arrival
  isCTD?: boolean; // Close to Departure
  isDisable?: boolean;
  isHidden?: boolean;
  isHover?: boolean;
  isInsideRange?: boolean;
  isStayIn?: boolean;
  isSelected?: boolean;
  isToday?: boolean;
  isCheckIn?: boolean;
  isCheckOut?: boolean;
  canNotCheckIn?: boolean;
  isSoldOut?: boolean;
  value: Date;
  netPrice: number;
  grossPrice: number;
  dealPrice?: number;
  dealRestrictions?: {
    minLOS: number;
    maxLOS: number;
  };
  idxRow?: number;
}
