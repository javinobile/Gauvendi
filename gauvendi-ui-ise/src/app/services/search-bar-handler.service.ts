import { Injectable } from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";
import {SearchBarOverlayState} from "@models/search-bar-overlay-state";
import {OverlayRef} from "@angular/cdk/overlay";
import {RecommendationFlow} from "@models/recommendation-flow";

@Injectable({
  providedIn: 'root'
})
export class SearchBarHandlerService {
  openOverlayState$: BehaviorSubject<SearchBarOverlayState> = new BehaviorSubject(null);
  overlayRefList$: BehaviorSubject<OverlayRef[]> = new BehaviorSubject([]);
  flowSuggestion$: Subject<RecommendationFlow> = new Subject();
}
