import { describe, expect, it } from 'vitest';
import { supportHandles, type SupportHandles } from '@/config/support';
import { providerLink, supportOptions } from './providers';

const ALL: SupportHandles = {
  paypal: 'devname',
  kofi: 'devname',
  pix: { key: 'dev@example.com', name: 'Dev Name', city: 'Sao Paulo' },
  revolutLink: 'https://revolut.me/devname',
  wiseLink: 'https://wise.com/pay/me/devname',
  githubSponsorsLink: 'https://github.com/sponsors/devname',
};

const NONE: SupportHandles = {
  paypal: '',
  kofi: '',
  pix: { key: '', name: '', city: '' },
  revolutLink: '',
  wiseLink: '',
  githubSponsorsLink: '',
};

describe('supportOptions (spec 7)', () => {
  it('shows PayPal and Ko-fi first, and the others under "More ways to pay"', () => {
    expect(supportOptions('en', ALL)).toEqual({ first: ['paypal', 'kofi'], more: ['pix', 'revolut', 'wise', 'github'] });
  });

  it('shows Pix first to visitors who read Brazilian Portuguese', () => {
    const brazil = { first: ['pix', 'paypal', 'kofi'], more: ['revolut', 'wise', 'github'] };
    expect(supportOptions('pt-BR', ALL)).toEqual(brazil);
    expect(supportOptions('pt-br', ALL)).toEqual(brazil);
    expect(supportOptions('pt', ALL)).toEqual(brazil);
    expect(supportOptions('pt-PT', ALL).first).toEqual(['paypal', 'kofi']);
  });

  it('hides every provider without a handle', () => {
    expect(supportOptions('en', { ...NONE, kofi: 'devname', wiseLink: ALL.wiseLink })).toEqual({ first: ['kofi'], more: ['wise'] });
    expect(supportOptions('en', NONE)).toEqual({ first: [], more: [] });
  });

  it('needs the Pix key, name and city, and a link that starts with https://', () => {
    expect(supportOptions('pt-BR', { ...NONE, pix: { ...ALL.pix, city: '' } })).toEqual({ first: [], more: [] });
    expect(supportOptions('en', { ...NONE, revolutLink: 'revolut.me/devname' })).toEqual({ first: [], more: [] });
  });

  it('hides Pix when its key, name or city would build a broken Pix code', () => {
    expect(supportOptions('pt-BR', { ...NONE, pix: { ...ALL.pix, key: 'a'.repeat(78) } })).toEqual({ first: [], more: [] });
    expect(supportOptions('pt-BR', { ...NONE, pix: { ...ALL.pix, key: 'chave-ção@example.com' } })).toEqual({ first: [], more: [] });
    expect(supportOptions('pt-BR', { ...NONE, pix: { ...ALL.pix, name: '東京' } })).toEqual({ first: [], more: [] });
  });

  it('moves "More ways to pay" up when nothing would show first', () => {
    expect(supportOptions('en', { ...NONE, wiseLink: ALL.wiseLink })).toEqual({ first: ['wise'], more: [] });
  });

  it('ships with handles that are empty or https links', () => {
    for (const link of [supportHandles.revolutLink, supportHandles.wiseLink, supportHandles.githubSponsorsLink]) {
      expect(link === '' || link.startsWith('https://')).toBe(true);
    }
  });
});

describe('providerLink', () => {
  it('puts the amount and its currency in the PayPal.me link', () => {
    expect(providerLink('paypal', ALL, 5, 'USD')).toEqual({ href: 'https://paypal.me/devname/5USD', carriesAmount: true });
    expect(providerLink('paypal', ALL, 12.5, 'USD').href).toBe('https://paypal.me/devname/12.50USD');
    expect(providerLink('paypal', ALL, 25, 'BRL').href).toBe('https://paypal.me/devname/25BRL');
    expect(providerLink('paypal', ALL, 30.5, 'BRL').href).toBe('https://paypal.me/devname/30.50BRL');
  });

  it('links Ko-fi, Revolut, Wise and GitHub Sponsors without the amount', () => {
    expect(providerLink('kofi', ALL, 5, 'USD')).toEqual({ href: 'https://ko-fi.com/devname', carriesAmount: false });
    expect(providerLink('revolut', ALL, 5, 'USD')).toEqual({ href: 'https://revolut.me/devname', carriesAmount: false });
    expect(providerLink('wise', ALL, 5, 'USD')).toEqual({ href: 'https://wise.com/pay/me/devname', carriesAmount: false });
    expect(providerLink('github', ALL, 5, 'USD')).toEqual({ href: 'https://github.com/sponsors/devname', carriesAmount: false });
  });
});
