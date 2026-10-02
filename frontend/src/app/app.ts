import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './core/services/auth.service';

@Component({
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly title = signal('BAPS àª¶à«àª°à«€ àª¸à«àªµàª¾àª®àª¿àª¨àª¾àª°àª¾àª¯àª£ àª®àª‚àª¦àª¿àª°, àªªà«àª£à«‡');
  protected readonly isLoggedIn = this.authService.isLoggedIn;

  // Tracks the current URL so the toolbar/menu can be hidden on the login screen - only a
  // signal read (not the router's snapshot) triggers change detection on navigation.
  protected readonly isLoginScreen = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.startsWith('/login'))
    ),
    { initialValue: this.router.url.startsWith('/login') }
  );

  private static readonly COLLAPSE_KEY = 'sidebarCollapsed';
  protected readonly collapsed = signal(localStorage.getItem(App.COLLAPSE_KEY) === 'true');
  protected readonly mobileOpen = signal(false);

  protected toggleMenu(): void {
    if (window.innerWidth <= 1024) {
      this.mobileOpen.update((v) => !v);
    } else {
      this.collapsed.update((v) => !v);
      localStorage.setItem(App.COLLAPSE_KEY, String(this.collapsed()));
    }
  }

  protected onNavigate(): void {
    this.mobileOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}

