import { Injectable, signal } from '@angular/core';
import { HotelRetailCategory } from '@core/graphql/generated/graphql';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfiguratorService {
  private isCurrentSelected$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  private selectedCategory$: BehaviorSubject<HotelRetailCategory> =
    new BehaviorSubject(null);
  private selectedRetailFeatures$: BehaviorSubject<string[]> =
    new BehaviorSubject([]);
  private rankingCategories$: BehaviorSubject<HotelRetailCategory[]> =
    new BehaviorSubject([]);
  categorySelected = signal<HotelRetailCategory>(null);
  featureSelected = signal<string[]>([]);
  featureParam = signal<string>(null);
  isCollapse = signal(true);
  minimalView = signal(false);

  _rankingCategories$(): Observable<HotelRetailCategory[]> {
    return this.rankingCategories$.asObservable();
  }

  setRankingCategories$(value: HotelRetailCategory[]): void {
    this.rankingCategories$.next(value);
  }

  _isCurrentSelected(): Observable<boolean> {
    return this.isCurrentSelected$.asObservable();
  }

  setIsCurrentSelected(value: boolean): void {
    this.isCurrentSelected$.next(value);
  }

  _selectedCategory(): Observable<HotelRetailCategory> {
    return this.selectedCategory$.asObservable();
  }

  getSelectedCategory(): HotelRetailCategory {
    return this.selectedCategory$.value;
  }

  setSelectedCategory(value: HotelRetailCategory): void {
    this.selectedCategory$.next(value);
  }

  _selectedRetailFeatures(): Observable<string[]> {
    return this.selectedRetailFeatures$.asObservable();
  }

  getSelectedRetailFeatures(): string[] {
    return this.selectedRetailFeatures$.value;
  }

  setSelectedRetailFeatures(values: string[]): void {
    this.selectedRetailFeatures$.next(values);
  }
}
