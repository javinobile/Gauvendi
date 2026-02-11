export enum EDeviceType {
  Mobile = 'mobile',
  Tablet = 'tablet',
  Desktop = 'desktop',
}

export type DeviceType =
  | EDeviceType.Mobile
  | EDeviceType.Tablet
  | EDeviceType.Desktop
