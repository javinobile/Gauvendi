export interface IAccessibilityWidgetColors {
  primary: string; // Primary color for main elements (buttons, icons, headings)
  secondary: string; // Secondary color for backgrounds, borders, secondary buttons
}

export interface IAccessibilityConfig {
  widget: boolean; // Specifies whether to display the accessibility widget.
  contrast?: boolean; //	Enables high contrast mode.
  invertColor?: boolean; // Enables color inversion.
  fontSize?: boolean; // Allows changing the font size.
  underline?: boolean; // Underlines links on the page.
  letterSpacing?: boolean; // Increases letter spacing.
  lineHeight?: boolean; // Increases line height in text.
  textToSpeech?: boolean; // Adds text-to-speech functionality.
  enlargeCursor?: boolean; // Enlarges the cursor pointer.
  hideMedia?: boolean; // Hides multimedia elements on the page.
  disableAnimations?: boolean; // Disables animations on the page.
  showLine?: boolean; // Adds a line to help focus on reading.
  dyslexic?: boolean; // Changes the font to one that is dyslexia-friendly.
  textToSpeechLanguage?: string; // Language for text-to-speech.
  position?: string; // Position of the widget.
  keyboardNavigation?: boolean; // Enables keyboard navigation.
  colors?: IAccessibilityWidgetColors; // Colors for the widget.
  saturation?: boolean; // Enables color saturation.
  trigger?: any;
}

export interface IAccessibilityWidgetConfig {
  colors: IAccessibilityWidgetColors;
  textToSpeechLanguage: string;
  dockWcagToken?: string;
  isMobile?: boolean;
}
