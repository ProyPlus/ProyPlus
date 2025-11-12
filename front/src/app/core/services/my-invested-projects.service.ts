import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface IInvestedProjectApi {
  id: number;
  name: string;
  description?: string;
  budgetGoal?: number;
  currentGoal?: number;
  status?: string;
  startDate?: string;
  estimatedEndDate?: string;
  endDate?: string | null;
  ownerId?: number;
  ownerName?: string | null;
  students?: Array<{ id: number; name: string }>;
  tagName?: string; // El backend devuelve la categoría en 'tagName'
}

export interface IInvestedProject {
  id: number;
  title: string;
  summary: string | null;
  status: string | null;
  lastUpdated: string | null;
  fundingGoal: number | null;
  fundingRaised: number | null;
  owner?: string | null;
  category?: string | null;
  university?: string | null;
  students?: Array<{ id: number; name: string }> | null;
}

function adapt(p: IInvestedProjectApi): IInvestedProject {
  return {
    id: p.id,
    title: p.name,
    summary: p.description ?? null,
    status: p.status ?? null,
    lastUpdated: p.startDate ?? null,
    fundingGoal: p.budgetGoal ?? null,
    fundingRaised: p.currentGoal ?? null,
    owner: p.ownerName ?? null,
    category: p.tagName ?? '—', // Mapear desde tagName
    university: null,
    students: p.students ?? null,
  };
}

@Injectable({ providedIn: 'root' })
export class InvestedProjectsService {
  private http = inject(HttpClient);
  private api = '/api/projects';

  private getUserId(): number | null {
    try {
      const raw = localStorage.getItem('auth_user');
      if (!raw) return null;
      const u = JSON.parse(raw);
      const id = Number(u?.id ?? u?.userId ?? u?.sub);
      return Number.isFinite(id) ? id : null;
    } catch {
      return null;
    }
  }

  getByInvestment(): Observable<IInvestedProject[]> {
    const investorId = this.getUserId();
    console.log('Este es el id del usuario actual:', investorId);
    const url = `${this.api}/by-investment/${investorId}`;

  return this.http.get<IInvestedProjectApi[]>(url).pipe(
      map(list => {
        const data = list ?? [];
        return data.map(adapt);
      })
    );
  }
}