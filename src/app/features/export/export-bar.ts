import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../../shared/icon';
import { ExportService } from './export.service';

/** Junto al título del proyecto: orientación de página y botones Exportar PDF / PNG, siempre activos. */
@Component({
  selector: 'app-export-bar',
  imports: [TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <div class="orientation" role="group" [attr.aria-label]="'export.orientation.group' | transloco">
        <button
          type="button"
          class="seg"
          [class.seg-active]="exporter.orientation() === 'portrait'"
          [attr.aria-pressed]="exporter.orientation() === 'portrait'"
          (click)="exporter.setOrientation('portrait')"
        >
          {{ 'export.orientation.portrait' | transloco }}
        </button>
        <button
          type="button"
          class="seg"
          [class.seg-active]="exporter.orientation() === 'landscape'"
          [attr.aria-pressed]="exporter.orientation() === 'landscape'"
          (click)="exporter.setOrientation('landscape')"
        >
          {{ 'export.orientation.landscape' | transloco }}
        </button>
      </div>
      <button type="button" class="btn btn-soft" (click)="exporter.exportSolution()">
        <app-icon name="download" />
        {{ 'export.solution' | transloco }}
      </button>
      <button type="button" class="btn btn-primary" (click)="exporter.exportPdf()">
        <app-icon name="file" />
        {{ 'export.pdf' | transloco }}
      </button>
      <button type="button" class="btn btn-primary" (click)="exporter.exportPng()">
        <app-icon name="image" />
        {{ 'export.png' | transloco }}
      </button>
    </div>
  `,
  styles: `
    .bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 12px;
    }
    .orientation {
      display: inline-flex;
      padding: 3px;
      gap: 3px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-button);
      background: var(--color-surface);
    }
    .seg {
      height: 28px;
      padding: 0 12px;
      border: 0;
      border-radius: calc(var(--radius-button) - 3px);
      background: transparent;
      color: var(--color-text);
      font: 600 12px var(--font-ui);
      cursor: pointer;
    }
    .seg-active {
      background: var(--color-accent);
      color: var(--color-on-accent);
    }
  `,
})
export class ExportBar {
  protected readonly exporter = inject(ExportService);
}
