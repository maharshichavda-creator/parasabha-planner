import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ScheduleEntry, ScheduleEntryRequest, WeeklyScheduleDay } from '../models';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/schedule`;

  list(): Observable<ScheduleEntry[]> {
    return this.http.get<ScheduleEntry[]>(this.baseUrl);
  }

  /** @param weekStartIso ISO yyyy-MM-dd date (any day within the desired week; server snaps to Monday). */
  weekly(weekStartIso: string): Observable<WeeklyScheduleDay[]> {
    const params = new HttpParams().set('weekStart', weekStartIso);
    return this.http.get<WeeklyScheduleDay[]>(`${this.baseUrl}/weekly`, { params });
  }

  get(id: number): Observable<ScheduleEntry> {
    return this.http.get<ScheduleEntry>(`${this.baseUrl}/${id}`);
  }

  create(request: ScheduleEntryRequest): Observable<ScheduleEntry> {
    return this.http.post<ScheduleEntry>(this.baseUrl, request);
  }

  update(id: number, request: ScheduleEntryRequest): Observable<ScheduleEntry> {
    return this.http.put<ScheduleEntry>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
