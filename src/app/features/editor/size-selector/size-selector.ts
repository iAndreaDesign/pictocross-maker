import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MAX_SIZE, MIN_SIZE } from '../../../core/domain';
import { Icon } from '../../../shared/icon/icon';

export interface SizeChange {
  readonly rows: number;
  readonly cols: number;
}

type Axis = 'rows' | 'cols';

/** Alto × Ancho (1..50) con steppers. No toca el store: emite `sizeChange`. */
@Component({
  selector: 'app-size-selector',
  imports: [TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './size-selector.html',
  styleUrl: './size-selector.css',
})
export class SizeSelector {
  readonly rows = input.required<number>();
  readonly cols = input.required<number>();
  readonly sizeChange = output<SizeChange>();

  protected readonly min = MIN_SIZE;
  protected readonly max = MAX_SIZE;

  protected value(axis: Axis): number {
    return axis === 'rows' ? this.rows() : this.cols();
  }

  protected step(axis: Axis, delta: number): void {
    this.emit(axis, this.value(axis) + delta);
  }

  protected onInput(axis: Axis, event: Event): void {
    const input = event.target as HTMLInputElement;
    const parsed = Math.round(Number(input.value));
    if (input.value.trim() !== '' && Number.isFinite(parsed)) this.emit(axis, parsed);
    // Si el cambio no se aplica (p. ej. pendiente de confirmación) el campo vuelve al valor real.
    input.value = String(this.value(axis));
  }

  private emit(axis: Axis, raw: number): void {
    const next = Math.min(Math.max(raw, MIN_SIZE), MAX_SIZE);
    if (next === this.value(axis)) return;
    this.sizeChange.emit(
      axis === 'rows' ? { rows: next, cols: this.cols() } : { rows: this.rows(), cols: next },
    );
  }
}
