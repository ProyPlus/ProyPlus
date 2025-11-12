import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, catchError } from 'rxjs';
import { IMyProject } from './my-projects.service';

interface IParticipantProjectApi {
  idProject: number;
  name: string;
  description: string;
  budgetGoal: number;
  currentGoal: number;
  status: string;
  startDate: string;
  estimatedEndDate: string;
  endDate: string | null;
  tagName?: string; // Añadido para la categoría
}

function adapt(p: IParticipantProjectApi): IMyProject {
  return {
    id: p.idProject,
    title: p.name,
    summary: p.description ?? null,
    status: p.status ?? null,
    lastUpdated: p.startDate ?? null,
    fundingGoal: p.budgetGoal ?? null,
    fundingRaised: p.currentGoal ?? null,
    owner: null,
    category: p.tagName ?? null, // Mapear desde la API
    university: null,
    students: null,
  };
}

@Injectable({ providedIn: 'root' })
export class ParticipantProjectsService {
  private http = inject(HttpClient);

 private getUserId(): number | null {
  const KEYS = ['auth_user', 'pp_user'];
  for (const k of KEYS) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const u = JSON.parse(raw);
      // acepta id, userId o sub (y como string o number)
      const id = Number(u?.id ?? u?.userId ?? u?.sub);
      if (Number.isFinite(id)) return id;
    } catch { /* noop */ }
  }
  return null;
}


  /** Proyectos donde soy colaborador (no owner) */
  getMineAsParticipant(): Observable<IMyProject[]> {
    const id = this.getUserId();
    if (!id) return of([]);
    // Usamos una URL relativa para que el proxy de Angular la intercepte
    const url = `/api/students/projects/${id}`;
    return this.http.get<IParticipantProjectApi[]>(url).pipe(
      map(list => (list ?? []).map(adapt)),
      catchError(() => of([])) // Si la API falla, devuelve un array vacío para no romper la UI
    );
  }
}
