import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'weekly', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent)
  },
  {
    path: 'weekly',
    loadComponent: () => import('./features/weekly-schedule/weekly-schedule').then((m) => m.WeeklyScheduleComponent)
  },
  {
    path: 'report',
    loadComponent: () => import('./features/weekly-report/weekly-report').then((m) => m.WeeklyReportComponent)
  },
  {
    path: 'plan-visits',
    loadComponent: () => import('./features/plan-visits/plan-visits').then((m) => m.PlanVisitsComponent)
  },
  {
    path: 'mandals',
    loadComponent: () => import('./features/mandals/mandals').then((m) => m.MandalsComponent)
  },
  {
    path: 'mandal-schedule',
    loadComponent: () =>
      import('./features/mandal-schedule/mandal-schedule').then((m) => m.MandalScheduleComponent)
  },
  {
    path: 'swamis',
    loadComponent: () => import('./features/swamis/swamis').then((m) => m.SwamisComponent)
  },
  { path: '**', redirectTo: 'weekly' }
];
