import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { i18nTestingImports, i18nTestingProviders } from './shared/i18n/i18n-testing';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, ...i18nTestingImports],
      providers: i18nTestingProviders,
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the translated brand (smoke test)', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('PICTOCROSS MAKER');
  });
});
