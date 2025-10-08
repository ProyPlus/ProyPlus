import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Proyecto {
  nombre: string;
  estado: string;
  fecha: Date;
}

@Component({
  selector: 'app-inversiones-form',
  templateUrl: './inversiones-form.component.html',
  styleUrls: ['./inversiones-form.component.scss']
})
export class InversionesComponent implements OnInit {
  projects: Proyecto[] = [
    { nombre: 'Proyecto Omega', estado: 'Habilitado', fecha: new Date('2024-05-15') },
    { nombre: 'Proyecto Alpha', estado: 'EnProgreso', fecha: new Date('2024-04-20') },
    { nombre: 'Proyecto Beta', estado: 'Completado', fecha: new Date('2024-03-10') },
    { nombre: 'Proyecto Gamma', estado: 'Habilitado', fecha: new Date('2024-06-01') },
    { nombre: 'Proyecto Delta', estado: 'EnProgreso', fecha: new Date('2024-02-28') },
  ];

  filteredProjects: Proyecto[] = [...this.projects];
  searchTerm: string = '';
  sortKey: string = 'nombre';
  sortOrder: number = 1;

  // Propiedades para el formulario de creación de proyecto
  projectForm: FormGroup;
  selectedFile: { file: File, url: string } | null = null;

  constructor(private fb: FormBuilder) {
    // Inicializamos el formulario en el constructor.
    this.projectForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      status: ['', Validators.required],
      objective: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      creator: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    //this.sort(this.sortKey);
  }

  // --- Lógica de la tabla ---

  onSearch(): void {
    this.filteredProjects = this.projects.filter(project =>
      project.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  sort(key: keyof Proyecto): void {
    if (this.sortKey === key) {
      this.sortOrder = -this.sortOrder;
    } else {
      this.sortKey = key;
      this.sortOrder = 1;
    }

    this.filteredProjects.sort((a, b) => {
      const valueA = a[key];
      const valueB = b[key];
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return valueA.localeCompare(valueB) * this.sortOrder;
      }
      if (valueA instanceof Date && valueB instanceof Date) {
        return (valueA.getTime() - valueB.getTime()) * this.sortOrder;
      }
      return 0;
    });
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'Habilitado':
        return 'status-badge-Habilitado';
      case 'EnProgreso':
        return 'status-badge-EnProgreso';
      case 'Completado':
        return 'status-badge-Completado';
      default:
        return '';
    }
  }

  editProject(project: Proyecto): void {
    console.log('Editar proyecto:', project);
  }

  deleteProject(project: Proyecto): void {
    console.log('Eliminar proyecto:', project);
    this.projects = this.projects.filter(p => p.nombre !== project.nombre);
    this.onSearch();
  }

  // --- Lógica del formulario de creación (que puedes usar si el HTML cambia) ---

  onFileSelect(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = {
        file: file,
        url: URL.createObjectURL(file)
      };
    }
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.selectedFile = {
        file: file,
        url: URL.createObjectURL(file)
      };
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onSubmit() {
    if (this.projectForm.valid) {
      const formData = new FormData();
      formData.append('title', this.projectForm.value.title);
      formData.append('description', this.projectForm.value.description);
      formData.append('status', this.projectForm.value.status);
      formData.append('objective', this.projectForm.value.objective);
      formData.append('startDate', this.projectForm.value.startDate);
      formData.append('endDate', this.projectForm.value.endDate);
      formData.append('creator', this.projectForm.value.creator);

      if (this.selectedFile) {
        formData.append('file', this.selectedFile.file, this.selectedFile.file.name);
      }

      console.log('Form data to be sent:', formData);
      // Aquí iría el envío a la API
    }
  }
}