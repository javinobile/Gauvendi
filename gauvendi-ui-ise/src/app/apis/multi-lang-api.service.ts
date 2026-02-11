import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from "@environment/environment";
import {HttpClient} from "@angular/common/http";

@Injectable({providedIn: 'root'})
export class MultiLangApiService {
  constructor(
    private httpClient: HttpClient
  ) {
  }

  staticLanguageContent(language: string): Observable<any> {
    return this.httpClient.get(`${environment.cdnTranslationUrl}/${this.getLanguage((language))}/i18n.json`);
  }

  private getLanguage(language: string): string {
    switch (language?.toUpperCase()) {
      case 'EN':
        return 'en-EN';
      case 'DE':
        return 'de-DE';
      case 'ES':
        return 'es-ES';
      case 'FR':
        return 'fr-FR';
      case 'IT':
        return 'it-IT';
      case 'AR':
        return 'ar-AE';
      case 'NL':
        return 'nl-NL';
      default:
        return 'en-EN';
    }
  }
}
