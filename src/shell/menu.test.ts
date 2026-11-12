import { describe, expect, it } from 'vitest';
import { isCurrentPage, MENU_ITEMS } from './menu';

describe('MENU_ITEMS (spec 4.2)', () => {
  it('lists Learn, Simulator, Enigma and Bombe, and only the simulator has a page yet', () => {
    expect(MENU_ITEMS).toEqual([
      { id: 'learn', href: null },
      { id: 'simulator', href: '/simulator' },
      { id: 'enigma', href: null },
      { id: 'bombe', href: null },
    ]);
  });
});

describe('isCurrentPage', () => {
  it('matches the page and the pages under it', () => {
    expect(isCurrentPage('/simulator', '/simulator')).toBe(true);
    expect(isCurrentPage('/simulator/2016', '/simulator')).toBe(true);
    expect(isCurrentPage('/simulators', '/simulator')).toBe(false);
    expect(isCurrentPage('/support', '/simulator')).toBe(false);
  });

  it('matches Home only on Home', () => {
    expect(isCurrentPage('/', '/')).toBe(true);
    expect(isCurrentPage('/about', '/')).toBe(false);
  });
});
