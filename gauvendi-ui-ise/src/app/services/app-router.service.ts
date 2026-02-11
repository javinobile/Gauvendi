import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppRouterService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private queryParamsQueue$ = new BehaviorSubject<{
    queryParams: Record<string, any>;
    options?: {
      done?: () => void;
      navigateUrl?: string;
      replaceUrl?: boolean;
    };
  }>(null);
  private isProcessing = signal(false);
  private queryParamsQueue = [];

  constructor() {
    this.initQueueProcessor();
  }

  /**
   * Initializes the queue processor for route query parameter updates.
   * This function subscribes to the queryParamsQueue$ BehaviorSubject and ensures that
   * route navigation updates (with query params) are processed sequentially, one at a time.
   * If a navigation is already in progress, new updates are queued and processed in order.
   * This prevents race conditions and ensures that callbacks are executed after navigation.
   */
  private initQueueProcessor() {
    this.queryParamsQueue$
      // Only process non-null queue items.
      .pipe(
        filter((data) => !!data) // RxJS: Filters out null/undefined queue items before processing.
      )
      // Subscribe to process each queued navigation request.
      .subscribe(({ queryParams, options }) => {
        if (this.isProcessing()) {
          // If a navigation is already in progress, queue the new request.
          this.queryParamsQueue.push({ queryParams, options });
          return;
        }
        this.isProcessing.set(true);
        this.router
          .navigate(options?.navigateUrl ? [options.navigateUrl] : [], {
            relativeTo: this.route,
            queryParams,
            queryParamsHandling: 'merge',
            replaceUrl: options?.replaceUrl || false
          })
          .then((isResolved: boolean) => {
            console.log('queryParamsQueue resolved', isResolved);
            // Execute the optional callback after navigation completes.
            if (isResolved) {
              options?.done?.();
            }
            this.isProcessing.set(false);
            // If there are more items in the queue, process the next one.
            if (!this.queryParamsQueue?.length) return;
            const nextItem = this.queryParamsQueue.shift();
            this.queryParamsQueue$.next(nextItem);
          });
      });
  }

  updateRouteQueryParams(
    queryParams: Record<string, any>,
    options?: {
      done?: () => void;
      navigateUrl?: string;
      replaceUrl?: boolean;
    }
  ) {
    this.queryParamsQueue$.next({
      queryParams,
      options
    });
  }
}
