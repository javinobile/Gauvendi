import * as countries from 'i18n-iso-countries';

// Note: Locale registration is only needed for country names, not for code conversion
// The alpha2ToAlpha3 and alpha3ToAlpha2 functions work without locale registration

/**
 * Converts ISO 3166-1 alpha-2 country code (2 characters) to alpha-3 (3 characters)
 * @param alpha2Code - 2-character country code (e.g., 'US', 'GB', 'FR')
 * @returns 3-character country code (e.g., 'USA', 'GBR', 'FRA') or null if not found
 * @example
 * convertAlpha2ToAlpha3('US') // returns 'USA'
 * convertAlpha2ToAlpha3('GB') // returns 'GBR'
 * convertAlpha2ToAlpha3('FR') // returns 'FRA'
 */
export const convertAlpha2ToAlpha3 = (alpha2Code: string | null | undefined): string | null => {
  if (!alpha2Code || alpha2Code.length !== 2) {
    return null;
  }

  try {
    const alpha3Code = countries.alpha2ToAlpha3(alpha2Code.toUpperCase());
    return alpha3Code || null;
  } catch (error) {
    return null;
  }
};

/**
 * Converts ISO 3166-1 alpha-3 country code (3 characters) to alpha-2 (2 characters)
 * @param alpha3Code - 3-character country code (e.g., 'USA', 'GBR', 'FRA')
 * @returns 2-character country code (e.g., 'US', 'GB', 'FR') or null if not found
 * @example
 * convertAlpha3ToAlpha2('USA') // returns 'US'
 * convertAlpha3ToAlpha2('GBR') // returns 'GB'
 * convertAlpha3ToAlpha2('FRA') // returns 'FR'
 */
export const convertAlpha3ToAlpha2 = (alpha3Code: string | null | undefined): string | null => {
  if (!alpha3Code || alpha3Code.length !== 3) {
    return null;
  }

  try {
    const alpha2Code = countries.alpha3ToAlpha2(alpha3Code.toUpperCase());
    return alpha2Code || null;
  } catch (error) {
    return null;
  }
};

/**
 * Compares a 2-character country code with a 3-character country code
 * by converting the 2-character code to 3-character format
 * @param alpha2Code - 2-character country code (e.g., 'US', 'GB', 'FR')
 * @param alpha3Code - 3-character country code (e.g., 'USA', 'GBR', 'FRA')
 * @returns true if codes match, false otherwise
 * @example
 * compareCountryCodes('US', 'USA') // returns true
 * compareCountryCodes('GB', 'GBR') // returns true
 * compareCountryCodes('US', 'GBR') // returns false
 */
export const compareCountryCodes = (
  alpha2Code: string | null | undefined,
  alpha3Code: string | null | undefined
): boolean => {
  if (!alpha2Code || !alpha3Code) {
    return false;
  }

  const convertedAlpha3 = convertAlpha2ToAlpha3(alpha2Code);
  if (!convertedAlpha3) {
    return false;
  }

  return convertedAlpha3.toUpperCase() === alpha3Code.toUpperCase();
};
