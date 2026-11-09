import { ComponentFixture, TestBed } from '@angular/core/testing';
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
});
