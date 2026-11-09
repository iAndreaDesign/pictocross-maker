import { ComponentFixture, TestBed } from '@angular/core/testing';
import { i18nTestingImports, i18nTestingProviders } from '../../shared/i18n/i18n-testing';
import { ExportBar } from './export-bar';
import { ExportService } from './export.service';

describe('ExportBar', () => {
  let fixture: ComponentFixture<ExportBar>;
  let el: HTMLElement;
  let service: ExportService;

  const byText = (text: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportBar, ...i18nTestingImports],
      providers: i18nTestingProviders,
    }).compileComponents();
    service = TestBed.inject(ExportService);
    vi.spyOn(service, 'exportPdf').mockResolvedValue();
    vi.spyOn(service, 'exportPng').mockResolvedValue();
    vi.spyOn(service, 'exportSolution').mockResolvedValue();
    fixture = TestBed.createComponent(ExportBar);
    el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => vi.restoreAllMocks());

  it('has the solution, PDF and PNG export buttons, always enabled, with the orientation switch first', () => {
    for (const label of ['Exportar solución', 'Exportar PDF', 'Exportar PNG']) {
      expect(byText(label).disabled).toBe(false);
    }
    const order = [...el.querySelector('.bar')!.children].map((c) => c.classList.contains('orientation') ? 'orientation' : c.textContent?.trim());
    expect(order).toEqual(['orientation', 'Exportar solución', 'Exportar PDF', 'Exportar PNG']);
  });

  it('each button triggers its export', () => {
    byText('Exportar PDF').click();
    byText('Exportar PNG').click();
    expect(service.exportPdf).toHaveBeenCalledTimes(1);
    expect(service.exportPng).toHaveBeenCalledTimes(1);
    expect(service.exportSolution).not.toHaveBeenCalled();
    byText('Exportar solución').click();
    expect(service.exportSolution).toHaveBeenCalledTimes(1);
  });

  it('shows Vertical selected by default and lets the user switch to Horizontal', async () => {
    expect(byText('Vertical').getAttribute('aria-pressed')).toBe('true');
    expect(byText('Horizontal').getAttribute('aria-pressed')).toBe('false');
    byText('Horizontal').click();
    await fixture.whenStable();
    expect(service.orientation()).toBe('landscape');
    expect(byText('Horizontal').getAttribute('aria-pressed')).toBe('true');
    expect(byText('Vertical').getAttribute('aria-pressed')).toBe('false');
  });
});
