import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { RolesService, IRole } from '../../core/services/roles.service';

@Component({
  standalone: true,
  selector: 'app-roles',
  imports: [CommonModule, TableModule, CardModule, TagModule, ToastModule],
  providers: [MessageService],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {
  private svc = inject(RolesService);
  private toast = inject(MessageService);

  roles: IRole[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: (data) => {
        this.roles = data || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los roles' });
        console.error(err);
      }
    });
  }
}
