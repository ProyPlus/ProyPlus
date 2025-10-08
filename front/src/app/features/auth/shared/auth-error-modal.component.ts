import { CommonModule } from "@angular/common";
import {
  Component, EventEmitter, HostListener, Input, OnChanges, Output,
  SimpleChanges, ViewChild, ElementRef, ChangeDetectionStrategy
} from "@angular/core";

@Component({
  standalone: true,
  selector: "app-auth-error-modal",
  imports: [CommonModule],
  templateUrl: "./auth-error-modal.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthErrorModalComponent implements OnChanges {
  @Input() open = false;
  @Input() title = "No pudimos iniciar sesión";
  @Input() message = "Ocurrió un error inesperado.";
  @Output() close = new EventEmitter<void>();

  @ViewChild("acceptBtn") acceptBtn!: ElementRef<HTMLButtonElement>;

  // ids únicos por instancia (por si algún día hay más de un modal en pantalla)
  private uid = Math.random().toString(36).slice(2, 9);
  titleId = `auth-error-title-${this.uid}`;
  descId  = `auth-error-desc-${this.uid}`;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["open"]?.currentValue === true) {
      // foco al botón aceptar cuando se abre
      setTimeout(() => this.acceptBtn?.nativeElement?.focus(), 0);
    }
  }

  @HostListener("document:keydown.escape")
  onEsc() { if (this.open) this.close.emit(); }
}
