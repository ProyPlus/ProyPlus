import { Component, signal, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { AuthService } from "../auth/login/auth.service";

@Component({
  standalone: true,
  selector: "app-panel",
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: "./panel.component.html",
  styleUrls: ["./panel.component.scss"],
})
export class PanelComponent {
  rightOpen = signal(false);

  private auth = inject(AuthService);
  private router = inject(Router);

  toggleRight() {
    this.rightOpen.update((v) => !v);
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl("/auth/login", { replaceUrl: true });
  }
}
