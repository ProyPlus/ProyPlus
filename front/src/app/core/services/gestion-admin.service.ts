import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


export type Currency = 'USD' | 'ARS' | 'CNY' | 'EUR';
export type ContractStatus = string;
export type InvestmentStatus = string;
export type EarningStatus = string;
export type ProjectStatus = 'PENDING_FUNDING' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_FUNDED' | 'CANCELLED' | string;

export interface ServerResponseInvestmentDTO {
  idInvestment: number;
  status: InvestmentStatus;
  amount: number;
  currency: Currency;
  createdAt?: string;
  confirmedAt?: string | null;
  generatedById?: number;
  projectId?: number;
  confirmedByStudentId?: number | null;
}

export interface ServerResponseEarningDTO {
  idEarning: number;
  amount: number;
  profitRate: number;
  currency: Currency;
  status: EarningStatus;
  createdAt?: string;
  confirmedAt?: string | null;
  contractId?: number;
  projectId?: number;
  generatedById?: number;
  confirmedById?: number | null;
  baseAmount?: number;
  profitAmount?: number;
}

export interface ServerResponseContractDTO {
  idContract: number;
  projectId?: number;
  createdByInvestorId?: number;
  textTitle: string;
  description?: string;
  amount?: number;
  currency?: Currency;
  status?: ContractStatus;
  createdAt?: string;
  investorSigned?: boolean;
  investorSignedDate?: string | null;
  studentSigned?: boolean;
  studentSignedDate?: string | null;
  profit1Year?: number;
  profit2Years?: number;
  profit3Years?: number;
}


export interface RequestAdminProjectUpdateDTO {
  name: string;
  description: string;
  budgetGoal: number | null;
  status: ProjectStatus;
  startDate: string | null;
  estimatedEndDate: string | null;
  endDate: string | null;
  deleted: boolean;
}


export interface RequestAdminContractUpdateDTO {
  status: ContractStatus;
}


export interface RequestAdminInvestmentUpdateDTO {
  status: InvestmentStatus;
}


export interface RequestAdminUpdateEarningStatusDTO {
  status: EarningStatus;
}


@Injectable({ providedIn: 'root' })
export class GestionAdminService {
  
  private adminBaseUrl = '/api/admin';
  
  private apiBaseUrl = '/api';

  constructor(private http: HttpClient) {}

  getContractsByProject(projectId: number): Observable<ServerResponseContractDTO[]> {
    return this.http
      .get<ServerResponseContractDTO[]>(`${this.apiBaseUrl}/contracts/by-project/${projectId}`)
      .pipe(catchError(err => { console.error('getContractsByProject', err); return of([] as ServerResponseContractDTO[]); }));
  }

  getInvestmentsByProject(projectId: number): Observable<ServerResponseInvestmentDTO[]> {
    return this.http
      .get<ServerResponseInvestmentDTO[]>(`${this.apiBaseUrl}/investments/investments-by-project/${projectId}`)
      .pipe(catchError(err => { console.error('getInvestmentsByProject', err); return of([] as ServerResponseInvestmentDTO[]); }));
  }

  getEarningsByProject(projectId: number): Observable<ServerResponseEarningDTO[]> {
    return this.http
      .get<ServerResponseEarningDTO[]>(`${this.apiBaseUrl}/earnings/project/${projectId}`)
      .pipe(catchError(err => { console.error('getEarningsByProject', err); return of([] as ServerResponseEarningDTO[]); }));
  }


  updateProject(id: number, payload: RequestAdminProjectUpdateDTO): Observable<any> {
    const url = `${this.adminBaseUrl}/projects/${id}`;
    return this.http.put<any>(url, payload).pipe(
      catchError(err => { console.error('updateProject error', err); return new Observable(obs => obs.error(err)); })
    );
  }


  updateContract(id: number, payload: RequestAdminContractUpdateDTO): Observable<any> {
    const url = `${this.adminBaseUrl}/contracts/${id}`;
    return this.http.put<any>(url, payload).pipe(
      catchError(err => { console.error('updateContract error', err); return new Observable(obs => obs.error(err)); })
    );
  }


  updateInvestmentStatus(id: number, status: string): Observable<any> {
    const payload: RequestAdminInvestmentUpdateDTO = { status: status as InvestmentStatus };
    const url = `${this.adminBaseUrl}/investments/${id}`;
    return this.http.put<any>(url, payload).pipe(
      catchError(err => { console.error('updateInvestmentStatus error', err); return new Observable(obs => obs.error(err)); })
    );
  }


  updateEarningStatus(id: number, status: string): Observable<any> {
    const payload: RequestAdminUpdateEarningStatusDTO = { status: status as EarningStatus };
    const url = `${this.adminBaseUrl}/earnings/${id}/status`;
    return this.http.put<any>(url, payload).pipe(
      catchError(err => { console.error('updateEarningStatus error', err); return new Observable(obs => obs.error(err)); })
    );
  }
}