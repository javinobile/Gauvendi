/**
 * Note:
 * UC = Usercentrics CMP
 */

export type UcConsent = {
  gcm: UcConsentGmp;
  consent: UcConsentPayload;
};

export type UcConsentGmp = {
  adsDataRedaction?: boolean;
  adStorage?: string;
  adPersonalization?: string;
  adUserData?: string;
  analyticsStorage?: string;
};

export type UcConsentPayload = {
  services: UcConsentServices;
};

export type UcConsentServices = {
  [key: string]: UcConsentServiceDetails;
};

export type UcConsentServiceDetails = {
  name: string;
  consent: boolean;
};

export enum UcConsentServiceName {
  FUNCTIONALITY_STORAGE = 'Functionality Storage',
  PERSONALIZATION_STORAGE = 'Personalization Storage',
  SECURITY_STORAGE = 'Security Storage'
}
