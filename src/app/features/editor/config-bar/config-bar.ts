import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../../../shared/icon';
import { DrawingStore } from '../drawing-store';
import { SizeChange, SizeSelector } from '../size-selector/size-selector';

interface PendingResize extends SizeChange {
  readonly lost: number;
}

/**
 * Barra de configuración a todo el ancho de la página (Figma 4:606): tamaño del tablero,
 * Limpiar e Invertir. Vive fuera de las tarjetas porque afecta a todo el dibujo.
 */
@Component({
  selector: 'app-config-bar',
  imports: [TranslocoPipe, Icon, SizeSelector],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './config-bar.html',
  styleUrl: './config-bar.css',
})
export class ConfigBar {
  protected readonly store = inject(DrawingStore);
  protected readonly pendingResize = signal<PendingResize | null>(null);

  protected requestResize(size: SizeChange): void {
    const lost = this.store.lostOnResize(size.rows, size.cols);
    if (lost > 0) {
      this.pendingResize.set({ ...size, lost });
    } else {
      this.pendingResize.set(null);
      this.store.resize(size.rows, size.cols);
    }
  }

  protected confirmResize(): void {
    const pending = this.pendingResize();
    if (pending) this.store.resize(pending.rows, pending.cols);
    this.pendingResize.set(null);
  }

  protected cancelResize(): void {
    this.pendingResize.set(null);
  }
}
