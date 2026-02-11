/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
    colors: {
      "hotel-primary-color": "var(--color-primary)",
      "background-primary-color": "var(--color-background-primary)",
      "background-secondary-color": "var(--color-background-secondary)",
      "primary-color": "var(--color-text-primary)",
      "secondary-color": "var(--color-text-secondary)",
      "border-color": "var(--color-border)",
      "header-color": "var(--color-header-text)",
      "header-background-color": "var(--color-header-background)",
      "footer-color": "var(--color-footer-text)",
      "footer-background-color": "var(--color-footer-background)",
      "entry-bar-background-color": "var(--color-entry-bar-background)",
      "calendar-selected-color": "var(--color-calendar-selected-text)",
      "calendar-selected-background-color": "var(--color-calendar-selected-background)",
      "calendar-hover-color": "var(--color-calendar-hover-text)",
      "calendar-hover-background-color": "var(--color-calendar-hover-background)",
      "configurator-background-color": "var(--color-configurator-background)",
      "configurator-category-default-icon-color": "var(--color-configurator-category-default-icon)",
      "configurator-category-default-background-color": "var(--color-configurator-category-default-background)",
      "configurator-category-hover-icon-color": "var(--color-configurator-category-hover-icon)",
      "configurator-category-hover-background-color": "var(--color-configurator-category-hover-background)",
      "configurator-feature-default-icon-color": "var(--color-configurator-feature-default-icon)",
      "configurator-feature-default-background-color": "var(--color-configurator-feature-default-background)",
      "configurator-feature-hover-icon-color": "var(--color-configurator-feature-hover-icon)",
      "configurator-feature-hover-background-color": "var(--color-configurator-feature-hover-background)",
      "product-background-color": "var(--color-product-background)",
      "button-hover-background-color": "var(--color-button-hover-background)",
      "button-hover-color": "var(--color-button-hover-text)",
      "button-normal-background-color": "var(--color-button-normal-background)",
      "button-normal-color": "var(--color-button-normal-text)",
      "outline-button-hover-background-color": "var(--color-outline-button-hover-background)",
      "outline-button-hover-color": "var(--color-outline-button-hover-text)",
      "outline-button-normal-background-color": "var(--color-outline-button-normal-background)",
      "outline-button-normal-color": "var(--color-outline-button-normal-text)",
      "lowest-price-color": "var(--color-lowest-price-text)",
      "lowest-price-background-color": "var(--color-lowest-price-background)",
      "most-popular-color": "var(--color-most-popular-text)",
      "most-popular-background-color": "var(--color-most-popular-background)",
      "our-tip-color": "var(--color-our-tip-text)",
      "our-tip-background-color": "var(--color-our-tip-background)",
      "matched-color": "var(--color-matched-text)",
      "matched-background-color": "var(--color-matched-background)",
      "popover-background-color": "var(--color-popover-background)",
      "popover-primary-color": "var(--color-popover-text-primary)",
      "popover-secondary-color": "var(--color-popover-text-secondary)",
      "error-color": "#F85757"
    },
    screens: {
      'sm': {'max': '767px'},

      'md': {'min': '768px', 'max': '1232px'},

      'lg': {'min': '1233px', 'max': '1365px'},

      // 'lg': {'min': '1366px'}
    },
    boxShadow: {
      "m": "0 5px 24px rgba(184, 189, 209, 0.01)",
      "ms": '0px 2px 16px 0px rgba(0, 0, 0, 0.25)',
      "ml": '0px 0px 16px 0px rgba(0, 0, 0, 0.24)',
      "active": "0 0 16px 0 rgba(0, 0, 0, 0.12)",
      "configurator": "0px 4px 16px 0px rgba(0, 0, 0, 0.08)",
      "count": "0px 0px 12px 0px rgba(0, 0, 0, 0.08)",
      "extras": "0px 0px 12px 0px rgba(0, 0, 0, 0.08)",
      "panel-price": "0px 0px 28px 0px rgba(0, 0, 0, 0.06)",
      "unit": "0px 4px 16px 0px rgba(0, 0, 0, 0.16)",
      "combination-item": "0px 2px 24px 0px rgba(0, 0, 0, 0.24)",
      "total-payment": "0px -4px 40px 0px rgba(0, 0, 0, 0.04)",
      "search-bar-mobile": "0px 0px 10px 0px rgba(100, 124, 159, 0.25)",
      "option-item": "0px 2px 16px 0px rgba(0, 0, 0, 0.06)"
    }
  },
  plugins: [],
}

