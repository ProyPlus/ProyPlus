// shared/directives/animate-on-scroll.directive.ts
import { Directive, ElementRef, OnDestroy, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appAnimateOnScroll]',
  standalone: true
})
export class AnimateOnScrollDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const node = this.el.nativeElement;
    node.classList.add('aos-init');

    // Fallback: SSR / sin IO -> mostrar ya
    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      node.classList.add('aos-enter');
      node.classList.remove('aos-init');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            node.classList.add('aos-enter');
            node.classList.remove('aos-init', 'aos-leave');
          } else {
            node.classList.add('aos-leave');
            node.classList.remove('aos-enter');
          }
        });
      },
      {
        threshold: 0.05,          // dispara fácil
        rootMargin: '0px 0px -10% 0px' // entra un poco antes
      }
    );

    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
