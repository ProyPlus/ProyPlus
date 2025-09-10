import { Component } from '@angular/core';
import { Card } from 'primeng/card';

@Component({
  standalone: true,
  selector: 'app-panel',
  imports: [Card],
  template: `
    <p-card header="Panel Proy+">
      <p>Bienvenido al panel inicial.</p>
    </p-card>
  `
})
export class PanelComponent {}
