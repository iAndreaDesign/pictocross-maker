import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DEFAULT_LOGO_GRID } from '../../core/domain';
import { i18nTestingImports, i18nTestingProviders } from '../../shared/i18n/i18n-testing';
import { DrawingStore } from './drawing-store';
import { Editor } from './editor';

describe('Editor', () => {
  let fixture: ComponentFixture<Editor>;
  let el: HTMLElement;
  let store: DrawingStore;

  const q = <T extends Element>(selector: string) => el.querySelector<T>(selector)!;
  const byLabel = (label: string) => q<HTMLButtonElement>(`[aria-label="${label}"]`);
  const byText = (text: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!;
  const counter = () => q('.counter').textContent?.trim();
  const settle = () => fixture.whenStable();

  beforeEach(async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await TestBed.configureTestingModule({
      imports: [Editor, ...i18nTestingImports],
      providers: i18nTestingProviders,
    }).compileComponents();
    store = TestBed.inject(DrawingStore);
    fixture = TestBed.createComponent(Editor);
    el = fixture.nativeElement as HTMLElement;
    await settle();
  });

  afterEach(() => vi.restoreAllMocks());

  it('shows the default logo state: title, counter and hint', () => {
    expect(q<HTMLInputElement>('.title').value).toBe('Corazón de píxel');
    expect(counter()).toBe('48 / 100 celdas');
    expect(el.textContent).toContain('Arrastra para dibujar');
  });

  it('renders rulers 1..N for rows and columns', () => {
    expect(el.querySelectorAll('.ruler-x li')).toHaveLength(10);
    expect(el.querySelector('.ruler-y li:last-child')?.textContent?.trim()).toBe('10');
  });

  it('Clear empties the board and Undo restores it', async () => {
    byText('Limpiar').click();
    await settle();
    expect(counter()).toBe('0 / 100 celdas');
    byLabel('Deshacer').click();
    await settle();
    expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
  });

  it('Invert gives the complement', async () => {
    byText('Invertir').click();
    await settle();
    expect(counter()).toBe('52 / 100 celdas');
  });

  it('undo/redo buttons are disabled when there is nothing to do', async () => {
    expect(byLabel('Deshacer').disabled).toBe(true);
    expect(byLabel('Rehacer').disabled).toBe(true);
    store.clear();
    await settle();
    expect(byLabel('Deshacer').disabled).toBe(false);
  });

  it('tool toggle reflects the active tool', async () => {
    const draw = byText('Dibujar');
    const erase = byText('Borrar');
    expect(draw.getAttribute('aria-pressed')).toBe('true');
    erase.click();
    await settle();
    expect(store.tool()).toBe('erase');
    expect(erase.getAttribute('aria-pressed')).toBe('true');
    expect(draw.getAttribute('aria-pressed')).toBe('false');
  });

  it('Ctrl+Z undoes and Ctrl+Y / Ctrl+Shift+Z redo', async () => {
    store.clear();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    expect(store.blackCount()).toBe(48);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true }));
    expect(store.blackCount()).toBe(0);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Z', ctrlKey: true, shiftKey: true, bubbles: true }),
    );
    expect(store.blackCount()).toBe(0);
  });

  it('does not hijack Ctrl+Z inside a text field', () => {
    store.clear();
    q<HTMLInputElement>('.title').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }),
    );
    expect(store.blackCount()).toBe(0);
  });

  it('editing the title updates the store; blank restores the default', async () => {
    const input = q<HTMLInputElement>('.title');
    input.value = 'Mi pez';
    input.dispatchEvent(new Event('change'));
    await settle();
    expect(store.title()).toBe('Mi pez');
    input.value = '  ';
    input.dispatchEvent(new Event('change'));
    await settle();
    expect(store.title()).toBeNull();
  });

  describe('resize', () => {
    const typeSize = async (id: string, value: string) => {
      const input = q<HTMLInputElement>(`#${id}`);
      input.value = value;
      input.dispatchEvent(new Event('change'));
      await settle();
    };

    it('growing applies immediately, no confirmation', async () => {
      await typeSize('size-rows', '12');
      expect(store.rows()).toBe(12);
      expect(el.querySelector('[role="alertdialog"]')).toBeNull();
    });

    it('shrinking that loses black cells asks for confirmation', async () => {
      await typeSize('size-rows', '5');
      expect(store.rows()).toBe(10);
      expect(q('[role="alertdialog"]').textContent).toContain('casillas negras');
      expect(q<HTMLInputElement>('#size-rows').value).toBe('10');
    });

    it('cancel keeps the board; accept applies the resize', async () => {
      await typeSize('size-cols', '5');
      byText('Cancelar').click();
      await settle();
      expect(store.cols()).toBe(10);
      expect(el.querySelector('[role="alertdialog"]')).toBeNull();

      await typeSize('size-cols', '5');
      byText('Reducir').click();
      await settle();
      expect(store.cols()).toBe(5);
      expect(q<HTMLInputElement>('#size-cols').value).toBe('5');
    });

    it('clamps typed values to 1..50 and ignores garbage', async () => {
      await typeSize('size-rows', '999');
      expect(store.rows()).toBe(50);
      await typeSize('size-cols', '');
      expect(store.cols()).toBe(10);
    });

    it('steppers and presets change the size', async () => {
      byLabel('Aumentar alto').click();
      await settle();
      expect(store.rows()).toBe(11);
      byLabel('Tamaño 20 × 20').click();
      await settle();
      expect([store.rows(), store.cols()]).toEqual([20, 20]);
      expect(byLabel('Tamaño 20 × 20').getAttribute('aria-pressed')).toBe('true');
    });

    it('disables steppers at the limits', async () => {
      byLabel('Tamaño 50 × 50').click();
      await settle();
      expect(byLabel('Aumentar alto').disabled).toBe(true);
      expect(byLabel('Aumentar ancho').disabled).toBe(true);
    });
  });
});
