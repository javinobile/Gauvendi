import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from "@environment/environment";

@Injectable()
export class TimeZoneInterceptor implements HttpInterceptor {

  constructor() {
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    request = request.clone({
      setHeaders: {
        'client-time-zone': Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });
    return next.handle(request);
  }
}
