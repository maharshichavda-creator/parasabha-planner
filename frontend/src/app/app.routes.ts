import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'weekly', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login').then((m) => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent)
  },
  {
    path: 'weekly',
    canActivate: [authGuard],
    loadComponent: () => import('./features/weekly-schedule/weekly-schedule').then((m) => m.WeeklyScheduleComponent)
  },
  {
    path: 'report',
    canActivate: [authGuard],
    loadComponent: () => import('./features/weekly-report/weekly-report').then((m) => m.WeeklyReportComponent)
  },
  {
    path: 'plan-visits',
    canActivate: [authGuard],
    loadComponent: () => import('./features/plan-visits/plan-visits').then((m) => m.PlanVisitsComponent)
  },
  {
    path: 'mandals',
    canActivate: [authGuard],
    loadComponent: () => import('./features/mandals/mandals').then((m) => m.MandalsComponent)
  },
  {
    path: 'mandal-schedule',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/mandal-schedule/mandal-schedule').then((m) => m.MandalScheduleComponent)
  },
  {
    path: 'swamis',
    canActivate: [authGuard],
    loadComponent: () => import('./features/swamis/swamis').then((m) => m.SwamisComponent)
  },
  { path: '**', redirectTo: 'weekly' }
];
