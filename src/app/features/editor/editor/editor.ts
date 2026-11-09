import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../../../shared/icon';
import { DrawingGrid } from '../drawing-grid/drawing-grid';
import { DrawingStore } from '../drawing-store';
import { EditorToolbar } from '../editor-toolbar/editor-toolbar';

/** Panel izquierdo: título, herramientas, grid y pie. La configuración (tamaño…) está en `ConfigBar`. */
@Component({
  selector: 'app-editor',
  imports: [TranslocoPipe, Icon, DrawingGrid, EditorToolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './editor.html',
  styleUrl: './editor.css',
  host: { '(document:keydown)': 'onShortcut($event)' },
})
export class Editor {
  protected readonly store = inject(DrawingStore);
  /** Ctrl+Z deshacer; Ctrl+Y o Ctrl+Shift+Z rehacer. No interfiere con los campos de texto. */
  protected onShortcut(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, [contenteditable="true"]')) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.store.undo();
    } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
      event.preventDefault();
      this.store.redo();
    }
  }
}
