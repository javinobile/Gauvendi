import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ScrollerService {
  isScrollDown$ = new BehaviorSubject(false);
}
