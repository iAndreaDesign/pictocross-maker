import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../../shared/icon';
import { DrawingGrid } from './drawing-grid';
import { DrawingStore } from './drawing-store';
import { EditorToolbar } from './editor-toolbar';
import { SizeChange, SizeSelector } from './size-selector';

interface PendingResize extends SizeChange {
  readonly lost: number;
}

/** Panel izquierdo: configuración (tamaño, limpiar, invertir), herramientas, grid y pie. */
@Component({
  selector: 'app-editor',
  imports: [TranslocoPipe, Icon, DrawingGrid, EditorToolbar, SizeSelector],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './editor.html',
  styleUrl: './editor.css',
  host: { '(document:keydown)': 'onShortcut($event)' },
})
export class Editor {
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

  protected onTitleChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.setTitle(input.value);
  }

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
