import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DEFAULT_LOGO_GRID } from '../../../core/domain';
import { i18nTestingImports, i18nTestingProviders } from '../../../shared/i18n/i18n-testing';
import { ConfigBar } from './config-bar';
import { DrawingStore } from '../drawing-store';

describe('ConfigBar', () => {
  let fixture: ComponentFixture<ConfigBar>;
  let el: HTMLElement;
  let store: DrawingStore;

  const q = <T extends Element>(selector: string) => el.querySelector<T>(selector)!;
  const byLabel = (label: string) => q<HTMLButtonElement>(`[aria-label="${label}"]`);
  const byText = (text: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!;
  const settle = () => fixture.whenStable();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigBar, ...i18nTestingImports],
      providers: i18nTestingProviders,
    }).compileComponents();
    store = TestBed.inject(DrawingStore);
    fixture = TestBed.createComponent(ConfigBar);
    el = fixture.nativeElement as HTMLElement;
    await settle();
  });

  it('shows Height × Width fields, Clear and Invert, with no size presets', () => {
    expect(q<HTMLInputElement>('#size-rows').value).toBe('10');
    expect(q<HTMLInputElement>('#size-cols').value).toBe('10');
    expect(byText('Limpiar')).toBeTruthy();
    expect(byText('Invertir')).toBeTruthy();
    expect(el.querySelector('.chip')).toBeNull();
  });

  it('Clear empties the board and the change is undoable', async () => {
    byText('Limpiar').click();
    await settle();
    expect(store.blackCount()).toBe(0);
    store.undo();
    expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
  });

  it('Invert gives the complement', async () => {
    byText('Invertir').click();
    await settle();
    expect(store.blackCount()).toBe(52);
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

    it('steppers change the size and are disabled at the limits', async () => {
      byLabel('Aumentar alto').click();
      await settle();
      expect(store.rows()).toBe(11);
      await typeSize('size-rows', '50');
      await typeSize('size-cols', '50');
      expect(byLabel('Aumentar alto').disabled).toBe(true);
      expect(byLabel('Aumentar ancho').disabled).toBe(true);
    });
  });
});
