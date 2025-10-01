// src/app/core/services/students.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, switchMap } from 'rxjs';
import { Student } from '../../models/student.model';
import { StudentName } from '../../models/student-name.model';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private apiUrl = '/api/students';
  private apiNamesUrl = '/api/students/names';

  private _students = signal<Student[]>([]);
  students = this._students.asReadonly();

  constructor(private http: HttpClient) {}

  loadAll(): Observable<Student[]> {
    return new Observable((subscriber) => {
      this.http.get<Student[]>(this.apiUrl).subscribe({
        next: (data) => { this._students.set(data); subscriber.next(data); subscriber.complete(); },
        error: (err) => subscriber.error(err)
      });
    });
  }

  /** NUEVO: acepta q opcional; si /names falla (400), cae a /students y mapea */
  getNames(q?: string): Observable<StudentName[]> {
    const url = q != null ? `${this.apiNamesUrl}?q=${encodeURIComponent(q)}` : this.apiNamesUrl;
    return this.http.get<StudentName[] | any>(url).pipe(
      map((list: any[]) => (list ?? []).map(s => ({
        id: s.id, firstName: s.firstName, lastName: s.lastName
      } as StudentName))),
      catchError(err => {
        // Si el /names no acepta sin q o responde 400, probamos /students
        if (err.status === 400) {
          return this.http.get<Student[]>(this.apiUrl).pipe(
            map(list => (list ?? []).map(s => ({
              id: (s as any).id,
              firstName: (s as any).firstName ?? (s as any).nombre ?? '',
              lastName: (s as any).lastName ?? (s as any).apellido ?? ''
            })))
          );
        }
        return of([] as StudentName[]);
      })
    );
  }

  getById(id: number): Observable<Student> { return this.http.get<Student>(`${this.apiUrl}/${id}`); }
  create(studentData: Partial<Student>): Observable<Student> {
    return new Observable((subscriber)=> {
      this.http.post<Student>(this.apiUrl, studentData).subscribe({
        next: (created) => { this._students.update(l => [...l, created]); subscriber.next(created); subscriber.complete(); },
        error: (err) => subscriber.error(err)
      });
    });
  }
  update(id: number, studentData: Partial<Student>): Observable<Student> {
    return new Observable((subscriber)=> {
      this.http.put<Student>(`${this.apiUrl}/${id}`, studentData).subscribe({
        next: (updated) => { this._students.update(l => l.map(s => (s as any).id === id ? updated : s)); subscriber.next(updated); subscriber.complete(); },
        error: (err) => subscriber.error(err)
      });
    });
  }
  activate(id: number) { return this.http.post<void>(`${this.apiUrl}/${id}/activate`, {}); }
  deactivate(id: number) { return this.http.post<void>(`${this.apiUrl}/${id}/deactivate`, {}); }
}
