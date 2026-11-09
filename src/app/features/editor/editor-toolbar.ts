import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../../shared/icon';
import { DrawingStore } from './drawing-store';

/**
 * Cabecera del panel (Figma 4:713): selector de herramienta (la activa muestra icono y texto, la otra
 * solo icono) y deshacer/rehacer sin borde a la derecha.
 */
@Component({
  selector: 'app-editor-toolbar',
  imports: [TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <div class="toggle" role="group" [attr.aria-label]="'editor.tools.group' | transloco">
        <button
          type="button"
          class="tool"
          [class.tool-active]="store.tool() === 'draw'"
          [attr.aria-pressed]="store.tool() === 'draw'"
          [attr.aria-label]="'editor.tools.draw' | transloco"
          [attr.title]="'editor.tools.draw' | transloco"
          (click)="store.setTool('draw')"
        >
          <app-icon name="pencil" />
          @if (store.tool() === 'draw') {
            <span>{{ 'editor.tools.draw' | transloco }}</span>
          }
        </button>
        <button
          type="button"
          class="tool"
          [class.tool-active]="store.tool() === 'erase'"
          [attr.aria-pressed]="store.tool() === 'erase'"
          [attr.aria-label]="'editor.tools.erase' | transloco"
          [attr.title]="'editor.tools.erase' | transloco"
          (click)="store.setTool('erase')"
        >
          <app-icon name="eraser" />
          @if (store.tool() === 'erase') {
            <span>{{ 'editor.tools.erase' | transloco }}</span>
          }
        </button>
      </div>
      <div class="history">
        <button
          type="button"
          class="history-btn"
          [disabled]="!store.canUndo()"
          [attr.aria-label]="'editor.tools.undo' | transloco"
          [attr.title]="'editor.tools.undo' | transloco"
          (click)="store.undo()"
        >
          <app-icon name="undo" />
        </button>
        <button
          type="button"
          class="history-btn"
          [disabled]="!store.canRedo()"
          [attr.aria-label]="'editor.tools.redo' | transloco"
          [attr.title]="'editor.tools.redo' | transloco"
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
      justify-content: space-between;
      gap: 12px;
      min-height: 36px;
    }
    .toggle {
      display: inline-flex;
      padding: 3px;
      gap: 4px;
      border-radius: 8px;
      background: var(--color-page);
    }
    .tool {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      min-width: 32px;
      height: 30px;
      padding: 0 8px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: var(--color-text);
      font: 600 11px var(--font-ui);
      cursor: pointer;
    }
    .tool .icon {
      width: 15px;
      height: 15px;
    }
    .tool-active {
      padding: 0 12px;
      background: var(--color-accent);
    }
    .history {
      display: flex;
      gap: 8px;
    }
    .history-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: var(--color-text);
      cursor: pointer;
    }
    .history-btn .icon {
      width: 16px;
      height: 16px;
    }
  `,
})
export class EditorToolbar {
  protected readonly store = inject(DrawingStore);
}
