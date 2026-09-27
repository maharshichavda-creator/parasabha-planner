import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
    provideServiceWorker('ngsw-worker.js', {
      // The mobile (Capacitor) build never emits ngsw-worker.js, so registering it
      // there would just log a failed fetch on every app start.
      enabled: !isDevMode() && !Capacitor.isNativePlatform(),
      // Register shortly after the app stabilizes (or after 5s at the latest) rather
      // than waiting up to 30s, so Chrome/Android can detect installability (which
      // requires an active service worker) within a typical first-visit session.
      registrationStrategy: 'registerWhenStable:5000'
    })
  ]
};
