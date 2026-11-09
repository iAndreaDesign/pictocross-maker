import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DEFAULT_LOGO_GRID } from '../../core/domain';
import { i18nTestingImports, i18nTestingProviders } from '../../shared/i18n/i18n-testing';
import { DrawingGrid } from './drawing-grid';
import { DrawingStore } from './drawing-store';

describe('DrawingGrid', () => {
  let fixture: ComponentFixture<DrawingGrid>;
  let canvas: HTMLCanvasElement;
  let store: DrawingStore;

  // El canvas ocupa 100x100 px en pantalla: cada casilla del 10x10 mide 10 px.
  const at = (type: string, cell: [number, number], button = 0) =>
    canvas.dispatchEvent(
      new MouseEvent(type, {
        button,
        bubbles: true,
        clientX: cell[1] * 10 + 5,
        clientY: cell[0] * 10 + 5,
      }),
    );
  const key = (k: string) => canvas.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

  beforeEach(async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await TestBed.configureTestingModule({
      imports: [DrawingGrid, ...i18nTestingImports],
      providers: i18nTestingProviders,
    }).compileComponents();
    store = TestBed.inject(DrawingStore);
    fixture = TestBed.createComponent(DrawingGrid);
    await fixture.whenStable();
    canvas = (fixture.nativeElement as HTMLElement).querySelector('canvas')!;
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
  });

  afterEach(() => vi.restoreAllMocks());

  it('left click paints and right click erases with the Draw tool', () => {
    at('pointerdown', [9, 9]);
    at('pointerup', [9, 9]);
    expect(store.grid()[9][9]).toBe(1);

    at('pointerdown', [4, 4], 2);
    at('pointerup', [4, 4], 2);
    expect(store.grid()[4][4]).toBe(0);
  });

  it('buttons are inverted with the Erase tool', () => {
    store.setTool('erase');
    at('pointerdown', [4, 4]);
    at('pointerup', [4, 4]);
    expect(store.grid()[4][4]).toBe(0);
    at('pointerdown', [9, 0], 2);
    at('pointerup', [9, 0], 2);
    expect(store.grid()[9][0]).toBe(1);
  });

  it('the first click fixes the stroke mode until release', () => {
    at('pointerdown', [9, 0]); // pinta
    at('pointermove', [9, 5]);
    at('pointerup', [9, 5]);
    expect(store.grid()[9].slice(0, 6)).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it('a fast diagonal drag leaves no gaps and undoes as one entry', () => {
    store.clear();
    at('pointerdown', [0, 0]);
    at('pointermove', [9, 9]);
    at('pointerup', [9, 9]);
    for (let i = 0; i < 10; i++) expect(store.grid()[i][i]).toBe(1);
    store.undo();
    expect(store.blackCount()).toBe(0);
  });

  it('moving without pressing does not draw', () => {
    at('pointermove', [9, 9]);
    expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
  });

  it('ignores the middle button', () => {
    at('pointerdown', [9, 9], 1);
    at('pointerup', [9, 9], 1);
    expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
  });

  it('suppresses the browser context menu', () => {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    canvas.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('arrow keys move the cursor and Space/Enter toggle the cell', async () => {
    key('ArrowRight');
    key('ArrowDown'); // cursor en (1,1), blanca en el logo
    key(' ');
    expect(store.grid()[1][1]).toBe(1);
    key('Enter');
    expect(store.grid()[1][1]).toBe(0);
    await fixture.whenStable();
  });

  it('the cursor stays inside the board', () => {
    for (let i = 0; i < 20; i++) key('ArrowLeft');
    for (let i = 0; i < 20; i++) key('ArrowUp');
    key(' '); // (0,0) es blanca en el logo
    expect(store.grid()[0][0]).toBe(1);
    for (let i = 0; i < 30; i++) key('ArrowRight');
    for (let i = 0; i < 30; i++) key('ArrowDown');
    key(' '); // (9,9)
    expect(store.grid()[9][9]).toBe(1);
  });

  it('announces the focused cell for assistive tech', async () => {
    canvas.dispatchEvent(new Event('focus'));
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('[aria-live]')?.textContent).toContain(
      'Fila 1, columna 1: blanca',
    );
  });

  it('exposes a labelled, focusable canvas', () => {
    expect(canvas.getAttribute('aria-label')).toBe('Cuadrícula de dibujo');
    expect(canvas.tabIndex).toBe(0);
  });
});
