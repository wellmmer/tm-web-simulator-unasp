import { describe, expect, it } from 'vitest';
import { shareUrl } from '@/share/share-link';
import { examples } from '@/simulator/examples';
import { pageRoute, pageUrlOnly, withoutMachine } from './page-url';

describe('pageRoute', () => {
  it('groups a page in every language under one route', () => {
    expect(pageRoute('/en/simulator')).toBe('/[locale]/simulator');
    expect(pageRoute('/pt-br/simulator')).toBe('/[locale]/simulator');
    expect(pageRoute('/de/about')).toBe('/[locale]/about');
  });

  it('groups Home in every language', () => {
    expect(pageRoute('/es')).toBe('/[locale]');
    expect(pageRoute('/pt-br')).toBe('/[locale]');
  });

  it('leaves an address without a known language as it is', () => {
    expect(pageRoute('/xx/simulator')).toBe('/xx/simulator');
    expect(pageRoute('/')).toBe('/');
  });
});

describe('pageUrlOnly', () => {
  it('keeps the address and the page, and drops the part after #', () => {
    expect(pageUrlOnly('https://computable.example/en/simulator#m=N4IgLgpg')).toBe('https://computable.example/en/simulator');
  });

  it('drops the part after ? too', () => {
    expect(pageUrlOnly('https://computable.example/pt-br/simulator?ref=x#m=N4Ig')).toBe('https://computable.example/pt-br/simulator');
  });

  it('leaves an address without ? or # as it is', () => {
    expect(pageUrlOnly('https://computable.example/de/about')).toBe('https://computable.example/de/about');
  });

  it('drops a lone # or ?', () => {
    expect(pageUrlOnly('https://computable.example/en/support?#')).toBe('https://computable.example/en/support');
  });
});

describe('withoutMachine (the analytics beforeSend)', () => {
  it('sends the page view of a share link without the machine in it', () => {
    const link = shareUrl('https://computable.example/en/simulator', examples['binary-plus-one'].machine);
    if (!link.ok) throw new Error('the example is too big for a link');
    expect(link.url).toContain('#m=');

    expect(withoutMachine({ type: 'pageview', url: link.url })).toEqual({
      type: 'pageview',
      url: 'https://computable.example/en/simulator',
    });
  });

  it('cleans a custom event the same way', () => {
    expect(withoutMachine({ type: 'event', url: 'https://computable.example/en/simulator#m=abc' })).toEqual({
      type: 'event',
      url: 'https://computable.example/en/simulator',
    });
  });
});
