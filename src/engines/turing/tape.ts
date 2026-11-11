import { symbolsOf } from './symbol';

/** A sparse tape: only cells that hold a non-blank symbol are stored. */
export class Tape {
  private readonly cells = new Map<number, string>();

  constructor(
    readonly blank: string,
    input = '',
  ) {
    symbolsOf(input).forEach((symbol, cell) => this.write(cell, symbol));
  }

  read(cell: number): string {
    return this.cells.get(cell) ?? this.blank;
  }

  write(cell: number, symbol: string): void {
    if (symbol === this.blank) {
      this.cells.delete(cell);
    } else {
      this.cells.set(cell, symbol);
    }
  }

  /** The lowest and highest non-blank cell, or null when the whole tape is blank. */
  bounds(): { min: number; max: number } | null {
    if (this.cells.size === 0) return null;
    // A loop, not Math.min(...keys): spreading 100,000+ keys overflows the call stack.
    let min = Infinity;
    let max = -Infinity;
    for (const cell of this.cells.keys()) {
      if (cell < min) min = cell;
      if (cell > max) max = cell;
    }
    return { min, max };
  }

  /** The symbols from the lowest to the highest non-blank cell. A blank tape gives "". */
  toString(): string {
    const bounds = this.bounds();
    if (bounds === null) return '';
    let text = '';
    for (let cell = bounds.min; cell <= bounds.max; cell++) text += this.read(cell);
    return text;
  }
}
