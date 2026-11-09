import { TestBed } from '@angular/core/testing';
import { DEFAULT_LOGO_GRID } from '../../core/domain';
import { DRAFT_SAVE_DEBOUNCE_MS, DRAFT_STORAGE, DraftPersistence } from './draft-persistence';
import { DrawingStore } from './drawing-store';
import { DRAFT_STORAGE_KEY, serializeDraft } from './draft-storage';

class FakeStorage {
  readonly data = new Map<string, string>();
  failWrites = false;
  failReads = false;
  getItem(key: string): string | null {
    if (this.failReads) throw new Error('denied');
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failWrites) throw new DOMException('quota', 'QuotaExceededError');
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

function setup(storage: FakeStorage | null) {
  TestBed.configureTestingModule({ providers: [{ provide: DRAFT_STORAGE, useValue: storage }] });
  return { store: TestBed.inject(DrawingStore), draft: TestBed.inject(DraftPersistence) };
}

describe('DraftPersistence', () => {
  let storage: FakeStorage;

  beforeEach(() => {
    vi.useFakeTimers();
    storage = new FakeStorage();
  });

  afterEach(() => vi.useRealTimers());

  describe('restore', () => {
    it('loads a saved draft (grid and title) into the store', () => {
      storage.data.set(DRAFT_STORAGE_KEY, serializeDraft([[1, 0], [0, 1]], 'Mi pez'));
      const { store, draft } = setup(storage);
      expect(draft.restore()).toBe(true);
      expect(store.grid()).toEqual([[1, 0], [0, 1]]);
      expect(store.title()).toBe('Mi pez');
      expect(store.canUndo()).toBe(false);
    });

    it('keeps the default drawing when nothing is stored', () => {
      const { store, draft } = setup(storage);
      expect(draft.restore()).toBe(false);
      expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
    });

    it('ignores and removes corrupt data without breaking', () => {
      storage.data.set(DRAFT_STORAGE_KEY, '{"version":1,"rows":99');
      const { store, draft } = setup(storage);
      expect(draft.restore()).toBe(false);
      expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
      expect(storage.data.has(DRAFT_STORAGE_KEY)).toBe(false);
    });

    it('ignores a draft from another schema version', () => {
      storage.data.set(DRAFT_STORAGE_KEY, JSON.stringify({ version: 0, rows: 1, cols: 1, cells: ['1'], title: null }));
      const { store, draft } = setup(storage);
      expect(draft.restore()).toBe(false);
      expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
    });

    it('does not throw when reading is denied', () => {
      storage.failReads = true;
      const { draft } = setup(storage);
      expect(draft.restore()).toBe(false);
      expect(draft.status()).toBe('unavailable');
    });

    it('does nothing when localStorage is unavailable', () => {
      const { draft, store } = setup(null);
      expect(draft.restore()).toBe(false);
      draft.start();
      expect(draft.status()).toBe('unavailable');
      expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
    });
  });

  describe('saving', () => {
    it('saves after the debounce and goes saving → saved', () => {
      const { store, draft } = setup(storage);
      draft.restore();
      TestBed.runInInjectionContext(() => draft.start());
      TestBed.tick();
      vi.advanceTimersByTime(DRAFT_SAVE_DEBOUNCE_MS);
      expect(draft.status()).toBe('saved');

      store.invert();
      TestBed.tick();
      expect(draft.status()).toBe('saving');
      vi.advanceTimersByTime(DRAFT_SAVE_DEBOUNCE_MS - 1);
      expect(draft.status()).toBe('saving');
      vi.advanceTimersByTime(1);
      expect(draft.status()).toBe('saved');
      const saved = JSON.parse(storage.data.get(DRAFT_STORAGE_KEY) ?? '{}');
      expect(saved.rows).toBe(10);
      expect(saved.cells[0]).toBe(DEFAULT_LOGO_GRID[0].map((c) => 1 - c).join(''));
    });

    it('also saves the title and coalesces bursts into one write', () => {
      const { store, draft } = setup(storage);
      const setItem = vi.spyOn(storage, 'setItem');
      draft.restore();
      TestBed.runInInjectionContext(() => draft.start());
      TestBed.tick();
      vi.advanceTimersByTime(DRAFT_SAVE_DEBOUNCE_MS);
      setItem.mockClear();

      store.setTitle('Uno');
      TestBed.tick();
      store.setTitle('Dos');
      TestBed.tick();
      vi.advanceTimersByTime(DRAFT_SAVE_DEBOUNCE_MS);
      expect(setItem).toHaveBeenCalledTimes(1);
      expect(JSON.parse(storage.data.get(DRAFT_STORAGE_KEY) ?? '{}').title).toBe('Dos');
    });

    it('does not rewrite when the state equals what is stored (e.g. right after restore)', () => {
      storage.data.set(DRAFT_STORAGE_KEY, serializeDraft(DEFAULT_LOGO_GRID, null));
      const { draft } = setup(storage);
      const setItem = vi.spyOn(storage, 'setItem');
      draft.restore();
      TestBed.runInInjectionContext(() => draft.start());
      TestBed.tick();
      vi.advanceTimersByTime(DRAFT_SAVE_DEBOUNCE_MS * 2);
      expect(setItem).not.toHaveBeenCalled();
      expect(draft.status()).toBe('saved');
    });

    it('flush writes pending changes immediately (tab closing)', () => {
      const { store, draft } = setup(storage);
      draft.restore();
      TestBed.runInInjectionContext(() => draft.start());
      TestBed.tick();
      vi.advanceTimersByTime(DRAFT_SAVE_DEBOUNCE_MS);
      store.clear();
      TestBed.tick();
      expect(draft.status()).toBe('saving');
      draft.flush();
      expect(draft.status()).toBe('saved');
      expect(JSON.parse(storage.data.get(DRAFT_STORAGE_KEY) ?? '{}').cells[0]).toBe('0000000000');
    });

    it('reports unavailable (and keeps working) when writing fails, e.g. quota exceeded', () => {
      const { store, draft } = setup(storage);
      draft.restore();
      TestBed.runInInjectionContext(() => draft.start());
      TestBed.tick();
      vi.advanceTimersByTime(DRAFT_SAVE_DEBOUNCE_MS);
      storage.failWrites = true;
      store.clear();
      TestBed.tick();
      vi.advanceTimersByTime(DRAFT_SAVE_DEBOUNCE_MS);
      expect(draft.status()).toBe('unavailable');
      expect(store.blackCount()).toBe(0);
    });

    it('survives a full reload cycle: save, new session, restore', () => {
      const first = setup(storage);
      first.draft.restore();
      TestBed.runInInjectionContext(() => first.draft.start());
      TestBed.tick();
      first.store.clear();
      first.store.resize(4, 6);
      first.store.setCell(2, 3, 1);
      first.store.setTitle('Ciclo');
      TestBed.tick();
      first.draft.flush();

      TestBed.resetTestingModule();
      const second = setup(storage);
      expect(second.draft.restore()).toBe(true);
      expect(second.store.rows()).toBe(4);
      expect(second.store.cols()).toBe(6);
      expect(second.store.grid()[2][3]).toBe(1);
      expect(second.store.title()).toBe('Ciclo');
    });
  });
});
