import { Component } from '@angular/core';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
//import { Button } from 'primeng/button';
import { FormsModule } from '@angular/forms';


@Component({
  standalone: true,
  selector: 'app-configuracion',
  imports: [Card, InputText, FormsModule],
  template: `
    <p-card header="Configuración de usuario">
      <div class="field">
        <label>Nombre</label>
        <input pInputText [(ngModel)]="nombre" placeholder="Tu nombre" />
      </div>
      <div class="field">
        <label>Email</label>
        <input pInputText [(ngModel)]="email" type="email" placeholder="tu@email.com" />
      </div>
      <button pButton label="Guardar" icon="pi pi-save" class="mt-2"></button>
    </p-card>
  `,
  styles: [`
    .field { display: grid; gap: .25rem; margin-bottom: .75rem; }
    .mt-2 { margin-top: .5rem; }
  `]
})
export class ConfiguracionComponent {
  nombre = '';
  email = '';
}
