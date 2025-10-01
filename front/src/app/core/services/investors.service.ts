// src/app/core/services/investors.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Investor } from '../../models/investor.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InvestorService {
  // ✅ relativo → usa tu proxy a 72.60.11.35:8080
  private apiUrl = '/api/investors';

  private _investors = signal<Investor[]>([]);
  investors = this._investors.asReadonly();

  constructor(private http: HttpClient) {}

  loadAll(): Observable<Investor[]> {
    return new Observable((subscriber) => {
      this.http.get<Investor[]>(this.apiUrl).subscribe({
        next: (data) => {
          this._investors.set(data ?? []);
          subscriber.next(data ?? []);
          subscriber.complete();
        },
        error: (err) => subscriber.error(err)
      });
    });
  }

  // 🔹 nuevo
  getById(id: number): Observable<Investor> {
    return this.http.get<Investor>(`${this.apiUrl}/${id}`);
  }

  create(investorData: Partial<Investor>): Observable<Investor> {
    return new Observable((subscriber) => {
      this.http.post<Investor>(this.apiUrl, investorData).subscribe({
        next: (created) => {
          this._investors.update(list => [...list, created]);
          subscriber.next(created);
          subscriber.complete();
        },
        error: (err) => subscriber.error(err)
      });
    });
  }

  // 🔹 nuevo
  update(id: number, investorData: Partial<Investor>): Observable<Investor> {
    return new Observable((subscriber) => {
      this.http.put<Investor>(`${this.apiUrl}/${id}`, investorData).subscribe({
        next: (updated) => {
          this._investors.update(list => list.map(i => (i as any).id === id ? updated : i));
          subscriber.next(updated);
          subscriber.complete();
        },
        error: (err) => subscriber.error(err)
      });
    });
  }

  // 🔹 opcionales (si tu backend los tiene; si no, el componente hace fallback con update)
  activate(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/activate`, {});
  }
  deactivate(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
