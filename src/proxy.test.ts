import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import proxy from './proxy';

function visit(path: string, headers: Record<string, string> = {}) {
  return proxy(new NextRequest(`http://localhost${path}`, { headers }));
}

describe('the language in the URL (spec 3, "Language on first visit")', () => {
  it('sends "/" to the browser language', () => {
    expect(visit('/', { 'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8' }).headers.get('location')).toBe('http://localhost/pt-br');
    expect(visit('/', { 'accept-language': 'en-US,en;q=0.9' }).headers.get('location')).toBe('http://localhost/en');
  });

  it('sends a Spanish browser from Mexico to /es', () => {
    expect(visit('/', { 'accept-language': 'es-MX,es;q=0.9' }).headers.get('location')).toBe('http://localhost/es');
  });

  it('sends a French browser from Canada to /fr', () => {
    expect(visit('/', { 'accept-language': 'fr-CA,fr;q=0.9' }).headers.get('location')).toBe('http://localhost/fr');
  });

  it('sends a German browser from Austria to /de', () => {
    expect(visit('/', { 'accept-language': 'de-AT,de;q=0.9' }).headers.get('location')).toBe('http://localhost/de');
  });

  it('sends a browser language the site does not have to English', () => {
    expect(visit('/', { 'accept-language': 'ja-JP' }).headers.get('location')).toBe('http://localhost/en');
  });

  it('writes Brazilian Portuguese in lower case in the URL, and sends /pt-BR there', () => {
    expect(visit('/pt-BR/simulator').headers.get('location')).toBe('http://localhost/pt-br/simulator');
    expect(visit('/pt-br/simulator').headers.get('x-middleware-rewrite')).toBe('http://localhost/pt-BR/simulator');
  });
});
