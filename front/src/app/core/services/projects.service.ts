import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


export type ProjectStatus = 'PENDING_FUNDING' | 'IN_PROGRESS' | 'COMPLETED';


export interface CreateProjectDto {
name: string;
description: string;
budgetGoal: number;
startDate: string; // YYYY-MM-DD
estimatedEndDate: string; // YYYY-MM-DD
ownerId: number;
studentIds: number[];
}


export interface IProject {
id: number;
title: string;
summary?: string | null;
category?: string | null;
status?: 'CANCELLED' | 'IN_PROGRESS' | 'PENDING_FUNDING' | 'NOT_FUNDED' | 'COMPLETED' | string;
university?: string | null;
owner?: string | null;
tags?: string[] | null;
lastUpdated?: string | null;
fundingGoal?: number | null;
fundingRaised?: number | null;
startDate?: string | null;
estimatedEndDate?: string | null;
endDate?: string | null;
deleted?: boolean | null;
}


interface ProjectApi {
id: number;
name: string;
description: string;
budgetGoal: number;
currentGoal: number;
status: string;
startDate: string;
estimatedEndDate: string;
endDate: string | null;
tagName: string | null;
ownerName: string | null;
deleted: boolean;
}


function adapt(p: ProjectApi): IProject {
return {
id: p.id,
title: p.name,
summary: p.description,
status: p.status,
startDate: p.startDate ?? null,
estimatedEndDate: p.estimatedEndDate ?? null,
endDate: p.endDate ?? null,
fundingGoal: p.budgetGoal,
fundingRaised: p.currentGoal,
lastUpdated: p.startDate || null,
category: p.tagName ?? '—', // Mapear desde tagName
university: null,
owner: p.ownerName || null,
tags: null,
deleted: p.deleted,
};
}


@Injectable({ providedIn: 'root' })
export class ProjectsService {
private http = inject(HttpClient);
private api = '/api/projects';


getAll(): Observable<IProject[]> {
return this.http.get<ProjectApi[]>(this.api).pipe(map(list => (list ?? []).map(adapt)));
}

getAllByTag(tag: string): Observable<IProject[]> {
    const url = `/api/projects/tag/${encodeURIComponent(tag)}`;
    return this.http.get<ProjectApi[]>(url).pipe(map(list => (list ?? []).map(adapt)));
}

getAllAdmin(): Observable<IProject[]> {
  return this.http.get<ProjectApi[]>(`${this.api}/dashboard-admin/projects`).pipe(map(list => (list ?? []).map(adapt)));
}

getById(id: number): Observable<IProject | null> {
    return this.http.get<ProjectApi>(`${this.api}/${id}`)
      .pipe(
        map(p => p ? adapt(p) : null),
        // si falla, retornamos null para que el componente lo maneje
        catchError((err) => { console.error('ProjectsService.getById', err); return of(null); })
      );
}


// NUEVO: crear proyecto
create(dto: CreateProjectDto): Observable<{ id: number } & ProjectApi> {
return this.http.post<{ id: number } & ProjectApi>(this.api, dto);
}
}