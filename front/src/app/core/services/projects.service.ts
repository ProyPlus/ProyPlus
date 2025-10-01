import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';


export type ProjectStatus = 'PENDING_FUNDING' | 'IN_PROGRESS' | 'COMPLETED';


export interface CreateProjectDto {
name: string;
description: string;
budgetGoal: number;
status: ProjectStatus | string;
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
status?: 'IDEA' | 'IN_PROGRESS' | 'MVP' | 'FUNDING' | 'COMPLETED' | string;
university?: string | null;
owner?: string | null;
tags?: string[] | null;
lastUpdated?: string | null;
fundingGoal?: number | null;
fundingRaised?: number | null;
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
}


function adapt(p: ProjectApi): IProject {
return {
id: p.id,
title: p.name,
summary: p.description,
status: p.status,
fundingGoal: p.budgetGoal,
fundingRaised: p.currentGoal,
lastUpdated: p.startDate || null,
category: '—',
university: null,
owner: null,
tags: null,
};
}


@Injectable({ providedIn: 'root' })
export class ProjectsService {
private http = inject(HttpClient);
private api = '/api/projects';


getAll(): Observable<IProject[]> {
return this.http.get<ProjectApi[]>(this.api).pipe(map(list => (list ?? []).map(adapt)));
}


// NUEVO: crear proyecto
create(dto: CreateProjectDto): Observable<{ id: number } & ProjectApi> {
return this.http.post<{ id: number } & ProjectApi>(this.api, dto);
}
}