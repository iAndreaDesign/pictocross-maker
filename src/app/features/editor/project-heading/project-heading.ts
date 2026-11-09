import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../../../shared/icon/icon';
import { MAX_TITLE_LENGTH } from '../draft-storage/draft-storage';
import { DrawingStore } from '../drawing-store/drawing-store';

/**
 * Encabezado del proyecto (Figma 4:695): título editable con lápiz y, a la derecha, las acciones proyectadas.
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

  protected readonly maxLength = MAX_TITLE_LENGTH;

  protected onTitleChange(event: Event): void {
    this.store.setTitle((event.target as HTMLInputElement).value);
  }
}
