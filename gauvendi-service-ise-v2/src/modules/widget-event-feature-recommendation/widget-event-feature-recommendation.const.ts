/**
 * Constants and translation mappings for Widget Event Feature Recommendation
 * Extracted from service class for better organization
 */

// Translation messages for travel segments based on guest composition
export const TRAVEL_SEGMENT_TRANSLATION_MESSAGE: Record<string, Record<number, string>> = {
  null: {
    1: 'Solo travelers,',
    2: 'Guests,',
    3: 'Guests with young children,',
    4: 'Families,',
    5: 'Guests with dogs',
    6: 'Guests',
    7: 'Families',
    8: 'Guests',
    9: 'Small groups,'
  },
  DE: {
    1: 'Alleinreisende,',
    2: 'Gäste,',
    3: 'Gäste mit kleinen Kindern,',
    4: 'Familien,',
    5: 'Gäste mit Hunden,',
    6: 'Gäste,',
    7: 'Familien,',
    8: 'Gäste,',
    9: 'Kleine Gruppen,'
  },
  ES: {
    1: 'Viajeros solos,',
    2: 'Huéspedes,',
    3: 'Huéspedes con niños pequeños,',
    4: 'Familias,',
    5: 'Huéspedes con perros',
    6: 'Huéspedes',
    7: 'Familias',
    8: 'Huéspedes',
    9: 'Grupos pequeños,'
  },
  FR: {
    1: 'Voyageurs solo,',
    2: 'Clients,',
    3: 'Clients avec de jeunes enfants,',
    4: 'Familles,',
    5: 'Clients avec des chiens',
    6: 'Clients',
    7: 'Les familles',
    8: 'Clients',
    9: 'Petits groupes,'
  },
  IT: {
    1: 'Viaggiatori singoli,',
    2: 'Ospiti,',
    3: 'Ospiti con bambini piccoli,',
    4: 'Famiglie,',
    5: 'Guests with dogs',
    6: 'Guests',
    7: 'Families',
    8: 'Guests',
    9: 'Piccoli gruppi,'
  },
  AR: {
    1: 'المسافرون المنفردون',
    2: 'النزلاء',
    3: 'النزلاء مع أطفال صغار',
    4: 'العائلات',
    5: 'ضيوف مع كلاب',
    6: 'مجموعات صغيرة',
    7: 'عائلات',
    8: 'ضيوف',
    9: 'المجموعات الصغيرة'
  },
  NL: {
    1: 'Soloreizigers,',
    2: 'Gasten,',
    3: 'Gasten met jonge kinderen,',
    4: 'Gezinnen,',
    5: 'Guests with dogs',
    6: 'Guests',
    7: 'Families',
    8: 'Guests',
    9: 'Kleine groepen,'
  }
};

// Translation messages for "staying for" text
export const FOR_TRANSLATION_MESSAGE: Record<string, string> = {
  null: 'staying for',
  DE: 'die für',
  ES: 'que se alojan por',
  FR: 'qui séjournent pour',
  IT: 'che soggiornano per',
  AR: 'الذين يقيمون لمدة',
  NL: 'die voor'
};

// Translation messages for "often pick" text
export const PICKED_TRANSLATION_MESSAGE: Record<string, string> = {
  null: 'often pick',
  DE: 'wählen oft',
  ES: 'suelen elegir',
  FR: 'choisissent souvent',
  IT: 'scelgono spesso',
  AR: 'يختارون غالبًا.',
  NL: 'kiezen vaak'
};

// LOS (Length of Stay) message functions using template literals
export const createLosText = (nights: number, language: string | null): string => {
  const losMessages = {
    single: {
      null: (n: number) => `${n} night,`,
      DE: (n: number) => `${n} Nacht übernachten,`,
      ES: (n: number) => `${n} noche,`,
      FR: (n: number) => `${n} nuit,`,
      IT: (n: number) => `${n} notte,`,
      AR: (n: number) => `${n} ليلة,`,
      NL: (n: number) => `${n} nacht verblijven,`
    },
    plural: {
      null: (n: number) => `${n} nights,`,
      DE: (n: number) => `${n} Nächte übernachten,`,
      ES: (n: number) => `${n} noches,`,
      FR: (n: number) => `${n} nuits,`,
      IT: (n: number) => `${n} notti,`,
      AR: (n: number) => `${n} ليالٍٍ,`,
      NL: (n: number) => `${n} nachten verblijven,`
    }
  };

  const category = nights === 1 ? 'single' : 'plural';
  const langKey = language || 'null';
  const messageFunc = losMessages[category][langKey] || losMessages[category]['null'];

  return messageFunc(nights);
};

// Message format functions using TypeScript template literals
export const createLosMessage = (
  travelSegment: string,
  forText: string,
  los: string,
  picked: string
): string => {
  return `${travelSegment} ${forText} ${los}\n ${picked}`;
};

export const createEventMessage = (
  event: string,
  travelSegment: string,
  picked: string
): string => {
  return `${event}: ${travelSegment}\n ${picked}:`;
};

// Helper function to get translation text with fallback
export const getTranslationText = (
  translationMap: Record<string, string>,
  language: string | null
): string => {
  return translationMap[language || 'null'] || translationMap['null'];
};

export const ADULTS_CATEGORY_GROUP = {
  // Rank 1: 2 Adults (32%)
  TWO_ADULTS: '2a',
  // Rank 2: 2 Adults + 1 Child (18%)
  TWO_ADULTS_ONE_CHILD: '2a_1c',
  // Rank 3: 2 Adults + 2 Children (12%)
  TWO_ADULTS_TWO_CHILDREN: '2a_2c',
  // Rank 4: 1 Adult (8%)
  ONE_ADULT: '1a',
  // Rank 5: 3 Adults (7%)
  THREE_ADULTS: '3a',
  // Rank 6: 4 Adults (6%)
  FOUR_ADULTS: '4a',
  // Rank 7: 2 Adults + 3 Children (4%)
  TWO_ADULTS_THREE_CHILDREN: '2a_3c',
  // Rank 8: 1 Adult + 1 Child (3%)
  ONE_ADULT_ONE_CHILD: '1a_1c',
  // Rank 9: 5 Adults (3%)
  FIVE_ADULTS: '5a',
  // Rank 10: 3 Adults + 1 Child (3%)
  THREE_ADULTS_ONE_CHILD: '3a_1c',
  // Rank 11: 6 Adults (2%)
  SIX_ADULTS: '6a',
  // Rank 12: 4 Adults + 2 Children (2%)
  FOUR_ADULTS_TWO_CHILDREN: '4a_2c',
  // Rank 13: 3 Adults + 2 Children (~1.5%)
  THREE_ADULTS_TWO_CHILDREN: '3a_2c',
  // Rank 14: 1 Adult + 2 Children (~1.2%)
  ONE_ADULT_TWO_CHILDREN: '1a_2c',
  // Rank 15: 2 Adults + 4 Children (~1.1%)
  TWO_ADULTS_FOUR_CHILDREN: '2a_4c',
  // Rank 16: 7 Adults (~0.9%)
  SEVEN_ADULTS: '7a',
  // Rank 17: 5 Adults + 1 Child (~0.8%)
  FIVE_ADULTS_ONE_CHILD: '5a_1c',
  // Rank 18: 8 Adults (~0.7%)
  EIGHT_ADULTS: '8a',
  // Rank 19: 6 Adults + 2 Children (~0.6%)
  SIX_ADULTS_TWO_CHILDREN: '6a_2c',
  // Rank 20: 4 Adults + 3 Children (~0.5%)
  FOUR_ADULTS_THREE_CHILDREN: '4a_3c',
  // Fallback for other combinations
  OTHER: 'other'
};

export const PETS_CATEGORY_GROUP = {
  NO_PETS: 'no_pets',
  PETS: 'pets'
};

export const ROOMS_CATEGORY_GROUP = {
  ONE: 'one',
  MULTI: 'multi'
};

export const FEATURE_CACHE_KEYS = 'feature_cache_keys';
export const FEATURE_EVENT_CACHE_KEYS = 'feature_event_cache_keys';
