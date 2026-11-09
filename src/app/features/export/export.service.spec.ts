import { TestBed } from '@angular/core/testing';
import { i18nTestingImports, i18nTestingProviders } from '../../shared/i18n/i18n-testing';
import { DrawingStore } from '../editor/drawing-store';
import { EXPORT_CANVAS_FACTORY, ExportService, FILE_DOWNLOADER } from './export.service';
import { exportPixelMetrics } from './export-render';
import { MARGIN_MM, computeExportLayout, mmToPx } from './export-layout';
import { computeLayout } from '../../shared/nonogram-renderer';
import { generateClues } from '../../core/domain';

// PNG válido de 1x1 px, para que jsPDF pueda incrustarlo.
const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const COLORS: Record<string, string> = {
  '--color-preview-bg': 'BG',
  '--color-cell-filled': 'FILLED',
  '--color-cross': 'CROSS',
  '--color-impossible-bg': 'RED',
  '--color-clue-band': 'BAND',
  '--color-grid-line': 'LINE',
  '--color-text': 'TEXT',
  '--font-ui': 'Inter',
};

interface FakeCanvas {
  canvas: HTMLCanvasElement;
  fills: string[];
  strokes: number;
  texts: string[];
}

function fakeCanvas(options: { noContext?: boolean } = {}): FakeCanvas {
  const rec = { fills: [] as string[], strokes: 0, texts: [] as string[] };
  const noop = (): void => undefined;
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    fillRect() {
      rec.fills.push(this.fillStyle);
    },
    fillText(text: string) {
      rec.texts.push(text);
    },
    stroke() {
      rec.strokes++;
    },
    save: noop,
    restore: noop,
    translate: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => (options.noContext ? null : ctx),
    toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['png'], { type: 'image/png' })),
    toDataURL: () => PNG_1X1,
  };
  return {
    canvas: canvas as unknown as HTMLCanvasElement,
    get fills() {
      return rec.fills;
    },
    get strokes() {
      return rec.strokes;
    },
    get texts() {
      return rec.texts;
    },
  };
}

/** Tamaño de página (pt) leído del /MediaBox del PDF. */
async function mediaBox(blob: Blob): Promise<[number, number]> {
  const match = /\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(await blob.text());
  if (!match) throw new Error('El PDF no tiene /MediaBox');
  return [Number(match[1]), Number(match[2])];
}

describe('ExportService', () => {
  let service: ExportService;
  let store: DrawingStore;
  let canvases: FakeCanvas[];
  let downloads: { blob: Blob; name: string }[];
  let nextCanvasOptions: { noContext?: boolean };

  beforeEach(() => {
    canvases = [];
    downloads = [];
    nextCanvasOptions = {};
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) => COLORS[name] ?? '',
    } as CSSStyleDeclaration);
    TestBed.configureTestingModule({
      imports: [...i18nTestingImports],
      providers: [
        ...i18nTestingProviders,
        {
          provide: EXPORT_CANVAS_FACTORY,
          useValue: () => {
            const fake = fakeCanvas(nextCanvasOptions);
            canvases.push(fake);
            return fake.canvas;
          },
        },
        { provide: FILE_DOWNLOADER, useValue: (blob: Blob, name: string) => downloads.push({ blob, name }) },
      ],
    });
    service = TestBed.inject(ExportService);
    store = TestBed.inject(DrawingStore);
  });

  afterEach(() => vi.restoreAllMocks());

  it('is portrait by default and only changes when asked', () => {
    expect(service.orientation()).toBe('portrait');
    store.resize(5, 50);
    expect(service.orientation()).toBe('portrait');
    service.setOrientation('landscape');
    expect(service.orientation()).toBe('landscape');
  });

  it('suggests the other orientation (without applying it) when it gives bigger cells', () => {
    store.clear();
    store.resize(5, 50);
    expect(service.suggestion()?.orientation).toBe('landscape');
    expect(service.orientation()).toBe('portrait');
  });

  describe('PNG', () => {
    it('downloads a blank board PNG named nonograma-{rows}x{cols}.png', async () => {
      await service.exportPng();
      expect(downloads).toHaveLength(1);
      expect(downloads[0].name).toBe('nonograma-10x10.png');
      expect(downloads[0].blob.type).toBe('image/png');
      expect(service.failed()).toBe(false);
    });

    it('blank board: grid and clues only, no filled cells, no crosses', async () => {
      await service.exportPng();
      const { fills, strokes, texts } = canvases[0];
      expect(fills).not.toContain('FILLED');
      expect(fills).not.toContain('RED');
      expect(strokes).toBe(0);
      expect(texts.length).toBeGreaterThan(0);
    });

    it('solution: terracotta cells for black and a cross for every white cell', async () => {
      await service.exportSolution();
      expect(downloads[0].name).toBe('nonograma-10x10-solucion.png');
      const { fills, strokes } = canvases[0];
      expect(fills.filter((f) => f === 'FILLED')).toHaveLength(store.blackCount());
      expect(strokes).toBe(store.totalCells() - store.blackCount());
    });

    it('never includes the red highlight, even when the puzzle is not solvable', async () => {
      store.clear();
      store.setCell(0, 0, 1);
      store.setCell(1, 1, 1); // diagonal: no resoluble
      await service.exportSolution();
      await service.exportPng();
      for (const c of canvases) expect(c.fills).not.toContain('RED');
    });

    it('exports an empty drawing as a valid blank board', async () => {
      store.clear();
      await service.exportPng();
      await service.exportSolution();
      expect(downloads.map((d) => d.name)).toEqual(['nonograma-10x10.png', 'nonograma-10x10-solucion.png']);
      expect(service.failed()).toBe(false);
    });

    it('sizes the canvas at 300 dpi with a 5 mm margin around the board', async () => {
      await service.exportPng();
      const layout = computeExportLayout(generateClues(store.grid()), 'portrait');
      const { cellPx, thick } = exportPixelMetrics(layout, 300);
      expect(Math.round(mmToPx(7, 300))).toBe(cellPx); // 7 mm ≈ 83 px
      const px = computeLayout(generateClues(store.grid()), cellPx, thick, mmToPx(MARGIN_MM, 300));
      expect(canvases[0].canvas.width).toBe(px.width);
      expect(canvases[0].canvas.height).toBe(px.height);
    });

    it('uses the project title for the file name when there is one', async () => {
      store.setTitle('Corazón de píxel');
      await service.exportSolution();
      expect(downloads[0].name).toBe('corazon-de-pixel-solucion.png');
    });

    it('uses the brand tokens only (no hardcoded colors)', async () => {
      await service.exportSolution();
      const allowed = new Set(Object.values(COLORS));
      expect(canvases[0].fills.every((f) => allowed.has(f))).toBe(true);
    });
  });

  describe('PDF', () => {
    it('generates a portrait A4 PDF named nonograma-{rows}x{cols}.pdf', async () => {
      await service.exportPdf();
      expect(downloads[0].name).toBe('nonograma-10x10.pdf');
      expect(downloads[0].blob.type).toBe('application/pdf');
      expect((await downloads[0].blob.text()).startsWith('%PDF-')).toBe(true);
      const [width, height] = await mediaBox(downloads[0].blob);
      expect(width).toBeCloseTo(595.28, 1);
      expect(height).toBeCloseTo(841.89, 1);
    });

    it('honours the landscape toggle (A4 landscape)', async () => {
      service.setOrientation('landscape');
      await service.exportPdf();
      const [width, height] = await mediaBox(downloads[0].blob);
      expect(width).toBeCloseTo(841.89, 1);
      expect(height).toBeCloseTo(595.28, 1);
    });

    it('uses the same blank rendering as the PNG (no cells, no red)', async () => {
      await service.exportPdf();
      expect(canvases[0].fills).not.toContain('FILLED');
      expect(canvases[0].fills).not.toContain('RED');
    });

    it('works for an empty drawing', async () => {
      store.clear();
      await service.exportPdf();
      expect(downloads).toHaveLength(1);
      expect(service.failed()).toBe(false);
    });
  });

  it('reports a failure without downloading anything when the canvas has no 2D context', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    nextCanvasOptions = { noContext: true };
    await service.exportPng();
    expect(downloads).toHaveLength(0);
    expect(service.failed()).toBe(true);
    expect(spy).toHaveBeenCalled();

    nextCanvasOptions = {};
    await service.exportPng();
    expect(service.failed()).toBe(false);
    expect(downloads).toHaveLength(1);
  });
});
