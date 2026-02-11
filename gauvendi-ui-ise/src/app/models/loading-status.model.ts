export enum ELoadingStatus {
  error = 'error',
  idle = 'idle',
  loaded = 'loaded',
  loading = 'loading',
  reloading = 'reloading'
}

export type LoadingStatus =
  | ELoadingStatus.error
  | ELoadingStatus.idle
  | ELoadingStatus.loaded
  | ELoadingStatus.loading
  | ELoadingStatus.reloading;
