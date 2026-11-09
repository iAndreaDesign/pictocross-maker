import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../../shared/icon';
import { MAX_TITLE_LENGTH } from './draft-storage';
import { DraftPersistence } from './draft-persistence';
import { DrawingStore } from './drawing-store';

/**
 * Encabezado del proyecto (Figma 4:695): título editable con lápiz y, al final de la fila,
 * el punto de estado de guardado local (guardado / guardando / no disponible).
 */
@Component({
  selector: 'app-project-heading',
  imports: [TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-heading.html',
  styleUrl: './project-heading.css',
})
export class ProjectHeading {
  protected readonly store = inject(DrawingStore);
  private readonly draft = inject(DraftPersistence);

  protected readonly maxLength = MAX_TITLE_LENGTH;
  protected readonly status = this.draft.status;
  /** El estado no depende solo del color: forma del punto (lleno/anillo/cruz) + texto accesible. */
  protected readonly statusClass = computed(() => `status-${this.status()}`);

  protected onTitleChange(event: Event): void {
    this.store.setTitle((event.target as HTMLInputElement).value);
  }
}
