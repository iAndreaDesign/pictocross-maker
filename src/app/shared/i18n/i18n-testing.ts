import { Injectable } from '@angular/core';
import {
  TRANSLOCO_MISSING_HANDLER,
  TranslocoMissingHandler,
  TranslocoTestingModule,
  Translation,
} from '@jsverse/transloco';
import es from '../../../assets/i18n/es.json';
import { AVAILABLE_LANGS, DEFAULT_LANG } from './i18n.providers';

/** Falla el test si se usa una clave sin traducción. */
@Injectable()
export class ThrowingMissingHandler implements TranslocoMissingHandler {
  handle(key: string): string {
    throw new Error(`Clave i18n sin traducción: "${key}"`);
  }
}

export const i18nTestingImports = [
  TranslocoTestingModule.forRoot({
    langs: { [DEFAULT_LANG]: es as Translation },
    translocoConfig: { availableLangs: AVAILABLE_LANGS, defaultLang: DEFAULT_LANG },
    preloadLangs: true,
  }),
];

export const i18nTestingProviders = [
  { provide: TRANSLOCO_MISSING_HANDLER, useClass: ThrowingMissingHandler },
];
