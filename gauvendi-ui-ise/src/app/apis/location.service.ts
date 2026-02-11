import {Injectable} from '@angular/core';
import {HttpBackend, HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ILocation} from "@models/location";
import {environment} from "@environment/environment";

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  constructor(
    private httpBackend: HttpBackend
  ) {
  }

  userLocation(): Observable<ILocation> {
    const httpClient = new HttpClient(this.httpBackend);
    const location = environment.location;
    return httpClient
      .get(`${location.endpoint}`, {params: {token: location.token}})
      .pipe(
        map((value: ILocation) => {
          const latLng = value?.loc?.split(',');
          return {...value, location: latLng?.length === 2 ? {lat: +latLng[0], lng: +latLng[1]} : null};
        })
      );
  }
}
