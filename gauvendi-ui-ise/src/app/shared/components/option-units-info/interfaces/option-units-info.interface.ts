import { IFeature } from '@app/models/option-item.model';

export interface IOptionUnitsInfo {
  adults: number;
  children?: number;
  roomKey?: number;
  bedRooms?: number;
  roomSpace?: number;
  pets?: number;
  features?: IFeature[];
  extraBeds?: number;
  measurementUnit?: string;
  featureCode?: string;
  totalRoom?: number;
  [key: string]: any;
}

export interface IUnitConfigItem {
  label: string;
  pluralLabel: string;
  icon: string;
  value: number;
  isPluralLabel?: boolean;
  isUsingMeasureMetrics?: boolean;
  isDivider?: boolean;
  toolTipMsg?: string;
}
