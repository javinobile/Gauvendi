import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SESSION_STORAGE_KEY } from '@app/constants/storage.const';
import { environment } from '@environment/environment';
import { Observable, of } from 'rxjs';

const endpoint = environment.trackingUrl;

export enum ACTION_BEHAVIOUR {
  VIEW = 'VIEW',
  CLICK = 'CLICK'
}

export interface TrackingBehaviour {
  sessionUserId: string;
  action: ACTION_BEHAVIOUR;
  metadata: {
    city: string;
    country: string;
    ip: string;
    region: string;
    timezone: string;
  };
  payload: any;
  ucData?: any;
}

@Injectable({
  providedIn: 'root'
})
export class TrackingBehaviourService {
  constructor(private http: HttpClient) {}

  trackingBehaviour(payload: any, action: ACTION_BEHAVIOUR): Observable<any> {
    if (endpoint?.length > 0) {
      const body: TrackingBehaviour = {
        payload,
        action,
        sessionUserId: sessionStorage.getItem(
          SESSION_STORAGE_KEY.SESSION_USER_ID
        ),
        metadata: {
          city: sessionStorage.getItem(
            SESSION_STORAGE_KEY.LOCATION_SESSION_USER_CITY
          ),
          ip: sessionStorage.getItem(
            SESSION_STORAGE_KEY.LOCATION_SESSION_USER_IP
          ),
          timezone: sessionStorage.getItem(
            SESSION_STORAGE_KEY.LOCATION_SESSION_USER_TIMEZONE
          ),
          region: sessionStorage.getItem(
            SESSION_STORAGE_KEY.LOCATION_SESSION_USER_REGION
          ),
          country: sessionStorage.getItem(
            SESSION_STORAGE_KEY.LOCATION_SESSION_USER_COUNTRY
          )
        },
        ucData:
          localStorage.getItem('ucData')?.length > 0
            ? JSON.parse(localStorage.getItem('ucData'))
            : null
      };
      return this.http.post(endpoint, body);
    }
    return of(null);
  }
}
