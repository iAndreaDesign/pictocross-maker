import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService, TranslocoTestingModule, Translation } from '@jsverse/transloco';
import es from '../../../assets/i18n/es.json';
import { ConfigBar } from '../../features/editor/config-bar';
import { EditorToolbar } from '../../features/editor/editor-toolbar';
import { ProjectHeading } from '../../features/editor/project-heading';
import { ExportBar } from '../../features/export/export-bar';

/** Segundo idioma de prueba: mismas claves, otro texto. No es un idioma de la app. */
const mapValues = (value: unknown): unknown =>
  typeof value === 'string'
    ? `§${value}§`
    : Object.fromEntries(Object.entries(value as object).map(([k, v]) => [k, mapValues(v)]));
const xx = mapValues(es) as Translation;

describe('adding a second language needs no component changes (REQ-S08-05)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ConfigBar,
        EditorToolbar,
        ExportBar,
        ProjectHeading,
        TranslocoTestingModule.forRoot({
          langs: { es: es as Translation, xx },
          translocoConfig: { availableLangs: ['es', 'xx'], defaultLang: 'es' },
          preloadLangs: true,
        }),
      ],
    }).compileComponents();
  });

  const render = async (component: Type<unknown>) => {
    const fixture = TestBed.createComponent(component);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it('shows Spanish by default', async () => {
    const text = (await render(ConfigBar)).textContent;
    expect(text).toContain('Limpiar');
    expect(text).not.toContain('§');
  });

  it('switching the language at runtime changes every visible text and aria-label', async () => {
    TestBed.inject(TranslocoService).setActiveLang('xx');
    for (const component of [ConfigBar, EditorToolbar, ExportBar, ProjectHeading]) {
      const el = await render(component);
      // Todo texto visible viene de la traducción: quitando los segmentos §…§ (y el símbolo ×) no queda nada.
      const outside = (el.textContent ?? '').replace(/§[^§]*§/g, '').replace(/[×\s]/g, '');
      expect(outside, component.name).toBe('');
      expect(el.textContent, component.name).toContain('§');
      const labels = [...el.querySelectorAll('[aria-label]')].map((n) => n.getAttribute('aria-label') ?? '');
      expect(labels.length, component.name).toBeGreaterThan(0);
      for (const label of labels) expect(label, component.name).toMatch(/^§.*§$/);
    }
  });

  it('has exactly the same keys as Spanish, so a new locale file is just a copy of es.json', () => {
    const keys = (o: object, p = ''): string[] =>
      Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
    expect(keys(xx).sort()).toEqual(keys(es).sort());
  });
});
