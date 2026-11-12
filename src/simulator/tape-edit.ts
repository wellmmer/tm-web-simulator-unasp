import { symbolsOf } from '@/engines/turing';

/**
 * Writes one symbol into the machine's input, which starts on cell 0 (spec 5.4). Cells between the
 * input and `cell` become blanks. Blanks at the end are dropped, because the tape is blank there anyway.
 */
export function writeInputCell(input: string, blank: string, cell: number, symbol: string): string {
  const symbols = symbolsOf(input);
  while (symbols.length <= cell) symbols.push(blank);
  symbols[cell] = symbol;
  while (symbols.length > 0 && symbols[symbols.length - 1] === blank) symbols.pop();
  return symbols.join('');
}
