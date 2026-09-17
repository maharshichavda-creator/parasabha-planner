import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WeeklyTopic, WeeklyTopicRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class WeeklyTopicService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/weekly-topics`;

  /**
   * @param weekStartIso ISO yyyy-MM-dd date (any day within the desired week; server snaps to Monday).
   * Always resolves - if nothing has been planned yet for the week, the server returns an empty shell.
   */
  getForWeek(weekStartIso: string): Observable<WeeklyTopic> {
    const params = new HttpParams().set('weekStart', weekStartIso);
    return this.http.get<WeeklyTopic>(this.baseUrl, { params });
  }

  /** Creates or updates the P1/P2 topic plan for the week identified by `request.weekStart`. */
  upsert(request: WeeklyTopicRequest): Observable<WeeklyTopic> {
    return this.http.put<WeeklyTopic>(this.baseUrl, request);
  }
}
