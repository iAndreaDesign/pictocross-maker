import { Injectable, InjectionToken, effect, inject, signal, untracked } from '@angular/core';
import { DrawingStore } from './drawing-store';
import { DRAFT_STORAGE_KEY, parseDraft, serializeDraft } from './draft-storage';

export const DRAFT_SAVE_DEBOUNCE_MS = 400;

type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** `localStorage`, o `null` si el navegador lo bloquea (modo privado, políticas, SSR). */
export const DRAFT_STORAGE = new InjectionToken<DraftStorage | null>('DRAFT_STORAGE', {
  providedIn: 'root',
  factory: () => {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  },
});

/** `saved`: al día · `saving`: cambios pendientes · `unavailable`: no se puede guardar en este navegador. */
export type SaveStatus = 'saved' | 'saving' | 'unavailable';

/**
 * Guarda el borrador (dibujo + título) en `localStorage` con debounce y lo restaura al abrir.
 * Un dato corrupto o de otra versión se ignora (y se borra) sin romper la app.
 */
@Injectable({ providedIn: 'root' })
export class DraftPersistence {
  private readonly store = inject(DrawingStore);
  private readonly storage = inject(DRAFT_STORAGE);

  private readonly state = signal<SaveStatus>(this.storage ? 'saved' : 'unavailable');
  readonly status = this.state.asReadonly();

  private lastSaved: string | null = null;
  private pending: string | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private started = false;

  /** Carga el borrador guardado en el store. Devuelve `true` si había uno válido. */
  restore(): boolean {
    if (!this.storage) return false;
    let raw: string | null;
    try {
      raw = this.storage.getItem(DRAFT_STORAGE_KEY);
    } catch {
      this.state.set('unavailable');
      return false;
    }
    const draft = parseDraft(raw);
    if (!draft) {
      if (raw !== null) this.safely(() => this.storage?.removeItem(DRAFT_STORAGE_KEY));
      return false;
    }
    this.store.load(draft.grid, draft.title);
    this.lastSaved = raw;
    return true;
  }

  /** Empieza a guardar cada cambio del dibujo o del título. Se llama una sola vez. */
  start(): void {
    if (this.started || !this.storage) return;
    this.started = true;
    effect(() => {
      const raw = serializeDraft(this.store.grid(), this.store.title());
      untracked(() => this.schedule(raw));
    });
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => document.hidden && this.flush());
      window.addEventListener('pagehide', () => this.flush());
    }
  }

  /** Escribe ya lo pendiente (p. ej. al cerrar la pestaña). */
  flush(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    if (this.pending !== null) this.write(this.pending);
  }

  private schedule(raw: string): void {
    if (raw === this.lastSaved) {
      this.pending = null;
      if (this.timer !== null) clearTimeout(this.timer);
      this.timer = null;
      this.state.set('saved');
      return;
    }
    this.pending = raw;
    this.state.set('saving');
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), DRAFT_SAVE_DEBOUNCE_MS);
  }

  private write(raw: string): void {
    this.pending = null;
    try {
      this.storage?.setItem(DRAFT_STORAGE_KEY, raw);
      this.lastSaved = raw;
      this.state.set('saved');
    } catch {
      // Cuota llena o acceso denegado: la app sigue funcionando sin guardar.
      this.state.set('unavailable');
    }
  }

  private safely(action: () => void): void {
    try {
      action();
    } catch {
      /* sin acceso al almacenamiento */
    }
  }
}
