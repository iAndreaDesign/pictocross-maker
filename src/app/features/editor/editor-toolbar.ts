import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../../shared/icon';
import { DrawingStore } from './drawing-store';

/** Cabecera del panel (REQ-S05-14): toggle Dibujar/Borrar y deshacer/rehacer. */
@Component({
  selector: 'app-editor-toolbar',
  imports: [TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <div class="toggle" role="group" [attr.aria-label]="'editor.tools.group' | transloco">
        <button
          type="button"
          class="toggle-btn"
          [class.toggle-btn-active]="store.tool() === 'draw'"
          [attr.aria-pressed]="store.tool() === 'draw'"
          (click)="store.setTool('draw')"
        >
          <app-icon name="pencil" />
          {{ 'editor.tools.draw' | transloco }}
        </button>
        <button
          type="button"
          class="toggle-btn"
          [class.toggle-btn-active]="store.tool() === 'erase'"
          [attr.aria-pressed]="store.tool() === 'erase'"
          (click)="store.setTool('erase')"
        >
          <app-icon name="eraser" />
          {{ 'editor.tools.erase' | transloco }}
        </button>
      </div>
      <div class="history">
        <button
          type="button"
          class="btn-icon"
          [disabled]="!store.canUndo()"
          [attr.aria-label]="'editor.tools.undo' | transloco"
          (click)="store.undo()"
        >
          <app-icon name="undo" />
        </button>
        <button
          type="button"
          class="btn-icon"
          [disabled]="!store.canRedo()"
          [attr.aria-label]="'editor.tools.redo' | transloco"
          (click)="store.redo()"
        >
          <app-icon name="redo" />
        </button>
      </div>
    </div>
  `,
  styles: `
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .toggle {
      display: inline-flex;
      padding: 3px;
      gap: 3px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-button);
      background: var(--color-surface);
    }
    .toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 32px;
      padding: 0 12px;
      border: 0;
      border-radius: calc(var(--radius-button) - 3px);
      background: transparent;
      color: var(--color-text);
      font: 600 13px var(--font-ui);
      cursor: pointer;
    }
    .toggle-btn-active {
      background: var(--color-accent);
      color: var(--color-input);
    }
    .history {
      display: flex;
      gap: 4px;
    }
  `,
})
export class EditorToolbar {
  protected readonly store = inject(DrawingStore);
}
