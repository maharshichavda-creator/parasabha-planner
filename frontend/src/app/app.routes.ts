import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'weekly', pathMatch: 'full' },
  {
    path: 'weekly',
    loadComponent: () => import('./features/weekly-schedule/weekly-schedule').then((m) => m.WeeklyScheduleComponent)
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
    path: 'swamis',
    loadComponent: () => import('./features/swamis/swamis').then((m) => m.SwamisComponent)
  },
  { path: '**', redirectTo: 'weekly' }
];
