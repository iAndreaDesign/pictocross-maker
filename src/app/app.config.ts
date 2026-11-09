import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { DraftPersistence } from './features/editor/draft-persistence/draft-persistence';
import { provideI18n } from './shared/i18n/i18n.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideI18n(),
    // Restaura el borrador antes del primer render y empieza a guardar los cambios.
    provideAppInitializer(() => {
      const draft = inject(DraftPersistence);
      draft.restore();
      draft.start();
    }),
  ],
};
