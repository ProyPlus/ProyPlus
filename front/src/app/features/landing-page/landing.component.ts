import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RippleModule } from 'primeng/ripple';
import { LandingPageService, PlatformStats } from '../../landing-page.service';
import { SkeletonModule } from 'primeng/skeleton';import { CarouselModule } from 'primeng/carousel';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    RippleModule,
    SkeletonModule,
    CarouselModule
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  private router = inject(Router);
  private landingSvc = inject(LandingPageService);

  stats = signal<PlatformStats | null>(null);
  loadingStats = signal(true);

  carouselImages = [
    { path: 'assets/images/landing1.jpg', alt: 'Personas negociando en una oficina' },
    { path: 'assets/images/landing2.jpg', alt: 'Firma de un contrato' },
    { path: 'assets/images/landing3.jpg', alt: 'Equipo celebrando un acuerdo' },
    { path: 'assets/images/landing4.jpg', alt: 'Equipo celebrando un acuerdo' }
  ];

  ngOnInit(): void {
    this.landingSvc.getPlatformStats().subscribe((data: PlatformStats) => {
      this.stats.set(data);
      this.loadingStats.set(false);
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
  }
}