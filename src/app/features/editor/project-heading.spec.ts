import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { i18nTestingImports, i18nTestingProviders } from '../../shared/i18n/i18n-testing';
import { DraftPersistence, SaveStatus } from './draft-persistence';
import { DrawingStore } from './drawing-store';
import { ProjectHeading } from './project-heading';

describe('ProjectHeading', () => {
  let fixture: ComponentFixture<ProjectHeading>;
  let el: HTMLElement;
  let store: DrawingStore;
  const status = signal<SaveStatus>('saved');

  const q = <T extends Element>(selector: string) => el.querySelector<T>(selector)!;
  const settle = () => fixture.whenStable();

  beforeEach(async () => {
    status.set('saved');
    await TestBed.configureTestingModule({
      imports: [ProjectHeading, ...i18nTestingImports],
      providers: [...i18nTestingProviders, { provide: DraftPersistence, useValue: { status } }],
    }).compileComponents();
    store = TestBed.inject(DrawingStore);
    fixture = TestBed.createComponent(ProjectHeading);
    el = fixture.nativeElement as HTMLElement;
    await settle();
  });

  it('shows the default project title, labelled for assistive tech', () => {
    const input = q<HTMLInputElement>('.title');
    expect(input.value).toBe('Corazón de píxel');
    expect(input.getAttribute('aria-label')).toBe('Título del proyecto');
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

  it('limits the title length', () => {
    expect(q<HTMLInputElement>('.title').getAttribute('maxlength')).toBe('60');
  });

  it('the pencil is a label that focuses the title field', () => {
    expect(q<HTMLLabelElement>('.pencil').htmlFor).toBe('project-title');
  });

  describe('local save indicator', () => {
    const dot = () => q('.dot');
    const text = () => q('.status .sr-only').textContent?.trim();

    it('shows a filled dot and "saved" text when the draft is saved', () => {
      expect(dot().classList.contains('status-saved')).toBe(true);
      expect(text()).toBe('Borrador guardado en este navegador');
    });

    it('switches to a ring and "saving" text while saving', async () => {
      status.set('saving');
      await settle();
      expect(dot().classList.contains('status-saving')).toBe(true);
      expect(text()).toBe('Guardando borrador…');
      expect(dot().getAttribute('title')).toBe('Guardando borrador…');
    });

    it('shows a distinct shape and a message when saving is unavailable', async () => {
      status.set('unavailable');
      await settle();
      expect(dot().classList.contains('status-unavailable')).toBe(true);
      expect(text()).toBe('No se puede guardar el borrador en este navegador');
    });

    it('is announced politely to assistive tech', () => {
      expect(q('.status').getAttribute('role')).toBe('status');
    });
  });
});
