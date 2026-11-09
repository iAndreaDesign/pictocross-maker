import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideI18n } from './shared/i18n/i18n.providers';

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideI18n()],
};
