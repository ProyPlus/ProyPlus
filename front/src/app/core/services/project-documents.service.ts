import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface IProjectDocument {
  idProjectDocument: number;
  fileName: string;
  fileType: string;
  uploadDate: string; // O Date, dependiendo de lo que devuelva el backend
  fileSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectDocumentsService {
  private http = inject(HttpClient);
  private apiUrl = `/api/project-documents`;


  uploadDocument(file: File, projectId: number): Observable<IProjectDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId.toString()); 
    return this.http.post<IProjectDocument>(`${this.apiUrl}/upload`, formData);
  }

  /**
   * Obtiene la lista de documentos para un proyecto específico.
   * GET /api/project-documents/project/{projectId}
   */
  getDocumentsByProject(projectId: number): Observable<IProjectDocument[]> {
    return this.http.get<IProjectDocument[]>(`${this.apiUrl}/project/${projectId}`);
  }

  /**
   * Elimina un documento por su ID.
   * DELETE /api/project-documents/{documentId}
   */
  deleteDocument(documentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${documentId}`);
  }

  /**
   * Devuelve la URL completa para descargar un documento.
   * El componente o la vista se encargarán de la descarga.
   * GET /api/project-documents/download/{documentId}
   */
  getDownloadUrl(documentId: number): string {
    return `${this.apiUrl}/download/${documentId}`;
  }

  /**
   * Devuelve la URL para el componente de subida de archivos.
   */
  getUploadUrl(): string {
    return `${this.apiUrl}/upload`;
  }
}