import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MonthlyDashboard } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/dashboard`;

  /** @param month ISO year-month, e.g. "2026-09". */
  monthly(month: string): Observable<MonthlyDashboard> {
    const params = new HttpParams().set('month', month);
    return this.http.get<MonthlyDashboard>(`${this.baseUrl}/monthly`, { params });
  }
}
