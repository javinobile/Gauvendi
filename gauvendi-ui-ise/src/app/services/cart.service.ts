import { computed, Injectable, Signal, signal } from '@angular/core';
import { RouteKeyQueryParams } from '@app/constants/RouteKey';
import { CartItem } from '@app/models/cart.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private cart = signal<CartItem[]>([{ idx: 0, adults: 1, selectedFeatures: [], promoCode: null }]);

  isSearchChanged = signal<boolean>(false);

  getActiveTab(queryParams): number {
    return +(queryParams[RouteKeyQueryParams.active] ?? 0);
  }

  setCart(cart: CartItem[]): void {
    this.cart.set([...cart]);
  }

  setCartByIdx(tab: number, data: CartItem): void {
    const newCart = this.getCart();
    newCart[tab] = { ...newCart[tab], ...data };
    this.setCart(newCart);
    this.refreshSearchChanged({ [RouteKeyQueryParams.active]: tab });
  }

  getCart(): CartItem[] {
    return [...this.cart()];
  }

  getCartAsync(): Signal<CartItem[]> {
    return computed(() => this.cart());
  }

  getCartByIdx(tab: number): CartItem {
    return { ...this.cart()[tab] };
  }

  storeSearchSnapshot(queryParams): void {
    const tab = this.getActiveTab(queryParams);
    const {
      idx,
      adults,
      children,
      pets,
      arrival,
      departure,
      promoCode,
      selectedFeatures
    } = this.cart()[tab];
    const searchSnapshot = {
      idx,
      adults,
      children,
      pets,
      arrival,
      departure,
      promoCode,
      selectedFeatures
    };
    this.setCartByIdx(tab, { ...this.cart()[tab], searchSnapshot });
    this.isSearchChanged.set(false);
  }

  refreshSearchChanged(queryParams): void {
    const tab = this.getActiveTab(queryParams);
    const searchSnapshot = this.cart()[tab].searchSnapshot;
    const {
      idx,
      adults,
      children,
      pets,
      arrival,
      departure,
      promoCode,
      selectedFeatures
    } = this.cart()[tab];
    const currentSearch = {
      idx,
      adults,
      children,
      pets,
      arrival,
      departure,
      promoCode,
      selectedFeatures
    };
    this.isSearchChanged.set(
      JSON.stringify(searchSnapshot) !== JSON.stringify(currentSearch)
    );
  }
}
