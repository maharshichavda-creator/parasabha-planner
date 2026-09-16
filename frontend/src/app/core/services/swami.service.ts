import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Swami } from '../models';

@Injectable({ providedIn: 'root' })
export class SwamiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/swamis`;

  list(): Observable<Swami[]> {
    return this.http.get<Swami[]>(this.baseUrl);
  }

  get(id: number): Observable<Swami> {
    return this.http.get<Swami>(`${this.baseUrl}/${id}`);
  }

  create(swami: Swami): Observable<Swami> {
    return this.http.post<Swami>(this.baseUrl, swami);
  }

  update(id: number, swami: Swami): Observable<Swami> {
    return this.http.put<Swami>(`${this.baseUrl}/${id}`, swami);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
