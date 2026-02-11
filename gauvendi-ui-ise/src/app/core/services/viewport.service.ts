import { Injectable } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ViewportService {
  constructor(private breakpointObserver: BreakpointObserver) {}

  isMobile$(): Observable<boolean> {
    return this.breakpointObserver.observe(['(max-width: 767px)']).pipe(
      map((result: BreakpointState) => result.matches),
      shareReplay({ bufferSize: 1, refCount: true }) // cache the result
    );
  }
}
