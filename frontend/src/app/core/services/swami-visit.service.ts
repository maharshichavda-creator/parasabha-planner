import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SwamiVisit, SwamiVisitRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class SwamiVisitService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/swami-visits`;

  /** @param weekStartIso ISO yyyy-MM-dd date (any day within the desired week; server snaps to Monday). */
  listForWeek(weekStartIso: string): Observable<SwamiVisit[]> {
    const params = new HttpParams().set('weekStart', weekStartIso);
    return this.http.get<SwamiVisit[]>(this.baseUrl, { params });
  }

  /** Creates a new visit, or updates the existing one if this entry already has a plan for that date. */
  upsert(request: SwamiVisitRequest): Observable<SwamiVisit> {
    return this.http.post<SwamiVisit>(this.baseUrl, request);
  }

  update(id: number, request: SwamiVisitRequest): Observable<SwamiVisit> {
    return this.http.put<SwamiVisit>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
