import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { i18nTestingImports, i18nTestingProviders } from '../../shared/i18n/i18n-testing';
import { DrawingStore } from './drawing-store';
import { ProjectHeading } from './project-heading';

@Component({
  imports: [ProjectHeading],
  template: `<app-project-heading><button class="probe">x</button></app-project-heading>`,
})
class Host {}

describe('ProjectHeading', () => {
  let fixture: ComponentFixture<ProjectHeading>;
  let el: HTMLElement;
  let store: DrawingStore;

  const q = <T extends Element>(selector: string) => el.querySelector<T>(selector)!;
  const settle = () => fixture.whenStable();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectHeading, ...i18nTestingImports],
      providers: [...i18nTestingProviders],
    }).compileComponents();
    store = TestBed.inject(DrawingStore);
    fixture = TestBed.createComponent(ProjectHeading);
    el = fixture.nativeElement as HTMLElement;
    await settle();
  });

  it('shows the default project title, labelled for assistive tech', () => {
    const input = q<HTMLInputElement>('.title');
    expect(input.value).toBe('Pictocross');
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

  it('projects its content (the export buttons) next to the title', async () => {
    const host = TestBed.createComponent(Host);
    await host.whenStable();
    const row = host.nativeElement.querySelector('.heading') as HTMLElement;
    const order = [...row.children].map((c) => c.className.split(' ')[0]);
    expect(order).toEqual(['title-wrap', 'actions']);
    expect(row.querySelector('.actions .probe')).not.toBeNull();
  });
});
