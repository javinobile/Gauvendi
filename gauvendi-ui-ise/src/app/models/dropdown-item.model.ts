export interface DropdownItem {
  code: string;
  label: string;
  children?: DropdownItem[];
  flag?: string;
  color?: string;
  icon?: string;
  metaData?: any;
}
