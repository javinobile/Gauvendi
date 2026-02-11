import { ElementRef, inject, Injectable } from '@angular/core';
import { loadAccessibilityWidget } from 'assets/accessibility/accessibility-widget.loader';
import { CommonService } from './common.service';
import { HotelConfigService } from './hotel-config.service';
import {
  FOCUS_TRAP_SELECTOR,
  KEYBOARD_EVENT_KEYS,
  KEYBOARD_EVENTS
} from '@app/constants/accessibility.const';
import { FocusMonitor } from '@angular/cdk/a11y';

@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private hotelConfigService = inject(HotelConfigService);
  private commonService = inject(CommonService);
  private focusMonitor = inject(FocusMonitor);

  loadAccessibility(lang?: string): void {
    loadAccessibilityWidget({
      colors: {
        primary: this.hotelConfigService.hotelPrimaryColor$.value,
        secondary: this.hotelConfigService.categoryDefaultBg$.value
      },
      textToSpeechLanguage: lang || this.commonService.currentLang(),
      dockWcagToken: this.hotelConfigService.dockWcagToken$.value?.trim(),
      isMobile: this.commonService.isMobile$.value
    });
  }

  focusOnElement(element: HTMLElement) {
    if (!element) return;

    const focusableElements = element.querySelectorAll(FOCUS_TRAP_SELECTOR);
    const firstFocusableElement = focusableElements[0] as HTMLElement;
    firstFocusableElement?.focus();
  }

  handleExitFocusTrap(selector: string, monitorEl?: HTMLElement) {
    if (!selector) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === KEYBOARD_EVENT_KEYS.ESCAPE) {
        const element = document.querySelector(selector) as HTMLElement;
        element?.focus();
        document.removeEventListener(KEYBOARD_EVENTS.KEYDOWN, handleEscape);
        if (monitorEl) {
          this.focusMonitor.stopMonitoring(monitorEl);
        }
      }
    };
    document.addEventListener(KEYBOARD_EVENTS.KEYDOWN, handleEscape);
  }

  monitorFocus(elRef: HTMLElement, exitSelector: string) {
    if (!elRef) return;

    this.focusMonitor.monitor(elRef, true).subscribe((origin) => {
      if (origin === 'keyboard') {
        this.handleExitFocusTrap(exitSelector, elRef);
      }
    });
  }

  stopMonitorFocus(elRef: HTMLElement) {
    this.focusMonitor.stopMonitoring(elRef);
  }
}
