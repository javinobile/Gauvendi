import { MultiLangEnum } from '@app/store/multi-lang/multi-lang.state';
import {
  IAccessibilityConfig,
  IAccessibilityWidgetConfig
} from './interfaces/accessibility-widget.interface';

// Constants for accessibility widget configuration
const ACCESSIBILITY_KEY = 'accessibility';
const SCRIPT_ID = 'accessibility-widget-script';
const SCRIPT_URI = `//wcag.dock.codes/accessibility/{dock_wcag_token}`;
const SCRIPT_URL = `${SCRIPT_URI}/start.js`;
const ACCESSIBILITY_WIDGET_ID = 'daccw';

/**
 * Loads and configures the accessibility widget
 * @param config Widget configuration options
 */
export function loadAccessibilityWidget(config: IAccessibilityWidgetConfig) {
  if (!config.dockWcagToken) return;

  // Create accessibility configuration object with default settings
  const trigger = config.isMobile
    ? {
        position:
          config.textToSpeechLanguage !== MultiLangEnum.AR ? 'right' : 'left',
        right: {
          breakpoints: [
            {
              maxWidth: 768,
              styles: {
                offset: { right: '0', bottom: '50%' },
                size: '36px'
              }
            }
          ]
        },
        left: {
          breakpoints: [
            {
              maxWidth: 768,
              styles: {
                offset: { left: '0', bottom: '50%' },
                size: '36px'
              }
            }
          ]
        }
      }
    : null;
  const accessibilityConfig: IAccessibilityConfig = {
    widget: true,
    // Set widget position based on language direction
    position:
      config.textToSpeechLanguage !== MultiLangEnum.AR ? 'right' : 'left',
    textToSpeech: true,
    textToSpeechLanguage: config.textToSpeechLanguage,
    keyboardNavigation: true,
    contrast: true,
    invertColor: true,
    fontSize: true,
    underline: true,
    letterSpacing: true,
    lineHeight: true,
    enlargeCursor: true,
    hideMedia: true,
    disableAnimations: true,
    showLine: true,
    dyslexic: true,
    colors: config.colors,
    saturation: true,
    trigger
  };

  // If widget already exists, just reload configuration
  if (window[ACCESSIBILITY_KEY]) {
    reloadConfig(accessibilityConfig, config.dockWcagToken);
    return;
  }

  // Initialize accessibility widget
  injectAccessibilityScript(
    window,
    document,
    'script',
    ACCESSIBILITY_KEY,
    accessibilityConfig,
    config.dockWcagToken
  );
}
/**
 * Injects the accessibility script into the document
 * @param window Window object
 * @param document Document object
 * @param scriptTag Script tag name
 * @param accessibilityKey Key for accessibility configuration
 * @param config Accessibility configuration
 */
function injectAccessibilityScript(
  window: Window,
  document: Document,
  scriptTag: string,
  accessibilityKey: string,
  config: IAccessibilityConfig,
  dockWcagToken?: string
) {
  // Set accessibility configuration on window object
  window[accessibilityKey] = config;
  window[accessibilityKey].token = dockWcagToken;
  // Create and configure script element
  const firstScript = document.getElementsByTagName(scriptTag)[0];
  const scriptElement = document.createElement(scriptTag) as HTMLScriptElement;
  const timestamp = new Date().getTime();
  scriptElement.id = SCRIPT_ID;
  scriptElement.async = true;
  scriptElement.src = `${SCRIPT_URL.replace('{dock_wcag_token}', dockWcagToken)}?t=${timestamp}`;
  // Insert script into document
  firstScript.parentNode?.insertBefore(scriptElement, firstScript);
}

/**
 * Reloads the accessibility widget configuration
 * @param config New accessibility configuration
 */
function reloadConfig(config: IAccessibilityConfig, dockWcagToken?: string) {
  // Return if translations are not loaded
  if (!window[ACCESSIBILITY_KEY]?.trans) return;

  removeTranslationScripts();

  if (!window[ACCESSIBILITY_KEY]?.shd) {
    const interval = setInterval(() => {
      if (window[ACCESSIBILITY_KEY]?.shd) {
        // Update configuration and language settings
        window[ACCESSIBILITY_KEY].trans.currentLang =
          config.textToSpeechLanguage || MultiLangEnum.EN;
        window[ACCESSIBILITY_KEY].trans.setLanguage(
          config.textToSpeechLanguage || MultiLangEnum.EN
        );
        clearInterval(interval);
      }
    }, 1000);
    return;
  }

  // Update configuration and language settings
  window[ACCESSIBILITY_KEY] = { ...window[ACCESSIBILITY_KEY], ...config };
  window[ACCESSIBILITY_KEY].trans.currentLang =
    config.textToSpeechLanguage || MultiLangEnum.EN;
  window[ACCESSIBILITY_KEY].trans.setLanguage(
    config.textToSpeechLanguage || MultiLangEnum.EN
  );
}

function removeTranslationScripts() {
  const scripts = document.getElementsByTagName('script');
  for (let i = scripts.length - 1; i >= 0; i--) {
    const script = scripts[i];
    if (script.src && script.src.includes(`${SCRIPT_URI}/translations`)) {
      script.parentNode?.removeChild(script);
    }
  }
}

function removeAccessibility() {
  document.getElementById(ACCESSIBILITY_WIDGET_ID)?.remove();
  delete window[ACCESSIBILITY_KEY];

  const script = document.getElementById(SCRIPT_ID);
  if (script) {
    script.parentNode?.removeChild(script);
  }
}
