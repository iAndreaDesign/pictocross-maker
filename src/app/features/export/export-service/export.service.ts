import { DOCUMENT } from '@angular/common';
import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { SolverCell, generateClues } from '../../../core/domain';
import { readRenderColors } from '../../../shared/nonogram-renderer/nonogram-renderer';
import { DrawingStore } from '../../editor/drawing-store/drawing-store';
import {
  MARGIN_MM,
  Orientation,
  betterOrientation,
  computeExportLayout,
  exportFileName,
} from '../export-layout/export-layout';
import { renderExport } from '../export-render/export-render';

/** Crea el canvas donde se dibuja la exportación (inyectable para poder probarlo sin navegador). */
export const EXPORT_CANVAS_FACTORY = new InjectionToken<() => HTMLCanvasElement>('EXPORT_CANVAS_FACTORY', {
  providedIn: 'root',
  factory: () => () => document.createElement('canvas'),
});

/** Entrega el fichero al usuario (descarga). */
export const FILE_DOWNLOADER = new InjectionToken<(blob: Blob, fileName: string) => void>('FILE_DOWNLOADER', {
  providedIn: 'root',
  factory: () => (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  },
});

/**
 * Exportaciones del nonograma: PNG y PDF en blanco, y PNG con la solución. Siempre disponibles,
 * sea o no resoluble el dibujo; nunca incluyen el resaltado rojo de casillas indecidibles.
 */
@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly store = inject(DrawingStore);
  private readonly createCanvas = inject(EXPORT_CANVAS_FACTORY);
  private readonly download = inject(FILE_DOWNLOADER);
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(TranslocoService);

  /** Vertical por defecto; solo cambia si el usuario lo pide. */
  readonly orientation = signal<Orientation>('portrait');
  /** `true` si la última exportación falló (se muestra un aviso). */
  readonly failed = signal(false);

  private readonly clues = computed(() => generateClues(this.store.grid()));
  readonly layout = computed(() => computeExportLayout(this.clues(), this.orientation()));
  /** Otra orientación con casilla mayor, solo como sugerencia. */
  readonly suggestion = computed(() => betterOrientation(this.clues(), this.orientation()));

  setOrientation(orientation: Orientation): void {
    this.orientation.set(orientation);
  }

  exportPng(): Promise<void> {
    return this.run(() => this.png('blank'));
  }

  exportSolution(): Promise<void> {
    return this.run(() => this.png('solution'));
  }

  exportPdf(): Promise<void> {
    return this.run(() => this.pdf());
  }

  private async run(task: () => Promise<void>): Promise<void> {
    this.failed.set(false);
    try {
      await task();
    } catch (error) {
      console.error('Error al exportar:', error);
      this.failed.set(true);
    }
  }

  private async png(kind: 'blank' | 'solution'): Promise<void> {
    const canvas = this.createCanvas();
    await this.render(canvas, kind, MARGIN_MM);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob devolvió null'))), 'image/png'),
    );
    this.download(blob, this.fileName(kind, 'png'));
  }

  private async pdf(): Promise<void> {
    const layout = this.layout();
    const canvas = this.createCanvas();
    const { layout: px, mmPerPx } = await this.render(canvas, 'blank', 0);

    // jspdf solo se descarga al exportar un PDF (no pesa en el bundle inicial).
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: layout.orientation, unit: 'mm', format: 'a4' });
    doc.setProperties({ title: this.fileName('blank', 'pdf') });
    // La imagen incluye el margen mínimo de las líneas (pad): se coloca para que el tablero quede centrado.
    doc.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      layout.xMm - px.pad * mmPerPx,
      layout.yMm - px.pad * mmPerPx,
      canvas.width * mmPerPx,
      canvas.height * mmPerPx,
      undefined,
      'FAST',
    );
    this.download(doc.output('blob'), this.fileName('blank', 'pdf'));
  }

  private async render(canvas: HTMLCanvasElement, kind: 'blank' | 'solution', marginMm: number) {
    // El canvas necesita la tipografía de marca cargada para dibujar los números.
    await this.document.fonts?.load('600 20px Inter').catch(() => undefined);
    const { fontFamily, ...colors } = readRenderColors(this.document.documentElement);
    return renderExport(canvas, {
      clues: this.clues(),
      cells: kind === 'solution' ? this.solutionCells() : null,
      layout: this.layout(),
      colors,
      fontFamily,
      marginMm,
    });
  }

  /** La solución es el propio dibujo (negras = terracota, blancas = cruz); nunca hay casillas rojas. */
  private solutionCells(): SolverCell[][] {
    return this.store
      .grid()
      .map((row) => row.map((c): SolverCell => (c === 1 ? SolverCell.Black : SolverCell.White)));
  }

  private fileName(kind: 'blank' | 'solution', extension: 'png' | 'pdf'): string {
    const labels = {
      base: this.i18n.translate('export.file.base'),
      solution: this.i18n.translate('export.file.solution'),
    };
    const title = this.store.title() ?? this.i18n.translate('editor.title.default');
    return exportFileName(title, this.store.rows(), this.store.cols(), kind, extension, labels);
  }
}
