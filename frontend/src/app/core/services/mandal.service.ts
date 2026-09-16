import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Mandal } from '../models';

@Injectable({ providedIn: 'root' })
export class MandalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/mandals`;

  list(): Observable<Mandal[]> {
    return this.http.get<Mandal[]>(this.baseUrl);
  }

  get(id: number): Observable<Mandal> {
    return this.http.get<Mandal>(`${this.baseUrl}/${id}`);
  }

  create(mandal: Mandal): Observable<Mandal> {
    return this.http.post<Mandal>(this.baseUrl, mandal);
  }

  update(id: number, mandal: Mandal): Observable<Mandal> {
    return this.http.put<Mandal>(`${this.baseUrl}/${id}`, mandal);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
